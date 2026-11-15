"""Herramientas (MCP en proceso) que usa el agente. Todas gratis y sin clave."""
import asyncio
import hashlib
import ipaddress
import json
import os
import socket
from pathlib import Path
from urllib.parse import urlparse

import httpx
from claude_agent_sdk import create_sdk_mcp_server, tool

BASE = Path(__file__).parent
CACHE = BASE / "cache"
CACHE.mkdir(exist_ok=True)
CORPUS_F = CACHE / "corpus.json"
UA = {"User-Agent": "opportunity-research-agent/0.1 (proyecto educativo)"}
MAX_CHARS = 12000

try:
    CORPUS: dict[str, str] = json.loads(CORPUS_F.read_text(encoding="utf-8"))
except Exception:  # noqa: BLE001
    CORPUS = {}


def guardar_corpus(url: str, texto: str):
    """Guarda el texto visto por el agente; luego se usa para comprobar las citas."""
    if url and texto:
        CORPUS[url] = texto[:60000]
        CORPUS_F.write_text(json.dumps(CORPUS, ensure_ascii=False), encoding="utf-8")


def _ok(obj) -> dict:
    return {"content": [{"type": "text", "text": json.dumps(obj, ensure_ascii=False)[:20000]}]}


def _err(msg: str) -> dict:
    return {"content": [{"type": "text", "text": json.dumps({"error": msg}, ensure_ascii=False)}], "is_error": True}


def _cache_get(clave: str):
    f = CACHE / (hashlib.sha1(clave.encode()).hexdigest() + ".json")
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None


def _cache_set(clave: str, valor):
    f = CACHE / (hashlib.sha1(clave.encode()).hexdigest() + ".json")
    f.write_text(json.dumps(valor, ensure_ascii=False), encoding="utf-8")


def url_segura(url: str) -> bool:
    """Solo http/https hacia hosts públicos (evita que el modelo lea la red local)."""
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        return False
    try:
        for info in socket.getaddrinfo(p.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
    except OSError:
        return False
    return True


# ---------------- buscar_web ----------------
@tool("buscar_web", "Busca en la web (DuckDuckGo). Devuelve título, URL y fragmento. Después usa leer_pagina para leer lo importante.",
      {"consulta": str, "max_resultados": int})
async def buscar_web(args):
    q, n = args["consulta"], min(int(args.get("max_resultados") or 6), 10)
    c = _cache_get(f"web|{q}|{n}")
    if c is not None:
        return _ok(c)
    from ddgs import DDGS
    try:
        res = await asyncio.to_thread(lambda: DDGS().text(q, max_results=n))
    except Exception as e:  # noqa: BLE001
        return _err(f"búsqueda falló: {type(e).__name__}: {e}")
    out = [{"titulo": r.get("title"), "url": r.get("href"), "fragmento": (r.get("body") or "")[:300]} for r in res]
    for r in out:
        guardar_corpus(r["url"], f"{r['titulo']}. {r['fragmento']}")
    _cache_set(f"web|{q}|{n}", out)
    return _ok(out)


# ---------------- leer_pagina ----------------
def _extraer_http(url: str) -> str:
    import trafilatura
    r = httpx.get(url, headers=UA, timeout=30, follow_redirects=True)
    r.raise_for_status()
    if "pdf" in r.headers.get("content-type", ""):
        return ""
    return trafilatura.extract(r.text, include_links=False, include_tables=True) or ""


async def _extraer_crawl4ai(url: str) -> str:
    os.environ.setdefault("CRAWL4AI_NO_CLOUD_NOTICE", "1")
    from crawl4ai import AsyncWebCrawler
    async with AsyncWebCrawler(verbose=False) as c:
        r = await c.arun(url)
        return (r.markdown or "") if r.success else ""


@tool("leer_pagina", "Descarga una página web y devuelve su texto limpio (hasta 12.000 caracteres). Úsala para leer una fuente antes de citarla.",
      {"url": str, "desde_caracter": int})
async def leer_pagina(args):
    url, ini = args["url"], int(args.get("desde_caracter") or 0)
    if not await asyncio.to_thread(url_segura, url):
        return _err("URL no permitida (solo http/https públicas).")
    texto = _cache_get(f"pag|{url}")
    if texto is None:
        try:
            texto = await asyncio.to_thread(_extraer_http, url)
        except Exception as e:  # noqa: BLE001
            texto = ""
            err = f"{type(e).__name__}"
        if len(texto) < 500:  # página vacía o con JavaScript: segundo intento con navegador
            try:
                texto = await _extraer_crawl4ai(url) or texto
            except Exception as e:  # noqa: BLE001
                if not texto:
                    return _err(f"no se pudo leer: {type(e).__name__}: {str(e)[:150]}")
        _cache_set(f"pag|{url}", texto)
    guardar_corpus(url, texto)
    return _ok({"url": url, "total_caracteres": len(texto), "desde": ini, "texto": texto[ini:ini + MAX_CHARS]})


# ---------------- NTRS ----------------
@tool("buscar_papers_ntrs", "Busca informes técnicos y artículos de la NASA (NTRS). Devuelve título, resumen, fecha y URL.",
      {"consulta": str, "max_resultados": int})
async def buscar_papers_ntrs(args):
    n = min(int(args.get("max_resultados") or 5), 10)
    clave = f"ntrs|{args['consulta']}|{n}"
    c = _cache_get(clave)
    if c is not None:
        return _ok(c)
    try:
        async with httpx.AsyncClient(headers=UA, timeout=30) as cl:
            r = await cl.get("https://ntrs.nasa.gov/api/citations/search", params={"q": args["consulta"], "page.size": n})
            r.raise_for_status()
    except Exception as e:  # noqa: BLE001
        return _err(f"NTRS falló: {type(e).__name__}")
    out = []
    for x in r.json().get("results", []):
        url = f"https://ntrs.nasa.gov/citations/{x['id']}"
        out.append({"titulo": x.get("title"), "resumen": (x.get("abstract") or "")[:700], "fecha": (x.get("distributionDate") or "")[:10], "url": url})
        guardar_corpus(url, f"{x.get('title')}. {x.get('abstract') or ''}")
    _cache_set(clave, out)
    return _ok(out)


TOOLS = [buscar_web, leer_pagina, buscar_papers_ntrs]
SERVER = create_sdk_mcp_server(name="inv", version="0.1.0", tools=TOOLS)
NOMBRES = [f"mcp__inv__{t.name}" for t in TOOLS]
