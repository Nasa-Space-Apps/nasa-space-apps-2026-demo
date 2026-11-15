#!/usr/bin/env python3
"""Herramientas de construcción de una línea de tiempo (esquema 2.0).

Subcomandos:
  fusionar BASE.json EXTRA1.json [EXTRA2.json ...] -o SALIDA.json --prefijo pth [--umbral 0.6]
      Agrega eventos 'crudos' (sin id/orden) a un documento base, quita duplicados,
      ordena, renumera ids, reconstruye indice_fuentes y resumen.
  reindexar DOC.json -o SALIDA.json --prefijo pth
      Solo reordena/renumera y reconstruye índices (úsalo tras editar a mano).
  normalizar-fuente   (como módulo: normalizar_fuente(dict) -> dict)

Un evento crudo necesita al menos: fecha_inicio, titulo, detalle, etapa, fase, categoria, fuentes[].
El resto se completa con valores por defecto (ver DEFECTOS)."""
import json, re, sys, argparse, difflib
from urllib.parse import quote

FASES = ["origen", "planificacion_y_desarrollo", "lanzamiento_y_viaje", "aterrizaje", "operaciones", "fin_de_mision", "legado"]
CATS = ["origen", "planificacion", "desarrollo", "pruebas", "lanzamiento", "viaje", "aterrizaje", "despliegue", "operacion", "ciencia", "problema", "solucion", "hito", "fin_de_mision", "legado"]
PRECS = ["año", "mes", "día", "rango", "aproximada", "década"]
TIPOS = ["oficial NASA/JPL", "científica", "prensa", "comunitaria", "libro/medio", "video/audio"]
VERIF = ["página abierta completa", "página abierta (resumen automático de la herramienta)", "solo extracto de búsqueda"]
PRIO = {v: i for i, v in enumerate(VERIF)}  # menor = mejor verificación
FECHA = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
URL = re.compile(r"^https?://\S+$")


def normalizar_fuente(f):
    f = dict(f)
    f["url"] = f["url"].strip().replace(" ", "%20")
    f.setdefault("editor", None)
    if f.get("tipo") not in TIPOS:
        raise ValueError(f"tipo de fuente inválido: {f.get('tipo')} ({f['url']})")
    if f.get("verificacion") not in VERIF:
        raise ValueError(f"verificacion inválida: {f.get('verificacion')} ({f['url']})")
    if not URL.match(f["url"]):
        raise ValueError("URL inválida: " + f["url"])
    return {k: v for k, v in f.items() if k in ("titulo", "editor", "url", "tipo", "verificacion", "nota")}


def completar(e):
    """Valida y completa un evento crudo; lanza ValueError si está mal."""
    for k in ("fecha_inicio", "titulo", "detalle", "etapa", "fase", "categoria", "fuentes"):
        if not e.get(k):
            raise ValueError(f"falta '{k}' en: {e.get('titulo', e)}")
    if not FECHA.match(e["fecha_inicio"]): raise ValueError("fecha_inicio inválida: " + e["fecha_inicio"])
    if e.get("fecha_fin") and not FECHA.match(e["fecha_fin"]): raise ValueError("fecha_fin inválida: " + e["fecha_fin"])
    if e["fase"] not in FASES: raise ValueError("fase inválida: " + e["fase"])
    if e["categoria"] not in CATS: raise ValueError("categoria inválida: " + e["categoria"])
    fu = [normalizar_fuente(f) for f in e["fuentes"]]
    precision = e.get("precision_fecha") or {4: "año", 7: "mes", 10: "día"}[len(e["fecha_inicio"])]
    if precision not in PRECS: raise ValueError("precision_fecha inválida: " + precision)
    oficial = any(f["tipo"] in ("oficial NASA/JPL", "científica") for f in fu)
    return dict(
        fecha_inicio=e["fecha_inicio"], fecha_fin=e.get("fecha_fin"), precision_fecha=precision,
        sol=e.get("sol"), sol_texto=e.get("sol_texto"), titulo=e["titulo"].strip(), detalle=e["detalle"].strip(),
        datos_clave=[str(x) for x in e.get("datos_clave", [])], etapa=e["etapa"], fase=e["fase"], categoria=e["categoria"],
        respaldo=e.get("respaldo") or ("oficial_o_cientifico" if oficial else "secundario"),
        discutido=bool(e.get("discutido")), nota=e.get("nota"), fuentes=fu,
        compartido_con=list(e.get("compartido_con", [])), datos_extra=e.get("datos_extra"))


def sim(a, b): return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def duplicado(n, existentes, umbral):
    for x in existentes:
        misma_epoca = n["fecha_inicio"][:7] == x["fecha_inicio"][:7] or n["fecha_inicio"][:4] == x["fecha_inicio"][:4] and (len(n["fecha_inicio"]) == 4 or len(x["fecha_inicio"]) == 4)
        if misma_epoca and (sim(n["titulo"], x["titulo"]) > umbral or sim(n["detalle"][:200], x["detalle"][:200]) > 0.75):
            return x
    return None


def reindexar(doc, prefijo):
    ev = sorted(doc["eventos"], key=lambda e: (e["fecha_inicio"], e.get("orden") or 0))  # sort estable
    for i, e in enumerate(ev, 1):
        e["id"] = f"{prefijo}{i:03d}"; e["orden"] = i
    doc["eventos"] = ev
    # índice de fuentes: cada URL una vez, con los ids que la citan
    ix = {}
    for e in ev:
        for f in e["fuentes"]:
            x = ix.setdefault(f["url"], dict(url=f["url"], titulo=f["titulo"], editor=f.get("editor"), tipo=f["tipo"], verificacion=f["verificacion"], eventos=[]))
            if PRIO[f["verificacion"]] < PRIO[x["verificacion"]]: x["verificacion"] = f["verificacion"]
            if e["id"] not in x["eventos"]: x["eventos"].append(e["id"])
    for f in doc.get("fuentes_no_citadas_en_eventos", []):
        ix.setdefault(f["url"], dict(url=f["url"], titulo=f["titulo"], editor=f.get("editor"), tipo=f["tipo"], verificacion=f["verificacion"], eventos=[]))
    doc["indice_fuentes"] = sorted(ix.values(), key=lambda x: (-len(x["eventos"]), x["url"]))
    por_fase = {k: 0 for k in FASES}
    for e in ev: por_fase[e["fase"]] += 1
    m = doc["mision"]
    m["resumen"] = dict(eventos=len(ev), fuentes_unicas=len(ix), eventos_por_fase=por_fase)
    # fechas_clave: enlaza por fecha exacta (±1 día) con los eventos
    from datetime import date, timedelta
    for k, v in m.get("fechas_clave", {}).items():
        fecha = v["fecha"] if isinstance(v, dict) else v
        ids = []
        if fecha and re.fullmatch(r"\d{4}-\d\d-\d\d", fecha):
            y, mo, d = map(int, fecha.split("-")); c = date(y, mo, d)
            cerca = {(c + timedelta(days=i)).isoformat() for i in (-1, 0, 1)}
            ids = [e["id"] for e in ev if e["fecha_inicio"] in cerca]
        m["fechas_clave"][k] = dict(fecha=fecha, eventos=ids)
    return doc


def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
    f = sp.add_parser("fusionar"); f.add_argument("base"); f.add_argument("extras", nargs="+"); f.add_argument("-o", required=True); f.add_argument("--prefijo", required=True); f.add_argument("--umbral", type=float, default=0.6)
    r = sp.add_parser("reindexar"); r.add_argument("doc"); r.add_argument("-o", required=True); r.add_argument("--prefijo", required=True)
    a = ap.parse_args()
    doc = json.load(open(a.doc if a.cmd == "reindexar" else a.base, encoding="utf-8"))
    if a.cmd == "fusionar":
        nuevos = 0; dup = []; mal = []
        for ruta in a.extras:
            for e in json.load(open(ruta, encoding="utf-8")):
                try: n = completar(e)
                except ValueError as ex: mal.append(str(ex)); continue
                d = duplicado(n, doc["eventos"], a.umbral)
                if d:
                    # no se pierde información: las fuentes nuevas se suman al evento existente
                    urls = {x["url"] for x in d["fuentes"]}
                    d["fuentes"] += [x for x in n["fuentes"] if x["url"] not in urls]
                    dup.append(f"{n['titulo'][:60]}  ≈  {d['titulo'][:60]}"); continue
                n["orden"] = 10**6; doc["eventos"].append(n); nuevos += 1
        print(f"nuevos: {nuevos} | duplicados (fuentes fusionadas): {len(dup)} | inválidos: {len(mal)}")
        for x in dup: print("  DUP", x)
        for x in mal: print("  MAL", x)
    reindexar(doc, a.prefijo)
    json.dump(doc, open(a.o, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("eventos:", len(doc["eventos"]), "| URLs:", len(doc["indice_fuentes"]), "->", a.o)


if __name__ == "__main__":
    main()
