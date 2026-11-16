# Event research agent

Takes **one event** (JSON) of a space mission and researches it on the web to expand it. (It was written for Opportunity, hence the folder name; the prompts are mission-neutral and it now serves every mission in `misiones/`.) It produces a dossier with:

- a story in Spanish for secondary-school students (17 years old),
- real facts, each with a URL and a literal quote checked by code,
- new classified sources, contradictions, gaps and visual ideas.

The dossiers are the source of every fact shown in the web demo (see [`../../docs/story.md`](../../docs/story.md)); the end-to-end flow is in [`../../docs/research-pipeline.md`](../../docs/research-pipeline.md). Code identifiers, prompts and dossier contents are in Spanish on purpose: they are the research data of a Spanish-speaking team.

## Requirements

| Requirement | Detail |
|---|---|
| Python | 3.12 (tested with 3.12.10). |
| Claude | One of: **(a)** Claude Code installed and logged in (`claude login`), which uses your plan; or **(b)** an `ANTHROPIC_API_KEY`. |
| Network | Internet access. All the search tools are free and need no key. |
| Disk | About 500 MB: the virtual environment and Playwright's Chromium (~125 MB). |

The SDK (`claude-agent-sdk`) launches Claude Code underneath. If it fails to start, install Claude Code (<https://code.claude.com/docs>).

## Install (once per machine)

From this folder (`agents/opportunity-research/`).

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

Then check that everything works:

```
.venv\Scripts\python probar_herramientas.py            # tests the tools and Claude (spends a little quota)
.venv\Scripts\python probar_herramientas.py --sin-claude   # tools only, spends no quota
```

Expected result: everything `OK` except **Wikipedia / Wikimedia Commons**, which shows as `FALLA`/`OMITIDA` on purpose (see "Known problems"). It writes `resultado_pruebas.json` (git-ignored).

## Model providers and authentication

The agent can run with three providers. Pick one with `--proveedor`, with `PROVEEDOR_LLM` in `.env`, or automatically (API key if `ANTHROPIC_API_KEY` exists; otherwise the plan).

| Provider | What it uses | Needs | Cost |
|---|---|---|---|
| `plan` | Your Claude subscription (a Claude Code session) | `claude login` | Consumes the plan's quota |
| `api` | The Anthropic API | `ANTHROPIC_API_KEY` | USD per token; cap `PRESUPUESTO_USD` |
| `bedrock` | Claude on Amazon Bedrock | AWS credentials in a CLI profile with access to the models | Billed to the AWS account; cap `PRESUPUESTO_USD` |

**Bedrock:** uses `CLAUDE_CODE_USE_BEDROCK=1` underneath (the program sets it). Variables: `AWS_REGION` (default `us-east-1`), `BEDROCK_PROFILE` (default `default`, explicit so another profile is never used by accident), `BEDROCK_MODELO` and `BEDROCK_MODELO_PEQUENO` (defaults `us.anthropic.claude-sonnet-4-6` and `us.anthropic.claude-haiku-4-5-20251001-v1:0`, the ones that answered on the tested account; the 5.5 family returned `INVALID_PAYMENT_INSTRUMENT` until AWS accepts a payment method). The IDs are inference profiles, not the plain model IDs; list them with `aws bedrock list-inference-profiles`. Minimum IAM permissions: `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream` and `bedrock:ListInferenceProfiles`. The first time, the account needs a valid payment method and model access enabled.

**Review with Opus (Bedrock only):** after Sonnet's research, a second pass with Opus (`BEDROCK_MODELO_REVISOR`, default `us.anthropic.claude-opus-4-6-v1`; `ninguno` turns it off) re-reads the draft with no tools and no internet. It does not rewrite the dossier: it returns only decisions (which facts to keep by index, the new story text and the contradictions or gaps it adds against the original event). It **cannot** invent facts, URLs, quotes or images: `revision.fusionar` only selects among what already exists. If the review fails the draft is kept. `metricas.json` gets the keys `revision` and `costo_usd_referencia_total`. With `plan` and `api` there is no review. To test it alone on an existing dossier: `python revision.py salida/<id> <file.json> --evento <id> --guardar` (writes `dossier.revisado.json`, does not overwrite the original).

**Fallback to the plan:** with `--fallback-plan` (or `FALLBACK_PLAN=1`), if Bedrock or the API fail **before the agent starts working** (credentials, payment, model access, network), it retries with the Claude plan and prints a warning; `metricas.json` stores `fallback_desde`. If it fails halfway it does not retry, to avoid paying twice. `--plan` forces the plan directly.

Test a provider (costs a fraction of a cent): `python probar_herramientas.py --sin-claude` tests only the tools; without `--sin-claude` it tests the model too, and `--proveedor bedrock` chooses the provider.

## Usage

```
python agente.py --mision <id> --evento <event_id> [--plan] [--forzar] [--max-turnos 30]
python agente.py <file.json> [--evento ID] [--plan] [--forzar] [--max-turnos 30]
python procesar_lote.py --mision <id> --ids a,b,c --paralelo 3 --tope-usd <cap>
python pipeline.py estado <id>            # phase and next step of a mission
python costos.py --mision <id>            # cost per event and per model
```

(On macOS/Linux use `.venv/bin/python` and `/`.)

- **Events already processed:** if `salida/<id>/dossier.json` exists, the agent **runs nothing**, spends no quota and exits with code `2` and a message. To repeat it pass `--forzar`: before writing the new result, the previous version (dossier, metrics and images) is moved to `salida/<id>/anteriores/<date-time>/`. If the run fails before finishing, the previous version stays intact.
- If the file has several elements (`eventos` or `nodos`), `--evento` is required. A JSON with a single event does not need it.
- The console shows every tool the agent calls and, at the end, the reference cost, the turns and the time.
- A run takes 1 to 3 minutes. Each event spends plan quota (in the tests, between 0.49 and 0.69 USD reference). Run few events per session and watch the consumption.

### Output

```
misiones/<mission>/dossiers/<event-id>/
  dossier.json     full data (schema in esquema.py)
  dossier.md       readable version
  metricas.json    tokens, reference cost, turns, duration and tool calls
  anteriores/      previous versions, only if repeated with --forzar
```

Inside `dossier.json`:

- `datos_reales`: only facts whose quote was really found in the text that was read.
- `datos_no_verificados`: facts whose quote does **not** appear in the text. Do not use them unreviewed.
- `contradicciones` and `huecos`: what the agent could not confirm. Always read them: they can reveal errors in the source JSON.

## How it works

1. `agente.py` loads the event and starts a Claude agent (SDK) with a strict-rules `system_prompt`.
2. The agent only has the tools of `herramientas.py` (no files, no terminal):

   | Tool | What it does | Needs |
   |---|---|---|
   | `buscar_web` | DuckDuckGo search (`ddgs`) | nothing |
   | `leer_pagina` | text of a URL (`httpx` + `trafilatura`; `Crawl4AI` if the page uses JavaScript) | Playwright's Chromium |
   | `buscar_papers_ntrs` | NASA technical reports (NTRS) | nothing |

3. Everything the agent reads is saved in `cache/` (responses and `corpus.json`). If you repeat a run, the tools answer from the cache.
4. When done, the program checks every quote against `cache/corpus.json` (`verificar()` in `agente.py`) and writes the files.

## Prompts (to improve them)

They live in `prompts/` as text files, separate from the code:

| File | Purpose |
|---|---|
| `prompts/investigador.md` | `system_prompt`: the agent's rules (current version). |
| `prompts/investigador_v3.md` | Frozen copy of v3, to compare against or roll back (`PROMPT_INVESTIGADOR=investigador_v3`; the tests use it). |
| `prompts/revisor.md` | The Opus reviewer's prompt. |
| `prompts/usuario.md` | First message; `{evento_json}` is replaced by the event. |
| `prompts/CHANGELOG.md` | What changed in every version and why. |

- Each file starts with a `---` header with `version: N`. `prompts.py` reads it and `metricas.json` stores the version used (key `prompts`).
- **To change a prompt:** edit the `.md`, bump `version`, note the change in `CHANGELOG.md`, run `python -m unittest discover -s tests` (free) and compare 2 or 3 events with `--forzar`.
- **Contract you must not break:** the prompt names schema fields (`cita`, `fuente_url`, `datos_reales`…) and tools (`leer_pagina`, `buscar_papers_ntrs`…). If you rename something in `esquema.py` or `herramientas.py`, update the prompt; `tests/test_prompts.py` fails if they no longer match.

## Tests (free, no network or quota)

```
.venv\Scripts\python -m unittest discover -s tests
```

## File map

| File | Contents |
|---|---|
| `agente.py` | Command-line entry, prompt, quote verification and output. |
| `pipeline.py` | The mission pipeline commands (`nueva`, `estado`, `prefiltro`, `seleccion`, `conciliar`, `historia`, `validar-base`). |
| `procesar_lote.py` | Parallel batch runner with a spending cap and a stop after 3 failures in a row. |
| `costos.py` | Cost report per event and per model. |
| `mision.py` | Mission sheets (`misiones/<id>/ficha.json`) and where each mission's outputs live. |
| `revision.py` | Second pass with Opus (Bedrock) and the rules that limit what it can change. |
| `proveedores.py` | Selection and configuration of plan / api / bedrock. |
| `herramientas.py` | In-process MCP tools, cache and URL filter. |
| `prompts.py`, `prompts/` | Loading and versions of the prompts. |
| `esquema.py` | pydantic models of the dossier (the model must return exactly this schema). |
| `probar_herramientas.py` | Smoke test of all the tools and of Claude. |
| `tests/` | Free tests (prompts, schema and tools stay consistent). |
| `requirements.txt`, `.env.example`, `.gitignore` | Dependencies, environment template and exclusions. |
| `cache/`, `.venv/`, `.env` | Local; not versioned. |

## Images

The agent **does not search or download images** (removed in prompt v2). The dossiers made before that change (`opp001`, `opp005`, `opp008`, `opp015`, `opp018`, `opp021`) keep their `imagenes` field and `imagenes/` folder as historical data; the new schema ignores them when reading.

## Guarantees and safety

- Every fact carries a URL and a literal quote; the quotes are checked by code.
- `leer_pagina` rejects URLs that are not http/https to public hosts.
- The agent runs isolated: it does not load the user's `CLAUDE.md` or hooks (`setting_sources=[]`) and has no system tools (`tools=[]`).
- It does not invent: what it cannot confirm goes into `huecos`. It generates nothing hypothetical.

## Known problems

- **Wikipedia/Wikimedia returns 403** with any generic User-Agent (tested). That is why it is not integrated. Enable it by putting a real contact of the user in `WIKIMEDIA_CONTACT`; do not put another person's personal data there.
- **It does not read PDFs:** `leer_pagina` returns empty text for a PDF. Many official NASA sources are PDFs; it is the most useful pending improvement.
- **Blocked pages** (e.g. ScienceDirect behind Cloudflare) cannot be read; the agent notes it in `huecos`.
- **`ddgs` may rate-limit** if many searches are launched in a row. Wait a few minutes or run fewer events.
- **Output varies between runs:** the same event can give 10 or 12 facts and cost ±25 %. That is why keeping the previous version (what `--forzar` does) and comparing before replacing is worth it.
- **Windows:** if deleting or moving `.venv` or folders gives "Device or resource busy", close the files open in the IDE. A `.venv` cannot be moved: recreate it with the install commands.
- **Crawl4AI banner:** silenced with the variable `CRAWL4AI_NO_CLOUD_NOTICE=1` (the agent already sets it).

## For an agent that continues this work

- Install and verify with `probar_herramientas.py --sin-claude` before running the agent.
- Do not commit `.env`, `cache/` or `.venv/`. Do not print keys.
- Ask the user for confirmation before running many events (they consume their quota).
- When a dossier contradicts the source JSON (as happened with `opp001`), do not silently change the JSON: warn the user and propose the correction.
- The repo conventions are in the root `CLAUDE.md`.
