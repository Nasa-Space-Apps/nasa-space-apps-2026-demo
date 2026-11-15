"""Procesa varios eventos uno tras otro con agente.py, con límites de seguridad.

Uso:
  python procesar_lote.py                      # todos los pendientes de la historia
  python procesar_lote.py --ids opp028,opp030  # solo esos
Opciones: --archivo <json>, --tope-usd 12 (se detiene al superar ese costo de referencia acumulado en el lote),
          --max-fallos-seguidos 3, --minutos-por-evento 20.
Cada evento corre en su propio proceso; los ya procesados se saltan solos (no gastan nada). Si se interrumpe, se puede
volver a lanzar: continúa con los que falten. El registro completo queda en lotes/lote_<fecha>.log.
"""
import argparse
import json
import os
import subprocess
import sys
import time
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archivo", default=str(ARCHIVO))
    ap.add_argument("--ids", help="lista separada por comas; por defecto, todos los pendientes del archivo")
    ap.add_argument("--tope-usd", type=float, default=12.0)
    ap.add_argument("--max-fallos-seguidos", type=int, default=3)
    ap.add_argument("--minutos-por-evento", type=int, default=20)
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

    todos = a.ids.split(",") if a.ids else ids_del_archivo(Path(a.archivo))
    cola = pendientes([i.strip() for i in todos if i.strip()])
    (BASE / "lotes").mkdir(exist_ok=True)
    log = BASE / "lotes" / f"lote_{datetime.now():%Y%m%d-%H%M%S}.log"
    print(f"Lote: {len(cola)} evento(s) pendiente(s): {', '.join(cola) or 'ninguno'}\nRegistro: {log}\nTope: {a.tope_usd} USD de referencia", flush=True)

    env = {**os.environ, "PYTHONIOENCODING": "utf-8", "CRAWL4AI_NO_CLOUD_NOTICE": "1"}
    ok, fallidos, gasto, seguidos, t0 = [], [], 0.0, 0, time.time()
    for n, ev in enumerate(cola, 1):
        if gasto >= a.tope_usd:
            print(f"\nTOPE alcanzado ({gasto:.2f} >= {a.tope_usd} USD). Se detiene antes de {ev}.", flush=True)
            break
        t1 = time.time()
        print(f"\n[{n}/{len(cola)}] {ev} ...", flush=True)
        try:
            p = subprocess.run([sys.executable, "-u", "agente.py", str(a.archivo), "--evento", ev], cwd=BASE, env=env, capture_output=True,
                               text=True, encoding="utf-8", errors="replace", timeout=a.minutos_por_evento * 60)
            salida, codigo = p.stdout + p.stderr, p.returncode
        except subprocess.TimeoutExpired as e:
            salida, codigo = f"TIEMPO AGOTADO ({a.minutos_por_evento} min)\n{(e.stdout or b'')!r}"[:3000], 124
        with log.open("a", encoding="utf-8") as f:
            f.write(f"\n===== {ev} (código {codigo}) =====\n{salida}\n")
        c = costo_evento(ev) if codigo == 0 else 0.0
        gasto += c
        if codigo == 0:
            ok.append((ev, c))
            seguidos = 0
            print(f"    OK en {time.time()-t1:.0f}s · {c:.4f} USD · acumulado del lote {gasto:.4f} USD", flush=True)
        elif codigo == 2:
            print("    ya procesado, se salta", flush=True)
        else:
            fallidos.append(ev)
            seguidos += 1
            ultimas = [l for l in salida.strip().splitlines() if l.strip()][-2:]
            print(f"    FALLÓ (código {codigo}): {' | '.join(ultimas)[:300]}", flush=True)
            if seguidos >= a.max_fallos_seguidos:
                print(f"\n{seguidos} fallos seguidos: se detiene el lote para no gastar de más.", flush=True)
                break

    print(f"\n===== RESUMEN DEL LOTE ({(time.time()-t0)/60:.1f} min) =====", flush=True)
    print(f"Procesados: {len(ok)} · fallidos: {len(fallidos)} · costo de referencia del lote: {gasto:.4f} USD", flush=True)
    for ev, c in ok:
        print(f"  {ev}: {c:.4f} USD", flush=True)
    if fallidos:
        print(f"  FALLIDOS: {', '.join(fallidos)} (se pueden relanzar con --ids)", flush=True)
    restantes = pendientes(todos)
    print(f"Pendientes tras el lote: {', '.join(restantes) or 'ninguno'}", flush=True)


if __name__ == "__main__":
    main()
