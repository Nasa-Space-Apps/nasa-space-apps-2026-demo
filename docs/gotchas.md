# Trampas y problemas ya resueltos

## Next.js 16

- `AGENTS.md` (generado por Next) avisa de que esta versión cambia APIs respecto a lo habitual. Consulta
  `node_modules/next/dist/docs/` antes de usar APIs de Next que no conozcas. `layout.tsx` usa el tipo global `LayoutProps<"/">`.
- `ssr: false` en `next/dynamic` solo funciona dentro de un Client Component → por eso existen `SceneLoader.tsx` y `ExploreLoader.tsx`.
- **`cacheComponents` está activo** (`next.config.ts`): `await params` fuera de `<Suspense>` da «instant shell»; ver «Rutas y vistas» en [architecture.md](architecture.md). Las rutas no válidas devuelven 200 con la página 404 (el `notFound()` ocurre dentro del Suspense ya en streaming).
- `next dev` muestra un indicador "N" abajo a la izquierda (solo en desarrollo). Los chips de controles están centrados abajo
  para no solaparse con él.

## ESLint / React Compiler

- La regla `react-hooks/immutability` marcaba como error la mutación dentro de `useFrame` (posiciones, `game.*`, buffers). Es
  un falso positivo para código imperativo de R3F → **desactivada** en `eslint.config.mjs`.
- No asignes `game.*` durante el render (la regla lo veía como error); hazlo en `useEffect` o en `useFrame`.

## three.js / R3F

- **Avisos de consola inofensivos:** `THREE.Clock deprecated` y `PCFSoftShadowMap has been removed` vienen de R3F/three, no del
  código del proyecto.
- **STL en Z-up:** si algo sale «tumbado», es la rotación `rotateX(-90°)` en `buildTerrain`.
- **Modelos negros:** ya no aplica a los vehículos (su `ShaderMaterial` de 3 tonos no usa iluminación PBR). Si cargas un GLB con `metalness` alto sin mapa de entorno, saldrá negro.
  Alternativa: añadir `<Environment>` de drei (requiere assets de red o `Lightformer`).
- **Bordes del terreno:** se aplanan + plano de suelo infinito + niebla. En terrenos empinados el borde es una pendiente fuerte:
  usar `margin` por misión para que el rover no suba por ahí.
- **Cambio de misión:** `Experience` se remonta con `key={mission.id}`; el estado del rover (`st`) y las huellas se reinician
  solos, `game` se reinicia en el `useEffect`. El minimapa detecta el cambio comparando `game.terrain`.

## Escala y terreno

- **Los vehículos no están a escala** (ver «Por resolver: escala real» en [roadmap.md](roadmap.md)). Los STL tampoco son
  metros; no deduzcas distancias reales de las unidades.
- **El centro de los mapas es un cráter** (punto de aterrizaje). En Marte (Opportunity) sus paredes son muy empinadas: el rover sale
  inclinado hasta casi vertical. Es del relieve exagerado, no un fallo de la física.
- **Terreno de Gale** (`gale-terrain.stl`, vehículo Perseverance): un cráter central enorme con el suelo plano a z ≈ 0 y paredes de 20–30 de desnivel. Los checkpoints están en las mesetas llanas (norte y este)
  y la ruta evita el cráter (pendiente máxima ~13°); no pongas paradas en el suelo del cráter sin trazar antes la ruta (A\*: ver la receta de checkpoints).

## Checkpoints

- **Nunca pongas un checkpoint donde sale el rover** (Luna ≈ (2, 2), Marte (0, 0)): se activaría nada más cargar.
- Las coordenadas son de **mundo** (terreno centrado). Si el STL está en Z-up: `X = x − cx`, `Z = −(y − cy)`.
- El vehículo se detiene solo en el centro de cada checkpoint (con `Espacio`), así que la tarjeta se ve el tiempo que quieras. En un
  viaje automático los checkpoints intermedios se cruzan sin tarjeta ni narración.
- **La salida ya está activa al cargar** (el rover aparece dentro de su radio): su tarjeta y narración arrancan solas. El navegador
  bloquea el audio sin gesto previo → verás «Browser blocked audio: press Listen» hasta que haya un clic o tecla; el botón lo resuelve.
- **La meta de un tramo no se recalcula mientras frena** (`st.goal` en `Rover.tsx`): si se buscara «el siguiente stop > s + 0.5» en
  cada frame, al estar a < 0,5 u del checkpoint saltaría al siguiente y el vehículo no se detendría (bug real que se corrigió).
- La tarjeta va abajo a la izquierda. Solo en desarrollo se sube (`bottom-14`) para no quedar tapada por el indicador «N» de
  Next; en producción va a `bottom-5`. El minimapa ocupa abajo a la derecha y los chips, abajo al centro.
- `visited` no se persiste: se reinicia al cambiar de vehículo y al recargar.
- **Guía de voz**: tiempos en reloj real, movimiento en tiempo de simulación (`dt` ≤ 0,05 s): con pocos fps la guía parece «adelantada»
  respecto al rover. Para probarla, engancha `HTMLMediaElement.prototype.play` y registra `src` + `performance.now()`; el subtítulo
  está en el `[aria-live]` de `GuideCaption`. Ver [guide.md](guide.md).
- Si editas `narration` (guion) de una historia, hay que regrabar el audio (`npm run story-audio -- <misión>`); si no, el mp3 dice otra cosa.
- Si el navegador va a ~1 fps (otra pestaña con la escena abierta compite por la GPU), el rover casi no avanza: el `dt` se
  limita a 0,05 s por frame. Al probar con automatización, conduce por posición (leyendo el minimapa), no por tiempo.
- `rm -rf .next` con el servidor de desarrollo en marcha es seguro (se regenera solo); `.next/types` puede quedar obsoleto
  si borras una ruta: `npx next typegen` lo regenera.

## Teclado y foco

- **Un estilo `background` en línea anula el barrido lima** de `.ui-btn`/`.ui-nav`/`.ui-row` (el shorthand borra `background-image`): en la barra superior eso dejaba el texto de «Globe» en tinta sobre tinta al pasar el cursor. No pongas `background` en línea en elementos con esas clases (usa la clase o `backgroundColor` solo si no necesitas el barrido).

- Tras pulsar un botón del DOM, `Espacio` (avanzar) podría reactivarlo → los selectores, el botón Listen y los marcadores de la línea
  de tiempo llaman a `blur()` al hacer clic.
- Los listeners de teclado están en `window`; `bindKeyboard()` hace `preventDefault` solo para las teclas del juego.

## Probar en el navegador (método usado)

Con la extensión Claude in Chrome (o cualquier navegador):

1. `npm run dev` y abre `http://localhost:3000`.
2. Las pulsaciones sintéticas de una herramienta de «tecla» son demasiado cortas para conducir. En su lugar, despacha eventos
   desde la consola:
   ```js
   const k=(c,d)=>window.dispatchEvent(new KeyboardEvent(d?'keydown':'keyup',{code:c,bubbles:true}));
   k('KeyW',1);            // avanzar
   setTimeout(()=>k('KeyW',0), 2000);
   ```
   (`Space` avanza hasta el siguiente checkpoint y se para solo; `KeyM` de vehículo, `KeyN` la
   narración, `KeyG` la guía). Para saltar a un checkpoint sin esperar: `document.querySelectorAll('[aria-label="Route timeline"] button')[i].click()`.
   Lee «Pos X · Z» del minimapa y el texto de estado de la línea de tiempo (`span.truncate`) para comprobar dónde está. Para que suene el audio hace falta **un clic real** previo en la página
   (los eventos sintéticos no cuentan como gesto del usuario).
3. Ir directo a un vehículo: `http://localhost:3000/moon/sev` (o `/mars/opportunity`); al globo con tarjeta: `/moon#sev`. Para silenciar: `localStorage.setItem('poc-narration','off')`
   (`poc-narration` / `poc-guide`: `on|off`) Ojo: son las preferencias reales del usuario si usas su navegador; restáuralas.
4. Los errores de consola pueden ser **obsoletos** (estados intermedios del HMR mientras se editaba); recarga y vuelve a leer.

## Volver al globo (Next mantiene las vistas vivas)

- **Rendimiento:** por lo mismo, cada vista visitada seguía montada (≈ +350–400 MB de GPU por escena). `Scene` y `Explore` ahora no renderizan nada cuando su ruta no es la actual (`usePathname`), ver [performance.md](performance.md). `PERF.releaseHiddenViews = false` lo desactiva.
- **R3F en `frameloop="demand"`:** invalidar solo desde fuera del render (un `requestAnimationFrame` propio) da **un fotograma de cada dos** (30 fps aunque pidas 60). Para sostener 60 fps hay que invalidar desde dentro de `useFrame` (`FrameGovernor`). Cuenta fotogramas con `drawElements`, no con `requestAnimationFrame`.

- Con `cacheComponents`, Next **conserva montada la vista anterior** (oculta, con su estado de React) cuando navegas a otra ruta, y al volver **re-ejecuta sus efectos**. `Explore` fundía a blanco al viajar (`leaving = true`) y al volver con «← Globe» o el botón Atrás
  del navegador seguía así: página en blanco en `/moon#sev`. Corregido reseteando `leaving` en el efecto de montaje. **Regla:** todo estado transitorio de una vista (fundidos, «en curso»…) debe reiniciarse en el efecto de montaje, no en el inicializador del `useState`.
- Para reproducirlo: `/moon` → clic en el vehículo → Travel to the past → `navigate back`.

## Audio: no confíes en `preload` (hito 38)

- Un `new Audio(url)` que no está en el DOM puede perder su búfer con el tiempo y re-pedir el archivo al reproducir (segundos de «Loading…» sin subtítulos). Los clips de narración se guardan como **Blob en memoria** (`loadNarration` en `lib/narration.ts`): si añades otro audio que deba sonar sin demora, haz lo mismo y precárgalo antes de que el usuario llegue (como `useStoryAssets` en `Journey`).

## Montar la escena 3D bloquea el hilo (hito 37)

- Construir el terreno (`buildTerrain`, mapa de alturas, minimapa) y compilar los shaders (`<Preload all/>`) bloquea el hilo principal **~6 s en desarrollo** (medido con `PerformanceObserver` de `longtask`): mientras tanto no responden botones, teclas ni subtítulos. **No montes `Scene` detrás de algo interactivo**: hazlo cuando el usuario ya espera una carga (p. ej. al aterrizar del cómic) y tápalo con transiciones de transform/opacidad, que siguen en el compositor. Para adelantar trabajo solo de red, un `fetch` del STL basta.
- Mide así: en la consola, `new PerformanceObserver(l => l.getEntries().forEach(e => console.log(e.startTime|0, e.duration|0))).observe({entryTypes:['longtask']})` y pasa de página.

## Animaciones de juego (hito 32)

- **Un `Canvas` de R3F dentro de un elemento con `transform: scale`** (p. ej. dentro de `Pop`) se mide con `getBoundingClientRect`, que incluye la escala: a mitad del pop el canvas «mide» poco y el vehículo queda diminuto cuando termina. Usa `resize={{ offsetSize: true }}` (medida de layout, sin transformaciones), como `VehicleView`.
- **El CSS nuevo puede no llegar al servidor de desarrollo** hasta que se recarga la página (`location.reload()`); si una clase nueva no hace nada, comprueba con `document.styleSheets` antes de depurar el código.
- **Tras hacer merges/cambiar de rama la UI sale «rota» (botones en mayúsculas y mono, selector de mundo sin estilo) aunque el código es el correcto** (visto el 15 nov 2026): el servidor de desarrollo (Turbopack) sigue sirviendo una hoja de estilos **antigua** (la de «Primer») desde su caché `.next/dev/cache`; ni `touch globals.css` ni recargar lo arreglan. Comprobación: en la consola, `fetch(document.styleSheets[0].href).then(r=>r.text()).then(t=>t.includes('.ui-world'))` debe dar `true`. **Solución:** parar `npm run dev`, borrar la carpeta `.next` (`Remove-Item -Recurse -Force .next`), volver a arrancar y recargar con Ctrl+Shift+R. No es un fallo de ningún commit.
- Los `@keyframes` nuevos no se recogen en dev: para bucles (p. ej. la flecha que se mueve de «travel to the past») usa la **Web Animations API** (`el.animate`, ver `VehicleCard`) y cancélala al desmontar; los muelles del 3D van en `lib/motion.ts` (`springStep`, desde `useFrame`).
- El clic fuera de la tarjeta (`Explore`) ignora el clic que la abrió con una marca de tiempo (`openedAt`): el efecto que registra el listener puede ejecutarse antes de que ese mismo clic llegue a `window`.

## Tarjeta del vehículo y subtítulos

- `VehicleView` usa `frameloop="demand"`: si cambias algo del modelo o la cámara, llama a `invalidate()` (el efecto de encuadre ya lo hace).
- `Captions` y la narración: la burbuja se apaga sola al terminar el clip (`ended`) o al parar (`stopNarration`). Si editas `narration` de un checkpoint, los subtítulos se recalculan solos al regrabar el audio (no hay archivos de tiempos que mantener).

## Globo y rutas

- **No uses `Html` de drei dentro del `Canvas`** (etiquetas): en desarrollo con StrictMode lanza «Attempted to synchronously unmount a root while React was already rendering» y pierde etiquetas. Se usan etiquetas DOM propias (`GlobeLabels.tsx`) posicionadas por proyección.
- **`@keyframes` nuevos en `globals.css` no los recogió el servidor de desarrollo** (el bundle CSS no los incluía ni tras recargar): el fundido de entrada a la escena usa una transición inline (`veil` en `Scene.tsx`).
- **`await params` fuera de `<Suspense>`** da el error «instant shell» (`cacheComponents`): ver `app/[body]/page.tsx`.
- **Cambiar de mundo usa `history.pushState`** (no `router.push`) para no remontar el `Canvas`; `usePathname` se sincroniza solo. La tarjeta va en el hash (`/mars#opportunity`) y se lee **tras montar** (al volver de la escena Next actualiza la URL después del primer render).
- El giro hacia el vehículo (`settle`) se mide en tiempo de simulación (`dt` ≤ 0,05 s): con pocos fps (navegador de pruebas) tarda mucho más en reloj real. Espera varios segundos antes de capturar.
- Para probar el arrastre del globo: `left_click_drag` sobre la esfera. Desde el hito 47 gira **libre en X e Y** (cuaternión `st.q`); antes solo giraba en horizontal. El zoom es de la cámara (`view` en `Globe.tsx`: rueda sobre el canvas, `Ctrl`+rueda/pellizco y `Ctrl` +/−/0, solo en `/mars` y `/moon`); por eso los botones y etiquetas del DOM no cambian de tamaño.
- `VehicleCard` dibuja el vehículo procedural en un mini `<Canvas>` ortográfico (`VehicleView`): no descarga nada. Los vehículos usan una luz **fija en espacio mundo** (`SUN` en `lib/vehicles/kit.ts`), así que los tonos cambian al girar.
- **Vehículos (kit):** en `Kit.loft` el orden de los anillos decide hacia dónde mira la superficie; el material es de doble cara, así que un casco «del revés» no desaparece, pero si sale todo oscuro es que las normales apuntan hacia dentro. No uses escalas negativas para reflejar piezas (invierten las caras): refleja las coordenadas (`for (const s of [-1, 1])`). Las ruedas izquierdas se dibujan giradas 180°, así que en `wheel()` la cara exterior siempre es +x.
- **Probar un vehículo sin navegador:** los modelos no importan nada de Next ni usan el alias `@/`, así que Node puede construirlos (`buildVehicle`) y volcar sus triángulos; así se revisaron (render ortográfico propio) antes de abrir el navegador. Mantén esos archivos sin imports de la app.
- **El globo usa cámara ortográfica** (`orthographic` en el `Canvas`): los shaders de `Globe.tsx` (rejilla, cuadrados orbitantes) y el `front` de `Pin` asumen una dirección de vista constante (+z en vista). Si vuelves a perspectiva, hay que recuperar la dirección hacia la cámara por vértice. El zoom (píxeles por unidad) lo fija `Fit` con `frame()` × el zoom del usuario (`view.cur`).
- Los scripts de edición con *heredoc* de varias líneas con comillas fallaron en el shell de la herramienta; para ediciones largas escribe el script a un archivo y ejecútalo.

## Hitos 45–52 (Spirit, paletas, UI, globo, vehículos inmóviles)

- **Vehículos inmóviles (hito 52):** con `game.stationary`, `game.s` es un cursor de tiempo, no una distancia; no uses `game.x/z` ni la proximidad para saber en qué momento estás (usa `game.active` o `route.stops`). Espacio llama a `stepForward()`, no pone `input.go`; `left_click`/`key` de prueba: una pulsación = un momento. El modelo **no puede tener ruedas** (`rig.wheels` vacío, y `halfLen/halfWid` hay que pasarlos a `finish()`: salen de las ruedas).
- **`beagle-2` ↔ `beagle2`:** el id de la misión y de la ruta (`/mars/beagle-2`) lleva guion; la carpeta de datos y los scripts (`npm run story -- beagle2`) no. `STORIES` en `lib/story.ts` usa el id con guion.
- **El botón «skip to mars» del cómic** no está siempre en (1405, 40): depende del ancho del viewport (a 1531 de ancho, ~(1473, 24)); mira la captura antes de pulsar.

- **Enderezado al soltar (hito 50):** la orientación «derecha» es `Rx(TILT)·Ry(a)`; su centro está siempre a latitud `TILT` (≈ 28,6°) y a longitud `l` con `a = faceAngle(l)`. `upright()` toma la longitud del centro actual (`atan2(−c.z, c.x)`) y busca la más cercana con vehículo (`showsVehicle`, barrido de 1°). Por eso, tras soltar, el centro queda a latitud 28,6° aunque el usuario lo hubiese subido o bajado: la tilde es lo que se «normaliza». Con la cámara del navegador de pruebas `left_click_drag` suelta dentro de la misma acción, así que la captura siguiente ya muestra el globo enderezado.

- **Límite del globo (hito 49):** la geometría está en `BodyGlobe` (`look`, `toward`, `constrain`): el centro de la pantalla en el marco del globo es `q⁻¹·(0,0,1)`; si su distancia angular al vehículo más cercano pasa de `MAX_OFF`, se corrige con la rotación mínima que lo lleva al borde del casquete (`q ← q·Rot⁻¹`). Se validó con una simulación numérica (arrastres aleatorios en la Luna, 2 vehículos, y en Marte, 6): el máximo fue exactamente `MAX_OFF` y todos los snaps llegaron. El snap usa la rotación mínima, así que la rejilla puede quedar inclinada (roll) tras él. Para probarlo en el navegador hay que **esperar ~40 s** a que el giro automático deje una cara vacía en la Luna y luego agarrar el globo.

- **«No se oye la narración» ≠ audio roto:** la causa fue `localStorage['poc-narration'] = "off"` (tecla `N`). Los mp3 eran válidos (se compararon duración y volumen con `ffprobe`/`ffmpeg volumedetect`). Comprueba la preferencia antes de regrabar nada (cuesta créditos).
- **Dentro del `<Canvas>` de R3F no llega el contexto de React** (`usePathname`, `useTheme`…): `Experience` (`Scene.tsx`) saca el tema con `themeFor(bodyOfMission(mission.id).id)`; el globo recibe `theme` por props. No uses `useTheme()` dentro de componentes del canvas.
- **Paleta por mundo y primer pintado:** las variables CSS las pone un script en el `<head>` (`layout.tsx`) antes de pintar y `WorldVars.tsx` las mantiene al cambiar de ruta; `<html>` lleva `suppressHydrationWarning` porque el script cambia su `style`. Si añades un token CSS nuevo, añádelo a `cssVars()`.
- **Terreno de Gale:** el montículo central tiene pendientes de 30–40°; el planificador de rutas (`npm run story-route`) no consigue un camino suave por él. Para Spirit se usó Meridiani. Antes de elegir `ANCHORS` imprime un mapa de alturas/pendientes con `scripts/lib/terrain-node.mjs` (`loadTerrain` → `heightAt`, `slopeAt`); el primer y el último ancla no se ajustan a suelo llano: ponlos tú en un llano.
- **Finales de línea mezclados (CRLF/LF):** varios archivos (`themes.ts`, `Globe.tsx`, `Scene.tsx`, `CheckpointCard.tsx`, `globals.css`, `Hud.tsx`…) están en CRLF y otros en LF. Los parches con `str.replace` de varias líneas fallan en los CRLF: normaliza a `\n` en memoria y vuelve a escribir con el mismo final (`split("\r\n").join("\n")`). Git avisa «LF will be replaced by CRLF»; es inofensivo.
- **Parches desde el shell:** las comillas/escapes de `node -e` y de `sed` con regex rompen texto con `\` o saltos de línea. Escribe el script a un archivo (herramienta Write) y ejecútalo.
- **Probar con el navegador:** `computer.wait` admite como máximo 10 s; `zoom` exige una región dentro del viewport; el botón «skip to mars» está en ~(1405, 40) a 1536×775. La narración suena en el navegador de pruebas (el audio es real).

## Rendimiento

- No hay *raycast* por frame: todo usa `heightAt` sobre la rejilla.
- El *bake* del minimapa (desenfoque + curvas) tarda unas decenas de ms; ocurre al cargar y al cambiar de estilo/misión.
- Posible parpadeo de sombras al moverse (el frustum de la luz sigue al rover sin ajustarse al texel). Ver roadmap.

## Servidor de desarrollo

- **El usuario arranca `npm run dev` a mano** (y pidió que no se deje ninguno corriendo). Si lanzas uno propio para probar,
  ciérralo después. Next avisa si ya hay otro en el proyecto («You can access the existing server at…») y no arranca un
  segundo: pruebas contra el existente.

## Verificaciones pendientes de hacer en un entorno limpio

- `npm run build` pasa (verificado al documentar), pero no se ha probado el build servido con `npm start` en el navegador.
- Probar en un navegador sin caché y sin internet (Draco por CDN).
