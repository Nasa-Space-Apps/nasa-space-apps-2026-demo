import type { Checkpoint } from "./checkpoints";

/**
 * FICTIONAL stories for the vehicles added to try their 3D models (Spirit, InSight, Beagle 2, Surveyor 3; Ingenuity now has its real story, lib/story.ts): invented places, dates and figures,
 * laid out on the Mars terrains we already have. Every checkpoint is `demo: true`:
 *  - no audio is recorded for them: `audio` points to a clip of ANOTHER checkpoint (placeholder, the subtitle text does not match what is said);
 *  - the voice guide stays silent about them (no `next-` / `remind-` lines exist);
 *  - they are NOT in `ALL_CHECKPOINTS`, so `npm run narration` / `npm run guide` never touch them (they would overwrite the shared clips).
 * Photos: real NASA / Wikimedia pictures of the vehicle (or its tests / replica); the `credit` says what each one really shows.
 * Documented in docs/history.md (hito 28) and docs/assets.md.
 */

export const SPIRIT_CHECKPOINTS: Checkpoint[] = [
  {
    id: "spirit-touchdown",
    name: "Touchdown Plain",
    place: "Sol 0 · Fiction",
    x: -281,
    z: -153,
    demo: true,
    image: "/images/checkpoints/mars-landing.jpg",
    credit: "NASA/JPL/MSSS · PIA05251 (a Mars landing ellipse)",
    text: "Where the demo story begins. In this fictional version Spirit lands on a wide plain after seven months in flight. Every place, date and figure on this route is invented for the demo.",
    narration:
      "Sol zero. After seven months in flight, Spirit drops onto a wide, empty plain. In this story, nothing here has a name yet. The team will give one to every rock the rover reaches, and the first one is already waiting.",
    audio: "/narration/landing.mp3",
    facts: [
      ["Story", "Fictional"],
      ["Site", "Touchdown Plain"],
      ["Planned life", "90 sols"],
    ],
  },
  {
    id: "spirit-five-wheels",
    name: "Five-Wheel Drive",
    place: "Sol 52 · Fiction",
    x: -229,
    z: -31,
    via: [[-287, -123]],
    demo: true,
    image: "/images/checkpoints/mars-spirit-wheel.jpg",
    credit: "NASA/JPL-Caltech · PIA06685 (a rover test at JPL)",
    text: "A wheel locks up, and the rover learns to drag it. In this story Spirit keeps going on five wheels, scraping the soil as it goes. The photo shows an engineering test of a rover on five wheels.",
    narration:
      "Sol fifty-two. The front right wheel seizes. Instead of stopping, Spirit turns around and drives backwards, dragging the dead wheel like a plow. The scar it leaves in the soil is deep, and it will turn out to be the best tool on board.",
    audio: "/narration/eagle.mp3",
    facts: [
      ["Wheels working", "5 of 6"],
      ["Cause", "Seized motor"],
      ["Driving", "Backwards"],
    ],
  },
  {
    id: "spirit-cinder-ridge",
    name: "Cinder Ridge",
    place: "Sol 310 · Fiction",
    x: -177,
    z: -1,
    via: [[-197, -31]],
    demo: true,
    image: "/images/checkpoints/mars-spirit-ridge.jpg",
    credit: "NASA/JPL-Caltech · PIA16442 (Spirit's own deck, seen in a round panorama)",
    text: "A long climb to a ridge, with the solar panels tilted towards the winter sun. The photo is a round panorama that shows Spirit's own deck from above.",
    narration:
      "Sol three hundred ten. Spirit climbs a long slope to Cinder Ridge, tilting its solar panels towards a low winter sun. From the top, the whole plain lies below, and the tracks of its five wheels run back to the horizon.",
    audio: "/narration/endurance.mp3",
    facts: [
      ["Climb", "+40 m"],
      ["Slope", "Up to 20°"],
      ["Power", "Panels tilted"],
    ],
  },
  {
    id: "spirit-home-basin",
    name: "Home Basin",
    place: "Sol 760 · Fiction",
    x: -31,
    z: 97,
    via: [[-139, 5]],
    demo: true,
    image: "/images/checkpoints/mars-spirit-basin.jpg",
    credit: "NASA/JPL-Caltech · PIA11804 (Spirit beside a rocky plateau, black and white)",
    text: "A flat plateau of layered rock where the story finds its answer: hot water once flowed here. The photo shows the rover's mast and deck beside rocky ground.",
    narration:
      "Sol seven hundred sixty. On a flat plateau of layered rock, the wheel scar uncovers bright, pale soil. It is the signature of hot water, and it means this basin was once a place where life could have started.",
    audio: "/narration/victoria.mp3",
    facts: [
      ["Rock", "Layered"],
      ["Water", "Hot springs"],
      ["Stay", "40 sols"],
    ],
  },
  {
    id: "spirit-last-dune",
    name: "Last Dune",
    place: "Sol 1400 · Fiction ending",
    x: 81,
    z: 125,
    via: [[25, 89]],
    demo: true,
    image: "/images/checkpoints/mars-spirit-sand.jpg",
    credit: "NASA/JPL-Caltech · PIA12352 (a sandbox rehearsal at JPL)",
    text: "The demo ending. Spirit sinks into soft sand, and the team spends months trying to free it before winter. The photo shows a rehearsal in a sandbox on Earth.",
    narration:
      "Sol fourteen hundred. A hidden pocket of soft sand swallows the wheels, and Spirit sinks. The team rehearses an escape for months in a sandbox on Earth, but winter arrives first. In this story, the rover goes quiet here.",
    audio: "/narration/perseverance.mp3",
    facts: [
      ["Status", "Stuck"],
      ["Ending", "Fictional"],
      ["Last signal", "Sol 1400"],
    ],
  },
];

export const INSIGHT_CHECKPOINTS: Checkpoint[] = [
  {
    id: "insight-lander-flats",
    name: "Lander Flats",
    place: "Sol 0 · Fiction",
    x: 307,
    z: -167,
    demo: true,
    image: "/images/checkpoints/mars-insight-lander.jpg",
    credit: "NASA/JPL-Caltech · PIA19664 (the real lander in a clean room, on Earth)",
    text: "The demo starts on a smooth plain. This fictional InSight has a wheel under each of its three legs, so it can roll from place to place; the real one never moved.",
    narration:
      "Sol zero. A lander settles on a smooth plain and spreads its two round solar arrays like wings. This one is a fiction: it has a wheel under each leg, so it can roll. Its job is not to drive, but to listen.",
    audio: "/narration/jezero-landing.mp3",
    facts: [
      ["Story", "Fictional"],
      ["Legs", "3, on wheels"],
      ["Solar arrays", "2"],
    ],
  },
  {
    id: "insight-arm-test",
    name: "Arm Test Site",
    place: "Sol 24 · Fiction",
    x: 241,
    z: -107,
    demo: true,
    image: "/images/checkpoints/mars-insight-arm.jpg",
    credit: "NASA/JPL-Caltech · PIA22952 (an engineer testing the arm on Earth)",
    text: "The robotic arm picks up a seismometer and sets it on the ground. The photo shows an engineer testing the real arm in a lab.",
    narration:
      "Sol twenty-four. The robotic arm unfolds, lifts a dome-shaped seismometer from the deck, and sets it gently on the ground, level to within a degree. From now on, this patch of Mars is the most carefully placed ear on the planet.",
    audio: "/narration/eagle.mp3",
    facts: [
      ["Tool", "Robotic arm"],
      ["Placed", "Seismometer"],
      ["Level", "Within 1°"],
    ],
  },
  {
    id: "insight-quiet-basin",
    name: "Quiet Basin",
    place: "Sol 120 · Fiction",
    x: 261,
    z: 15,
    via: [[221, -53], [243, -29], [235, 1]],
    demo: true,
    image: "/images/checkpoints/mars-insight-panels.jpg",
    credit: "NASA/JPL-Caltech · PIA22201 (a solar array test on Earth)",
    text: "The seismometer listens. In this story the first quakes rumble through a quiet basin. The photo shows a solar array being tested on Earth.",
    narration:
      "Sol one hundred twenty. In a silent basin, the seismometer hears a faint rumble: the planet itself trembling. Each quake is a flashlight pointed through the rock, and slowly the layers inside Mars take shape.",
    audio: "/narration/endurance.mp3",
    facts: [
      ["Listening", "Day and night"],
      ["Quakes heard", "12"],
      ["Depth", "Crust to core"],
    ],
  },
  {
    id: "insight-selfie-rise",
    name: "Selfie Rise",
    place: "Sol 700 · Fiction",
    x: 297,
    z: 75,
    demo: true,
    image: "/images/checkpoints/mars-insight-selfie.jpg",
    credit: "NASA/JPL-Caltech · PIA22876 (a stitched selfie of the real lander)",
    text: "The lander climbs a low rise and takes a picture of itself, panels spread wide. The photo is a stitched selfie of the real lander.",
    narration:
      "Sol seven hundred. From a low rise, the lander lifts its arm and takes a picture of itself: dozens of frames stitched together, panels spread wide, the gray plain all around. The arrays still shine clean and dark.",
    audio: "/narration/victoria.mp3",
    facts: [
      ["Photos", "Stitched"],
      ["Panels", "Clean"],
      ["Dust", "Light"],
    ],
  },
  {
    id: "insight-dusty-end",
    name: "Dusty End",
    place: "Sol 1400 · Fiction ending",
    x: 293,
    z: 169,
    via: [[315, 111]],
    demo: true,
    image: "/images/checkpoints/mars-insight-dusty.jpg",
    credit: "NASA/JPL-Caltech · PIA23203 (a dusty selfie of the real lander)",
    text: "The demo ending. Dust covers the panels, the power fades and the lander goes quiet. The photo is a dusty selfie of the real lander.",
    narration:
      "Sol fourteen hundred. Fine red dust has settled on the solar arrays, and each day the lander makes a little less power. It takes one last picture, switches off its instruments one by one, and listens in silence. In this story, it never wakes again.",
    audio: "/narration/last-sol.mp3",
    facts: [
      ["Status", "Out of power"],
      ["Ending", "Fictional"],
      ["Dust", "Thick"],
    ],
  },
];

export const BEAGLE2_CHECKPOINTS: Checkpoint[] = [
  {
    id: "beagle2-release",
    name: "Release Orbit",
    place: "Day 1 · Fiction",
    x: -37,
    z: -125,
    demo: true,
    image: "/images/checkpoints/mars-beagle-museum.jpg",
    credit: "gocarts · CC BY 2.0 · Wikimedia Commons (a full-size replica)",
    text: "The demo story starts where the lander opens. This fictional Beagle 2 unfolds on schedule and, unlike the real one, carries a small wheeled base. The photo shows a full-size replica.",
    narration:
      "Day one. A round lander lands on a flat plain and opens like a flower: a gold lid, then four dark solar petals, one by one. In this story, every one of them opens on schedule, and a small wheeled base lifts the whole flower off the ground.",
    audio: "/narration/landing.mp3",
    facts: [
      ["Story", "Fictional"],
      ["Panels", "4"],
      ["Lid", "Gold"],
    ],
  },
  {
    id: "beagle2-first-whisper",
    name: "First Whisper",
    place: "Day 2 · Fiction",
    x: 15,
    z: -19,
    via: [[7, -81]],
    demo: true,
    image: "/images/checkpoints/mars-beagle-leicester.jpg",
    credit: "Gavin Stewart · CC BY 2.0 · Wikimedia Commons (a replica)",
    text: "In this story the lander calls home on the first pass: a short tune, then silence. The photo shows a replica.",
    narration:
      "Day two. On the first pass of the orbiter, the lander sends home a short tune of a few notes: its call sign. The control room in a small English town falls silent, then bursts into applause. It is alive, and it is on the move.",
    audio: "/narration/eagle.mp3",
    facts: [
      ["Signal", "A short tune"],
      ["Pass", "Day 2"],
      ["Echo", "Heard"],
    ],
  },
  {
    id: "beagle2-soil-run",
    name: "Soil Run",
    place: "Day 9 · Fiction",
    x: 71,
    z: 31,
    via: [[25, 17]],
    demo: true,
    image: "/images/checkpoints/mars-beagle-spaceport.jpg",
    credit: "Mike Peel (mikepeel.net) · CC BY-SA 4.0 · Wikimedia Commons (a replica on display)",
    text: "The folded arm unfolds over the ground and the probe reaches for a sample. The photo shows a replica in a Martian-style display.",
    narration:
      "Day nine. The folded arm reaches over the ground and presses a small probe into the soil. A tiny oven bakes the sample and an instrument sniffs the gas that comes out, looking for the chemical signature of life.",
    audio: "/narration/endurance.mp3",
    facts: [
      ["Arm reach", "~1 m"],
      ["Sample", "Soil"],
      ["Looking for", "Chemistry of life"],
    ],
  },
  {
    id: "beagle2-rock-garden",
    name: "Rock Garden",
    place: "Day 20 · Fiction",
    x: 143,
    z: 33,
    via: [[97, 15]],
    demo: true,
    image: "/images/checkpoints/mars-beagle-replica.jpg",
    credit: "user:geni · CC BY-SA 4.0 · Wikimedia Commons (a replica)",
    text: "Rolling on its small base, the lander crosses a field of low rocks to a new spot. The photo shows the replica with its petals open.",
    narration:
      "Day twenty. Rolling slowly on its small base, the lander crosses a garden of low rocks to reach a fresh patch of ground. Its petals stay open to the sun the whole way, and every night it sends home a new set of pictures.",
    audio: "/narration/victoria.mp3",
    facts: [
      ["Distance", "90 m"],
      ["Terrain", "Rocky"],
      ["Panels", "Open"],
    ],
  },
  {
    id: "beagle2-petal-bloom",
    name: "Petal Bloom",
    place: "Day 68 · Fiction ending",
    x: 255,
    z: -35,
    via: [[167, -5], [231, -41]],
    demo: true,
    image: "/images/checkpoints/mars-beagle-petals.jpg",
    credit: "Neil Owen · CC BY-SA 2.0 · geograph via Wikimedia Commons (a full-size replica)",
    text: "The demo ending. The lander spreads all its petals under the evening sun, sends a last tune and rests. The photo shows a full-size replica with every petal open.",
    narration:
      "Day sixty-eight. Under a low evening sun, the lander spreads every petal wide, sends one last tune, and rests. In this story, it worked for much longer than anyone planned. The ending is fiction; the real Beagle 2 never opened all its panels.",
    audio: "/narration/last-sol.mp3",
    facts: [
      ["Status", "Resting"],
      ["Ending", "Fictional"],
      ["Panels", "All open"],
    ],
  },
];

/**
 * Surveyor 3 (3D model first, its real story is still to come): two PLACEHOLDER stops on the Moon terrain, just enough for the scene to have a route.
 * Text, photos and figures are invented or borrowed (the pictures and clips are those of the SEV story); nothing here is real information.
 */
export const SURVEYOR3_CHECKPOINTS: Checkpoint[] = [
  {
    id: "surveyor3-landing",
    name: "Placeholder: landing",
    place: "Placeholder · Fiction",
    x: 55,
    z: -60,
    demo: true,
    image: "/images/checkpoints/moon-landing.jpg",
    credit: "Placeholder picture (SEV story)",
    text: "Placeholder stop: the real story of Surveyor 3 is not written yet. This card only exists so that the 3D scene has a route to drive on.",
    narration: "Placeholder. The real story of this lander is still to come.",
    audio: "/narration/landing-zone.mp3",
    facts: [
      ["Story", "Placeholder"],
      ["Ending", "Fictional"],
    ],
  },
  {
    id: "surveyor3-crater",
    name: "Placeholder: crater",
    place: "Placeholder · Fiction",
    x: -30,
    z: -30,
    via: [[0, -20]],
    demo: true,
    image: "/images/checkpoints/moon-antares.jpg",
    credit: "Placeholder picture (SEV story)",
    text: "Placeholder stop: invented text, borrowed picture. It marks the end of the demo route.",
    narration: "Placeholder. The real story of this lander is still to come.",
    audio: "/narration/antares.mp3",
    facts: [
      ["Story", "Placeholder"],
      ["Ending", "Fictional"],
    ],
  },
];
