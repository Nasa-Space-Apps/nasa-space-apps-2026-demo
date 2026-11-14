"""Agente investigador de eventos de Opportunity.

Uso:
  python agente.py ../../story/data/historia_opportunity.json --evento opp018
  python agente.py ../../story/data/juego_opportunity.json --evento n08
  python agente.py mi_evento.json                     (un JSON con un solo evento)
Opciones: --plan (forzar el plan de Claude aunque haya API key), --max-turnos 30,
          --forzar (repetir un evento ya procesado; guarda la versión anterior en salida/<id>/anteriores/)
Si el evento ya tiene dossier y no se pasa --forzar, no se ejecuta nada (código de salida 2).
"""
import argparse
import asyncio
import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, ResultMessage, TextBlock, ToolUseBlock, query

import herramientas as H
import prompts
from esquema import Dossier

BASE = Path(__file__).parent
SALIDA = BASE / "salida"
MODELO = os.environ.get("MODELO_INVESTIGADOR", "claude-sonnet-5-5")
DOMINIOS_IMG = ("nasa.gov", "jpl.nasa.gov", "caltech.edu", "wustl.edu")

SISTEMA, VERSION_SISTEMA = prompts.sistema()


def cargar_evento(ruta: str, evento_id: str | None) -> dict:
    d = json.loads(Path(ruta).read_text(encoding="utf-8"))
    lista = d.get("eventos") or d.get("nodos")
    if lista is None:
        return d
    if not evento_id:
        sys.exit(f"El archivo tiene {len(lista)} elementos; indica --evento ID (ej.: {lista[0]['id']}).")
    for e in lista:
        if e["id"] == evento_id:
            return e
    sys.exit(f"No encontré {evento_id}.")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9áéíóúñü]", "", s.lower())


def cita_en_texto(cita: str, texto: str) -> bool:
    t = norm(texto)
    partes = [p for p in re.split(r"\.\.\.|…", cita) if len(norm(p)) >= 12]
    return bool(partes) and all(norm(p) in t for p in partes)


def verificar(d: Dossier) -> Dossier:
    """Comprueba por código que cada cita aparece de verdad en el texto que el agente leyó."""
    ok, no = [], []
    for x in d.datos_reales:
        texto = H.CORPUS.get(x.fuente_url, "")
        x.verificado_en_texto = cita_en_texto(x.cita, texto)
        (ok if x.verificado_en_texto else no).append(x)
    d.datos_reales, d.datos_no_verificados = ok, no
    return d


def descargar_imagenes(d: Dossier, carpeta: Path):
    carpeta.mkdir(parents=True, exist_ok=True)
    for i, img in enumerate(d.imagenes, 1):
        host = urlparse(img.url).hostname or ""
        if not any(host == dm or host.endswith("." + dm) for dm in DOMINIOS_IMG):
            print(f"  imagen {i}: dominio no permitido ({host}), no se descarga")
            continue
        ext = Path(urlparse(img.url).path).suffix or ".jpg"
        destino = carpeta / f"{i:02d}_{(img.nasa_id or 'img')}{ext}"
        try:
            r = httpx.get(img.url, headers=H.UA, timeout=60, follow_redirects=True)
            r.raise_for_status()
            if len(r.content) > 25_000_000:
                print(f"  imagen {i}: demasiado grande, se omite")
                continue
            destino.write_bytes(r.content)
            img.archivo_local = str(destino.relative_to(BASE))
        except Exception as e:  # noqa: BLE001
            print(f"  imagen {i}: falló la descarga ({type(e).__name__})")


def a_markdown(d: Dossier, modo: str) -> str:
    L = [f"# {d.titulo} ({d.evento_id})", f"_Generado con {modo}. Todo dato lleva fuente; los no verificados están al final._", "",
         "## Contexto ampliado", d.contexto_ampliado, "", "## Datos reales (citas verificadas en el texto)"]
    L += [f"- {x.afirmacion} — [{urlparse(x.fuente_url).hostname}]({x.fuente_url}) · «{x.cita}» · confianza {x.confianza}" for x in d.datos_reales]
    L += ["", "## Imágenes"]
    L += [f"- **{i.titulo}** ({i.credito}) — {i.descripcion[:160]} — [{i.nasa_id or 'fuente'}]({i.pagina_url or i.url})" + (f" · `{i.archivo_local}`" if i.archivo_local else "") for i in d.imagenes]
    L += ["", "## Fuentes nuevas"] + [f"- [{f.titulo}]({f.url}) · {f.tipo}" for f in d.fuentes_nuevas]
    L += ["", "## Contradicciones"] + [f"- {c}" for c in d.contradicciones]
    L += ["", "## Huecos"] + [f"- {c}" for c in d.huecos]
    L += ["", "## Ideas visuales"] + [f"- {c}" for c in d.ideas_visuales]
    if d.datos_no_verificados:
        L += ["", "## Datos no verificados (la cita no aparece en el texto leído)"] + [f"- {x.afirmacion} — {x.fuente_url}" for x in d.datos_no_verificados]
    return "\n".join(L) + "\n"


async def investigar(evento: dict, max_turnos: int, forzar_plan: bool) -> tuple[Dossier, str, float | None]:
    if forzar_plan:
        os.environ.pop("ANTHROPIC_API_KEY", None)
    api = bool(os.environ.get("ANTHROPIC_API_KEY"))
    modo = f"API key ({MODELO})" if api else f"plan de Claude ({MODELO})"
    opts = ClaudeAgentOptions(
        model=MODELO, system_prompt=SISTEMA, mcp_servers={"inv": H.SERVER}, allowed_tools=H.NOMBRES, tools=[],
        max_turns=max_turnos, setting_sources=[], cwd=str(BASE),
        max_budget_usd=float(os.environ.get("PRESUPUESTO_USD", "2.0")) if api else None,
        output_format={"type": "json_schema", "schema": Dossier.model_json_schema()},
    )
    prompt, version_usuario = prompts.mensaje_usuario(
        json.dumps({k: v for k, v in evento.items() if k != "fuentes_extra"}, ensure_ascii=False, indent=1)[:9000])
    salida, met, llamadas = None, {}, {}
    print(f"Modo: {modo}")
    async for m in query(prompt=prompt, options=opts):
        if isinstance(m, AssistantMessage):
            for b in m.content:
                if isinstance(b, ToolUseBlock):
                    nom = b.name.replace("mcp__inv__", "")
                    llamadas[nom] = llamadas.get(nom, 0) + 1
                    print(f"  → {b.name.replace('mcp__inv__', '')} {json.dumps(b.input, ensure_ascii=False)[:110]}")
        elif isinstance(m, ResultMessage):
            met = {"costo_usd_referencia": m.total_cost_usd, "turnos": m.num_turns, "duracion_s": round(m.duration_ms / 1000, 1),
                   "duracion_api_s": round(m.duration_api_ms / 1000, 1), "tokens": m.usage, "por_modelo": m.model_usage}
            if m.is_error:
                sys.exit(f"El agente terminó con error: {m.subtype} {m.errors}")
            salida = m.structured_output
            if salida is None and m.result:
                mm = re.search(r"\{.*\}", m.result, re.S)
                salida = json.loads(mm.group(0)) if mm else None
    if not salida:
        sys.exit("El agente no devolvió un dossier válido.")
    met["llamadas_herramientas"] = llamadas
    met["prompts"] = {"investigador": VERSION_SISTEMA, "usuario": version_usuario}
    return Dossier.model_validate(salida), modo, met


def archivar_anterior(carpeta: Path):
    """Con --forzar: mueve el resultado previo a anteriores/<fecha>/ para no perderlo ni dejar imágenes huérfanas."""
    previos = [p for p in carpeta.iterdir() if p.name != "anteriores"] if carpeta.exists() else []
    if not previos:
        return
    destino = carpeta / "anteriores" / datetime.now().strftime("%Y%m%d-%H%M%S")
    destino.mkdir(parents=True)
    for p in previos:
        shutil.move(str(p), str(destino / p.name))
    print(f"  versión anterior guardada en {destino}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("archivo")
    ap.add_argument("--evento")
    ap.add_argument("--max-turnos", type=int, default=30)
    ap.add_argument("--plan", action="store_true", help="usar el plan de Claude aunque exista ANTHROPIC_API_KEY")
    ap.add_argument("--forzar", action="store_true", help="volver a investigar un evento ya procesado (guarda la versión anterior)")
    a = ap.parse_args()
    env = BASE / ".env"
    if env.exists():
        for ln in env.read_text(encoding="utf-8").splitlines():
            if "=" in ln and not ln.strip().startswith("#"):
                k, v = ln.split("=", 1)
                if v.strip():
                    os.environ.setdefault(k.strip(), v.strip())
    ev = cargar_evento(a.archivo, a.evento)
    eid = ev.get("id", "evento")
    carpeta = SALIDA / eid
    if (carpeta / "dossier.json").exists() and not a.forzar:
        print(f"El evento {eid} ya fue procesado: {carpeta / 'dossier.json'}\n"
              f"No se ejecutó nada y no se gastó cupo. Para investigarlo de nuevo usa --forzar "
              f"(la versión actual se guarda en {carpeta / 'anteriores'}).")
        sys.exit(2)
    d, modo, met = asyncio.run(investigar(ev, a.max_turnos, a.plan))
    d.evento_id = eid
    d = verificar(d)
    archivar_anterior(carpeta)
    descargar_imagenes(d, carpeta / "imagenes")
    (carpeta / "dossier.json").write_text(d.model_dump_json(indent=2), encoding="utf-8")
    (carpeta / "dossier.md").write_text(a_markdown(d, modo), encoding="utf-8")
    (carpeta / "metricas.json").write_text(json.dumps({"modo": modo, **met}, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print(f"\nListo: {carpeta}\n  datos verificados: {len(d.datos_reales)} · sin verificar: {len(d.datos_no_verificados)} · "
          f"imágenes: {len(d.imagenes)} ({sum(1 for i in d.imagenes if i.archivo_local)} descargadas) · fuentes nuevas: {len(d.fuentes_nuevas)}"
          f"\n  costo de referencia: {met.get('costo_usd_referencia')} USD · {met.get('turnos')} turnos · {met.get('duracion_s')} s (detalle en metricas.json)")


if __name__ == "__main__":
    main()
