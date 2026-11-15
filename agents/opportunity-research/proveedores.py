"""Proveedores de modelo del agente: plan de Claude, API key de Anthropic o Amazon Bedrock.

Se elige con --proveedor, con PROVEEDOR_LLM en .env o, si no hay nada, automáticamente:
API key si existe ANTHROPIC_API_KEY, y plan de Claude en caso contrario.
"""
import os
from dataclasses import dataclass, field
from pathlib import Path

MODELO_ANTHROPIC = "claude-sonnet-5-5"
# IDs de perfiles de inferencia de Bedrock. Estos dos responden en la cuenta probada (nov 2026).
# Los 5.x (us.anthropic.claude-sonnet-5-5 / claude-haiku-5-5) existen pero dieron INVALID_PAYMENT_INSTRUMENT:
# se activan poniéndolos en BEDROCK_MODELO / BEDROCK_MODELO_PEQUENO cuando la cuenta tenga un método de pago válido.
BEDROCK_PRINCIPAL = "us.anthropic.claude-sonnet-4-6"
BEDROCK_PEQUENO = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
# Revisor (Opus): relee el borrador de Sonnet. Responde en la cuenta probada. "ninguno" lo desactiva.
BEDROCK_REVISOR = "us.anthropic.claude-opus-4-6-v1"
VALIDOS = ("plan", "api", "bedrock")
# Variables que pueden cambiar de proveedor sin avisar: se limpian antes de aplicar uno.
LIMPIAR = ("ANTHROPIC_API_KEY", "CLAUDE_CODE_USE_BEDROCK", "ANTHROPIC_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL",
           "ANTHROPIC_SMALL_FAST_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "AWS_PROFILE")


@dataclass
class Proveedor:
    nombre: str
    modelo: str
    etiqueta: str
    con_tope: bool
    env: dict[str, str] = field(default_factory=dict)  # se aplica al proceso de Claude Code
    modelo_revisor: str | None = None  # segunda pasada con un modelo más potente (solo Bedrock)


def cargar_env(ruta: Path):
    """Lee un .env simple (CLAVE=valor) sin pisar variables ya definidas. No imprime nada."""
    if not ruta.exists():
        return
    for ln in ruta.read_text(encoding="utf-8").splitlines():
        if "=" in ln and not ln.strip().startswith("#"):
            k, v = ln.split("=", 1)
            if v.strip():
                os.environ.setdefault(k.strip(), v.strip())


def resolver(nombre: str | None = None) -> Proveedor:
    """Devuelve la configuración del proveedor pedido (o del elegido por entorno)."""
    nombre = (nombre or os.environ.get("PROVEEDOR_LLM") or ("api" if os.environ.get("ANTHROPIC_API_KEY") else "plan")).strip().lower()
    if nombre not in VALIDOS:
        raise ValueError(f"Proveedor desconocido: {nombre!r}. Usa uno de {VALIDOS}.")
    modelo = os.environ.get("MODELO_INVESTIGADOR", MODELO_ANTHROPIC)
    if nombre == "bedrock":
        region = os.environ.get("AWS_REGION", "us-east-1")
        principal = os.environ.get("BEDROCK_MODELO", BEDROCK_PRINCIPAL)
        pequeno = os.environ.get("BEDROCK_MODELO_PEQUENO", BEDROCK_PEQUENO)
        revisor = os.environ.get("BEDROCK_MODELO_REVISOR", BEDROCK_REVISOR)
        revisor = None if revisor.strip().lower() in ("", "ninguno", "none") else revisor
        perfil = os.environ.get("BEDROCK_PROFILE", "default")  # explícito: no usar otro perfil por accidente
        env = {"CLAUDE_CODE_USE_BEDROCK": "1", "AWS_REGION": region, "AWS_PROFILE": perfil,
               "ANTHROPIC_MODEL": principal, "ANTHROPIC_DEFAULT_SONNET_MODEL": principal,
               "ANTHROPIC_DEFAULT_HAIKU_MODEL": pequeno, "ANTHROPIC_SMALL_FAST_MODEL": pequeno}
        return Proveedor("bedrock", principal, f"Amazon Bedrock · perfil {perfil} · {region} · {principal}" + (f" + revisor {revisor}" if revisor else ""), True, env, revisor)
    if nombre == "api":
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise ValueError("El proveedor 'api' necesita ANTHROPIC_API_KEY.")
        return Proveedor("api", modelo, f"API key de Anthropic ({modelo})", True,
                         {"ANTHROPIC_API_KEY": os.environ["ANTHROPIC_API_KEY"]})
    return Proveedor("plan", modelo, f"plan de Claude ({modelo})", False)


def aplicar(p: Proveedor):
    """Deja el entorno del proceso listo para ese proveedor (borra rastros de los otros)."""
    for k in LIMPIAR:
        os.environ.pop(k, None)
    os.environ.update(p.env)
