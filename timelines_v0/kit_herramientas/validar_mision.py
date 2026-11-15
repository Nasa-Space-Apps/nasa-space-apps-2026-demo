#!/usr/bin/env python3
"""Validador de archivos de misión (línea de tiempo o hardware).
Uso:
  python3 validar_mision.py linea_de_tiempo_X.json --sol-cero 2004-01-25 --sol-offset 1
  python3 validar_mision.py linea_de_tiempo_X.json --sin-sol            # Luna / espacio profundo
  python3 validar_mision.py hardware_X.json --sol-cero 2004-01-25 --sol-offset 1 [--linea linea_de_tiempo_X.json]
--sol-offset: 1 si el sol 1 es el día de aterrizaje (MER); 0 si el sol 0 es el aterrizaje (InSight, Ingenuity).
Imprime problemas y devuelve código 1 si hay alguno."""
import json, re, sys, argparse, pathlib
from datetime import date
import jsonschema
ap = argparse.ArgumentParser()
ap.add_argument("archivo"); ap.add_argument("--sol-cero"); ap.add_argument("--sol-offset", type=int, default=0)
ap.add_argument("--sin-sol", action="store_true"); ap.add_argument("--linea"); ap.add_argument("--esquema-dir", default=str(pathlib.Path(__file__).parent))
a = ap.parse_args()
d = json.load(open(a.archivo, encoding="utf-8")); P = []
es_hw = d.get("tipo_de_documento") == "hardware" or "componentes" in d
sch = json.load(open(pathlib.Path(a.esquema_dir) / ("esquema_hardware_v2.json" if es_hw else "esquema_linea_de_tiempo_v2.json"), encoding="utf-8"))
for e in jsonschema.Draft7Validator(sch).iter_errors(d):
    P.append("ESQUEMA " + "/".join(map(str, e.absolute_path)) + ": " + e.message[:160])
URL = re.compile(r"^https?://[^\s/]+\.[^\s/]+\S*$")
def sol_calc(f):
    y, m, dd = map(int, f.split("-")); return (date(y, m, dd) - date.fromisoformat(a.sol_cero)).days / 1.0275 + a.sol_offset
def fuentes_de(o, acc):
    if isinstance(o, dict):
        if "url" in o and "tipo" in o and "verificacion" in o: acc.append(o)
        for v in o.values(): fuentes_de(v, acc)
    elif isinstance(o, list):
        for v in o: fuentes_de(v, acc)
if not es_hw:
    ev = d["eventos"]; ids = [e["id"] for e in ev]
    if len(ids) != len(set(ids)): P.append("ids repetidos")
    if [e["fecha_inicio"] for e in ev] != sorted(e["fecha_inicio"] for e in ev): P.append("eventos fuera de orden cronológico")
    if [e["orden"] for e in ev] != list(range(1, len(ev) + 1)): P.append("'orden' no es 1..N")
    for e in ev:
        if e["fecha_fin"] and e["fecha_fin"] < e["fecha_inicio"]: P.append(f"{e['id']} fecha_fin < fecha_inicio")
        if e["discutido"] and not e["nota"]: P.append(f"{e['id']} discutido sin nota")
        if e["respaldo"] == "oficial_o_cientifico" and not any(f["tipo"] in ("oficial NASA/JPL", "científica") for f in e["fuentes"]): P.append(f"{e['id']} respaldo oficial sin fuente oficial/científica")
        if a.sin_sol and e["sol"] is not None: P.append(f"{e['id']} tiene sol en misión sin sol")
        if not a.sin_sol and a.sol_cero and e["sol"] is not None and not e["discutido"] and re.fullmatch(r"\d{4}-\d\d-\d\d", e["fecha_inicio"]):
            c = sol_calc(e["fecha_inicio"])
            if abs(c - e["sol"]) > 3: P.append(f"{e['id']} {e['fecha_inicio']} sol {e['sol']} vs calculado {c:.1f}: {e['titulo'][:50]}")
    reg = {x["url"]: x for x in d["indice_fuentes"]}
    usadas = set()
    for e in ev:
        for f in e["fuentes"]:
            usadas.add(f["url"])
            if f["url"] not in reg: P.append(f"{e['id']} URL no está en indice_fuentes: {f['url']}")
            elif e["id"] not in reg[f["url"]]["eventos"]: P.append(f"indice_fuentes no enlaza {e['id']} con {f['url']}")
    nc = {f["url"] for f in d.get("fuentes_no_citadas_en_eventos", [])}
    for u in reg:
        if u not in usadas and u not in nc and reg[u]["eventos"]: P.append(f"indice_fuentes enlaza eventos pero ninguno la cita: {u}")
    for k, v in d["mision"]["fechas_clave"].items():
        for i in (v.get("eventos") or []):
            if i not in ids: P.append(f"fechas_clave.{k} apunta a evento inexistente {i}")
else:
    C = {c["id"]: c for c in d["componentes"]}
    if len(C) != len(d["componentes"]): P.append("ids de componentes repetidos")
    ev_ids = set()
    if a.linea: ev_ids = {e["id"] for e in json.load(open(a.linea, encoding="utf-8"))["eventos"]}
    for c in C.values():
        if c["sistema_padre"] and c["sistema_padre"] not in C: P.append(f"{c['id']} padre inexistente {c['sistema_padre']}")
        for s in c["subcomponentes"]:
            if s not in C or C[s]["sistema_padre"] != c["id"]: P.append(f"{c['id']} subcomponente incoherente {s}")
        for i in c["eventos_relacionados"]:
            if a.linea and i not in ev_ids: P.append(f"{c['id']} evento relacionado inexistente {i}")
        if c["discutido"] and not c["nota"]: P.append(f"{c['id']} discutido sin nota")
        if not (c["especificaciones"] or c["historial_operativo"] or c["que_permitio_descubrir"] or c["datos_clave"]): P.append(f"{c['id']} sin contenido")
        if not a.sin_sol and a.sol_cero:
            for h in c["historial_operativo"]:
                if h.get("sol") is not None and h.get("fecha") and re.fullmatch(r"\d{4}-\d\d-\d\d", h["fecha"]) and abs(sol_calc(h["fecha"]) - h["sol"]) > 3:
                    P.append(f"{c['id']} historial {h['fecha']} sol {h['sol']} vs calculado {sol_calc(h['fecha']):.1f}")
    reg = {x["url"] for x in d["indice_fuentes"]}
    for c in C.values():
        acc = []; fuentes_de(c, acc)
        for f in acc:
            if f["url"] not in reg: P.append(f"{c['id']} URL no está en indice_fuentes: {f['url']}")
acc = []; fuentes_de({k: v for k, v in d.items() if k != "indice_fuentes"}, acc)
visto = {}
for f in acc:
    if not URL.match(f["url"]): P.append("URL inválida: " + f["url"])
    visto.setdefault(f["url"], set()).add(f["verificacion"])
    if f["verificacion"] == "página abierta completa" and "resumen" in (f.get("nota") or "").lower(): P.append("verificación 'completa' dudosa: " + f["url"])
print(f"{'HARDWARE' if es_hw else 'LÍNEA DE TIEMPO'}: {len(acc)} citas, {len(visto)} URL distintas")
for p in P: print(" -", p)
print("problemas:", len(P)); sys.exit(1 if P else 0)
