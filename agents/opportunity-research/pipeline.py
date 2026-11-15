"""Herramientas del flujo «misión → historia de N eventos». Las usan las skills `mars-*`; sirve para cualquier misión.

Todas las salidas van a misiones/<id>/ (ver mision.py): las de una misión nunca se mezclan con las de otra.

Comandos (desde agents/opportunity-research/, con su entorno virtual):
  python pipeline.py nueva <id> --nombre ... --tipo rover --cuerpo Marte --prefijo spi (--sol-cero AAAA-MM-DD --sol-offset 0|1 | --sin-sol)
  python pipeline.py estado <id> [--n 25] [--json]          en qué fase va y cuál es el siguiente paso (incluye las estimaciones para la pregunta de N)
  python pipeline.py validar-base <id>                      valida timelines_v0/linea_de_tiempo_<id>.json con el kit (debe dar 0 problemas)
  python pipeline.py prefiltro <id> --n 20                  rasgos objetivos de cada evento y cuotas sugeridas por fase
  python pipeline.py seleccion <id> --ids a,b,c | --archivo sel.json | --desde-historia historia.json
  python pipeline.py conciliar <id>                         resume contradicciones, huecos y datos sin verificar de los dossiers
  python pipeline.py historia <id> --crear | --textos t.json | --validar | --html
"""
import argparse
import json
import statistics
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

import mision as M

FASES = ["origen", "planificacion_y_desarrollo", "lanzamiento_y_viaje", "aterrizaje", "operaciones", "fin_de_mision", "legado"]
FUERTES = ("oficial NASA/JPL", "científica")
# Valores medidos con Opportunity (Bedrock: Sonnet + revisión con Opus; costo de referencia). Son estimaciones, no garantías.
USD_POR_EVENTO, MIN_SERIE, MIN_PARALELO = 0.52, 3.9, 1.4
FRAGIL_FRACCION, FRAGIL_MIN_VERIFICADOS = 1 / 3, 5


def salir(msg: str, codigo: int = 1):
    print(msg, file=sys.stderr)
    sys.exit(codigo)


def leer(ruta: Path) -> dict:
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def escribir(ruta: Path, obj) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def cargar_base(mision: str) -> dict:
    ruta = M.rutas(mision)["base"]
    if not ruta.exists():
        salir(f"No existe la línea de tiempo base de «{mision}»: {ruta}\n"
              f"Hay que construirla primero (Fase 1, skill mars-mission-base-research).", 3)
    return leer(ruta)


def fuertes(evento: dict) -> int:
    return sum(1 for s in evento.get("fuentes", []) if s.get("tipo") in FUERTES)


# ---------------------------------------------------------------- estimaciones (la pregunta de N)
def estimacion(n: int) -> dict:
    return {"n": n, "usd": round(n * USD_POR_EVENTO, 1), "min_serie": round(n * MIN_SERIE), "min_paralelo3": round(n * MIN_PARALELO)}


def n_sugerido(total_eventos: int) -> int:
    """≈ 25 % de los eventos, entre 20 y 30 (en Opportunity: 20 de 81)."""
    return max(20, min(30, round(total_eventos * 0.25)))


# ---------------------------------------------------------------- nueva
def cmd_nueva(a):
    M.validar_id(a.id)
    if M.rutas(a.id)["ficha"].exists():
        salir(f"La misión «{a.id}» ya existe: {M.rutas(a.id)['ficha']}. No se sobrescribe.", 2)
    if not a.sin_sol and not a.sol_cero and a.cuerpo.lower() == "marte":
        salir("Una misión en Marte necesita --sol-cero y --sol-offset (se buscan en fuentes, no se asumen) o --sin-sol.", 2)
    ficha = {"id": a.id, "nombre": a.nombre, "tipo": a.tipo, "cuerpo": a.cuerpo, "agencia": a.agencia, "prefijo_eventos": a.prefijo,
             "publico": a.publico, "sol": {"sin_sol": True} if a.sin_sol else {"cero": a.sol_cero, "offset": a.sol_offset},
             "creada": date.today().isoformat()}
    r = M.crear_carpetas(a.id)
    escribir(r["ficha"], ficha)
    print(f"Misión «{a.id}» creada en {r['mision']}\n  ficha: {r['ficha']}\n  base esperada (Fase 1): {r['base']}")


# ---------------------------------------------------------------- estado
def resumen_base(base: dict) -> dict:
    ev = base["eventos"]
    ver = {}
    for e in ev:
        for s in e["fuentes"]:
            ver[s["verificacion"]] = ver.get(s["verificacion"], 0) + 1
    return {"eventos": len(ev), "por_fase": {f: sum(1 for e in ev if e["fase"] == f) for f in FASES},
            "oficial_o_cientifico": sum(1 for e in ev if e["respaldo"] == "oficial_o_cientifico"),
            "discutidos": sum(1 for e in ev if e["discutido"]), "verificacion_fuentes": ver}


def ids_con_dossier(r) -> list[str]:
    d = r["dossiers"]
    return sorted(p.name for p in d.iterdir() if (p / "dossier.json").exists()) if d.exists() else []


def estado(mision: str, n_extra: int | None = None) -> dict:
    r = M.rutas(mision)
    e = {"mision": mision, "carpeta": str(r["mision"]), "ficha": r["ficha"].exists()}
    e["fase1"] = {"base": str(r["base"]), "existe": r["base"].exists()}
    total = 0
    if r["base"].exists():
        e["fase1"].update(resumen_base(leer(r["base"])))
        total = e["fase1"]["eventos"]
    sel = r["seleccion"] / "seleccion.json"
    e["seleccion"] = {"existe": sel.exists()}
    ids = []
    if sel.exists():
        s = leer(sel)
        ids = s["ids"]
        e["seleccion"].update({"n": len(ids), "ids": ids})
    hechos = ids_con_dossier(r)
    e["dossiers"] = {"hechos": len(hechos), "pendientes": [i for i in ids if i not in hechos]}
    hist = r["historia"] / f"historia_{mision}.json"
    e["historia"] = {"existe": hist.exists(), "html": (r["historia"] / f"historia_{mision}.html").exists()}
    if total:
        ns = sorted({20, 30, n_sugerido(total)} | ({n_extra} if n_extra else set()))
        e["estimaciones"] = {"sugerido": n_sugerido(total), "opciones": [estimacion(n) for n in ns]}
    # siguiente paso
    if not e["fase1"]["existe"]:
        e["siguiente"] = "FASE 1: construir la línea de tiempo base con el kit (skill mars-mission-base-research)."
    elif not e["seleccion"]["existe"]:
        e["siguiente"] = "COMPUERTA: preguntar cuántos eventos (N) quiere la historia y esperar la respuesta; luego elegir N (skill mars-story-event-selection)."
    elif e["dossiers"]["pendientes"]:
        e["siguiente"] = f"FASE 2.2: investigar {len(e['dossiers']['pendientes'])} evento(s) pendientes (skill mars-event-research)."
    elif not (r["informes"] / "conciliacion.json").exists():
        e["siguiente"] = "FASE 2.3: conciliar los dossiers (skill mars-dossier-reconciliation)."
    elif not e["historia"]["existe"]:
        e["siguiente"] = "FASE 2.4: escribir la historia desde los dossiers (skill mars-story-writing)."
    else:
        e["siguiente"] = "Historia creada: revisarla (pipeline.py historia <id> --validar) y aprobarla."
    return e


def formatear_estado(e: dict) -> str:
    f1, L = e["fase1"], []
    L.append(f"MISIÓN {e['mision']}  ·  carpeta: {e['carpeta']}  ·  ficha: {'sí' if e['ficha'] else 'NO (usar pipeline.py nueva)'}")
    L.append(f"FASE 1 · base: {'EXISTE' if f1['existe'] else 'NO EXISTE'}  ({f1['base']})")
    if f1["existe"]:
        L.append(f"   {f1['eventos']} eventos · {f1['oficial_o_cientifico']} con respaldo oficial o científico · {f1['discutidos']} discutidos")
        L.append("   por fase: " + ", ".join(f"{k} {v}" for k, v in f1["por_fase"].items() if v))
        tot = sum(f1["verificacion_fuentes"].values()) or 1
        L.append("   verificación de las fuentes: " + ", ".join(f"{k[:30]} {v * 100 // tot}%" for k, v in f1["verificacion_fuentes"].items()))
    if "estimaciones" in e:
        L.append(f"COMPUERTA · N sugerido: {e['estimaciones']['sugerido']}")
        for o in e["estimaciones"]["opciones"]:
            L.append(f"   N={o['n']}: ≈ {o['usd']} USD · ≈ {o['min_serie']} min en serie · ≈ {o['min_paralelo3']} min con 3 en paralelo")
    s, d = e["seleccion"], e["dossiers"]
    L.append(f"FASE 2 · selección: {'N=' + str(s['n']) if s['existe'] else 'sin hacer'} · dossiers hechos: {d['hechos']} · pendientes: {len(d['pendientes'])}")
    L.append(f"   historia: {'creada' if e['historia']['existe'] else 'sin crear'}{' (con visor HTML)' if e['historia']['html'] else ''}")
    L.append(f"SIGUIENTE PASO: {e['siguiente']}")
    return "\n".join(L)


def cmd_estado(a):
    e = estado(a.id, a.n)
    print(json.dumps(e, ensure_ascii=False, indent=2) if a.json else formatear_estado(e))


# ---------------------------------------------------------------- validar-base
def cmd_validar_base(a):
    r = M.rutas(a.id)
    if not r["base"].exists():
        salir(f"No existe {r['base']}", 3)
    ficha = M.cargar_ficha(a.id)
    cmd = [sys.executable, str(M.KIT / "validar_mision.py"), str(r["base"])]
    sol = ficha.get("sol") or {}
    if a.sin_sol or sol.get("sin_sol"):
        cmd.append("--sin-sol")
    elif a.sol_cero or sol.get("cero"):
        cmd += ["--sol-cero", a.sol_cero or sol["cero"], "--sol-offset", str(a.sol_offset if a.sol_offset is not None else sol.get("offset", 0))]
    else:
        salir("Faltan los datos del sol: usa --sol-cero y --sol-offset, o --sin-sol, o crea la ficha con pipeline.py nueva.", 2)
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    sys.stdout.write(p.stdout + p.stderr)
    sys.exit(p.returncode)


# ---------------------------------------------------------------- prefiltro
def cuotas(conteo: dict, n: int) -> dict:
    """Reparto de N entre las fases, proporcional a sus eventos, con al menos 1 por fase y nunca más de los que hay."""
    fases = [f for f in FASES if conteo.get(f)]
    total = sum(conteo[f] for f in fases)
    if n <= len(fases):
        return {f: 1 if f in sorted(fases, key=lambda x: -conteo[x])[:n] else 0 for f in fases}
    q = {f: min(conteo[f], max(1, round(n * conteo[f] / total))) for f in fases}
    while sum(q.values()) > n:
        f = max((x for x in fases if q[x] > 1), key=lambda x: q[x])
        q[f] -= 1
    while sum(q.values()) < n:
        libres = [x for x in fases if q[x] < conteo[x]]
        if not libres:
            break
        q[max(libres, key=lambda x: conteo[x] - q[x])] += 1
    return q


def rasgos(e: dict) -> dict:
    f, precisa = fuertes(e), len(e["fecha_inicio"]) == 10
    return {"id": e["id"], "fecha": e["fecha_inicio"], "fase": e["fase"], "categoria": e["categoria"], "respaldo": e["respaldo"],
            "discutido": e["discutido"], "fuentes_fuertes": f, "fecha_precisa": precisa, "tiene_sol": e["sol"] is not None, "titulo": e["titulo"],
            "puntaje_objetivo": round(min(f, 3) + (1 if e["respaldo"] == "oficial_o_cientifico" else 0) - (1 if e["discutido"] else 0) + (0.5 if precisa else 0), 1)}


def cmd_prefiltro(a):
    base = cargar_base(a.id)
    ev = base["eventos"]
    conteo = {f: sum(1 for e in ev if e["fase"] == f) for f in FASES}
    q = cuotas(conteo, a.n)
    r = M.crear_carpetas(a.id)
    salida = {"mision": a.id, "n": a.n, "generado": datetime.now().isoformat(timespec="seconds"), "cuotas_sugeridas": q,
              "eventos_por_fase": conteo, "eventos": [rasgos(e) for e in ev]}
    escribir(r["seleccion"] / "prefiltro.json", salida)
    print(f"Prefiltro de «{a.id}» ({len(ev)} eventos) para N={a.n}  ->  {r['seleccion'] / 'prefiltro.json'}")
    print(f"{'fase':<28}{'eventos':>8}{'cuota':>7}   mediana de fuentes fuertes")
    for f in FASES:
        if conteo[f]:
            med = statistics.median(fuertes(e) for e in ev if e["fase"] == f)
            print(f"{f:<28}{conteo[f]:>8}{q.get(f, 0):>7}   {med}")


# ---------------------------------------------------------------- seleccion
def cmd_seleccion(a):
    base = cargar_base(a.id)
    por_id = {e["id"]: e for e in base["eventos"]}
    actos, asign, razones = [], {}, {}
    if a.desde_historia:
        h = leer(Path(a.desde_historia))
        ids = [e["id"] for e in h["eventos"]]
        actos = [{"n": x["n"], "titulo": x["titulo"]} for x in h.get("actos", [])]
        asign = {e["id"]: e.get("acto") for e in h["eventos"]}
        razones = {e["id"]: (e.get("narrativa") or {}).get("por_que_se_eligio") for e in h["eventos"]}
    elif a.archivo:
        s = leer(Path(a.archivo))
        ids, actos, asign, razones = s["ids"], s.get("actos", []), s.get("asignacion", {}), s.get("razones", {})
    elif a.ids:
        ids = [i.strip() for i in a.ids.split(",") if i.strip()]
    else:
        salir("Indica --ids, --archivo o --desde-historia.", 2)
    faltan = [i for i in ids if i not in por_id]
    if faltan:
        salir(f"Estos ids no existen en la línea de tiempo base: {', '.join(faltan)}", 2)
    if len(set(ids)) != len(ids):
        salir("Hay ids repetidos en la selección.", 2)
    ev_sel = [por_id[i] for i in ids]
    cob = {f: f"{sum(1 for e in ev_sel if e['fase'] == f)}/{sum(1 for e in base['eventos'] if e['fase'] == f)}" for f in FASES}
    r = M.crear_carpetas(a.id)
    escribir(r["seleccion"] / "seleccion.json", {
        "mision": a.id, "n": len(ids), "generado": datetime.now().isoformat(timespec="seconds"), "ids": sorted(ids, key=lambda i: por_id[i]["orden"]),
        "actos": actos or [{"n": 1, "titulo": "Historia"}], "asignacion": {i: asign.get(i) or 1 for i in ids}, "razones": {i: razones.get(i) for i in ids},
        "cobertura_fases": cob})
    print(f"Selección de «{a.id}»: N={len(ids)}  ->  {r['seleccion'] / 'seleccion.json'}")
    print("cobertura por fase: " + ", ".join(f"{k} {v}" for k, v in cob.items() if not v.startswith("0/0")))


# ---------------------------------------------------------------- conciliar
def datos_dossier(ruta: Path) -> dict:
    d = leer(ruta)
    v, nv = len(d["datos_reales"]), len(d.get("datos_no_verificados", []))
    fs = d.get("fuentes_nuevas", [])
    fuertes_n = sum(1 for f in fs if f.get("tipo") in FUERTES)
    frac = nv / (v + nv) if (v + nv) else 1.0
    motivos = []
    if frac > FRAGIL_FRACCION:
        motivos.append(f"{nv} de {v + nv} datos sin verificar")
    if v < FRAGIL_MIN_VERIFICADOS:
        motivos.append(f"solo {v} datos verificados")
    if fuertes_n == 0:
        motivos.append("ninguna fuente oficial ni científica")
    return {"titulo": d["titulo"], "verificados": v, "no_verificados": nv, "fuentes_total": len(fs), "fuentes_fuertes": fuertes_n,
            "contradicciones": d.get("contradicciones", []), "huecos": d.get("huecos", []), "fragil": bool(motivos), "motivos_fragil": motivos}


def cmd_conciliar(a):
    r = M.crear_carpetas(a.id)
    sel = r["seleccion"] / "seleccion.json"
    ids = leer(sel)["ids"] if sel.exists() else ids_con_dossier(r)
    base = {e["id"]: e for e in leer(r["base"])["eventos"]} if r["base"].exists() else {}
    filas, faltan = [], []
    for i in ids:
        ruta = r["dossiers"] / i / "dossier.json"
        if not ruta.exists():
            faltan.append(i)
            continue
        f = datos_dossier(ruta)
        f.update({"id": i, "discutido_en_base": base.get(i, {}).get("discutido"), "nota_base": base.get(i, {}).get("nota")})
        filas.append(f)
    filas.sort(key=lambda f: (not f["fragil"], -len(f["contradicciones"]), f["id"]))
    informe = {"mision": a.id, "generado": datetime.now().isoformat(timespec="seconds"), "eventos": len(filas), "sin_dossier": faltan,
               "fragiles": [f["id"] for f in filas if f["fragil"]], "datos_verificados": sum(f["verificados"] for f in filas),
               "datos_sin_verificar": sum(f["no_verificados"] for f in filas), "filas": filas}
    escribir(r["informes"] / "conciliacion.json", informe)
    L = [f"# Conciliación de «{a.id}»", "", f"{len(filas)} dossiers · {informe['datos_verificados']} datos verificados · {informe['datos_sin_verificar']} sin verificar · "
         f"{len(informe['fragiles'])} frágiles" + (f" · **sin dossier:** {', '.join(faltan)}" if faltan else ""), "",
         "| Evento | Título | Verificados | Sin verificar | Contradicciones | Huecos | Fuentes fuertes | Frágil | Decisión |", "|---|---|---|---|---|---|---|---|---|"]
    for f in filas:
        L.append(f"| `{f['id']}` | {f['titulo'][:50]} | {f['verificados']} | {f['no_verificados']} | {len(f['contradicciones'])} | {len(f['huecos'])} | "
                 f"{f['fuentes_fuertes']}/{f['fuentes_total']} | {'**sí**: ' + '; '.join(f['motivos_fragil']) if f['fragil'] else 'no'} | ☐ conservar ☐ corregir ☐ reemplazar |")
    L += ["", "## Detalle por evento", ""]
    for f in filas:
        L += [f"### `{f['id']}` · {f['titulo']}", ""]
        if f["nota_base"]:
            L.append(f"- **Nota en la línea de tiempo base:** {f['nota_base']}")
        L += [f"- **Contradicción:** {c}" for c in f["contradicciones"]] + [f"- **Hueco:** {h}" for h in f["huecos"]] + [""]
    (r["informes"] / "conciliacion.md").write_text("\n".join(L), encoding="utf-8")
    print(f"Conciliación de «{a.id}»: {len(filas)} dossiers, {len(informe['fragiles'])} frágiles"
          + (f", SIN dossier: {', '.join(faltan)}" if faltan else "") + f"\n  {r['informes'] / 'conciliacion.md'}\n  {r['informes'] / 'conciliacion.json'}")


# ---------------------------------------------------------------- historia
def construir_historia(mision: str) -> dict:
    r = M.rutas(mision)
    sel_f = r["seleccion"] / "seleccion.json"
    if not sel_f.exists():
        salir("Falta la selección (pipeline.py seleccion).", 3)
    sel = leer(sel_f)
    base = {e["id"]: e for e in leer(r["base"])["eventos"]} if r["base"].exists() else {}
    eventos, actos = [], {x["n"]: x["titulo"] for x in sel["actos"]}
    faltan = [i for i in sel["ids"] if not (r["dossiers"] / i / "dossier.json").exists()]
    if faltan:
        salir(f"Faltan dossiers de: {', '.join(faltan)}. Investigarlos antes de escribir la historia.", 3)
    for k, i in enumerate(sel["ids"], 1):
        d = leer(r["dossiers"] / i / "dossier.json")
        b = base.get(i, {})
        fs = d.get("fuentes_nuevas", [])
        acto = sel["asignacion"].get(i) or 1
        eventos.append({
            "id": i, "orden_historia": k, "acto": acto, "acto_titulo": actos.get(acto, "Historia"),
            "fecha_inicio": b.get("fecha_inicio"), "fecha_fin": b.get("fecha_fin"), "sol": b.get("sol"), "titulo": d["titulo"],
            "narrativa": {"gancho": None, "escena_visual": (d.get("ideas_visuales") or [None])[0], "emocion": None, "elementos": [],
                          "por_que_se_eligio": sel["razones"].get(i)},
            "hechos": {"detalle": d["contexto_ampliado"], "datos_clave": [x["afirmacion"] for x in d["datos_reales"][:5]],
                       "discutido": bool(d.get("contradicciones")) or bool(b.get("discutido")), "nota": b.get("nota")},
            "datos_verificados": [{"afirmacion": x["afirmacion"], "cita": x["cita"], "fuente_url": x["fuente_url"]} for x in d["datos_reales"]],
            "contradicciones": d.get("contradicciones", []), "huecos": d.get("huecos", []), "ideas_visuales": d.get("ideas_visuales", []),
            "fuentes": [{"titulo": f["titulo"], "editor": f.get("editor"), "url": f["url"], "tipo": f["tipo"]} for f in fs],
            "solidez_fuentes": "fuerte" if any(f.get("tipo") in FUERTES for f in fs) else "debil",
            "busqueda_sugerida": "; ".join((d.get("huecos") or [])[:2]) or "—"})
    ficha = M.cargar_ficha(mision)
    return {"esquema_version": "historia-2.0", "mision": ficha.get("nombre") or mision, "idioma": "es",
            "titulo": f"{ficha.get('nombre') or mision}: la historia en {len(eventos)} momentos", "publico": ficha.get("publico") or "estudiantes de 5.º de secundaria (17 años)",
            "actos": [{"n": n, "titulo": t, "eventos": [e["id"] for e in eventos if e["acto"] == n]} for n, t in actos.items()],
            "eventos": eventos,
            "resumen": {"eventos": len(eventos), "con_fuente_fuerte": sum(1 for e in eventos if e["solidez_fuentes"] == "fuerte"),
                        "con_fuente_debil": [e["id"] for e in eventos if e["solidez_fuentes"] == "debil"], "discutidos": [e["id"] for e in eventos if e["hechos"]["discutido"]]},
            "aviso": "Los hechos salen de los dossiers verificados (campo datos_verificados). Los campos gancho, emocion y escena_visual son redacción editorial."}


def problemas_historia(h: dict) -> list[str]:
    P = []
    for e in h["eventos"]:
        for c in ("gancho", "emocion", "escena_visual"):
            if not (e["narrativa"].get(c) or "").strip():
                P.append(f"{e['id']}: falta narrativa.{c}")
        if not e["datos_verificados"]:
            P.append(f"{e['id']}: sin datos verificados")
        if not e["fuentes"]:
            P.append(f"{e['id']}: sin fuentes")
    return P


def cmd_historia(a):
    r = M.crear_carpetas(a.id)
    destino = r["historia"] / f"historia_{a.id}.json"
    if a.crear:
        if destino.exists() and not a.forzar:
            salir(f"Ya existe {destino}. Usa --forzar para rehacerla (se pierde la redacción actual).", 2)
        h = construir_historia(a.id)
        escribir(destino, h)
        print(f"Historia de «{a.id}»: {len(h['eventos'])} eventos en {len(h['actos'])} actos  ->  {destino}\n"
              f"Faltan por escribir (hoy en null): gancho, emocion y elementos de cada evento. Después: --textos y --validar.")
        return
    if not destino.exists():
        salir(f"No existe {destino}. Primero: pipeline.py historia {a.id} --crear", 3)
    h = leer(destino)
    if a.textos:
        t = leer(Path(a.textos))
        por_id = {e["id"]: e for e in h["eventos"]}
        desconocidos = [i for i in t if i not in por_id]
        if desconocidos:
            salir(f"Estos ids no están en la historia: {', '.join(desconocidos)}", 2)
        for i, campos in t.items():
            for k in ("gancho", "escena_visual", "emocion", "elementos"):
                if k in campos:
                    por_id[i]["narrativa"][k] = campos[k]
        escribir(destino, h)
        print(f"Textos aplicados a {len(t)} evento(s).")
    if a.validar or a.textos:
        P = problemas_historia(h)
        print("problemas: " + str(len(P)))
        for p in P:
            print("  -", p)
        if P and a.validar:
            sys.exit(1)
    if a.html:
        plantilla = M.RAIZ / "story" / "templates" / "historia.template.html"
        t = plantilla.read_text(encoding="utf-8").replace('<script src="../data/historia_opportunity.js"></script>\n', "")
        datos = json.dumps(h, ensure_ascii=False).replace("</", "<\\/")
        salida = r["historia"] / f"historia_{a.id}.html"
        salida.write_text(t.replace("__DATA__", datos), encoding="utf-8")
        print(f"Visor: {salida}")


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("nueva"); p.add_argument("id"); p.add_argument("--nombre", required=True); p.add_argument("--tipo", required=True)
    p.add_argument("--cuerpo", required=True); p.add_argument("--agencia", default="NASA/JPL"); p.add_argument("--prefijo", required=True)
    p.add_argument("--publico", default="estudiantes de 5.º de secundaria (17 años)"); p.add_argument("--sol-cero"); p.add_argument("--sol-offset", type=int, default=0)
    p.add_argument("--sin-sol", action="store_true"); p.set_defaults(f=cmd_nueva)
    p = sp.add_parser("estado"); p.add_argument("id"); p.add_argument("--n", type=int); p.add_argument("--json", action="store_true"); p.set_defaults(f=cmd_estado)
    p = sp.add_parser("validar-base"); p.add_argument("id"); p.add_argument("--sol-cero"); p.add_argument("--sol-offset", type=int)
    p.add_argument("--sin-sol", action="store_true"); p.set_defaults(f=cmd_validar_base)
    p = sp.add_parser("prefiltro"); p.add_argument("id"); p.add_argument("--n", type=int, required=True); p.set_defaults(f=cmd_prefiltro)
    p = sp.add_parser("seleccion"); p.add_argument("id"); p.add_argument("--ids"); p.add_argument("--archivo"); p.add_argument("--desde-historia")
    p.set_defaults(f=cmd_seleccion)
    p = sp.add_parser("conciliar"); p.add_argument("id"); p.set_defaults(f=cmd_conciliar)
    p = sp.add_parser("historia"); p.add_argument("id"); p.add_argument("--crear", action="store_true"); p.add_argument("--forzar", action="store_true")
    p.add_argument("--textos"); p.add_argument("--validar", action="store_true"); p.add_argument("--html", action="store_true"); p.set_defaults(f=cmd_historia)
    a = ap.parse_args()
    try:
        M.validar_id(a.id)
    except ValueError as e:
        salir(str(e), 2)
    sys.stdout.reconfigure(encoding="utf-8")
    a.f(a)


if __name__ == "__main__":
    main()
