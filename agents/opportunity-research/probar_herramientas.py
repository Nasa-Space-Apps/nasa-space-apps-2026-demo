"""Prueba cada herramienta del agente y dice si funciona y qué requiere.

Uso: .venv\\Scripts\\python probar_herramientas.py [--sin-claude]
"""
import asyncio
import json
import os
import sys
import time

import httpx
from pathlib import Path

BASE_DIR = Path(__file__).parent

UA = {"User-Agent": "opportunity-research-agent/0.1 (proyecto educativo)"}
R = []  # resultados


def reg(nombre, ok, detalle, requiere=""):
    R.append({"herramienta": nombre, "ok": ok, "detalle": detalle, "requiere": requiere})
    print(("OK   " if ok else "FALLA"), nombre, "-", detalle, flush=True)


def probar_ntrs():
    r = httpx.get("https://ntrs.nasa.gov/api/citations/search", params={"q": "Mars Exploration Rover airbag landing", "page.size": 3},
                  headers=UA, timeout=30)
    j = r.json()
    res = j.get("results", [])
    reg("NASA NTRS (papers técnicos)", r.status_code == 200 and len(res) > 0,
        f"{j.get('stats',{}).get('total','?')} resultados; ej: {res[0]['title'][:60] if res else '-'}", "nada (sin clave)")


def probar_wikipedia():
    contacto = os.environ.get("WIKIMEDIA_CONTACT")
    if not contacto:
        reg("Wikipedia / Wikimedia Commons", False,
            "OMITIDA: Wikimedia responde 403 a User-Agent sin contacto (probado con 2 agentes genéricos)",
            "variable WIKIMEDIA_CONTACT (correo o URL tuyos) para el User-Agent")
        return
    h = {"User-Agent": f"opportunity-research-agent/0.1 ({contacto})"}
    r = httpx.get("https://en.wikipedia.org/api/rest_v1/page/summary/Opportunity_(rover)", headers=h, timeout=30)
    reg("Wikipedia / Wikimedia Commons", r.status_code == 200, f"HTTP {r.status_code}", "WIKIMEDIA_CONTACT")


def probar_ddgs():
    from ddgs import DDGS
    res = DDGS().text("Opportunity rover Purgatory Dune sol 446 JPL", max_results=5)
    reg("ddgs (búsqueda web gratis)", len(res) > 0, f"{len(res)} resultados; ej: {res[0]['href'] if res else '-'}",
        "nada (sin clave); puede limitar la velocidad")


def probar_trafilatura():
    import trafilatura
    url = "https://science.nasa.gov/mission/mer-opportunity/"
    html = httpx.get(url, headers=UA, timeout=30, follow_redirects=True).text
    txt = trafilatura.extract(html) or ""
    reg("httpx + trafilatura (extraer texto)", len(txt) > 500, f"{len(txt)} caracteres de {url}", "nada")


async def _crawl():
    from crawl4ai import AsyncWebCrawler
    async with AsyncWebCrawler() as c:
        r = await c.arun("https://science.nasa.gov/mission/mer-opportunity/")
        return r.success, len(r.markdown or "")


def probar_crawl4ai():
    ok, n = asyncio.run(_crawl())
    reg("Crawl4AI (JS, markdown)", ok and n > 500, f"{n} caracteres de markdown", "navegador de Playwright instalado (playwright install chromium)")


async def _claude(prov):
    from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, TextBlock, ResultMessage
    import proveedores
    proveedores.aplicar(prov)
    txt, costo, error = "", None, None
    async for m in query(prompt="Responde solo con la palabra: LISTO", options=ClaudeAgentOptions(
            model=prov.modelo, env=prov.env, max_turns=1, allowed_tools=[], tools=[], setting_sources=[],
            system_prompt="Responde con una sola palabra.")):
        if isinstance(m, AssistantMessage):
            for b in m.content:
                if isinstance(b, TextBlock):
                    txt += b.text
        elif isinstance(m, ResultMessage):
            costo = getattr(m, "total_cost_usd", None)
            if m.is_error:
                error = f"{m.subtype} {m.errors} {(m.result or '')[:200]}"
    return txt.strip(), costo, error


def probar_claude():
    import proveedores
    nombre = sys.argv[sys.argv.index("--proveedor") + 1] if "--proveedor" in sys.argv else None
    prov = proveedores.resolver(nombre)
    txt, costo, error = asyncio.run(_claude(prov))
    reg(f"Claude Agent SDK ({prov.nombre})", "LISTO" in txt.upper() and not error,
        f"{prov.etiqueta}; respuesta: {txt[:60]!r}; costo de referencia: {costo}" + (f"; error: {error}" if error else ""),
        "claude login (plan), ANTHROPIC_API_KEY (api) o credenciales AWS con acceso a Bedrock (bedrock)")


def main():
    import proveedores
    proveedores.cargar_env(BASE_DIR / '.env')
    pruebas = [probar_ntrs, probar_wikipedia, probar_ddgs, probar_trafilatura, probar_crawl4ai]
    if "--sin-claude" not in sys.argv:
        pruebas.append(probar_claude)
    for p in pruebas:
        try:
            p()
        except Exception as e:  # noqa: BLE001
            reg(p.__name__.replace("probar_", ""), False, f"{type(e).__name__}: {str(e)[:200]}")
    json.dump(R, open("resultado_pruebas.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n{sum(r['ok'] for r in R)}/{len(R)} herramientas OK -> resultado_pruebas.json")


if __name__ == "__main__":
    main()
