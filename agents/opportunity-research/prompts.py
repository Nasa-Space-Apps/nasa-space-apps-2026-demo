"""Carga de prompts desde la carpeta prompts/.

Cada archivo .md puede empezar con un bloque de metadatos entre líneas `---` (clave: valor).
La clave `version` se guarda en metricas.json para comparar corridas entre versiones del prompt.

Los prompts son neutros a la misión: `{mision}` y `{publico}` se reemplazan con el contexto de la misión
(ver `mision.contexto_prompt`). Sin contexto se usan valores neutros.
"""
import os
from pathlib import Path

CARPETA = Path(__file__).parent / "prompts"
PUBLICO_POR_DEFECTO = "estudiantes de 5.º de secundaria (17 años)"


def _rellenar(texto: str, contexto: dict | None) -> str:
    c = {"mision": "la misión", "publico": PUBLICO_POR_DEFECTO, **(contexto or {})}
    return texto.replace("{mision}", c["mision"]).replace("{publico}", c["publico"])


def cargar(nombre: str, contexto: dict | None = None) -> tuple[str, str]:
    """Devuelve (texto, versión) del prompt `nombre` (sin extensión), con {mision} y {publico} ya reemplazados."""
    crudo = (CARPETA / f"{nombre}.md").read_text(encoding="utf-8")
    meta: dict[str, str] = {}
    if crudo.startswith("---\n"):
        cabecera, _, crudo = crudo[4:].partition("\n---\n")
        for linea in cabecera.splitlines():
            if ":" in linea:
                k, v = linea.split(":", 1)
                meta[k.strip()] = v.strip()
    return _rellenar(crudo.strip("\n"), contexto), meta.get("version", "sin-version")


def sistema(contexto: dict | None = None) -> tuple[str, str]:
    """PROMPT_INVESTIGADOR elige otro archivo de prompts/ (p. ej. `investigador_v3` para comparar o volver atrás)."""
    return cargar(os.environ.get("PROMPT_INVESTIGADOR") or "investigador", contexto)


def mensaje_usuario(evento_json: str) -> tuple[str, str]:
    texto, version = cargar("usuario")
    return texto.replace("{evento_json}", evento_json), version
