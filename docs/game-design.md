# Diseño del juego: «Left behind» (Opportunity, de la mesa de diseño a la última señal)

> **Este es el enfoque vigente del proyecto** (hito 29 de [history.md](history.md)). Sustituye al de «plataforma informativa con globo y varios vehículos».
> Es **definición, no implementación**: nada de lo descrito aquí está construido salvo lo que se marca como «ya existe».
> Lo marcado **(propuesto)** lo añadió Claude al pulir la idea y está pendiente de validar con el usuario y su colega.

## 1. Qué cambia

| Antes | Ahora |
| --- | --- |
| Visor informativo: globo → tarjeta de un vehículo → viaje por checkpoints | **Juego** con dos modos: **Historia** (informativo) y **Decisiones** (aprender del error) |
| 3 vehículos reales/de prueba + 4 demo | **Solo Opportunity** por ahora (el resto queda en pausa, ver §9) |
| Solo cuenta lo que pasó en Marte | Cuenta **toda la vida de la misión**: planificación, construcción, lanzamiento, aterrizaje y 14 años en Marte |
| Texto de checkpoints «ficticio pero verosímil» | **Datos reales y verificados** (se reemplazan más adelante; ver [data-request.md](data-request.md)) |
| Una sola experiencia (3D + voz) | Dos partes: **Parte 1 (2D, historieta)** hasta el aterrizaje y **Parte 2 (3D)** en Marte |

Lo que **no** cambia: flat + tema único, ahora «Ink & Paper» de cómic (hito 30, [design.md](design.md)), interfaz y audios en inglés, audio pregrabado (sin API en ejecución), subtítulos para todo lo que dice una voz, honestidad real/ficticio, movimiento suave, rendimiento (`PERF`).

## 2. Concepto en una frase

Vive la historia real del rover Opportunity —desde la decisión de construirlo hasta su última señal— como relato (**Historia**) o como una serie de **decisiones** del equipo de la misión donde elegir mal acaba en un fallo que te enseña por qué se decidió lo que se decidió (**Decisiones**).

## 3. Estructura: 2 modos × 2 partes

| | **Parte 1 · «Earth»** (2D) | **Parte 2 · «Mars»** (3D) |
| --- | --- | --- |
| Cubre | Planificación → diseño/construcción → pruebas → lanzamiento → crucero → aterrizaje | Aterrizaje en Meridiani → recorrido → tormenta de polvo de 2018 (fin) |
| Formato | **Historieta**: viñetas ilustradas + narración por voz + subtítulos | Escena 3D actual: vehículo procedural, ruta fija, balizas, tarjeta, narración (**ya existe**, se adapta) |
| Avance | Clic / `Espacio` pasa a la siguiente viñeta (la voz arranca sola) | `Espacio` mantenido + línea de tiempo, como hoy |
| **Modo Historia** | Todas las viñetas en orden, solo informativo | Todos los checkpoints en orden, solo informativo |
| **Modo Decisiones** | Mismas viñetas, pero en algunos nodos **eliges** | Mismos checkpoints, pero en algunos nodos **eliges** |

La transición Parte 1 → Parte 2 es el aterrizaje: la última viñeta funde al lienzo y la escena 3D entra desde ahí (mismo mecanismo de fundidos que hoy, `Loading.tsx`).

## 4. La columna vertebral: una sola línea de nodos

Los dos modos comparten **una única lista ordenada de nodos** («beats»). El modo Decisiones no es otro contenido: es la misma historia con algunos nodos convertidos en decisión.

- Un nodo **`story`**: viñeta (Parte 1) o checkpoint (Parte 2) con su texto, datos, foto/ilustración y narración.
- Un nodo **`decision`**: antes de contar lo que pasó de verdad, plantea la situación y **2–3 opciones**. **Exactamente una es la real** (la que tomó el equipo); su resultado **es el nodo `story` siguiente**, así que escoger bien = seguir la historia real.
- Las opciones **no reales** abren una **rama alterna**: 1–3 nodos cortos que muestran cómo se desarrolla la mala decisión y terminan en un **fallo** (`failure`).
- En **modo Historia** los nodos `decision` se muestran como relato normal («El equipo decidió X porque Y»): se reutiliza el contenido de la opción real.

Esquema conceptual (tipos orientativos; **no** crear todavía):

```ts
type Part = "earth" | "mars";
type Beat = {
  id: string; part: Part;
  // contenido real (verificado): fecha, sol, lugar, datos, imagen + crédito, guion de voz
  kind: "story" | "decision";
  decision?: {
    prompt: string;                 // la situación, en inglés, sin dar la respuesta
    options: {
      id: string; label: string;
      real: boolean;                // exactamente una
      branch?: Beat[];              // 1–3 nodos de la rama alterna (solo si !real)
      failure?: Failure;            // dónde termina esa rama (solo si !real)
    }[];
  };
};
type Failure = {
  id: string; title: string;
  cause: string;                    // qué salió mal, en una frase
  realOutcome: string;              // lo que de verdad hizo el equipo y por qué
  scene?: "mars-stuck" | /* … */;   // animación 3D (Parte 2); en Parte 1, viñeta final
};
```

Datos en un archivo propio (p. ej. `src/lib/story.ts`), no en componentes, igual que `checkpoints.ts` hoy. Los `checkpoints` de Opportunity pasan a ser los nodos de la Parte 2.

## 5. Modo Historia (informativo y atractivo)

- Experiencia lineal, sin fallos ni decisiones. Meta: que el espectador **entienda y recuerde** el viaje completo de Opportunity.
- Parte 1: historieta narrada. Parte 2: el recorrido 3D de hoy con checkpoints reales.
- Al terminar: pantalla de cierre con el final real (Sol 5111, última señal de la tormenta de polvo; la misión debía durar 90 soles) y la invitación a probar el modo Decisiones.

## 6. Modo Decisiones (aprender del error)

Reglas **(propuestas)**:

1. **Todas las malas decisiones convergen en un fallo** de la misión (lo pidió el usuario) y el fallo **enseña**: nunca es un «game over» mudo.
2. **Anatomía de un fallo**: (a) la rama alterna (1–3 nodos), (b) la escena de fallo (viñeta final en Parte 1; **animación 3D** en Parte 2: vehículo atascado, inclinado, sin energía…), (c) **tarjeta «What really happened»**: la causa del fallo, qué hizo de verdad el equipo y por qué, con foto/dato real; (d) botón para **volver a la decisión** (rebobinar al nodo) y elegir otra vez.
3. **Las opciones deben ser plausibles**: son las que de verdad se debatieron o las alternativas razonables de la época, no trampas obvias. La correcta no va siempre en la misma posición.
4. **Sin cronómetro**: es un juego de aprender, no de reflejos (decisión propuesta).
5. **Ramas cortas**: el coste de contenido (ilustración, audio, animación) crece con cada rama; máximo 3 nodos por rama alterna.
6. **Número de decisiones**: 3–4 por parte (6–8 en total) como objetivo inicial; no todos los nodos son decisión, solo los que tuvieron una bifurcación real.
7. **Final**: «fallo» = misión terminada **antes** del final real. El final real (2018) es el desenlace canónico, agridulce: ganar es llegar a él.
8. Seguimiento mínimo **(propuesto)**: al acabar, un resumen «you matched history on N of M decisions» con lo aprendido; sin puntuación ni ranking de momento.

## 7. Parte 1 — «Earth» (historieta 2D)

- **Formato**: una viñeta por pantalla (a pantalla completa o composición editorial), imagen + título/fecha/lugar en mono + subtítulo de la voz. La voz arranca sola; `Espacio`/clic avanza; flechas o clic para retroceder.
- **Voz**: narrador de la narración (Bill) para todos los nodos; subtítulos con `lib/transcript.ts` (mismo método de siempre: solo se pide el audio).
- **Imágenes**: ilustraciones de tipo historieta/anime pedidas por el usuario. **Tensión a resolver con el diseño** (ver preguntas abiertas): la regla de la demo es flat de 3 tonos, sin efectos «de IA». Propuesta: ilustraciones **planas con la paleta de la demo** (mismo lenguaje que los vehículos); las **fotos reales de NASA** se reservan para la tarjeta «What really happened» y para los créditos/evidencias, así lo ilustrado y lo real se distinguen.
- **Contenido** (candidatos, **hechos por verificar** con [data-request.md](data-request.md); no inventar cifras):
  - Contexto: tras los fracasos de 1999 (Mars Climate Orbiter y Polar Lander) se exige más fiabilidad.
  - Decisión de **construir dos rovers idénticos** (redundancia: Spirit y Opportunity).
  - **Elección del sitio** de aterrizaje: Meridiani Planum (señal de hematita; lugar «seguro» para airbags y con evidencia de agua).
  - **Sistema de aterrizaje**: paracaídas + cohetes + airbags heredados de Pathfinder; ensayos del paracaídas.
  - **Ventana de lanzamiento** fija (cada ~26 meses): no se puede retrasar; presión de calendario y pruebas.
  - Lanzamiento (7 jul 2003, Delta II), crucero y **aterrizaje** (enero de 2004, «hoyo en uno» en el cráter Eagle).
- **Decisiones candidatas** (ejemplos, a validar con datos): sitio de aterrizaje · sistema de aterrizaje · uno o dos rovers · tolerar/retrasar ante un fallo en pruebas.

## 8. Parte 2 — «Mars» (3D)

- **Ya existe** la mayor parte: terreno de Meridiani (`terrain.stl`), vehículo procedural, ruta con `Espacio` y línea de tiempo, balizas, tarjeta, narración, guía de voz, minimapa, música.
- Los checkpoints de Opportunity (`landing, eagle, endurance, victoria, perseverance`) **son los nodos** de esta parte; su texto hoy es ficticio y **se sustituye por datos reales** más adelante (Eagle → Endurance → Heat Shield Rock → Purgatory Dune → Victoria → Endeavour → Marathon Valley → Perseverance Valley → tormenta de 2018: lista candidata de [data-request.md](data-request.md), elegir 5–6).
- **Decisiones en 3D**: al llegar a un nodo `decision` se muestra la tarjeta de decisión (en vez de la tarjeta informativa); la opción elegida decide la **ruta** que toma el vehículo (la real o una alterna con otros `via`).
- **Fallos en 3D** (animación sobre la escena, sin cambiar de pantalla): el vehículo ejecuta la consecuencia y la cámara se queda en él; después aparece la tarjeta «What really happened». Candidatos **(propuestos, por verificar)**: atascarse en una duna (Purgatory Dune fue un casi-fallo real, sol ~446–484), inclinarse/resbalar al entrar a un cráter por una pendiente demasiado dura, quedarse sin energía en la tormenta. Cada escena de fallo es una pequeña animación reutilizable (hundir ruedas, inclinar el cuerpo, apagar luces, fundido).

## 9. Impacto en el código (referencia, no se implementa ahora)

| Pieza | Destino |
| --- | --- |
| Escena 3D, ruta, checkpoints, minimapa, narración, guía, ambiente, captions, loading, `perf`, tema | **Se reutilizan** (Parte 2) |
| `lib/checkpoints.ts` (Opportunity) | Se convierte en los nodos de la Parte 2; texto a reemplazar por datos reales |
| Globo (`Explore`, `Globe`, `VehicleCard`, `bodies.ts`) y rutas `/[body]` | **En pausa**: el código se conserva; la entrada pasa a ser una pantalla de inicio con los dos modos (ver preguntas) |
| Vehículos Perseverance, SEV y demo (`spirit`, `ingenuity`, `insight`, `beagle2`) y sus checkpoints/audios | **En pausa**: no se borran ni se montan en el flujo del juego |
| Nuevo: datos de la historia (`lib/story.ts`), visor de historieta (Parte 1), tarjeta de decisión, tarjeta «What really happened», estado de partida (modo, nodo actual, rama), escenas de fallo 3D, navegación entre partes | **Por construir** |
| Audio: narración Parte 1 + ramas alternas + frases de la guía del modo Decisiones | **Por grabar** (cuesta créditos; cada rama alterna suma) |
| Rutas | **(propuesto)** `/` inicio con selección de modo; `/play/story` y `/play/decisions` con `?part=` o segmentos propios; hasta decidirlo, no tocar el enrutado actual |

`game.ts` seguirá siendo el estado mutable de la escena; el estado de la partida (modo, nodo, rama, decisiones tomadas) puede vivir aparte (store externo como `narration.ts`/`guide.ts`), sin re-renders por frame.

## 10. Fases sugeridas (propuesto)

1. **Datos**: investigar y verificar los eventos reales (plantilla de [data-request.md](data-request.md)); fijar la lista de nodos y marcar cuáles son decisión.
2. **Esquema y contenido en inglés**: `story.ts` con nodos reales, opciones y fallos (texto y guion de voz).
3. **Modo Historia, Parte 2**: adaptar la escena actual a los nodos reales (lo más barato: ya existe).
4. **Parte 1**: visor de historieta + ilustraciones + narración; transición al 3D.
5. **Modo Decisiones**: tarjeta de decisión, ramas, «What really happened», rebobinado; primero en la Parte 1 (más barato: viñetas), luego en la Parte 2 (rutas alternas + animaciones de fallo).
6. Pulido: pantalla de inicio, cierre, resumen, accesibilidad, rendimiento.

## 11. Honestidad y datos

- Todo lo real lleva su fuente/crédito; los datos se verifican antes de publicarse (lo contrario va contra el principio 5 del producto).
- **Las ramas alternas son contrafactuales**: se rotulan como tal («What if…») y sus fallos se apoyan en riesgos reales que el equipo enfrentó, nunca en hechos inventados presentados como historia.
- El final real del 2018 y los casos reales (p. ej. el atasco en Purgatory Dune) no se alteran: lo ficticio es **lo que habría pasado** si se hubiese elegido otra cosa, y debe poder distinguirse a simple vista.
- Los vehículos demo ficticios y su regla «sin audio nuevo» quedan fuera del juego. Para Opportunity **sí** se grabará audio nuevo (contenido real).

## 12. Preguntas abiertas

1. ~~Estilo de las ilustraciones de la Parte 1~~ **Resuelto (hito 30):** el lenguaje es el cómic de [ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2) (tinta negra + papel crema, recuadros gruesos, manchas azul/rosa, grano), ya aplicado a toda la UI: ver [design.md](design.md#parte-1-del-juego-historieta-2d). **Sigue abierto:** *quién y cómo produce* los dibujos (generados, encargados, dibujados a mano) y si los personajes/vehículos de las viñetas van en tinta y crema como en la referencia.
2. **Entrada**: ~~¿globo o portada?~~ **Decidido en parte (hito 31):** el globo se conserva como **menú previo** al juego (vehículos 3D en miniatura, botón de mundo, tarjeta flotante). **Abierto:** cómo se elige el modo (Historia / Decisiones) desde la tarjeta del vehículo.
3. **Duración objetivo** (provisional): Historia ≈ 6–8 min; Decisiones ≈ 8–12 min con fallos de ~1 min cada uno. ¿Es válido para la demo del jurado?
4. **Resumen/puntuación** al final del modo Decisiones: ¿solo «aprendiste X» o también conteo de aciertos?
5. **Reintento tras un fallo**: ¿volver a la misma decisión (propuesto) o reiniciar la parte?
6. **Parte 1 y modo Decisiones**: ¿la elección en la Parte 1 puede afectar a la Parte 2, o son independientes (propuesto: independientes, cada fallo termina la partida)?
7. **Nombre/título**: «Left behind» era del enfoque «abandonados»; ¿se mantiene?
8. **Idiomas y música**: interfaz en inglés, docs en español; la música actual (`moon`/`mars`/`timeline`) ¿alcanza para la Parte 1 o hace falta una cama propia?
