# Agente investigador de Opportunity

Recibe **un evento** (JSON) de la misión del rover Opportunity y hace una investigación web para ampliarlo. Produce un dossier con:

- un relato en español para estudiantes de 5.º de secundaria,
- datos reales, cada uno con URL y una cita literal comprobada por código,
- fuentes nuevas clasificadas, contradicciones, huecos e ideas visuales.

Está pensado para ampliar los eventos de `story/data/historia_opportunity.json` y `story/data/juego_opportunity.json`.

## Requisitos

| Requisito | Detalle |
|---|---|
| Python | 3.12 (probado con 3.12.10). |
| Claude | Una de dos: **(a)** Claude Code instalado y con sesión iniciada (`claude login`), que usa tu plan; o **(b)** una `ANTHROPIC_API_KEY`. |
| Red | Acceso a internet. Todas las herramientas de búsqueda son gratis y sin clave. |
| Espacio | Unos 500 MB: el entorno virtual y el navegador Chromium de Playwright (~125 MB). |

El SDK (`claude-agent-sdk`) lanza Claude Code por debajo. No verifiqué si trae su propio ejecutable; si falla al arrancar, instala Claude Code (<https://code.claude.com/docs>).

## Instalación (una vez por máquina)

Desde esta carpeta (`agents/opportunity-research/`).

**Windows (PowerShell):**

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m playwright install chromium
```

**macOS / Linux:**

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m playwright install chromium
```

Después, comprueba que todo funciona:

```
.venv\Scripts\python probar_herramientas.py            # prueba herramientas y Claude (gasta un poco de cupo)
.venv\Scripts\python probar_herramientas.py --sin-claude   # solo herramientas, sin gastar cupo
```

Resultado esperado: todo `OK` salvo **Wikipedia / Wikimedia Commons**, que aparece como `FALLA`/`OMITIDA` a propósito (ver «Problemas conocidos»). Escribe `resultado_pruebas.json`.

## Proveedores de modelo y autenticación

El agente puede correr con tres proveedores. Se elige con `--proveedor`, con `PROVEEDOR_LLM` en `.env`, o automáticamente (API key si existe `ANTHROPIC_API_KEY`; si no, plan).

| Proveedor | Qué usa | Requiere | Costo |
|---|---|---|---|
| `plan` | Tu suscripción de Claude (sesión de Claude Code) | `claude login` | Consume el cupo del plan |
| `api` | API de Anthropic | `ANTHROPIC_API_KEY` | USD por token; tope `PRESUPUESTO_USD` |
| `bedrock` | Claude en Amazon Bedrock | Credenciales AWS en un perfil de la CLI, con acceso a los modelos | Se factura en la cuenta de AWS; tope `PRESUPUESTO_USD` |

**Bedrock:** usa `CLAUDE_CODE_USE_BEDROCK=1` por debajo (lo pone el programa). Variables: `AWS_REGION` (por defecto `us-east-1`), `BEDROCK_PROFILE` (por defecto `default`, explícito para no usar otro perfil por accidente), `BEDROCK_MODELO` y `BEDROCK_MODELO_PEQUENO` (por defecto `us.anthropic.claude-sonnet-4-6` y `us.anthropic.claude-haiku-4-5-20251001-v1:0`, los que respondieron en la cuenta probada; los de la familia 5.5 devolvieron `INVALID_PAYMENT_INSTRUMENT` hasta que AWS acepte un método de pago). Los IDs son perfiles de inferencia, no los IDs simples; se listan con `aws bedrock list-inference-profiles`. Permisos IAM mínimos: `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream` y `bedrock:ListInferenceProfiles`. La primera vez la cuenta debe tener método de pago válido y el acceso al modelo habilitado.

**Revisión con Opus (solo Bedrock):** tras la investigación de Sonnet, una segunda pasada con Opus (`BEDROCK_MODELO_REVISOR`, por defecto `us.anthropic.claude-opus-4-6-v1`; `ninguno` la desactiva) relee el borrador sin herramientas ni internet. No reescribe el dossier: devuelve solo decisiones (qué datos conservar por número, el relato nuevo y las contradicciones o huecos que añade frente al evento original). **No puede** inventar datos, URLs, citas ni imágenes: `revision.fusionar` solo selecciona entre lo que ya existe. Si la revisión falla se conserva el borrador. En `metricas.json` queda la clave `revision` y `costo_usd_referencia_total`. Con `plan` y `api` no hay revisión. Para probarla sola sobre un dossier existente: `python revision.py salida/<id> <archivo.json> --evento <id> --guardar` (escribe `dossier.revisado.json`, no pisa el original).

**Respaldo al plan:** con `--fallback-plan` (o `FALLBACK_PLAN=1`), si Bedrock o la API fallan **antes de que el agente empiece a trabajar** (credenciales, pago, acceso al modelo, red), se reintenta con el plan de Claude y se imprime un aviso; `metricas.json` guarda `fallback_desde`. Si falla a mitad del trabajo no se reintenta, para no pagar dos veces. `--plan` fuerza el plan directamente.

Probar un proveedor (gasta una fracción de centavo): `python probar_herramientas.py --sin-claude` prueba solo las herramientas; sin `--sin-claude` prueba también el modelo, y `--proveedor bedrock` elige el proveedor.

## Uso

```
python agente.py <archivo.json> [--evento ID] [--plan] [--forzar] [--max-turnos 30]
```

Ejemplos (Windows; en macOS/Linux usa `.venv/bin/python` y `/`):

```
.venv\Scripts\python agente.py ..\..\story\data\historia_opportunity.json --evento opp018
.venv\Scripts\python agente.py ..\..\story\data\juego_opportunity.json --evento n08
.venv\Scripts\python agente.py mi_evento.json
```

- **Eventos ya procesados:** si `salida/<id>/dossier.json` existe, el agente **no ejecuta nada**, no gasta cupo y termina con código de salida `2` y un mensaje. Para repetirlo hay que pasar `--forzar`: antes de escribir el resultado nuevo, la versión anterior (dossier, métricas e imágenes) se mueve a `salida/<id>/anteriores/<fecha-hora>/`. Si la corrida falla antes de terminar, la versión anterior queda intacta.
- Si el archivo tiene varios elementos (`eventos` o `nodos`), `--evento` es obligatorio. Un JSON con un solo evento no lo necesita.
- Ids disponibles: `opp001`…`opp081` en la línea de tiempo; los 20 de la historia están en `story/data/historia_opportunity.json`; `n01`…`n17` y sus ramas en el juego.
- En consola muestra cada herramienta que llama el agente y, al final, el costo de referencia, los turnos y el tiempo.
- Una corrida tarda de 1 a 3 minutos. Cada evento gasta cupo del plan (en las pruebas, entre 0,49 y 0,69 USD de referencia). Corre pocos eventos por sesión y monitorea el consumo.

### Salida

```
salida/<id-del-evento>/
  dossier.json     datos completos (esquema en esquema.py)
  dossier.md       versión legible
  metricas.json    tokens, costo de referencia, turnos, duración y llamadas a herramientas
  anteriores/      versiones previas, solo si se repitió con --forzar
```

Dentro de `dossier.json`:

- `datos_reales`: solo datos cuya cita se encontró de verdad en el texto leído.
- `datos_no_verificados`: datos cuya cita **no** aparece en el texto. No los uses sin revisar.
- `contradicciones` y `huecos`: lo que el agente no pudo confirmar. Léelos siempre: pueden revelar errores en el JSON de origen.

## Cómo funciona

1. `agente.py` carga el evento y arranca un agente de Claude (SDK) con un `system_prompt` de reglas estrictas.
2. El agente solo tiene las herramientas de `herramientas.py` (no tiene archivos ni terminal):

   | Herramienta | Qué hace | Requiere |
   |---|---|---|
   | `buscar_web` | búsqueda DuckDuckGo (`ddgs`) | nada |
   | `leer_pagina` | texto de una URL (`httpx` + `trafilatura`; `Crawl4AI` si la página usa JavaScript) | Chromium de Playwright |
   | `buscar_papers_ntrs` | informes técnicos NASA (NTRS) | nada |

3. Todo lo que el agente lee se guarda en `cache/` (respuestas y `corpus.json`). Si repites una corrida, las herramientas responden desde caché.
4. Al terminar, el programa comprueba cada cita contra `cache/corpus.json` (`verificar()` en `agente.py`), descarga las imágenes permitidas y escribe los archivos.

## Prompts (para mejorarlos)

Viven en `prompts/` como archivos de texto, separados del código:

| Archivo | Para qué |
|---|---|
| `prompts/investigador.md` | `system_prompt`: reglas del agente. |
| `prompts/usuario.md` | Mensaje inicial; `{evento_json}` se reemplaza por el evento. |
| `prompts/CHANGELOG.md` | Qué cambió en cada versión y por qué. |

- Cada archivo empieza con una cabecera `---` con `version: N`. `prompts.py` la lee y `metricas.json` guarda la versión usada (clave `prompts`).
- **Para cambiar un prompt:** edita el `.md`, sube `version`, anota el cambio en `CHANGELOG.md`, corre `python -m unittest discover -s tests` (gratis) y compara 2 o 3 eventos con `--forzar`.
- **Contrato que no debes romper:** el prompt nombra campos del esquema (`cita`, `fuente_url`, `datos_reales`…) y herramientas (`leer_pagina`, `buscar_papers_ntrs`…). Si renombras algo en `esquema.py` o `herramientas.py`, actualiza el prompt; `tests/test_prompts.py` falla si ya no coinciden.

## Tests (gratis, sin red ni cupo)

```
.venv\Scripts\python -m unittest discover -s tests
```

## Mapa de archivos

| Archivo | Contenido |
|---|---|
| `agente.py` | Entrada de línea de comandos, prompt, verificación de citas, descarga de imágenes y salida. |
| `revision.py` | Segunda pasada con Opus (Bedrock) y reglas que limitan lo que puede cambiar. |
| `proveedores.py` | Selección y configuración de plan / api / bedrock. |
| `herramientas.py` | Herramientas MCP en proceso, caché y filtro de URLs. |
| `prompts.py`, `prompts/` | Carga y versiones de los prompts. |
| `tests/` | Pruebas sin costo (prompts, esquema y herramientas coherentes). |
| `esquema.py` | Modelos pydantic del dossier (el modelo debe devolver exactamente este esquema). |
| `probar_herramientas.py` | Prueba de humo de todas las herramientas y de Claude. |
| `requirements.txt`, `.env.example`, `.gitignore` | Dependencias, plantilla de entorno y exclusiones. |
| `../../misiones/<id>/dossiers/` | Dossiers generados por misión (se versionan). |
| `cache/`, `.venv/`, `.env` | Locales; no se versionan. |

## Imágenes

El agente **no busca ni descarga imágenes** (se quitó en el prompt v2). Los dossiers anteriores a ese cambio (`opp001`, `opp005`, `opp008`, `opp015`, `opp018`, `opp021`) conservan su campo `imagenes` y su carpeta `imagenes/` como datos históricos; el esquema nuevo los ignora al leerlos.

## Garantías y seguridad

- Cada dato lleva URL y cita literal; las citas se comprueban por código.
- `leer_pagina` rechaza URLs que no sean http/https hacia hosts públicos.
- El agente corre aislado: no carga `CLAUDE.md` ni hooks del usuario (`setting_sources=[]`) y no tiene herramientas del sistema (`tools=[]`).
- No inventa: lo que no puede confirmar va a `huecos`. No genera nada hipotético.

## Problemas conocidos

- **Wikipedia/Wikimedia devuelve 403** con cualquier User-Agent genérico (probado). Por eso no está integrada. Se habilita poniendo un contacto real del usuario en `WIKIMEDIA_CONTACT`; no pongas datos personales de otra persona.
- **No lee PDFs:** `leer_pagina` devuelve texto vacío para un PDF. Muchas fuentes oficiales de NASA lo son; es la mejora pendiente más útil.
- **Páginas bloqueadas** (p. ej. ScienceDirect con Cloudflare) no se pueden leer; el agente lo anota en `huecos`.
- **`ddgs` puede limitar la velocidad** si se lanzan muchas búsquedas seguidas. Espera unos minutos o corre menos eventos.
- **La salida varía entre corridas:** el mismo evento puede dar 10 o 12 datos y costar ±25 %. Por eso conviene conservar la versión anterior (lo hace `--forzar`) y comparar antes de reemplazar.
- **Windows:** si borrar o mover `.venv` o carpetas da «Device or resource busy», cierra los archivos abiertos en el IDE. Un `.venv` no se puede mover: se recrea con los comandos de instalación.
- **Banner de Crawl4AI:** se silencia con la variable `CRAWL4AI_NO_CLOUD_NOTICE=1` (el agente ya la define).

## Para un agente que continúa este trabajo

- Instala y verifica con `probar_herramientas.py --sin-claude` antes de correr el agente.
- No subas `.env`, `cache/` ni `.venv/`. No imprimas claves.
- Pide confirmación al usuario antes de correr muchos eventos (consumen su cupo).
- Cuando un dossier contradiga el JSON de origen (como pasó con `opp001`), no cambies el JSON en silencio: avisa al usuario y propón la corrección.
- Las convenciones del repo están en el `CLAUDE.md` de la raíz (documentación en español, interfaz del juego en inglés).
