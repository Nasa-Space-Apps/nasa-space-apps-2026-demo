# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, `cacheComponents`) + React + three.js / React Three Fiber + Tailwind. Código existente; no se cambia de stack.

## Users

Jurado y público de un hackathon de NASA viendo la demo en una laptop o un proyector (pantalla grande, ratón y teclado). El móvil solo debe no romperse. Una persona curiosa, sin conocimientos técnicos, que quiere entender en segundos qué pasó con un vehículo espacial abandonado.

## Product Purpose

«Left behind» (título de trabajo): un **juego** sobre la vida completa del rover **Opportunity** —desde las decisiones de planificación y construcción hasta su última señal en Marte (2018)— con dos modos:

- **Historia** (informativo y atractivo): la misión contada de principio a fin. **Parte 1** (hasta el aterrizaje): historieta 2D con ilustraciones y voz. **Parte 2** (en Marte): el recorrido 3D con checkpoints reales y narración.
- **Decisiones** (aprender del error): los mismos puntos de la historia, pero algunos son **elecciones** del equipo de la misión. Elegir lo que no hizo la historia real lleva a un **fallo de la misión** (escena o animación incluida) que explica qué pasó de verdad y por qué.

Éxito = que el espectador recuerde cómo se llegó a Marte y por qué Opportunity duró 14 años, y que en el modo Decisiones entienda un riesgo real al equivocarse. Definición completa: `docs/game-design.md`. Está **definido, no implementado**.

## Positioning

No es un visor de datos de misión ni un simulador de conducción: es una **historia jugable** sobre una misión real, contada con ilustraciones, voz y el terreno 3D del vehículo (la ruta es fija; no hay conducción libre). Solo Opportunity «por el momento»; el resto de vehículos del proyecto anterior están en pausa.

## Operating Context

- Entrada: selección de modo (Historia / Decisiones). Dos partes por modo: Parte 1 «Earth» (viñetas 2D) y Parte 2 «Mars» (escena 3D).
- Parte 2 (ya existe): `Espacio` mantenido avanza hasta el siguiente checkpoint; la línea de tiempo permite viajar hacia delante o atrás; `N` narración, `G` guía de voz.
- **Antes del giro** (código conservado, en pausa): globo (`/moon`, `/mars`), escena por vehículo (`/<mundo>/<vehículo>`), Perseverance, SEV y 4 vehículos demo ficticios.
- Se demuestra en vivo: la app no necesita claves ni red (narración y guía son mp3 pregrabados).

## Capabilities and Constraints

- Interfaz y audios en **inglés**; documentación del repo en español.
- Vehículos procedurales de 3 tonos (`src/lib/vehicles.ts`); los GLB originales se conservan sin uso.
- Fotos de checkpoints de NASA (dominio público) con crédito visible.
- Estado compartido escena ⇄ DOM en el objeto mutable `src/lib/game.ts` (sin re-renders por frame).
- Los vehículos aún no tienen escala real (pendiente documentado en `docs/roadmap.md`).
- Los textos de los checkpoints actuales de Opportunity son verosímiles pero **no verificados**: se reemplazarán por datos reales (plantilla en `docs/data-request.md`) antes de dar el juego por válido.
- En el modo Decisiones, las ramas alternas son **contrafactuales** y se rotulan como tal («What if…»); nunca se presentan como historia.
- El SEV (en pausa) no tiene relación histórica con Apollo 14: su final es ficticio y así se rotula.

## Brand Commitments

- **Estilo plano (flat design)** como regla de toda la demo: sin sombras, brillos ni degradados (solo el grano estático del campo azul).
- **Referencia visual fijada por el usuario: ponpon-mania.com/chapter/2** (cómic interactivo: campo azul con grano, páginas de papel crema con trazo de tinta grueso, un acento rosa, Libre Franklin en negrita minúscula). Sustituyó a primer.io/payment-pioneers en el hito 30. El tema «Ink & Paper» es el único de la demo y la Parte 1 (historieta 2D) debe seguir su lenguaje (`docs/design.md`).
- Movimiento **suave** en todo: ninguna transición brusca.

## Evidence on Hand

- 60 ilustraciones de IA (20 por historia: Opportunity, Ingenuity y Surveyor 3) en `public/models/<misión>/images`, con los hechos y fuentes de cada evento en su `story.json` (`docs/assets.md`).
- 60 narraciones y 30 frases de guía pregrabadas (`public/models/<misión>/audio`, `public/guide`).
- No hay testimonios, métricas ni claims comerciales; no inventarlos.

## Product Principles

1. Contar una historia, no mostrar datos: cada pantalla sirve al viaje del vehículo.
1b. Equivocarse enseña: todo fallo del modo Decisiones explica la causa real y permite volver a elegir; nunca es un «game over» mudo.
2. Lo esencial primero: el espectador entiende qué hacer (Espacio, línea de tiempo) sin leer instrucciones.
3. Plano y limpio: color y forma en lugar de sombra y brillo.
4. Todo movimiento es suave y con propósito; nada salta ni se corta.
5. Honestidad: lo real se rotula como real y lo ficticio como ficticio.

## Accessibility & Inclusion

- Contraste legible sobre fondos claros; respetar `prefers-reduced-motion` en las animaciones de interfaz.
- Los botones de la interfaz no deben activarse con `Espacio` al avanzar (se les hace `blur()` tras el clic).
