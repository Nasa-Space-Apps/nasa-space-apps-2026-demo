"""Prueba cada herramienta del agente y dice si funciona y qué requiere.

Uso: .venv\\Scripts\\python probar_herramientas.py [--sin-claude]
"""
import asyncio
import json
import os
import sys
import time

import httpx

UA = {"User-Agent": "opportunity-research-agent/0.1 (proyecto educativo)"}
R = []  # resultados


def reg(nombre, ok, detalle, requiere=""):
    R.append({"herramienta": nombre, "ok": ok, "detalle": detalle, "requiere": requiere})
    print(("OK   " if ok else "FALLA"), nombre, "-", detalle, flush=True)


def probar_nasa_images():
    t = time.time()
    r = httpx.get("https://images-api.nasa.gov/search", params={"q": "opportunity rover landing", "media_type": "image"},
                  headers=UA, timeout=30)
    items = r.json()["collection"]["items"]
    d = items[0]["data"][0]
    reg("NASA Image and Video Library", r.status_code == 200 and len(items) > 0,
        f"{len(items)} resultados; ej: {d['nasa_id']} / {d.get('title','')[:50]} ({time.time()-t:.1f}s)", "nada (sin clave)")
    a = httpx.get(f"https://images-api.nasa.gov/asset/{d['nasa_id']}", headers=UA, timeout=30).json()
    reg("NASA Images /asset", len(a["collection"]["items"]) > 0, f"{len(a['collection']['items'])} archivos para {d['nasa_id']}", "nada")


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


async def _claude(env_key):
    from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, TextBlock, ResultMessage
    txt, costo = "", None
    async for m in query(prompt="Responde solo con la palabra: LISTO", options=ClaudeAgentOptions(
            max_turns=1, allowed_tools=[], system_prompt="Responde con una sola palabra.")):
        if isinstance(m, AssistantMessage):
            for b in m.content:
                if isinstance(b, TextBlock):
                    txt += b.text
        elif isinstance(m, ResultMessage):
            costo = getattr(m, "total_cost_usd", None)
    return txt.strip(), costo


def probar_claude():
    modo = "API key" if os.environ.get("ANTHROPIC_API_KEY") else "sesión de Claude Code (plan)"
    txt, costo = asyncio.run(_claude(None))
    reg("Claude Agent SDK", "LISTO" in txt.upper(), f"autenticación: {modo}; respuesta: {txt!r}; costo reportado: {costo}",
        "claude login (plan) o ANTHROPIC_API_KEY")


def main():
    pruebas = [probar_nasa_images, probar_ntrs, probar_wikipedia, probar_ddgs, probar_trafilatura, probar_crawl4ai]
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
