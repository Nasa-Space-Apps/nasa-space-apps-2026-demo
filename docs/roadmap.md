# Roadmap / pendientes

> **Prioridad actual: el juego sobre Opportunity** (modos Historia y Decisiones, Parte 1 en 2D y Parte 2 en 3D). Plan por fases y preguntas abiertas en [game-design.md](game-design.md#10-fases-sugeridas-propuesto). Lo de abajo es anterior al giro: lo que se refiere a más vehículos, el globo o la comparación entre expediciones está **en pausa**.

## Siguiente (qué hacer al retomar)

Estado (hito 48): 4 historias completas (Opportunity, Spirit, Ingenuity, Surveyor 3) con cómic, 3D, narración y fuentes; paleta por mundo; globo libre; tarjeta 3D con ilustración a todo el ancho. Candidatos, en el orden en que encajan con lo pedido hasta ahora:

1. **Revisar de oído las 80 narraciones** y las 20 ilustraciones de Spirit (el sello de «REJECTED» de `spi001`); regrabar solo lo que no guste (`--only`).
2. **Más historias:** **InSight y Beagle 2 ya tienen dossiers (20 cada uno) y sus 40 ilustraciones** (hito 51): falta el `<misión>-story.mjs`, la ruta 3D, la narración y registrarlas (ver [story.md](story.md#ilustraciones-de-insight-y-beagle-2-hito-51)). Perseverance y SEV siguen «coming soon» (sin dossiers).
3. **Modo Decisiones** (definido en [game-design.md](game-design.md), no implementado; los 30 nodos de Opportunity están en `story/data/juego_opportunity.json`).
4. **Terreno propio de Gusev** (hoy Spirit usa Meridiani como maqueta) y de Jezero (Ingenuity usa Gale): las paradas no son lugares reales.
5. **Alinear el color de cada vehículo con la paleta de su mundo** (hoy: Spirit violeta, Ingenuity ámbar, Opportunity coral, Surveyor 3 oliva).
6. Comprobar la tarjeta del 3D en pantallas pequeñas (≤ 720 px de alto) y en vertical; el zoom táctil (pellizco) del globo no está hecho.
7. Deudas viejas: escala real de los vehículos (abajo), progreso `visited` no persistente, build servido sin probar.

Ideas y deudas técnicas detectadas, sin orden estricto. Lo marcado ⭐ es lo que más encaja con lo que el usuario ha pedido.

## ⚠️ Por resolver: escala real de los vehículos

**Hoy los vehículos están muy sobredimensionados respecto al terreno** (decisión consciente para la PoC: se dejó así «por
ahora»). Detalle de la medición:

| | Terreno | ≈ m por unidad | Tamaño real del vehículo | En escena | Sobredimensión |
| --- | --- | --- | --- | --- | --- |
| Opportunity · Marte | ~263 × 356 km → 559 × 762 u | ~470 m | 2,3 × 1,6 × 1,5 m | ~10 × 15 u ≈ 4,7 × 7 km | ~2000× |
| SEV · Luna | ~30 × 30 km → 255 × 255 u | ~118 m | 4,5 × 4 × 3 m | ~8 × 12 × 8 u ≈ 0,9 × 1,4 km | ~200× |

Fuentes: fichas de NASA 3D Resources (Opportunity Landing Site / Apollo 14 – Landing Site; además el eje vertical va
exagerado, ×35 en la Luna) y fichas técnicas de MER y SEV. Los `scale` de `missions.ts` solo igualan el tamaño aparente entre
vehículos: el SEV (4,5 m) se ve igual de grande que el Opportunity (2,3 m).

Los STL son maquetas de relieve, no sirven a escala 1:1 (el Opportunity mediría ~0,005 u). Opciones:

1. **Seguir estilizado** y, como mínimo, corregir la proporción *entre* vehículos (SEV ≈ 2× Opportunity).
2. **Terreno real a escala de rover**: sustituir los STL por un DTM de alta resolución recortado a unos cientos de metros
   (HiRISE para Marte; LROC NAC a 0,5 m/px para Apollo 14). Así 1 u = 1 m, el vehículo sería real y las velocidades (ahora
   arbitrarias: 18–42 u/s) tendrían sentido físico. Los checkpoints (`lib/checkpoints.ts`) habría que recolocarlos.

## Hecho (última versión de la demo)

- ✅ **Historias** de Opportunity (hito 36), Ingenuity (hito 40), Surveyor 3 (hito 42) y **Spirit (hito 45)** con el mismo flujo (cómic → 3D → cómic, narración, fuentes); scripts genéricos por misión; vehículos sin historia con «coming soon» (hito 43–44).
- ✅ **Paleta por mundo** (hito 46: Marte terracota + mantequilla, Luna azul acero + menta) y **UI** (hitos 47–48): globo libre en X e Y con zoom propio, botón de música como icono, «skip the 3D» de acento, etiqueta «05. Título» en el cómic, tarjeta 3D con la ilustración a todo el ancho. Lo siguiente de esta lista describe etapas anteriores.

- ✅ 3 expediciones (Opportunity y Perseverance en Marte, SEV en la Luna), tema único (flat; «Ink & Paper» desde el hito 30, antes «Primer»), minimapa, polvo, huellas, cámara de seguimiento.
- ✅ **Storytelling**: 5 o 6 checkpoints por expedición, salida y final incluidos (balizas, rombos en el minimapa, tarjeta con foto y datos).
- ✅ **Ruta definida** (sin conducción libre): `Espacio` mantenido avanza hasta el siguiente checkpoint; **línea de tiempo** con clic en
  los checkpoints para viajar (hacia delante o atrás).
- ✅ **Narración** pregrabada con ElevenLabs (voz Bill, `eleven_v4`), automática al entrar, tecla `N`, botón Listen/Stop.
- ✅ Interfaz y audios en inglés.
- ✅ **Vista de entrada con el globo** (`/moon`, `/mars`): globo alámbrico claro sin assets, gira solo (inercia al arrastrar; desde el hito 47 gira libre en X e Y y tiene zoom propio), cuadrados negros que orbitan con él
  (solo los de delante), selector de mundo, marcadores/etiquetas de los vehículos abandonados y tarjeta con el modelo 3D empolvado → «Travel to the past».
- ✅ **Rutas por vehículo** (`/moon/sev`, `/mars/opportunity`) con carga de recursos por ruta (`cacheComponents` + `generateStaticParams`).
- ✅ **Rediseño completo en el tema «Primer»**: tokens únicos, tipografía, UI, globo, escena 3D y movimiento suave (ver [design.md](design.md)).
- ✅ **Guía de voz «mission control»**: 49 frases pregrabadas (voz Daniel; recortada al quitar la conducción libre) con subtítulo, tecla `G`, reglas anti-saturación y
  variantes por vehículo (ver [guide.md](guide.md)).

- ✅ **Perseverance (vehículo de prueba)**: historia real de Mars 2020 con final ficticio sobre el terreno de Gale (ver [history.md](history.md), hito 26).
  Pendiente si se quiere más rigor: un modelo de elevación del cráter **Jezero** (los lugares de la historia son de Jezero, el suelo es de Gale) y una cama de música propia.

## Pendientes menores del globo y las rutas

- El marcador queda algo a la derecha del centro del globo al enfocarlo (perspectiva: el globo está desplazado a la derecha de la cámara); se podría compensar en `faceAngle`.
- Los cuadrados orbitantes se ocultan con el plano del centro del globo (no por oclusión real): uno junto al borde puede desaparecer antes de quedar tapado.
- Las rutas no válidas (`/nope`, `/moon/opportunity`) devuelven **200** con la página 404 (limitación del streaming con `cacheComponents`).
- Teclado en el globo: solo `Esc`; se podrían añadir flechas/`Tab` para el selector de mundo y accesibilidad de los marcadores.
- No hay `loading` propio mientras llegan los chunks (se ve el color de fondo); se podría estilizar.

## Ideas tras revisar los «NASA Eyes» (nov 2026)

- **Eyes on Curiosity** (app WebGL): modos Rover Replay (reproduce eventos con marcadores sobre el terreno), Highlights (vuela a un sitio y muestra imagen + descripción), cámara orbital, panel de 7 cámaras del rover. No se pudo comprobar si tiene línea de tiempo ni cómo dibuja el recorrido.
- **science.nasa.gov/eyes**: ofrece `curiosity-static.glb` (11 MB, [enlace](https://science.nasa.gov/wp-content/uploads/2024/03/curiosity-static.glb)) —posible 3.er vehículo real; **revisar la licencia de uso antes**—, además de Mars Relay Network y Eyes on the Solar System (trayectorias/texturas). Sin APIs.
- ⭐ Ruta acumulada con **fecha/sol por checkpoint** y distancia recorrida, para contar «cómo se movió»; cámaras alternativas (cenital que sigue la ruta, cercana al vehículo); marcadores en el terreno con foto/descripción (estilo Highlights).
- Globo: marcar también la **trayectoria completa** sobre la esfera (no solo el punto final), añadir más vehículos abandonados (Spirit, Sojourner, Lunokhod, Apollo LRV…) y una luna/órbita animada.

## Producto

- **Ruta / línea de tiempo**: probar «`Espacio` alterna reproducir/pausar» frente a «mantener»; velocidad de crucero (Marte ≈ 1 100 u de
  ruta ≈ 46 s sin paradas, Luna ≈ 520 u ≈ 29 s) y del viaje automático; mostrar el tiempo/distancia estimada en la barra; atajos de
  teclado (flechas) para ir al checkpoint anterior/siguiente; tecla para volver a la salida; que el viaje automático narre/pare en los
  intermedios si se prefiere; la salida de Marte (0, 0) es el cráter central (en suelo llano).
- **Final de la Luna**: «Last Light» es inventado (el SEV no existe en Apollo 14); si se quiere algo histórico, el final natural es el
  despegue de Antares.

- ⭐ **Storytelling**: más checkpoints por expedición, progreso persistente en `localStorage` (hoy `visited` se pierde al recargar), pantalla de fin de expedición, imágenes propias
  o en mayor resolución.
- **Narración**: (subtítulos ya hechos con tiempos calculados en el cliente), voz distinta por
  expedición, control de volumen, música/ambiente y SFX. Evaluar la voz elegida (no se pudo escuchar al grabar) y, si no gusta,
  regrabar con `--voice`. Ver [narration.md](narration.md).
- **Guía de voz**: ajustar umbrales/enfriamientos con juego real (`QUIET`, `cool(...)` en `guide.ts`), más frases por vehículo, pistas
  de teclas contextuales para novatos (hoy solo las frases `idle-5/6` y `ready-4` mencionan `Space`), nivel de verbosidad en la UI (alto/bajo/off) y
  volumen independiente de la narración.
- **Checkpoints: interacción extra** — hoy la tarjeta aparece al entrar en el radio y se oculta al salir. Posibles mejoras:
  tecla para fijarla/cerrarla, galería, enlaces «saber más».
- **Internacionalización**: la interfaz y los audios están fijos en inglés; si hiciera falta otro idioma habría que extraer
  los textos (hoy están repartidos en componentes y `checkpoints.ts`) y regrabar los audios.
- ⭐ **Más vehículos/terrenos y más estilos**: el sistema ya está preparado (ver [themes-and-missions.md](themes-and-missions.md)).
- **Controles táctiles** (joystick virtual) para móvil.
- **Sonido**: motor, polvo, ambiente (la voz de los checkpoints ya existe: ver `docs/narration.md`).
- **Obstáculos / colisiones** y objetos del escenario (rocas, banderas, módulo de aterrizaje).
- **Cielo**: estrellas/Tierra en la Luna, gradiente en Marte (la cámara casi no ve el cielo ahora mismo).

## Visual / técnico

- ✅ **Ruedas animadas**: los vehículos procedurales tienen las ruedas separadas y giran con la velocidad.
- **Huellas con desvanecimiento** (ahora desaparecen solo al reciclar el anillo de 2600 marcas).
- **Sombras estables**: ajustar el frustum de la luz al texel para evitar parpadeo al moverse.
- **Mapa de entorno** (`Environment` con `Lightformer`) para recuperar materiales metálicos sin que salgan negros.
- **Draco offline**: alojar el decodificador en `public/draco/`.
- **Peso de `public`**: ya limpio (47 MB, hito 43). Los mp3 de las historias suman ~7 MB cada una (`mp3_44100_64` los reduciría a la mitad).
- **Rendimiento en equipos modestos**: la escena puede ir a ~1 fps si hay otra pestaña con WebGL abierta; valorar `dpr` más bajo,
  sombras más baratas o un modo «ligero».
- **Vehículos procedurales**: ya rehechos con detalle y proporciones medidas sobre los GLB (hito 27). Queda rehacerlos a escala real al resolver «escala real» (arriba), y, si se quiere, animar piezas (mástil que gira, suspensión que articula con el terreno, dirección de las ruedas).
- **Terreno al mismo estilo** (siguiente paso del rediseño): bandas de altura en 3 tonos, sin degradados.
- **Tests**: no hay. Candidatos fáciles: `buildHeightField`/`heightAt`, `findSpawn`, marching squares.

## Calidad

- Probar el build de producción servido (`npm run build && npm start`) en el navegador; `npm run build` ya compila sin errores.
- Revisar accesibilidad de los selectores (roles ARIA, foco con teclado — ahora se hace `blur()` tras el clic para no
  interferir con `Espacio`).
- Revisar el `README` generado por Next si se añade despliegue.
