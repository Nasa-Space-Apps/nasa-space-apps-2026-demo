# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, `cacheComponents`) + React + three.js / React Three Fiber + Tailwind. Código existente; no se cambia de stack.

## Users

Jurado y público de un hackathon de NASA viendo la demo en una laptop o un proyector (pantalla grande, ratón y teclado). El móvil solo debe no romperse. Una persona curiosa, sin conocimientos técnicos, que quiere entender en segundos qué pasó con un vehículo espacial abandonado.

## Product Purpose

«Left behind»: una prueba de concepto que muestra **cómo se movieron los vehículos hasta quedar abandonados** en la Luna y en Marte. Se entra por un globo, se elige un vehículo abandonado y se «viaja al pasado»: el vehículo recorre una ruta fija por 5 o 6 checkpoints (salida, paradas y final) con fotos de NASA, narración y guía de voz, minimapa y línea de tiempo. Éxito = que el espectador recuerde la historia de un vehículo y quiera recorrer el siguiente.

## Positioning

No es un visor de datos de misión ni un simulador de conducción: es una **historia guiada** sobre el último viaje de un vehículo, contada con su propio terreno, ruta, narración y línea de tiempo (la ruta es fija; no hay conducción libre).

## Operating Context

- Dos vistas: el globo (`/moon`, `/mars`) y la escena del vehículo (`/<mundo>/<vehículo>`).
- `Espacio` mantenido avanza hasta el siguiente checkpoint; la línea de tiempo permite viajar hacia delante o atrás; `N` narración, `G` guía de voz.
- Dos expediciones: Opportunity (Marte, real hasta el final de 2018) y SEV (Luna, vehículo de prueba con final ficticio).
- Se demuestra en vivo: la app no necesita claves ni red (narración y guía son mp3 pregrabados).

## Capabilities and Constraints

- Interfaz y audios en **inglés**; documentación del repo en español.
- Vehículos procedurales de 3 tonos (`src/lib/vehicles.ts`); los GLB originales se conservan sin uso.
- Fotos de checkpoints de NASA (dominio público) con crédito visible.
- Estado compartido escena ⇄ DOM en el objeto mutable `src/lib/game.ts` (sin re-renders por frame).
- Los vehículos aún no tienen escala real (pendiente documentado en `docs/roadmap.md`).
- El SEV no tiene relación histórica con Apollo 14: su final es ficticio y así se rotula.

## Brand Commitments

- **Estilo plano (flat design)** como regla de toda la demo: sin sombras, brillos ni degradados.
- **Referencia visual fijada por el usuario: primer.io/payment-pioneers** (limpieza, tipografía, color, ilustraciones de 3 tonos sobre gris liso). El tema resultante será el único de la demo.
- Movimiento **suave** en todo: ninguna transición brusca.

## Evidence on Hand

- 16 fotos de checkpoints en `public/images/checkpoints` con crédito (`docs/assets.md`).
- 16 narraciones y 62 frases de guía pregrabadas (`public/narration`, `public/guide`).
- No hay testimonios, métricas ni claims comerciales; no inventarlos.

## Product Principles

1. Contar una historia, no mostrar datos: cada pantalla sirve al viaje del vehículo.
2. Lo esencial primero: el espectador entiende qué hacer (Espacio, línea de tiempo) sin leer instrucciones.
3. Plano y limpio: color y forma en lugar de sombra y brillo.
4. Todo movimiento es suave y con propósito; nada salta ni se corta.
5. Honestidad: lo real se rotula como real y lo ficticio como ficticio.

## Accessibility & Inclusion

- Contraste legible sobre fondos claros; respetar `prefers-reduced-motion` en las animaciones de interfaz.
- Los botones de la interfaz no deben activarse con `Espacio` al avanzar (se les hace `blur()` tras el clic).
