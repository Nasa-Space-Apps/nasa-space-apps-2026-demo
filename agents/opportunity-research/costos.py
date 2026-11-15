"""Costos de referencia (a precio de lista, calculados por el SDK) por evento, por modelo y en total.

Uso (reporte acumulado de todo lo que hay en salida/):
  python costos.py
Con Bedrock el costo de referencia es lo que AWS debería facturar; con el plan de Claude es solo referencia (consume cupo).
"""
import json
import sys
from pathlib import Path

BASE = Path(__file__).parent
CAMPOS = (("inputTokens", "entrada"), ("outputTokens", "salida"), ("cacheReadInputTokens", "cache_leida"),
          ("cacheCreationInputTokens", "cache_escrita"), ("thinkingTokens", "razonamiento"))


def resumir_corrida(met: dict) -> dict:
    """Une la investigación y la revisión de una corrida: total, costo por paso y desglose por modelo."""
    pasos = {"investigacion": met.get("por_modelo") or {}, "revision": (met.get("revision") or {}).get("por_modelo") or {}}
    por_modelo, por_paso = {}, {}
    for paso, usos in pasos.items():
        por_paso[paso] = round(sum(v.get("costUSD", 0.0) for v in usos.values()), 6)
        for modelo, v in usos.items():
            r = por_modelo.setdefault(modelo, {"usd": 0.0, **{n: 0 for _, n in CAMPOS}})
            r["usd"] = round(r["usd"] + v.get("costUSD", 0.0), 6)
            for k, n in CAMPOS:
                r[n] += int(v.get(k, 0) or 0)
    return {"total_usd": round(sum(por_paso.values()), 6), "por_paso": por_paso, "por_modelo": por_modelo}


def tabla_corrida(res: dict) -> str:
    filas = [f"  {m:<48} {r['usd']:>8.4f} USD   entrada {r['entrada']:>7}  salida {r['salida']:>6}  cache leída {r['cache_leida']:>8}  cache escrita {r['cache_escrita']:>6}"
             for m, r in sorted(res["por_modelo"].items(), key=lambda x: -x[1]["usd"])]
    pasos = " · ".join(f"{k} {v:.4f}" for k, v in res["por_paso"].items() if v)
    return "\n".join(filas + [f"  TOTAL {res['total_usd']:.4f} USD  ({pasos})"])


def reporte() -> str:
    eventos, totales, por_modelo = [], {"bedrock": 0.0, "otros": 0.0}, {}
    for f in sorted((BASE / "salida").glob("*/metricas.json")):
        met = json.loads(f.read_text(encoding="utf-8"))
        res = resumir_corrida(met)
        es_bedrock = str(met.get("modo", "")).startswith("Amazon Bedrock") or met.get("proveedor") == "bedrock"
        totales["bedrock" if es_bedrock else "otros"] += res["total_usd"]
        eventos.append((f.parent.name, "Bedrock" if es_bedrock else "plan/API", res["total_usd"], met.get("turnos"), met.get("duracion_s")))
        for m, r in res["por_modelo"].items():
            acum = por_modelo.setdefault((m, "Bedrock" if es_bedrock else "plan/API"), {"usd": 0.0, "salida": 0, "entrada": 0, "cache_leida": 0, "cache_escrita": 0, "eventos": 0})
            acum["usd"] += r["usd"]
            acum["eventos"] += 1
            for n in ("salida", "entrada", "cache_leida", "cache_escrita"):
                acum[n] += r[n]
    L = ["=== POR EVENTO (USD de referencia) ===", f"{'evento':<8} {'proveedor':<9} {'USD':>8} {'turnos':>7} {'segundos':>9}"]
    L += [f"{e:<8} {p:<9} {c:>8.4f} {str(t or '-'):>7} {str(s or '-'):>9}" for e, p, c, t, s in eventos]
    L += ["", "=== POR MODELO (acumulado) ==="]
    for (m, p), r in sorted(por_modelo.items(), key=lambda x: -x[1]["usd"]):
        L.append(f"{m:<48} {p:<9} {r['usd']:>8.4f} USD  en {r['eventos']} evento(s)  salida {r['salida']}")
    L += ["", "=== TOTALES ===",
          f"Bedrock (se factura en AWS, a precio de lista): {totales['bedrock']:.4f} USD",
          f"Plan de Claude / API (solo referencia; el plan consume cupo): {totales['otros']:.4f} USD",
          f"Eventos medidos: {len(eventos)}"]
    return "\n".join(L)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(reporte())
