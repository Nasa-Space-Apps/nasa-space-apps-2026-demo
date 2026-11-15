"""Agente investigador de eventos de una misión espacial.

Uso (cualquier misión; las salidas van a misiones/<id>/dossiers/ y nunca se mezclan con las de otra misión):
  python agente.py --mision spirit --evento spi018          (usa timelines_v0/linea_de_tiempo_spirit.json)
  python agente.py ../../timelines_v0/linea_de_tiempo_spirit.json --mision spirit --evento spi018
Uso heredado (Opportunity, antes del orden por misión; salida en salida/<id>/):
  python agente.py ../../story/data/historia_opportunity.json --evento opp018
  python agente.py mi_evento.json                     (un JSON con un solo evento)
Opciones: --mision ID, --publico TEXTO, --proveedor plan|api|bedrock (o PROVEEDOR_LLM en .env), --fallback-plan (si Bedrock falla
          antes de empezar, reintenta con el plan de Claude), --plan (atajo de --proveedor plan), --max-turnos 30,
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

from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, ResultMessage, TextBlock, ToolUseBlock, query

import herramientas as H
import costos
import mision as misiones
import prompts
import proveedores
import revision
from esquema import Dossier

BASE = Path(__file__).parent
SALIDA = BASE / "salida"  # solo para el uso heredado sin --mision


def leer_json(ruta) -> dict:
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def cargar_evento(ruta: str, evento_id: str | None) -> dict:
    d = leer_json(ruta)
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


def a_markdown(d: Dossier, modo: str) -> str:
    L = [f"# {d.titulo} ({d.evento_id})", f"_Generado con {modo}. Todo dato lleva fuente; los no verificados están al final._", "",
         "## Contexto ampliado", d.contexto_ampliado, "", "## Datos reales (citas verificadas en el texto)"]
    L += [f"- {x.afirmacion} — [{urlparse(x.fuente_url).hostname}]({x.fuente_url}) · «{x.cita}» · confianza {x.confianza}" for x in d.datos_reales]
    L += ["", "## Fuentes nuevas"] + [f"- [{f.titulo}]({f.url}) · {f.tipo}" for f in d.fuentes_nuevas]
    L += ["", "## Contradicciones"] + [f"- {c}" for c in d.contradicciones]
    L += ["", "## Huecos"] + [f"- {c}" for c in d.huecos]
    L += ["", "## Ideas visuales"] + [f"- {c}" for c in d.ideas_visuales]
    if d.datos_no_verificados:
        L += ["", "## Datos no verificados (la cita no aparece en el texto leído)"] + [f"- {x.afirmacion} — {x.fuente_url}" for x in d.datos_no_verificados]
    return "\n".join(L) + "\n"


class ErrorProveedor(Exception):
    """El proveedor falló antes de que el agente hiciera trabajo útil (credenciales, acceso al modelo, red)."""


def evento_json(evento: dict, contexto: dict | None = None) -> str:
    """Evento tal como lo ve el modelo. Las fuentes semilla de la misión (ficha.json) van primero para no perderse al recortar."""
    ev = {k: v for k, v in evento.items() if k != "fuentes_extra"}
    semilla = (contexto or {}).get("fuentes_semilla")
    if semilla:
        ev = {"fuentes_semilla_de_la_mision": semilla, **ev}
    return json.dumps(ev, ensure_ascii=False, indent=1)[:9000]


async def investigar(evento: dict, max_turnos: int, prov: proveedores.Proveedor, contexto: dict | None = None) -> tuple[Dossier, str, dict]:
    proveedores.aplicar(prov)
    sistema, version_sistema = prompts.sistema(contexto)
    opts = ClaudeAgentOptions(
        model=prov.modelo, system_prompt=sistema, mcp_servers={"inv": H.SERVER}, allowed_tools=H.NOMBRES, tools=[],
        max_turns=max_turnos, setting_sources=[], cwd=str(BASE), env=prov.env,
        max_budget_usd=float(os.environ.get("PRESUPUESTO_USD", "2.0")) if prov.con_tope else None,
        output_format={"type": "json_schema", "schema": Dossier.model_json_schema()},
    )
    prompt, version_usuario = prompts.mensaje_usuario(evento_json(evento, contexto))
    salida, met, llamadas = None, {}, {}
    print(f"Modo: {prov.etiqueta}")
    try:
        async for m in query(prompt=prompt, options=opts):
            if isinstance(m, AssistantMessage):
                for b in m.content:
                    if isinstance(b, ToolUseBlock):
                        nom = b.name.replace("mcp__inv__", "")
                        llamadas[nom] = llamadas.get(nom, 0) + 1
                        print(f"  → {nom} {json.dumps(b.input, ensure_ascii=False)[:110]}")
            elif isinstance(m, ResultMessage):
                met = {"costo_usd_referencia": m.total_cost_usd, "turnos": m.num_turns, "duracion_s": round(m.duration_ms / 1000, 1),
                       "duracion_api_s": round(m.duration_api_ms / 1000, 1), "tokens": m.usage, "por_modelo": m.model_usage}
                if m.is_error:
                    if not llamadas:
                        raise ErrorProveedor(f"{m.subtype} {m.errors} {(m.result or '')[:300]}")
                    sys.exit(f"El agente terminó con error: {m.subtype} {m.errors}")
                salida = m.structured_output
                if salida is None and m.result:
                    mm = re.search(r"\{.*\}", m.result, re.S)
                    salida = json.loads(mm.group(0)) if mm else None
    except ErrorProveedor:
        raise
    except Exception as e:  # noqa: BLE001
        if llamadas:
            raise
        raise ErrorProveedor(f"{type(e).__name__}: {str(e)[:300]}") from e
    if not salida:
        if not llamadas:
            raise ErrorProveedor("el agente no devolvió nada")
        sys.exit("El agente no devolvió un dossier válido.")
    met["llamadas_herramientas"] = llamadas
    met["prompts"] = {"investigador": version_sistema, "usuario": version_usuario}
    met["proveedor"] = prov.nombre
    return Dossier.model_validate(salida), prov.etiqueta, met


def ejecutar(ev: dict, max_turnos: int, cadena: list, contexto: dict | None = None) -> tuple[Dossier, str, dict]:
    """Prueba cada proveedor de la cadena; pasa al siguiente solo si el anterior falla antes de empezar."""
    for n, p in enumerate(cadena):
        try:
            d, modo, met = asyncio.run(investigar(ev, max_turnos, p, contexto))
            if n:
                met["fallback_desde"] = cadena[0].nombre
            return d, modo, met
        except ErrorProveedor as e:
            print(f"{chr(10)}[{p.nombre}] falló antes de empezar el trabajo: {e}")
            if n + 1 < len(cadena):
                print(f"Reintentando con {cadena[n + 1].etiqueta} (modo respaldo)...")
    sys.exit("No se pudo iniciar el agente. Revisa las credenciales o prueba otro proveedor con --proveedor plan.")


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


def guardar(d: Dossier, modo: str, met: dict, carpeta: Path):
    """Escribe dossier.json, dossier.md y metricas.json. Crea la carpeta si no existe."""
    carpeta.mkdir(parents=True, exist_ok=True)
    met["costos"] = costos.resumir_corrida(met)
    (carpeta / "dossier.json").write_text(d.model_dump_json(indent=2), encoding="utf-8")
    (carpeta / "dossier.md").write_text(a_markdown(d, modo), encoding="utf-8")
    (carpeta / "metricas.json").write_text(json.dumps({"modo": modo, **met}, ensure_ascii=False, indent=2, default=str), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("archivo", nargs="?", help="JSON con los eventos; con --mision, por defecto su línea de tiempo base")
    ap.add_argument("--mision", help="id de la misión: las salidas van a misiones/<id>/dossiers/")
    ap.add_argument("--publico", help="público de la historia (por defecto el de la ficha o 5.º de secundaria)")
    ap.add_argument("--evento")
    ap.add_argument("--max-turnos", type=int, default=30)
    ap.add_argument("--proveedor", choices=proveedores.VALIDOS, help="plan de Claude, API key de Anthropic o Amazon Bedrock")
    ap.add_argument("--plan", action="store_true", help="atajo de --proveedor plan")
    ap.add_argument("--fallback-plan", action="store_true", help="si el proveedor falla antes de empezar, reintentar con el plan de Claude")
    ap.add_argument("--forzar", action="store_true", help="volver a investigar un evento ya procesado (guarda la versión anterior)")
    a = ap.parse_args()
    proveedores.cargar_env(BASE / ".env")
    if a.mision:
        try:
            rutas = misiones.rutas(a.mision)
        except ValueError as e:
            sys.exit(str(e))
        archivo, salida_dir = a.archivo or str(rutas["base"]), rutas["dossiers"]
    else:
        archivo, salida_dir = a.archivo, SALIDA
    if not archivo:
        sys.exit("Indica el archivo de eventos o --mision ID.")
    if not Path(archivo).exists():
        sys.exit(f"No existe {archivo}. Si la misión no tiene línea de tiempo base, hay que construirla primero (Fase 1).")
    ev = cargar_evento(archivo, a.evento)
    contexto = misiones.contexto_prompt(a.mision, leer_json(archivo), a.publico)
    eid = ev.get("id", "evento")
    carpeta = salida_dir / eid
    if (carpeta / "dossier.json").exists() and not a.forzar:
        print(f"El evento {eid} ya fue procesado: {carpeta / 'dossier.json'}\n"
              f"No se ejecutó nada y no se gastó cupo. Para investigarlo de nuevo usa --forzar "
              f"(la versión actual se guarda en {carpeta / 'anteriores'}).")
        sys.exit(2)
    try:
        prov = proveedores.resolver("plan" if a.plan else a.proveedor)
    except ValueError as e:
        sys.exit(str(e))
    cadena = [prov]
    if prov.nombre != "plan" and (a.fallback_plan or os.environ.get("FALLBACK_PLAN", "").lower() in ("1", "true", "si", "sí")):
        cadena.append(proveedores.resolver("plan"))
    d, modo, met = ejecutar(ev, a.max_turnos, cadena, contexto)
    # Red de seguridad: el borrador ya costó dinero; se guarda antes de revisar y de escribir la salida.
    (BASE / "cache").mkdir(parents=True, exist_ok=True)
    (BASE / "cache" / f"borrador_{eid}.json").write_text(d.model_dump_json(indent=2), encoding="utf-8")
    usado = next((p for p in cadena if p.nombre == met.get("proveedor")), None)
    if usado and usado.modelo_revisor:
        print(f"Revisión editorial con {usado.modelo_revisor}...")
        d, met_rev = asyncio.run(revision.revisar(ev, d, usado, contexto))
        met["revision"] = met_rev
        met["costo_usd_referencia_total"] = (met.get("costo_usd_referencia") or 0) + (met_rev.get("costo_usd_referencia") or 0)
        if met_rev.get("error"):
            print(f"  la revisión falló y se conserva el borrador de Sonnet: {met_rev['error'][:200]}")
        else:
            print(f"  cambios: {met_rev.get('cambios')}")
    d.evento_id = eid
    d = verificar(d)
    archivar_anterior(carpeta)
    guardar(d, modo, met, carpeta)
    print(f"\nListo: {carpeta}\n  datos verificados: {len(d.datos_reales)} · sin verificar: {len(d.datos_no_verificados)} · "
          f"fuentes nuevas: {len(d.fuentes_nuevas)}"
          f"\n  costo de referencia: {met.get('costo_usd_referencia_total', met.get('costo_usd_referencia'))} USD · {met.get('turnos')} turnos · {met.get('duracion_s')} s (detalle en metricas.json)")
    print("\n  Costo de referencia por modelo (USD, a precio de lista):")
    print(costos.tabla_corrida(met["costos"]))


if __name__ == "__main__":
    main()
