# Documentación

Índice de la carpeta `docs/`. Si retomas el proyecto, léelos en este orden:

0. **[story.md](story.md)** — **la historia de Opportunity ya implementada (hito 36)**: 20 eventos reales (cómic → 3D → cómic), ilustraciones de IA, narraciones cortas, datos en `public/models/opportunity/`, cómo regenerarlo y qué falta.
0. **[game-design.md](game-design.md)** — **enfoque vigente (hito 29): el juego sobre Opportunity**, con modo Historia y modo Decisiones, Parte 1 (2D) y Parte 2 (3D), reglas, impacto en el código y preguntas abiertas. *Léelo antes que nada: define hacia dónde va el proyecto.* El resto de la documentación describe lo que **ya está construido**.
1. **[history.md](history.md)** — qué se hizo, en qué orden y por qué (incluye las decisiones de diseño y las preferencias del
   usuario). *Léelo primero para recuperar el contexto.*
2. **[architecture.md](architecture.md)** — mapa del código: **rutas y vistas** (globo y escena), archivos, flujo de datos, bucle de render, física del rover,
   terreno, partículas, minimapa.
3. **[design.md](design.md)** — **el diseño de la demo: tema «Ink & Paper» (cómic, referencia Ponpon Mania) + flat design** (tokens, tipografía, componentes, movimiento, 3D), cómo aplicarlo en código y qué falta.
4. **[themes-and-missions.md](themes-and-missions.md)** — receta para añadir un estilo visual (incluye los tokens del globo), un vehículo+terreno (y su marcador en el globo) o
   checkpoints (storytelling) nuevos.
5. **[assets.md](assets.md)** — los modelos de `public/models` y las fotos de `public/images`: tamaños, ejes, créditos (el globo no usa assets).
6. **[gotchas.md](gotchas.md)** — trampas y problemas ya resueltos (rutas, globo, `cacheComponents`); cómo probar en el navegador.
7. **[narration.md](narration.md)** — narración pregrabada de los checkpoints (ElevenLabs): cómo grabar/regrabar, voz, modelo, costes.
8. **[performance.md](performance.md)** — qué cuesta en GPU/memoria (medido), el **perfil `light`/`full`** de `lib/perf.ts` (cómo volver atrás en una línea) y cómo volver a medir.
9. **[guide.md](guide.md)** — guía de voz «mission control»: principios, qué frase suena en cada momento y para cada vehículo, catálogo
   de las 62 frases, cómo regrabar.
10. **[ambient.md](ambient.md)** — música de fondo (ElevenLabs Music, pregrabada): una cama por lugar, bucle con crossfade, baja de volumen mientras habla la narración/guía, tecla `S`.
11. **[roadmap.md](roadmap.md)** — pendientes e ideas (incluye **⚠️ escala real de los vehículos**, aún sin resolver).
12. **[data-request.md](data-request.md)** — qué información hay que extraer por vehículo (ficha, 4–6 paradas con fecha/hora/sol/posición, imágenes con crédito, fuentes) para la demo con Opportunity, Spirit, Ingenuity, InSight y Beagle 2; pensado para pasárselo a quien investiga.

Otros documentos importantes fuera de `docs/`:

- [`../README.md`](../README.md) — visión general, cómo arrancar, controles.
- [`../CLAUDE.md`](../CLAUDE.md) — instrucciones para Claude Code en este repo (convenciones).
- [`../AGENTS.md`](../AGENTS.md) — aviso generado por Next sobre cambios incompatibles de esta versión.

## Mapa rápido del repo

```
src/
  app/            layout.tsx (fuentes), page.tsx (→ /moon), [body]/page.tsx (globo), [body]/[vehicle]/page.tsx (escena del rover), globals.css
  components/     Explore + Globe + GlobeLabels + VehicleCard + VehicleView (globo y tarjeta del vehículo abandonado; ExploreLoader/SceneLoader cargan cada vista), Scene (Canvas + overlays), Rover (sigue la ruta), Dust, Tracks, Checkpoints (balizas), CheckpointCard, Timeline (línea de tiempo), Guide + GuideCaption (guía de voz), Minimap, Hud
  lib/            perf (perfil de rendimiento light/full), ui (estilos DOM compartidos), vehicles + vehicles/ (vehículos procedurales de 3 tonos: kit de primitivas y un archivo por vehículo), bodies (mundos + vehículos abandonados), game (estado), terrain (STL → malla + mapa de alturas), route (ruta del vehículo), missions, themes, checkpoints (storytelling + ruta), narration (voz del checkpoint), guide + guide-lines (guía de voz)
public/models/    STL (terrenos) + una carpeta por historia (opportunity/, ingenuity/, surveyor3/: story.json, images/, audio/); los GLB de referencia se eliminaron (hito 43, ver model-sources.md)
public/guide/     mp3 pregrabados de la guía de voz genérica (30 frases) + manifest.json
public/story/     visores HTML del equipo (historia y juego de Opportunity)
public/ambient/   mp3 pregrabados de la música de fondo (moon, mars, timeline) + manifest.json
scripts/          build-story.mjs · plan-story-route.mjs · generate-story-images.mjs · generate-story-audio.mjs · generate-guide.mjs · generate-ambient.mjs · lib/tts.mjs (npm run story / story-route / story-images / story-audio / guide / ambient)
docs/             esta documentación
```
