# Game design: "Left behind" (from the design table to the last signal)

> **Status:** the **Story mode is implemented** for six vehicles (Opportunity, Spirit, Ingenuity, InSight, Beagle 2 and Surveyor 3): see [story.md](story.md). What is **still not built is the Decisions mode** described below. The backbone already exists in `public/models/<mission>/story.json`, and the decisions of Opportunity are defined and verified in `story/data/juego2_opportunity.json` (see [`story/README.md`](../story/README.md)). Items marked **(proposed)** were added when the idea was polished and are pending validation with the owner and their teammate.

## 1. The shift

The project stopped being an **informative platform** (a globe, several vehicles, invented checkpoint texts) and became a **game** with two modes — **Story** (informative) and **Decisions** (learn from the mistake) — that tells the **whole life of a mission**: planning, construction, launch, landing and the years on the surface, with **real, verified data**. It has two parts: **Part 1 "Earth"** (a 2D comic with a voice, until landing) and **Part 2 "Mars"** (the 3D). What does **not** change: the flat "Ink & Paper" theme ([design.md](design.md)), the English interface and audio, pre-recorded audio (no API at run time), subtitles for everything a voice says, honesty real/fictional, smooth motion, performance (`PERF`).

## 2. Concept in one sentence

Live the real story of a vehicle — from the decision to build it to its last signal — as a tale (**Story**) or as a series of **decisions** by the mission team where choosing badly ends in a failure that teaches you why the real choice was made (**Decisions**).

## 3. Structure: 2 modes × 2 parts

| | **Part 1 · "Earth"** (2D) | **Part 2 · "Mars"** (3D) |
| --- | --- | --- |
| Covers | Planning → design/construction → tests → launch → cruise → landing | Landing → route → the end |
| Format | **Comic**: panels with illustrations + voice narration + subtitles | The 3D scene: procedural vehicle, fixed route, beacons, card, narration (**exists**) |
| Advance | Click / `Space` moves to the next panel (the voice starts by itself) | `Space` held + timeline |
| **Story mode** | All the panels in order, informative only | All the checkpoints in order, informative only |
| **Decisions mode** | The same panels, but at some nodes **you choose** | The same checkpoints, but at some nodes **you choose** |

The transition Part 1 → Part 2 is the landing: the last panel dissolves into the field and the 3D scene comes in from it (the same fade mechanism as `Loading.tsx`).

## 4. The backbone: a single line of nodes

Both modes share **one ordered list of nodes** ("beats"). The Decisions mode is not other content: it is the same story with some nodes turned into decisions.

- A **`story`** node: a panel (Part 1) or a checkpoint (Part 2) with its text, facts, illustration and narration.
- A **`decision`** node: before telling what really happened, it poses the situation and **2–3 options**. **Exactly one is the real one** (what the team did); its result **is the next `story` node**, so choosing well = following the real story.
- The **non-real** options open an **alternative branch**: 1–3 short nodes that show how the bad decision unfolds and end in a **failure**.
- In **Story mode** the `decision` nodes show as a normal narrative ("the team decided X because Y"), reusing the content of the real option.

Conceptual schema (orientative types; **not** to be created yet):

```ts
type Part = "earth" | "mars";
type Beat = {
  id: string; part: Part;
  // real (verified) content: date, sol, place, facts, image + credit, voice script
  kind: "story" | "decision";
  decision?: {
    prompt: string;                 // the situation, in English, without giving the answer
    options: {
      id: string; label: string;
      real: boolean;                // exactly one
      branch?: Beat[];              // 1–3 nodes of the alternative branch (only if !real)
      failure?: Failure;            // where that branch ends (only if !real)
    }[];
  };
};
type Failure = {
  id: string; title: string;
  cause: string;                    // what went wrong, in one sentence
  realOutcome: string;              // what the team really did and why
  scene?: "mars-stuck" | /* … */;   // 3D animation (Part 2); in Part 1, a final panel
};
```

## 5. Story mode (informative and attractive)

A linear experience with no failures or decisions. Goal: that the viewer **understands and remembers** the vehicle's whole journey. Part 1: a narrated comic. Part 2: the 3D route with real checkpoints. At the end, a closing screen with the real ending and an invitation to try the Decisions mode.

## 6. Decisions mode (learn from the mistake)

Rules **(proposed)**:

1. **All the bad decisions converge on a mission failure** (asked by the owner), and the failure **teaches**: it is never a mute "game over".
2. **Anatomy of a failure**: (a) the alternative branch (1–3 nodes), (b) the failure scene (a final panel in Part 1; a **3D animation** in Part 2: stuck vehicle, tilted, out of power…), (c) a **"What really happened"** card: the cause of the failure, what the team really did and why, with a real photo/fact, (d) a button to **go back to the decision** (rewind to the node) and choose again.
3. **Options must be plausible**: the ones really debated or the reasonable alternatives of the time, not obvious traps. The correct one is not always in the same position.
4. **No timer**: it is a game to learn, not of reflexes.
5. **Short branches**: content cost (illustration, audio, animation) grows with every branch; at most 3 nodes per alternative branch.
6. **Number of decisions**: 3–4 per part (6–8 in total) as an initial goal; not every node is a decision, only the ones that had a real fork.
7. **Ending**: "failure" = mission ended **before** the real end. The real end is the canonical, bittersweet outcome: winning is reaching it.
8. Minimal tracking: at the end a summary "you matched history on N of M decisions" with what was learned; no score or ranking for now.

**Content cost arithmetic** (from the verified game v2): with a cap of 30 nodes and 2 fictional nodes per wrong option, 30 nodes = 18 real + 12 fictional (6 decisions × 1 wrong option × 2 levels). A decision with 3 options would not fit.

## 7. Part 1 — "Earth" (2D comic)

- **Format**: one panel per screen (full screen or editorial composition), image + title/date/place + the voice's subtitle. The voice starts by itself; `Space`/click advances; arrows or click go back.
- **Voice**: the story narrator (Bill) for all nodes; subtitles with `lib/transcript.ts` (only the audio is requested).
- **Images**: AI illustrations in the style of the comic reference (ink + cream, thick frames, blobs, grain); real NASA photos are reserved for the "What really happened" card and the credits, so illustrated and real are told apart.
- **Contents**: see the "intro" beats of each `story.json` (the idea, the decision, the launch, the landing).

## 8. Part 2 — "Mars" (3D)

- **Already exists**: terrain, procedural vehicle, route with `Space` and a timeline, beacons, card, narration, voice guide, minimap, music; the checkpoints are the real events of the story.
- **Decisions in 3D**: on reaching a `decision` node the decision card is shown (instead of the informative one); the chosen option decides the **route** the vehicle takes (the real one or an alternative with other `via`).
- **Failures in 3D** (an animation over the scene, no change of screen): the vehicle carries out the consequence and the camera stays on it; then the "What really happened" card appears. Candidates **(proposed, to verify)**: getting stuck in a dune (Purgatory Dune was a real near-failure, sol ~446–484), tilting/sliding on entering a crater by too hard a slope, running out of power in the storm. Each failure scene is a small reusable animation (sink the wheels, tilt the body, switch off the lights, fade).

## 9. Impact on the code (reference, not implemented yet)

| Piece | Destination |
| --- | --- |
| 3D scene, route, checkpoints, minimap, narration, guide, ambient, captions, loading, `perf`, theme | **Reused** (Part 2) |
| The globe (`Explore`, `Globe`, `VehicleCard`, `bodies.ts`) and `/[body]` routes | Kept as the **menu before the game** (how the mode — Story / Decisions — is chosen from the vehicle's card is still open) |
| New: the decision card, the "What really happened" card, the game state (mode, node, branch), 3D failure scenes, navigation between parts | **To build** |
| Audio: Part 1 narration + alternative branches + guide phrases of the Decisions mode | **To record** (it costs credits; each alternative branch adds) |
| Routes | **(proposed)** `/play/story` and `/play/decisions` with `?part=` or their own segments; until decided, do not touch the current routing |

`game.ts` stays the scene's mutable state; the game state (mode, node, branch, decisions taken) can live apart (an external store like `narration.ts`/`guide.ts`), with no per-frame renders.

## 10. Suggested phases (proposed)

1. **Data**: research and verify the real events (done: [research-pipeline.md](research-pipeline.md)); fix the node list and mark which are decisions (done for Opportunity: `story/data/juego2_opportunity.json`).
2. **Schema and content in English**: the nodes, options and failures (text and voice script).
3. **Story mode** — done.
4. **Decisions mode**: the decision card, branches, "What really happened", rewind; first in Part 1 (cheaper: panels), then in Part 2 (alternative routes + failure animations).
5. Polish: the start screen with the mode choice, closing, summary, accessibility, performance.

## 11. Honesty and data

- Everything real carries its source/credit; data are verified before publishing (the opposite goes against product principle 5, see [`PRODUCT.md`](../PRODUCT.md)).
- **Alternative branches are counterfactual**: labelled as such ("What if…") and their failures rest on real risks the team faced, never on invented facts presented as history. The real ending and real cases (e.g. the Purgatory Dune entrapment) are not altered: what is fictional is **what would have happened** had another option been chosen, and it must be distinguishable at a glance.

## 12. Open questions

1. **Entry**: how the mode (Story / Decisions) is chosen from the vehicle's card.
2. **Target duration** (provisional): Story ≈ 6–8 min; Decisions ≈ 8–12 min with failures of ~1 min each. Valid for a jury demo?
3. **Summary/score** at the end of Decisions: only "you learned X" or also a hit count?
4. **Retry after a failure**: back to the same decision (proposed) or restart the part?
5. **Part 1 and Decisions**: can a choice in Part 1 affect Part 2, or are they independent (proposed: independent, each failure ends the game)?
6. **Name/title**: "Left behind" was the title of the "abandoned" approach; is it kept? (It is, for now.)
7. **Music**: do the current beds (`moon`/`mars`/`timeline`) suffice for Part 1 or does it need its own?
