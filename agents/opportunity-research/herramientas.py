"""Herramientas (MCP en proceso) que usa el agente. Todas gratis y sin clave."""
import asyncio
import hashlib
import ipaddress
import json
import os
import time
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
PRESUPUESTO_RECORTE = 7000  # tope de caracteres cuando leer_pagina recibe `palabras` y la página es larga
CORTE = "\n[…]\n"

try:
    CORPUS: dict[str, str] = json.loads(CORPUS_F.read_text(encoding="utf-8"))
except Exception:  # noqa: BLE001
    CORPUS = {}


def guardar_corpus(url: str, texto: str):
    """Guarda el texto visto por el agente; luego se usa para comprobar las citas."""
    if not (url and texto):
        return
    CORPUS[url] = texto[:60000]
    # Varios procesos pueden correr a la vez (lotes en paralelo): se mezcla con lo que ya hay en disco y se reemplaza de forma
    # atómica para no pisar el trabajo de los demás. La verificación de citas usa la copia en memoria de cada proceso.
    try:
        actual = json.loads(CORPUS_F.read_text(encoding="utf-8")) if CORPUS_F.exists() else {}
    except Exception:  # noqa: BLE001
        actual = {}
    actual.update(CORPUS)
    tmp = CORPUS_F.with_name(f"corpus.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(actual, ensure_ascii=False), encoding="utf-8")
    for _ in range(5):
        try:
            os.replace(tmp, CORPUS_F)
            return
        except PermissionError:  # otro proceso lo tiene abierto un instante
            time.sleep(0.2)
    tmp.unlink(missing_ok=True)


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


def recortar(texto: str, palabras: str | None, presupuesto: int = PRESUPUESTO_RECORTE, cabeza: int = 2000, ventana: int = 600) -> str:
    """Si la página es larga y hay `palabras` (términos separados por comas), devuelve el inicio más los pasajes que las
    contienen, en orden y sin superar `presupuesto`. Todo trozo es literal del original, así las citas siguen verificándose
    contra el texto completo guardado en el corpus. Sin palabras, sin coincidencias o con página corta: el comportamiento de siempre."""
    claves = [p.strip().lower() for p in (palabras or "").split(",") if len(p.strip()) >= 3]
    if not claves or len(texto) <= presupuesto:
        return texto[:MAX_CHARS]
    bajo, tramos = texto.lower(), []
    for k in claves:
        i = bajo.find(k)
        for _ in range(20):
            if i < 0:
                break
            tramos.append((max(0, i - ventana), min(len(texto), i + len(k) + ventana)))
            i = bajo.find(k, i + len(k))
    if not tramos:
        return texto[:MAX_CHARS]
    unidos: list[list[int]] = []
    for a, b in sorted(tramos + [(0, min(cabeza, len(texto)))]):
        if unidos and a <= unidos[-1][1]:
            unidos[-1][1] = max(unidos[-1][1], b)
        else:
            unidos.append([a, b])
    piezas, usado = [], 0
    for a, b in unidos:
        if piezas and usado + (b - a) > presupuesto:
            break
        piezas.append(texto[a:b])
        usado += b - a
    return CORTE.join(piezas)


@tool("leer_pagina", "Descarga una página web y devuelve su texto limpio (hasta 12.000 caracteres). Úsala para leer una fuente antes de citarla. "
      "En `palabras` pasa 3-6 términos del evento separados por comas (o vacío): si la página es larga devuelve el inicio y los pasajes "
      "con esos términos, marcando los saltos con […]. `desde_caracter` mayor que 0 lee ese tramo completo.",
      {"url": str, "desde_caracter": int, "palabras": str})
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
    mostrado = recortar(texto, args.get("palabras")) if ini == 0 else texto[ini:ini + MAX_CHARS]
    return _ok({"url": url, "total_caracteres": len(texto), "desde": ini, "texto": mostrado,
                **({"recortado": True} if mostrado != texto[:MAX_CHARS] else {})})


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
