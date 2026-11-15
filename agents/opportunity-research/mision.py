"""Dónde vive cada cosa de una misión. Una carpeta por misión: las salidas de misiones distintas nunca se mezclan.

    misiones/<id>/
        ficha.json        alcance de la misión (nombre, tipo, cuerpo, prefijo de eventos, sol cero, rutas especiales)
        base_trabajo/     trabajo intermedio de la Fase 1 (eventos crudos, listas de huecos, validaciones)
        seleccion/        prefiltro, calificación y lista final de N eventos
        dossiers/<evento>/  salida del agente investigador (dossier.json, dossier.md, metricas.json)
        lotes/            registros de las corridas en lote
        informes/         conciliación y otros informes
        historia/         historia_<id>.json y su visor HTML

La línea de tiempo base (Fase 1) vive en `timelines_v0/linea_de_tiempo_<id>.json`, un archivo por misión.

Una misión «heredada» (Opportunity, trabajada antes de este orden) declara en su `ficha.json` la clave `rutas` con las
carpetas donde ya están sus salidas; así nada se mueve ni se rompe.
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
MISIONES = RAIZ / "misiones"
TIMELINES = RAIZ / "timelines_v0"
KIT = TIMELINES / "kit_herramientas"
SUBCARPETAS = ("base_trabajo", "seleccion", "dossiers", "lotes", "informes", "historia")
ID_VALIDO = re.compile(r"^[a-z][a-z0-9_]{1,30}$")


def validar_id(mision: str) -> str:
    if not ID_VALIDO.match(mision or ""):
        raise ValueError(f"id de misión inválido: {mision!r} (minúsculas, números y guion bajo; 2 a 31 caracteres)")
    return mision


def carpeta(mision: str) -> Path:
    return MISIONES / validar_id(mision)


def cargar_ficha(mision: str) -> dict:
    f = carpeta(mision) / "ficha.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def rutas(mision: str) -> dict[str, Path]:
    """Todas las rutas de la misión. Las de `ficha.json > rutas` (relativas a la raíz del repo) mandan sobre las normales."""
    base = carpeta(mision)
    r = {
        "mision": base,
        "ficha": base / "ficha.json",
        "base": TIMELINES / f"linea_de_tiempo_{mision}.json",
        **{k: base / k for k in SUBCARPETAS},
    }
    for k, v in (cargar_ficha(mision).get("rutas") or {}).items():
        r[k] = (RAIZ / v).resolve()
    return r


def crear_carpetas(mision: str) -> dict[str, Path]:
    r = rutas(mision)
    for k in SUBCARPETAS:
        r[k].mkdir(parents=True, exist_ok=True)
    return r


def contexto_prompt(mision: str | None = None, base: dict | None = None, publico: str | None = None) -> dict:
    """Variables para los prompts: nombre de la misión, tipo, cuerpo y público.
    Sale de la ficha, o del bloque `mision` de la línea de tiempo base, o de valores neutros."""
    ficha = cargar_ficha(mision) if mision else {}
    m = base.get("mision") if isinstance(base, dict) else None
    m = m if isinstance(m, dict) else {}
    nombre = ficha.get("nombre") or m.get("nombre_completo") or m.get("nombre") or (base.get("mision") if isinstance(base, dict) and isinstance(base.get("mision"), str) else None) or mision or "la misión"
    tipo = ficha.get("tipo") or m.get("tipo")
    cuerpo = ficha.get("cuerpo") or m.get("cuerpo")
    detalle = ", ".join(x for x in (tipo, cuerpo) if x)
    return {"mision": f"{nombre} ({detalle})" if detalle else nombre,
            "publico": publico or ficha.get("publico") or "estudiantes de 5.º de secundaria (17 años)"}
