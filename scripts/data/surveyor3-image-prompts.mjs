/**
 * Image prompts for the Surveyor 3 story (one per dossier in misiones/surveyor3/dossiers), written for Google's Nano Banana 2.1 on Replicate in the same house
 * style as the Opportunity and Ingenuity illustrations (STYLE and ENDING are shared with the Ingenuity set, so the whole collection reads as one comic): gritty
 * graphic-novel ink and flat cel-shaded colour, a limited burnt-orange / rust / brown / taupe / cream palette, one warm light source, no text anywhere (the app
 * adds all the text itself). Each prompt was written from the dossier's context and its «ideas visuales»; `scene` carries the event, `composition` the framing.
 * scripts/generate-story-images.mjs glues STYLE + scene + composition + ENDING.
 *
 * Every person is a stylised, anonymous figure (no likenesses of real people); the lander keeps its real silhouette (see LANDER) so the set reads as one story.
 */
import { ENDING, STYLE } from "./ingenuity-image-prompts.mjs";

export { ENDING, STYLE };

/** The vehicle, described the same way in every prompt so that it is recognisable from one image to the next (from the Apollo 12 photos of the real craft). */
const LANDER =
  "Surveyor, a spindly, lightweight robotic lunar lander of bare silvery aluminium: a triangular frame of thin tubes standing on three splayed legs with small round footpads, a tall slender central mast carrying a large rectangular solar panel tilted on top and a small flat square antenna beside it, a boxy white-and-silver thermal compartment on each side of the frame, a small television camera looking up into a tilted mirror, two thin booms with little cone antennas, and a thin pantograph arm with a small scoop folded against the frame";

export const PROMPTS = [
  {
    id: "sur001",
    title: "NASA approves Surveyor and gives it to JPL (spring 1960)",
    scene: `A busy 1960 engineering drafting room at a rocket laboratory, seen late in the day. Four engineers in short-sleeved white shirts and narrow ties bend over a big drafting table covered in blueprints, one of them holding a slide rule, another pointing with a pencil. On a stand at the center of the table sits a hand-made wooden and sheet-metal mock-up of a small spindly lander on three legs, and beside it a smaller mock-up of a satellite meant to circle the Moon, the two sketched as rival ideas. A big plaster model of the Moon with deep craters stands on a shelf behind them. On a chalkboard, two quick chalk silhouettes (a lander and an orbiter) are drawn side by side with arrows between them, and a rough sketch of a tall two-stage rocket. A single hanging desk lamp pours a warm cream-orange cone of light over the table, the blueprints and the little lander mock-up; the rest of the room falls into brown shadow. Mood: ambitious beginnings, an enormous plan taking shape on paper.`,
    composition:
      "Medium-wide shot slightly from above, the drafting table filling the lower two thirds, the wooden lander mock-up glowing at the center of the frame, the engineers' heads and shoulders ringing it, the plaster Moon and the chalkboard as dim shapes in the upper background, black shadows in the corners.",
  },
  {
    id: "sur005",
    title: "The three Ranger probes fail and fears grow for Surveyor (1962)",
    scene: `A dim 1962 space-mission control room, rows of bulky consoles with dials and paper-tape printers, a few engineers slumped in their chairs, one holding his head, another staring at a long strip of printed paper. On the big wall chart in front of them a cartoon Moon is drawn at the center, with three dashed trajectory lines: one sails past the Moon into empty space, one ends in a small impact mark on the far side, one veers off to the side. The three lines are drawn in a rough, hand-inked way and all miss the target. On a shelf in the far corner, half in shadow, a small model of the spindly Surveyor lander sits quietly, as if it were watching. The only glowing warm light comes from a single green-amber console lamp and a slanting beam from a high window, lighting the wall chart and the tired faces. Mood: the sting of repeated failure, heavy silence, doubt about the next machine.`,
    composition:
      "Wide shot from the back of the control room, the engineers as dark silhouettes in the lower third, the big wall chart with the three failed dashed trajectories glowing at the center, the tiny Surveyor model on the shelf in the far lower right corner, deep shadows at the edges.",
  },
  {
    id: "sur008",
    title: "Redesign: Surveyor slims down to about 950 kg with 52 kg of instruments (late 1962)",
    scene: `A hangar-like laboratory where a half-assembled Surveyor lander, ${LANDER}, stands on a huge industrial balance scale, its pans of iron weights tipping heavily to one side. Two technicians in white coats are taking boxy instruments and bundles of cable off the lander and setting them aside on a work cart; a third one holds a clipboard and shakes his head. Through a tall hangar window at the right, the silhouette of a tall, slender, silver-and-black Atlas-Centaur rocket stands on a distant gantry, its top stage faintly glowing, like a stern judge demanding less weight. A single warm sodium floodlight from the ceiling falls on the lander and the scale. Mood: hard compromises, every kilogram counts.`,
    composition:
      "Medium-wide shot from slightly low, the lander on the big scale at the center, the technicians on the left removing instruments, the tall rocket silhouette seen through the window at the upper right, heavy shadows in the corners.",
  },
  {
    id: "sur011",
    title: "Surveyor 1 makes the first US soft landing on the Moon (June 2, 1966)",
    scene: `The last seconds of a lunar landing. Over a dark gray, crater-pocked plain under a pitch-black sky, a Surveyor lander, ${LANDER}, comes down slowly on three small rockets that glow burnt orange at the ends of its frame, the long cone of flame spreading a ring of fine dust that rushes out flat across the ground in every direction in the airless vacuum. One footpad has just touched the soil, the other two are still a hand's breadth above it. A small blue-white crescent Earth hangs low in the black sky above the far horizon. Hard, low sunlight throws long, razor-sharp black shadows of the legs and the mast across the pale gray regolith, and the engine flame is the single glowing warm focal accent. Mood: a held breath, a fragile machine landing on another world for the first time.`,
    composition:
      "Wide low-angle shot at ground level, the lander in the center of the frame just above the soil, the dust ring spreading left and right, the small Earth crescent in the upper right, the flat gray plain and a few boulders in the foreground, deep black sky above.",
  },
  {
    id: "sur015",
    title: "Surveyor 3: the digging arm that cleared the way for Apollo",
    scene: `Surveyor 3 stands in a shallow crater on the pale gray lunar plain, ${LANDER}, but now its thin pantograph arm is stretched out in front of it like a scissor-mechanism, reaching toward the ground, a small box-like scoop at its end pressed into the soil where a short dark trench has been dug, a little pile of loose soil beside it. The television camera on the mast is turned toward the trench, watching it. The sky is pure black with a small blue-white Earth hanging above the horizon. Hard, low sun from the left throws long black shadows of the arm, the legs and the mast across the regolith, the sunlit silver metal and the white thermal boxes glowing warm cream-orange as the single focal accent. A faint ghostly line drawing of a lunar module's leg and footpad hovers in the air above the trench, as if it were already imagining a future landing. Mood: patient test, a robot quietly preparing the ground for humans.`,
    composition:
      "Medium-wide shot from the front-left at a low angle, the lander on the left-center with its arm reaching to the right toward the trench in the lower center, the ghostly leg-and-footpad sketch floating in the upper right, the black sky with the small Earth at the top.",
  },
  {
    id: "sur016",
    title: "The lunar soil holds: like wet sand (April 1967)",
    scene: `A close, dramatic view of the lunar ground. In the foreground, the scoop of the Surveyor arm, a small boxy shovel with a flat footpad on its door, presses down into fine dark gray regolith, leaving a clean, sharp print and a little crumb of soil lifted at the edge. Behind it, the thin tubular pantograph arm rises toward the lander, only partly in frame, its silver tubes catching the light. On the surface, a fresh trench cuts across the picture with crisp, steep, crumbly walls that stand up on their own like damp sand. Beyond it, out of focus, the pale-gray crater slope and the black sky. In the upper right, a faint ghostly outline of an Apollo lunar module's spidery leg and round footpad hovers just above the soil, as if testing whether the ground will carry it. Hard low sunlight rakes across the soil, making every grain cast a tiny black shadow, and the lit edge of the trench glows burnt orange. Mood: quiet relief, the ground is firm enough.`,
    composition:
      "Close-up from low to the ground, the scoop pressing into the soil at the lower center, the crisp trench running diagonally across the middle, the faint ghostly lunar-module footpad in the upper right, the arm rising out of frame at the left.",
  },
  {
    id: "sur022",
    title: "Atlas-Centaur AC-12 lifts off from LC-36B carrying Surveyor 3 (April 17, 1967)",
    scene: `A pre-dawn launch at Cape Canaveral, 1967. A tall, slender, silver-and-black Atlas-Centaur rocket rises from its pad on a roaring column of orange-white flame and billowing smoke, just a few meters off the ground, the steel launch tower and gantry arms falling away behind it, the whole scene lit in warm orange by the fire. Scattered floodlights still glow on the pad, and thick white clouds of exhaust roll out sideways across the flat Florida marsh. In the foreground, silhouetted against the glow, a handful of small figures in short sleeves and a few parked cars watch from a safe distance across a strip of dark water, a long reflection of the flame shimmering in it. The sky above is deep brown-black with a few stars. Mood: tense thrill of the night launch, a small lander riding far above on top of the flame.`,
    composition:
      "Tall vertical wide shot, the rocket rising at the center of the frame with its flame at the bottom third, the gantry on the left, the silhouetted watchers and the water reflection in the lower foreground, the dark starry sky above.",
  },
  {
    id: "sur027",
    title: "Canopus found automatically for the first time (April 17, 1967)",
    scene: `Deep space, the cruise to the Moon. A Surveyor spacecraft, ${LANDER}, travels with its three legs folded up against its body, a large rounded retro rocket motor hanging beneath it, and its solar panel unfolded on the mast like a wing. From the spacecraft, two thin dashed lines like drawn guide lines extend through the black: one to the bright burning Sun at the upper left, a blazing cream-orange disc with a corona, the other to a single very bright warm star at the upper right, Canopus, whose light is pointedly locked at the end of a small round sensor on the craft's frame. A small blue-white Earth sits low behind it with a crescent shape, and the faint curved edge of the Moon far ahead. The craft is lit by the Sun on one side and black on the other, with hard cel-shaded shadows. The single warm light source is the star and the Sun along the dashed lines. Mood: quiet precision, a machine finding its way by the stars.`,
    composition:
      "Wide shot, the folded spacecraft at the center, the Sun in the upper left and the bright star in the upper right joined to it by the two dashed lines, the small Earth in the lower left, the Moon's curve in the lower right, black space with a few small stars around.",
  },
  {
    id: "sur031",
    title: "The radar loses its link in reflections from the terrain (April 20, 1967)",
    scene: `The final seconds above the Moon. Surveyor 3, ${LANDER}, hangs a few meters above a rough crater floor on three downward-pointing rocket plumes of burnt-orange flame, but its radar beams, drawn as thin dashed zigzag lines fanning out beneath it, are bouncing wildly in every direction off a scatter of bright, glittering boulders and angular rocks, ricocheting up and sideways instead of returning cleanly. The boulders glint with sharp cream-white highlights, as if the ground itself were dazzling the machine. The black sky above has a small blue-white Earth. The vacuum flames throw hard orange light up across the legs and the underside of the frame and cast long black shadows across the pale gray rubble. The rocket flames and the ricocheting beams are the single warm focal accent. Mood: a quiet, strange confusion at the worst possible moment.`,
    composition:
      "Medium-wide shot from the ground level beside a big boulder, the lander at the center-upper area of the frame with its flames pointing down, the chaotic dashed radar beams fanning out below it and bouncing off the glittering boulders in the foreground, the small Earth at the top right.",
  },
  {
    id: "sur032",
    title: "The engines do not shut off and the craft bounces twice on the Moon (April 20, 1967)",
    scene: `A comic-style triple exposure of one landing. Over a pale gray, crater-pocked slope on the Moon under a black sky, the same Surveyor lander, ${LANDER}, is drawn three times along a long dotted parabolic arc: first at the left, touching the ground with its engines still blazing orange and a spray of dust; then high in the middle of the arc, a faint translucent ghost with its flame still burning, hanging in the black sky well above the ground; then low on the right, a second ghost arc with a small bounce; and finally, clearly drawn and solid at the far right, resting at an angle inside the small crater, legs splayed, engines silent, a gentle cloud of dust settling around it. Small puffs of dust mark each touch point on the ground, spaced out along the slope. The orange engine flames are the single warm focal accent. Mood: a clumsy, slightly comical, ultimately triumphant landing.`,
    composition:
      "Wide, long horizontal-feeling composition read left to right: first touchdown at the lower left, the high arcing ghost in the upper middle, the lower bounce in the center right, the final resting lander in the lower right, dotted arc lines connecting them, black sky above.",
  },
  {
    id: "sur035",
    title: "The first television pictures from Surveyor 3 (April 20, 1967)",
    scene: `Two worlds in one image, joined by a thin glowing line. In the upper part, on a pale gray lunar plain under a black sky, Surveyor 3, ${LANDER}, stands tilted in its crater with its camera head and tilted mirror turned toward us, a thin dotted line of radio waves leaving its small antenna and arcing up through the sky toward a tiny blue-white Earth. In the lower part, a dark 1960s tracking-station control room: a row of engineers in white shirts crowd close around a big old cathode-ray monitor with a grainy gray picture of a lunar horizon with a few rocks and a patch of the lander's own foot appearing on the screen, scan lines visible, one engineer pointing, another holding a cigarette, a reel-to-reel tape recorder turning behind them. The glow of the monitor is the single warm cream-orange light in the room, lighting the faces. Mood: awe, the first look at a new place, the Moon seen through slow, patient scan lines.`,
    composition:
      "Diagonal-split composition: the lunar scene with the lander and the radio-wave line in the upper left-center, the control room with the glowing monitor and the crowd of engineers in the lower right-center, the dotted radio line sweeping between them, black shadows at the corners.",
  },
  {
    id: "sur038",
    title: "First use of the digging scoop on the Moon (around April 22, 1967)",
    scene: `A low, close, dramatic view from near the ground. The thin pantograph arm of Surveyor 3 swings in from the left, and its small boxy scoop rises in front of us, holding a heap of loose dark gray lunar soil lifted out of a freshly dug trench, offering it up toward the television camera as if showing what it found. Fine grains of soil trickle off the edge of the scoop and drop slowly and straight down in the vacuum. Behind the scoop, out of focus, the lander's silvery legs and mast and its white thermal boxes stand in the crater, and on the ground beside the trench a ruler-like row of small marker stakes casts tiny shadows. A black sky with a little blue-white Earth. Hard low sun comes from the right, giving long black shadows and a warm burnt-orange glow along the lit metal of the arm and the heap of soil. Mood: curious, careful, the first lunar dig.`,
    composition:
      "Low close shot, the scoop with its heap of soil big in the center-right of the frame, the arm entering from the left edge, the trench in the lower foreground, the out-of-focus lander in the background at the left, the black sky and the little Earth at the top.",
  },
  {
    id: "sur040",
    title: "An eclipse of the Sun by the Earth, seen from the Moon (April 24, 1967)",
    scene: `A breathtaking black lunar sky. Over a gray plain lit only by a dim reddish-brown light, the dark disc of the Earth has almost completely covered the Sun, leaving a thin, brilliant ring of glowing burnt-orange and gold light all around the Earth's rim, as if the whole planet were wearing a halo of sunrise and sunset at once. A scatter of sharp small stars surrounds it. In the foreground, the dark silhouette of Surveyor 3, ${LANDER}, stands tilted at an angle in its crater, the television camera head and its mirror pointing straight up at the eclipse, the thin edges of the legs and the mast rimmed in the same warm orange light. The ring of the eclipse is the single glowing warm focal accent. Mood: reverent silence, the strangest sunset in the solar system.`,
    composition:
      "Tall vertical composition, the glowing eclipse ring in the upper center of the frame, the tilted lander silhouette in the lower left looking up at it, the dim gray plain and a few boulders along the bottom edge, black sky with small stars all around.",
  },
  {
    id: "sur045",
    title: "Last contact: a night that never ended (May 4, 1967)",
    scene: `A long lunar night. Surveyor 3, ${LANDER}, stands motionless in the bottom of its small crater in the middle of a vast, dark gray plain, lit only by a faint cold glow from the Earth hanging in the black sky above, its solar panel carefully tilted toward the eastern horizon, where the next sunrise will someday come, its camera mirror still, its scoop arm resting. A million sharp stars fill the black sky, and the Earth hangs as a small blue-white crescent. Far away on the horizon, a thin line of warm burnt-orange light, the first hint of a dawn that is two weeks away, is the single glowing warm focal accent, tinting the very tip of the solar panel. A few frost-like crystals of dust sparkle on the footpads. A faint trail of dotted radio-wave line rises from the antenna toward the Earth, and breaks off halfway, fading into nothing. Mood: stillness, solitude, a machine falling asleep and never waking.`,
    composition:
      "Wide, low, quiet composition, the lander small and alone at the center-left, the Earth crescent in the upper right, the thin warm line of the far-off dawn along the horizon at the right, the broken radio-wave line fading above the antenna, deep black sky filling the upper half.",
  },
  {
    id: "sur048",
    title: "Apollo 12 chooses Site 7 beside Surveyor 3",
    scene: `A smoky 1969 mission-planning conference room, lit by a hanging lamp. A group of men in white shirts and ties sit and stand around a big table covered by a huge detailed map of the Moon's dark plain, with craters drawn in fine contour lines and a few red pins. On one crater at the center of the map, a small hand-made model of the Surveyor lander, ${LANDER}, has been placed on a pin, and a hand, seen only as a sleeve and fingers, is carefully setting a tiny model of an Apollo lunar module just a few centimeters away from it. Some of the men lean forward with serious, doubtful faces, others lean back with crossed arms; one man at the head of the table, seen from the side, holds a pen over a sheet of paper, about to decide. A big slide of the lunar surface on a projection screen behind them shows a small crater with a glinting dot. The single hanging lamp casts a warm cream-orange pool of light over the map, the two little models and the hands. Mood: a daring, argued decision, the heart of a very risky idea.`,
    composition:
      "Medium shot slightly from above across the table, the map and the two little models glowing at the center of the frame, the hand placing the lunar-module model at the right, the men's tense faces ringing the table, the dim projection screen in the upper background.",
  },
  {
    id: "sur054",
    title: "The first precision landing: a view of Surveyor 3 from Intrepid's window (Apollo 12, November 19, 1969)",
    scene: `The view from inside the Apollo 12 lunar module during its descent, seen over a gloved astronaut's shoulder. Through the small, angular triangular window, in a swirling haze of drifting lunar dust, a rough crater slowly comes into view, and perched on its far edge, small and silvery and unmistakable, stands the spindly Surveyor 3 lander, ${LANDER}, waiting there where it has been for more than two years. The astronaut's white-gloved hand grips the window frame and his visor reflects a tiny, bright echo of the lander; the interior around the window is a cramped dark cockpit full of switches, gauges, taped-up notes and a small glowing red-orange instrument panel. Dust streaks past the window in long horizontal ribbons. The sunlit lander and the warm instrument-panel glow are the single focal accents. Mood: stunned recognition, the target hitting the bullseye.`,
    composition:
      "Over-the-shoulder shot from inside the cockpit, the astronaut's helmeted head on the left, the triangular window filling the center-right with the crater and the tiny Surveyor lander on its far rim, dust ribbons across the glass, dark instruments framing the bottom and the edges.",
  },
  {
    id: "sur055",
    title: "Conrad and Bean cut parts off Surveyor 3 (Apollo 12, EVA-2, November 20, 1969)",
    scene: `Two astronauts in bulky white spacesuits with gold-mirrored visors and backpacks stand beside Surveyor 3, ${LANDER}, tilted in its shallow crater on a gray slope, its silver metal now dust-stained and slightly tan. One astronaut, seen from the side, reaches up with a long-handled pair of bolt cutters to snip the television camera off the mast; the other stands a few steps behind with a camera in hand, photographing him. Their long black shadows lean across the gray soil, and their boot prints and a few tools lie scattered around. Far in the background, on the horizon of a rolling lunar plain under a black sky, a tiny spidery Apollo lunar module sits alone. The sunlit gold visors and the lit silver of the lander are the single warm focal accent. Mood: playful, careful, two humans visiting an old robot like a friend.`,
    composition:
      "Medium-wide shot from the side, the lander on the right with the astronaut at the camera cutting it, the second astronaut on the left with the camera, long shadows stretching toward the viewer, the tiny lunar module far in the upper left, black sky above.",
  },
  {
    id: "sur059",
    title: "Streptococcus mitis in Surveyor 3's camera: a finding (1970) and its refutation (2011)",
    scene: `A quiet 1970 microbiology laboratory at night, under a green-shaded bench lamp. At the center of a long stainless-steel bench, the retrieved Surveyor 3 television camera, a small cylindrical metal body with its lens and a tilted mirror, now dull and slightly tan with lunar dust, sits on a clean sheet of paper next to a pair of tweezers and a scrap of its gray foam padding. A technician in a white lab coat and a surgical mask, seen from the side, bends over a microscope, one hand adjusting the focus, the other holding a glowing round petri dish. Floating in the warm light just above the dish, like a hand-drawn thought bubble, a faint translucent drawing of a small colony of round bacteria, tiny spheres joined in chains, glows. A shelf of glass flasks and a notebook fill the background. The lamp's warm glow on the dish and the microscope is the single focal accent. Mood: curiosity and doubt, a tiny hitchhiker, or a trick of the lab.`,
    composition:
      "Medium shot from the front-left of the bench, the camera on the paper in the lower left, the technician at the microscope on the right, the glowing petri dish with the floating bacteria drawing at the center, flasks and shelves dissolving into shadow behind.",
  },
  {
    id: "sur064",
    title: "The camera survived 31 months on the Moon with almost no failures (analysis, 1972)",
    scene: `A clean laboratory at an aerospace company, early 1970s. On a padded workbench, the Surveyor 3 television camera sits under a bright inspection lamp, a small cylindrical metal body with its two lenses and a tilted mirror, its once-white surfaces now a warm tan, as if sunburned. Two engineers in white coats and caps lean over it, one with a magnifying loupe held to his eye, the other holding the mirror up to the light and tracing a delicate pattern of concentric rippling rings across its surface, an optical interference pattern drawn as thin warm bands like the rings on a tree. A big cutaway drawing of the camera is pinned to a corkboard behind them, and a row of small labelled jars of dust and parts sits on a shelf. A single desk lamp is the warm cream-orange light, glowing on the tan metal, the mirror and the engineers' faces. Mood: proud, careful detective work, a small robot eye that came home tougher than expected.`,
    composition:
      "Medium-close shot from the front of the bench, the tan camera at the center of the frame under the lamp, the two engineers leaning in from the left and right, the mirror with its ring pattern in the lower right, the corkboard drawing and the shelf of jars fading into shadow behind.",
  },
  {
    id: "sur066",
    title: "LRO photographs Surveyor 3 and the Apollo 12 site (September 2009)",
    scene: `High above the Moon, a small modern orbiter with a boxy body, a pair of folded-out solar panels, a round dish antenna on a boom and a long camera barrel pointed straight down floats alone in the black sky, a thin thread of reflected sunlight along its edges. Far below it, a gray, crater-pocked lunar plain unrolls toward a curved horizon. In the center of the plain, a small, sharp-rimmed crater holds three tiny things: a spidery silhouette of a lander (Surveyor 3), a little distance away the squat descent stage of an Apollo lunar module with a pale scorched halo around it where its exhaust brushed the soil, and between and around them a delicate web of very thin lines of footprints, drawn like threads across the dust. A beam of warm cream-orange light, like a scanning searchlight, streams from the orbiter's camera down to the crater, the single glowing warm focal accent. A tiny blue-white Earth hangs in the upper right. Mood: time travel, humanity's footprints still intact after forty years.`,
    composition:
      "Tall vertical wide shot, the orbiter small in the upper center, the warm scanning beam running down to the crater at the lower center, the web of footprints and the three tiny objects drawn in clear detail in the crater, the curved horizon and the small Earth at the upper right, black sky.",
  },
];
