# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, `cacheComponents`) + React + three.js / React Three Fiber + Tailwind. Existing code; the stack does not change.

## Users

The primary audience is **school-age space enthusiasts (secondary school, ~17 years old)** and casual learners, on a laptop (mouse and keyboard) or a phone/tablet (touch). The demo is also watched by a hackathon jury on a laptop or a projector. A curious person with no technical background who wants to understand, in seconds, what happened to an abandoned space vehicle.

## Product Purpose

**Left Behind** is a **game of stories** about the robotic explorers NASA left on Mars and the Moon, built for the NASA Space Apps 2026 challenge "Abandoned but not Forgotten". It tells the whole life of a mission — from the planning and construction decisions to its last signal — with two modes:

- **Story** (informative and attractive — **implemented for six vehicles**: Opportunity, Spirit, Ingenuity, Surveyor 3, InSight and Beagle 2): **Part 1** (until landing) is a 2D comic with illustrations and a voice; **Part 2** is the 3D route with real, sourced checkpoints and narration.
- **Decisions** (learn from the mistake — **designed, not implemented**): the same points of the story, but some are **choices** by the mission team. Choosing what the real history did not do leads to a **mission failure** (a scene or animation included) that explains what really happened and why.

Success = the viewer remembers how the vehicle got to its world and why it ended where it did (e.g. why Opportunity lasted 14 years instead of 90 days), feels a personal connection with it and, in the Decisions mode, understands a real risk by getting it wrong. Full definition: `docs/game-design.md`; what is built: `docs/story.md`.

## Positioning

It is not a mission-data viewer nor a driving simulator: it is an **interactive story** about real missions, told with illustrations, voice and the vehicle's own 3D terrain (the route is fixed; there is no free driving). A **globe** is the menu: each abandoned site has its vehicle; vehicles without a story yet say "coming soon". The platform is meant to grow over time with more vehicles, more art and more interaction.

## Operating Context

- Entry: the home (`/`) → the globe (`/mars`, `/moon`) → a vehicle's card → "Travel to the past" → the story (comic → 3D → comic) at `/<world>/<vehicle>`.
- 3D: `Space` held advances to the next checkpoint; the timeline lets you travel forward or backward; `N` narration, `G` voice guide, `S` music. Stationary vehicles (InSight, Beagle 2, Surveyor 3): `Space` goes to the next moment. On touch screens: on-screen buttons.
- It works live with no keys or network: narration, guide and music are pre-recorded mp3s.
- **Responsive:** phone, sideways phone, tablet and desktop.

## Capabilities and Constraints

- The interface and audio are in **English**; the documentation is in English.
- Procedural 3-tone vehicles (`src/lib/vehicles.ts`); no GLBs.
- Illustrations are **AI-generated** and always labelled so; they are not photos. The terrains are scale models: the stops are not real places.
- Shared scene ⇄ DOM state in the mutable object `src/lib/game.ts` (no per-frame re-renders).
- The vehicles do not have real scale yet (pending, documented in `docs/roadmap.md`).
- Every fact comes from research dossiers with literal quotes checked by code (`misiones/<mission>/dossiers`); the information was audited (`docs/audit.md`).
- In the Decisions mode, the alternative branches are **counterfactual** and are labelled as such ("What if…"); they are never presented as history.
- SEV (coming soon) has no historical relation to Apollo 14: its ending is fictional and is labelled so. Beagle 2 is a British/ESA lander, told because NASA's HiRISE found it.

## Brand Commitments

- **Flat design** as a rule of the whole demo: no shadows, glows or gradients (only the static grain of the field).
- **Visual reference fixed by the owner: ponpon-mania.com/chapter/2** (an interactive comic: a grainy field, cream paper pages with a thick ink stroke, one accent, Libre Franklin in bold lowercase). The "Ink & Paper" theme is the only one, with a **palette per world** (terracotta + butter on Mars, steel blue + mint on the Moon) and the home's own periwinkle; see `docs/design.md`.
- Smooth motion everywhere: no abrupt transitions.

## Evidence on Hand

- 120 AI illustrations (20 per story), 120 narrations and 30 voice-guide phrases (`public/models/<mission>/…`, `public/guide`).
- 6 stories × 20 real events with sources in each `story.json`; 140 research dossiers (30 for Opportunity, 20 for each other mission).
- No testimonials, metrics or commercial claims: do not invent them.

## Product Principles

1. Tell a story, do not show data: every screen serves the vehicle's journey.
1b. Being wrong teaches: every failure of the Decisions mode explains the real cause and lets you choose again; never a mute "game over".
2. The essentials first: the viewer understands what to do (Space, the timeline) without reading instructions.
3. Flat and clean: colour and shape instead of shadow and glow.
4. All motion is smooth and has a purpose; nothing jumps or cuts.
5. Honesty: what is real is labelled real and what is fictional or AI-made is labelled so.

## Accessibility & Inclusion

- Readable contrast on light backgrounds; respect `prefers-reduced-motion` in the UI animations.
- Everything a voice says has a subtitle.
- UI buttons must not be activated with `Space` when advancing (they are `blur()`ed after a click).
- Touch targets ≥ 44 px on touch screens.
