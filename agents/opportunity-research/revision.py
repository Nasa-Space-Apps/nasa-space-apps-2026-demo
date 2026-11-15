"""Segunda pasada con un modelo más potente (Opus) que revisa el borrador del investigador.

Solo se usa con Bedrock. El revisor no tiene herramientas ni internet y NO reescribe el dossier: devuelve solo sus decisiones
(qué datos conservar por número, el relato nuevo y las contradicciones o huecos que añade). Así genera pocos tokens y no puede
inventar datos, URLs, citas ni imágenes: `fusionar` solo selecciona entre lo que ya existe.

Prueba suelta sobre un dossier ya generado (no sobrescribe nada sin --guardar):
  python revision.py salida/opp021 ../../story/data/historia_opportunity.json --evento opp021
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query
from pydantic import BaseModel, Field

import prompts
import proveedores
from esquema import Dossier

BASE = Path(__file__).parent


class Revision(BaseModel):
    """Formato de respuesta del revisor: solo decisiones, no el dossier completo."""
    indices_datos_a_conservar: list[int] = Field(description="Números de los datos del borrador que se conservan.")
    contexto_ampliado: str
    contradicciones_nuevas: list[str] = Field(default_factory=list)
    huecos_nuevos: list[str] = Field(default_factory=list)
    ideas_visuales: list[str] = Field(default_factory=list)
    observaciones: str = ""


def fusionar(borrador: Dossier, rev: Revision) -> tuple[Dossier, dict]:
    """Aplica la revisión con límites estrictos: solo puede quitar datos y cambiar texto."""
    vistos, datos, invalidos = set(), [], 0
    for i in rev.indices_datos_a_conservar:
        if not isinstance(i, int) or i < 0 or i >= len(borrador.datos_reales) or i in vistos:
            invalidos += 1
            continue
        vistos.add(i)
        datos.append(borrador.datos_reales[i])
    final = borrador.model_copy(deep=True)
    final.datos_reales = [x.model_copy(deep=True) for x in sorted(datos, key=borrador.datos_reales.index)]
    if rev.contexto_ampliado.strip():
        final.contexto_ampliado = rev.contexto_ampliado.strip()
    final.contradicciones = borrador.contradicciones + [c for c in rev.contradicciones_nuevas if c.strip()]
    final.huecos = borrador.huecos + [h for h in rev.huecos_nuevos if h.strip()]
    if rev.ideas_visuales:
        final.ideas_visuales = rev.ideas_visuales
    cambios = {"datos_antes": len(borrador.datos_reales), "datos_despues": len(final.datos_reales), "indices_invalidos": invalidos,
               "contradicciones_nuevas": len(rev.contradicciones_nuevas), "huecos_nuevos": len(rev.huecos_nuevos),
               "observaciones": rev.observaciones[:400]}
    return final, cambios


def armar_entrada(evento: dict, borrador: Dossier) -> str:
    datos = "\n".join(f"[{i}] {x.afirmacion}\n    cita: «{x.cita}»\n    url: {x.fuente_url}" for i, x in enumerate(borrador.datos_reales))
    ev = {k: evento.get(k) for k in ("id", "titulo", "fecha_inicio", "fecha_fin", "sol", "hechos", "detalle", "datos_clave", "nota") if k in evento}
    return ("EVENTO ORIGINAL:\n" + json.dumps(ev, ensure_ascii=False, indent=1)[:6000]
            + f"\n\nBORRADOR DEL INVESTIGADOR\nTítulo: {borrador.titulo}\n\nRelato del borrador:\n{borrador.contexto_ampliado}\n\nDATOS:\n{datos}"
            + "\n\nContradicciones del borrador:\n" + "\n".join(f"- {c}" for c in borrador.contradicciones)
            + "\n\nHuecos del borrador:\n" + "\n".join(f"- {c}" for c in borrador.huecos))


async def revisar(evento: dict, borrador: Dossier, prov: proveedores.Proveedor, contexto: dict | None = None) -> tuple[Dossier, dict]:
    """Devuelve (dossier revisado, métricas). Si el revisor falla, devuelve el borrador y deja el error en las métricas."""
    sistema, version = prompts.cargar("revisor", contexto)
    env = {**prov.env, "ANTHROPIC_MODEL": prov.modelo_revisor}
    proveedores.aplicar(proveedores.Proveedor(prov.nombre, prov.modelo_revisor, prov.etiqueta, prov.con_tope, env))
    opts = ClaudeAgentOptions(model=prov.modelo_revisor, system_prompt=sistema, tools=[], allowed_tools=[], max_turns=3, setting_sources=[],
                              cwd=str(BASE), env=env, output_format={"type": "json_schema", "schema": Revision.model_json_schema()})
    met = {"modelo": prov.modelo_revisor, "prompt_version": version}
    salida = None
    try:
        async for m in query(prompt=armar_entrada(evento, borrador), options=opts):
            if isinstance(m, ResultMessage):
                met.update({"costo_usd_referencia": m.total_cost_usd, "turnos": m.num_turns, "duracion_s": round(m.duration_ms / 1000, 1),
                            "por_modelo": m.model_usage})
                if m.is_error:
                    met["error"] = f"{m.subtype} {m.errors} {(m.result or '')[:200]}"
                else:
                    salida = m.structured_output
    except Exception as e:  # noqa: BLE001
        met["error"] = f"{type(e).__name__}: {str(e)[:200]}"
    if not salida:
        met.setdefault("error", "el revisor no devolvió una revisión")
        return borrador, met
    try:
        final, cambios = fusionar(borrador, Revision.model_validate(salida))
    except Exception as e:  # noqa: BLE001
        met["error"] = f"revisión inválida: {type(e).__name__}: {str(e)[:150]}"
        return borrador, met
    met["cambios"] = cambios
    return final, met


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Revisa un dossier ya generado con el modelo revisor de Bedrock.")
    ap.add_argument("carpeta", help="p. ej. salida/opp021")
    ap.add_argument("archivo_eventos")
    ap.add_argument("--evento", required=True)
    ap.add_argument("--guardar", action="store_true", help="escribe dossier.revisado.json junto al dossier (no pisa el original)")
    a = ap.parse_args()
    proveedores.cargar_env(BASE / ".env")
    prov = proveedores.resolver("bedrock")
    if not prov.modelo_revisor:
        sys.exit("No hay modelo revisor configurado (BEDROCK_MODELO_REVISOR).")
    import agente  # noqa: E402  (reutiliza cargar_evento y verificar)
    ev = agente.cargar_evento(a.archivo_eventos, a.evento)
    borrador = Dossier.model_validate_json((Path(a.carpeta) / "dossier.json").read_text(encoding="utf-8"))
    borrador.datos_no_verificados = []
    final, met = asyncio.run(revisar(ev, borrador, prov))
    final = agente.verificar(final)
    print(json.dumps(met, ensure_ascii=False, indent=1, default=str)[:2000])
    if a.guardar:
        (Path(a.carpeta) / "dossier.revisado.json").write_text(final.model_dump_json(indent=2), encoding="utf-8")
        print("guardado dossier.revisado.json")
