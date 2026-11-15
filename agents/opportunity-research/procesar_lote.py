"""Procesa varios eventos con agente.py, en serie o en paralelo, con límites de seguridad.

Uso:
  python procesar_lote.py                                  # todos los pendientes de la historia, uno tras otro
  python procesar_lote.py --ids opp028,opp030 --paralelo 3 # esos, de 3 en 3
  python procesar_lote.py --archivo ../../story/data/linea_de_tiempo_opportunity.json --ids opp004,opp009
Opciones: --paralelo N (por defecto 1; se recomienda 3), --tope-usd 12 (no inicia más eventos al superar ese costo de
          referencia acumulado), --max-fallos-seguidos 3, --minutos-por-evento 20.
Cada evento corre en su propio proceso; los ya procesados se saltan solos (no gastan nada). Si se interrumpe, se puede
volver a lanzar: continúa con los que falten. El registro completo queda en lotes/lote_<fecha>.log.
Con varios a la vez conviene no pasar de 3: Bedrock y DuckDuckGo pueden limitar la velocidad.
"""
import argparse
import json
import os
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).parent
SALIDA = BASE / "salida"
ARCHIVO = BASE / ".." / ".." / "story" / "data" / "historia_opportunity.json"


def ids_del_archivo(archivo: Path) -> list[str]:
    d = json.loads(Path(archivo).read_text(encoding="utf-8"))
    return [e["id"] for e in (d.get("eventos") or d.get("nodos") or [])]


def pendientes(ids: list[str], salida: Path = SALIDA) -> list[str]:
    """Los ids que todavía no tienen dossier.json."""
    return [i for i in ids if not (salida / i / "dossier.json").exists()]


def costo_evento(id_: str, salida: Path = SALIDA) -> float:
    try:
        m = json.loads((salida / id_ / "metricas.json").read_text(encoding="utf-8"))
        return float((m.get("costos") or {}).get("total_usd") or m.get("costo_usd_referencia_total") or m.get("costo_usd_referencia") or 0)
    except Exception:  # noqa: BLE001
        return 0.0


def procesar(cola, correr, costo_de, paralelo=1, tope=12.0, max_fallos=3, log=print):
    """Corre `cola` con hasta `paralelo` eventos a la vez. `correr(ev) -> (codigo, salida)`; código 0 ok, 2 ya procesado, otro fallo.
    No inicia eventos nuevos si el gasto acumulado llegó al tope o hubo `max_fallos` fallos seguidos."""
    lock = threading.Lock()
    est = {"gasto": 0.0, "seguidos": 0, "parar": None}
    res = {"ok": [], "fallidos": [], "saltados": [], "omitidos": []}

    def tarea(ev):
        with lock:
            if est["parar"] or est["gasto"] >= tope:
                if not est["parar"]:
                    est["parar"] = f"tope alcanzado ({est['gasto']:.2f} >= {tope} USD)"
                res["omitidos"].append(ev)
                return
        t1 = time.time()
        log(f"-> {ev} empieza")
        codigo, salida = correr(ev)
        c = costo_de(ev) if codigo == 0 else 0.0
        with lock:
            est["gasto"] += c
            if codigo == 0:
                res["ok"].append((ev, c))
                est["seguidos"] = 0
                log(f"   {ev} OK en {time.time()-t1:.0f}s · {c:.4f} USD · acumulado {est['gasto']:.4f} USD")
            elif codigo == 2:
                res["saltados"].append(ev)
                log(f"   {ev} ya procesado, se salta")
            else:
                res["fallidos"].append(ev)
                est["seguidos"] += 1
                ultimas = [l for l in salida.strip().splitlines() if l.strip()][-2:]
                log(f"   {ev} FALLÓ (código {codigo}): {' | '.join(ultimas)[:300]}")
                if est["seguidos"] >= max_fallos:
                    est["parar"] = f"{est['seguidos']} fallos seguidos"

    with ThreadPoolExecutor(max_workers=max(1, paralelo)) as ex:
        list(ex.map(tarea, cola))
    res["gasto"], res["motivo_parada"] = est["gasto"], est["parar"]
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archivo", default=str(ARCHIVO))
    ap.add_argument("--ids", help="lista separada por comas; por defecto, todos los pendientes del archivo")
    ap.add_argument("--paralelo", type=int, default=1)
    ap.add_argument("--tope-usd", type=float, default=12.0)
    ap.add_argument("--max-fallos-seguidos", type=int, default=3)
    ap.add_argument("--minutos-por-evento", type=int, default=20)
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

    todos = [i.strip() for i in (a.ids.split(",") if a.ids else ids_del_archivo(Path(a.archivo))) if i.strip()]
    cola = pendientes(todos)
    (BASE / "lotes").mkdir(exist_ok=True)
    log_f = BASE / "lotes" / f"lote_{datetime.now():%Y%m%d-%H%M%S}.log"
    escribir = threading.Lock()
    print(f"Lote: {len(cola)} evento(s) pendiente(s): {', '.join(cola) or 'ninguno'}\nParalelo: {a.paralelo} · tope: {a.tope_usd} USD de referencia\nRegistro: {log_f}", flush=True)

    env = {**os.environ, "PYTHONIOENCODING": "utf-8", "CRAWL4AI_NO_CLOUD_NOTICE": "1"}

    def correr(ev):
        try:
            p = subprocess.run([sys.executable, "-u", "agente.py", str(a.archivo), "--evento", ev], cwd=BASE, env=env, capture_output=True,
                               text=True, encoding="utf-8", errors="replace", timeout=a.minutos_por_evento * 60)
            salida, codigo = p.stdout + p.stderr, p.returncode
        except subprocess.TimeoutExpired:
            salida, codigo = f"TIEMPO AGOTADO ({a.minutos_por_evento} min)", 124
        with escribir, log_f.open("a", encoding="utf-8") as f:
            f.write(f"\n===== {ev} (código {codigo}) =====\n{salida}\n")
        return codigo, salida

    t0 = time.time()
    r = procesar(cola, correr, costo_evento, a.paralelo, a.tope_usd, a.max_fallos_seguidos, log=lambda m: print(m, flush=True))
    print(f"\n===== RESUMEN DEL LOTE ({(time.time()-t0)/60:.1f} min) =====", flush=True)
    print(f"Procesados: {len(r['ok'])} · fallidos: {len(r['fallidos'])} · omitidos: {len(r['omitidos'])} · costo de referencia del lote: {r['gasto']:.4f} USD", flush=True)
    for ev, c in sorted(r["ok"]):
        print(f"  {ev}: {c:.4f} USD", flush=True)
    if r["motivo_parada"]:
        print(f"  SE DETUVO: {r['motivo_parada']}", flush=True)
    if r["fallidos"]:
        print(f"  FALLIDOS: {', '.join(r['fallidos'])} (se pueden relanzar con --ids)", flush=True)
    print(f"Pendientes tras el lote: {', '.join(pendientes(todos)) or 'ninguno'}", flush=True)


if __name__ == "__main__":
    main()
