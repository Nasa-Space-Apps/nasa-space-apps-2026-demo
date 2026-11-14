"""Carga de prompts desde la carpeta prompts/.

Cada archivo .md puede empezar con un bloque de metadatos entre líneas `---` (clave: valor).
La clave `version` se guarda en metricas.json para comparar corridas entre versiones del prompt.
"""
from pathlib import Path

CARPETA = Path(__file__).parent / "prompts"


def cargar(nombre: str) -> tuple[str, str]:
    """Devuelve (texto, versión) del prompt `nombre` (sin extensión)."""
    crudo = (CARPETA / f"{nombre}.md").read_text(encoding="utf-8")
    meta: dict[str, str] = {}
    if crudo.startswith("---\n"):
        cabecera, _, crudo = crudo[4:].partition("\n---\n")
        for linea in cabecera.splitlines():
            if ":" in linea:
                k, v = linea.split(":", 1)
                meta[k.strip()] = v.strip()
    return crudo.strip("\n"), meta.get("version", "sin-version")


def sistema() -> tuple[str, str]:
    return cargar("investigador")


def mensaje_usuario(evento_json: str) -> tuple[str, str]:
    texto, version = cargar("usuario")
    return texto.replace("{evento_json}", evento_json), version
