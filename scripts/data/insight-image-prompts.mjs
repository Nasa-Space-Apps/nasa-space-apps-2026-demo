/**
 * Image prompts for the InSight story (one per dossier in misiones/insight/dossiers), written for Google's Nano Banana 2.1 on Replicate in the same house
 * style as the Opportunity, Ingenuity, Surveyor 3 and Spirit illustrations (STYLE and ENDING are shared with the Ingenuity set, so the whole collection reads as
 * one comic): gritty graphic-novel ink and flat cel-shaded colour, a limited burnt-orange / rust / brown / taupe / cream palette, one warm light source, no text
 * anywhere (the app adds all the text itself). Each prompt was written from the dossier's context and its «ideas visuales»; `scene` carries the event,
 * `composition` the framing. scripts/generate-story-images.mjs glues STYLE + scene + composition + ENDING.
 *
 * Every person is a stylised, anonymous figure (no likenesses of real people); the lander keeps its real silhouette (see LANDER) so the set reads as one story.
 * Charts, maps and infographics suggested by the dossiers are turned into scenes (a drawn cutaway, a wall chart without writing…): the app adds all the words.
 */
import { ENDING, STYLE } from "./ingenuity-image-prompts.mjs";

export { ENDING, STYLE };

/** The vehicle, described the same way in every prompt so that it is recognisable from one image to the next (from the real InSight photos). */
const LANDER =
  "InSight, a stationary Mars lander about the size of a small car: a low, flat, six-sided deck in white and silver standing on three short landing legs, two big perfectly round solar panels fanned out on opposite sides like a pair of huge round ears, a slim robotic arm folded on the deck with a small scoop and a tiny camera at its elbow, a small round dish antenna and a short whip antenna on the deck, and, once deployed, a rounded copper-colored dome (the seismometer under its wind shield) and a small box with a thin cable (the heat probe) set on the ground a few meters from the deck";

export const PROMPTS = [
  {
    id: "ins003",
    title: "NASA picks InSight as its next Discovery mission (August 2012)",
    scene: `A 2012 meeting room at a space laboratory, seen from the end of a long table where a handful of anonymous scientists and managers in shirtsleeves sit looking at three small hand-built models standing in a row on the table under a hanging lamp. On the left, a model of a Mars lander (${LANDER}), lit by the warmest light and standing a little forward of the others; in the middle, a little boat-shaped probe floating on a bowl of dark liquid, a Titan sea explorer; on the right, a small spidery spacecraft perched on a lump of rock, a comet hopper. A chalkboard behind them shows three quick chalk sketches of the same three ideas and a thick chalk circle around the first one. One person leans over the table and sets a small flag on the Mars lander model. The single hanging lamp is the single warm light source, glowing on the lander model and on the faces. Mood: a quiet, decisive choice after a long contest, hope for a mission that will listen to the inside of a planet.`,
    composition:
      "Medium shot from the end of the table at a slightly low angle, the three models in a row at the center, the Mars lander glowing in the left third, the people leaning in at the sides, the chalkboard with three sketches in the dim background, deep shadows in the corners.",
  },
  {
    id: "ins006",
    title: "The launch is called off: a leaking seismometer (December 2015)",
    scene: `A bright, sterile clean room at a launch base on the California coast, in December 2015. In the center, the packed lander (${LANDER}), its petals folded, sits on a tall wheeled stand under a plastic tent. Beside it, a team of anonymous engineers in white hooded cleanroom suits and masks gathers around a small round vacuum chamber on a workbench, in which a delicate shiny copper-colored instrument shell sits; a dial gauge on the chamber has its needle creeping the wrong way and a thin trail of frost clings to the glass, showing that the seal leaks. One engineer holds a clipboard and shakes their head. Through a high window in the background, a tall white rocket stands waiting on a pad in the winter dusk. The cold white light of the clean room and the warm glow of a lamp over the workbench are the focal accents. Mood: disappointment held in silence, a launch window slipping away.`,
    composition:
      "Medium-wide shot, the packed lander under its tent in the right half, the engineers around the small vacuum chamber at the left center with the gauge in warm light, the rocket seen through the window at the upper left, black shadows at the edges.",
  },
  {
    id: "ins012",
    title: "Liftoff from Vandenberg: the first interplanetary launch from the West Coast (5 May 2018)",
    scene: `A slender white Atlas V rocket with a wide payload fairing lifting off before dawn from a launch pad on the California coast, a column of orange flame and billowing white smoke spreading over a dark hillside of scrub and a still sea, the first pale light of morning on the horizon. A steel gantry tower stands abandoned beside the pad. In the lower left foreground, a small crowd of silhouetted figures on a hill watch, arms raised, their faces lit orange. Superimposed faintly inside the fairing, as a ghostly translucent cutaway drawn in thin cream lines, the lander (${LANDER}) rides folded up in its aeroshell, with two tiny boxy CubeSat companions clinging beside it like little satellites. Far below the rocket, along the dark water, a faint dotted line curves south over the Pacific toward the horizon, with a few small islands near the coast. The engine fire is the single warm light source, reflected orange on the water. Mood: awe and a heavy hope, a first for the West Coast.`,
    composition:
      "Tall vertical wide shot at a low angle, the rocket rising along the center-right with its fire and smoke at the bottom, the ghostly cutaway of the lander and the two small CubeSats inside the fairing near the top, the silhouetted crowd in the lower left, the dotted path over the water at the right, deep shadows in the corners.",
  },
  {
    id: "ins019",
    title: "Six and a half minutes to land on Elysium Planitia (26 November 2018)",
    scene: `A comic-style triple exposure of one entry and landing over a vast, flat, dusty plain on Mars with a butterscotch-pink sky. High on the right, the aeroshell blazes as it hits the thin atmosphere, drawn as a glowing orange cone with a trail of fire behind it. In the middle of the sky, a large striped parachute billows open above the descending lander, drawn as a faint translucent ghost on its lines. Low on the left, the lander itself (${LANDER}) hangs a few meters over the plain on downward-pointing rocket plumes, kicking up a ring of orange dust, its two round solar panels still folded against its body like closed wings. Far above the sky, drawn in thin cream lines, two tiny CubeSat spacecraft with flat wings fly past and send a dotted line of radio signal toward a small blue-white Earth. Along the plain's horizon, a pale ridge. The rocket flames and the glow of the entry are the single warm focal accent. Mood: six minutes of held breath, nobody at the controls but the machine itself.`,
    composition:
      "Wide landscape shot, the blazing entry cone in the upper right, the parachute ghost at the center top, the lander on its flames at the lower left, the two small CubeSats and the dotted signal in the upper left, the ridge along the horizon, deep shadows in the corners.",
  },
  {
    id: "ins022",
    title: "InSight hears the Martian wind (1 December 2018)",
    scene: `${LANDER}, stands on a flat, rust-colored plain on Mars at midday, its two round solar panels fully open and shining, while a long, strong gust of wind sweeps across the dusty ground from one side to the other, drawn as bold, flowing ink lines of dust and sand curling over the plain, lifting little swirls around the legs. The two big round panels tremble in the wind: faint doubled outlines show them shaking like giant ears flapping. On the deck, a small covered instrument box sits still, and thin translucent cream sound waves, drawn like concentric ripples, rise from the panels and flow down into the lander body, as if the whole machine were an enormous ear listening. On the plain around it, the ground has long faint dark streaks from old dust devils, all running in the same direction as the wind. A butterscotch sky with a low, pale sun. The sun is the single warm light source, throwing the lander's long shadow across the plain. Mood: a happy surprise, a machine made to listen to the planet's insides hears its air.`,
    composition:
      "Medium-wide shot at a slightly low angle, the lander at the center with its round panels trembling at both sides, the wind lines sweeping diagonally across the middle of the frame from left to right, the ripples of sound flowing into the deck, the dust-devil streaks across the ground, deep shadows in the corners.",
  },
  {
    id: "ins023",
    title: "The first selfie on Mars (6 December 2018)",
    scene: `${LANDER}, seen from a slight height as if photographed by its own arm: the deck with its instruments still strapped on, its two big round solar panels spotless and gleaming a clean silver-blue, the small robotic arm bent so that the tiny camera at its elbow looks back at the machine itself. The picture is built like a patchwork mosaic: eleven overlapping square photo tiles drawn with visible seams, each slightly out of line, stitched into one image of the lander on a smooth, flat, rust-red plain under a pale butterscotch sky. In the lower right corner, a smaller inset in a thick ink frame shows a second mosaic of dozens of small photos forming the empty patch of ground in front of the lander, with two little circles drawn on it where the instruments might go. In the lower left corner, a tiny inset of the camera at the arm's elbow, drawn like a friendly eye. The low sun on the clean panels is the single warm light source. Mood: a proud, slightly comic portrait, new and clean, the first of two selfies that will bracket a long story.`,
    composition:
      "Medium shot from above and in front, the lander in the center of the mosaic with the seams of its eleven tiles clearly visible, the two bright round panels at the left and right, the inset of the work area at the lower right, the small camera inset at the lower left, deep shadows in the corners.",
  },
  {
    id: "ins026",
    title: "The robotic arm sets the seismometer on the ground (19 December 2018)",
    scene: `Dusk on a flat plain of Mars: the lander (${LANDER}) stands at the left with its slim robotic arm fully stretched out toward the right, its claw gently holding a rounded, copper-colored seismometer a few centimeters above the ground, about to set it down on a smooth patch of reddish soil that has been cleared in front of it. A thin double dotted line, drawn like a delicate guide, marks the arm's path from the deck down to the ground. The sky behind is a deep rust-orange fading to dusky purple-brown at the top, with a small bright evening star, and the first long blue-black shadows spread across the plain. The copper instrument catches the last warm light of the setting sun, the only warm focal accent, and glows like a small coal against the darkening ground. In the lower right corner, a small inset in a thick ink frame shows the four steps of the operation as four tiny sketches: the claw above the hook, gripping, carrying, letting go. Mood: delicate care, a first for any spacecraft on another world, patience at the end of the day.`,
    composition:
      "Wide shot at a low angle, the lander at the left with the arm stretching across the middle of the frame, the copper seismometer glowing at the lower center right just above the ground, the dusk sky filling the upper half, the four-step inset at the lower right corner, deep shadows in the corners.",
  },
  {
    id: "ins029",
    title: "The «mole» is set down on Mars (12 February 2019)",
    scene: `A flat rust-colored plain on Mars in the afternoon light. In the foreground, a small boxy instrument with a narrow tube sticking out of its underside rests on the ground, set down by the slim robotic arm that is still retreating up and to the left toward the lander (${LANDER}) in the soft-focus background, about a meter and a half behind. A short distance to the right, the rounded copper dome of the seismometer sits on the ground, close by. At the front of the picture, a cutaway of the soil drawn like a geology page in thick ink shows a cylinder like a giant steel nail, slim and about forty centimeters long, lying inside the box, and a thin ribbon-like cable coiled behind it, with tiny temperature sensors drawn as small dots along its length, and a long dotted line going far down for five meters through layers of soil, ending in a small target ring. In the cutaway the layers near the surface are drawn as a thin hard crust. The low afternoon sun is the single warm light source, throwing long shadows from the box and the dome. Mood: a patient, hopeful beginning, a little machine that will hammer itself deep into another world.`,
    composition:
      "Medium-wide shot at a low angle, the small box with its tube at the lower left, the retreating arm and the lander in the upper left background, the copper dome at the right, the cutaway of the soil with the mole and the cable filling the lower right corner in a thick ink frame, deep shadows in the corners.",
  },
  {
    id: "ins032",
    title: "A first marsquake is felt (Sol 128, 6 April 2019)",
    scene: `A calm night over a flat plain on Mars under a vast dark purple-brown sky full of stars. In the middle distance, a rounded copper-colored dome sits on the ground, a protective wind and thermal shield over a seismometer, with the lander (${LANDER}) behind it as a quiet dark silhouette. Under the ground, drawn as a thick-ink cutaway slicing through the plain like a page of a geology book, a crack in the cold crust shivers: thin shock waves ripple up through the layers in concentric arcs toward the little dome. On the right side of the picture, a delicate pen-and-ink seismograph strip runs as a long horizontal line that is almost flat, except for one faint wobble drawn in the middle like a held breath. Next to the strip, in comparison, a second strip from Earth shows a thick, constant jumble of scribbles. A thin, bright crescent glow at the horizon and the warm light inside the copper dome are the single focal accents. Mood: a hush, an ear pressed to the planet, a tiny first tremor in a planet that was believed to be dead.`,
    composition:
      "Wide shot, the dome and the lander silhouette in the lower center, the cutaway of the cracked crust with its ripples under the ground at the lower left, the two seismograph strips stacked at the right, the starry sky filling the upper half, deep shadows in the corners.",
  },
  {
    id: "ins038",
    title: "The mole pokes out of its hole (26–27 October 2019)",
    scene: `A close, low view of a small round pit in the rust-colored soil of Mars, with a thick crust of pale hard ground around its rim. Halfway out of the pit, tilted at an angle, a slim steel nail about forty centimeters long, the burrowing "mole", sticks up, as if it had just been spat out by the ground, a thin ribbon cable trailing from it. Pressed against the mole from the side, the small scoop at the end of the lander's robotic arm leans in from the upper left, pressing it gently against the wall of the pit like a hand holding a nail steady for a hammer. In the lower right corner, a cutaway of the soil in a thick ink frame shows the crust, only five to ten centimeters thick, as a hard pale layer lying above softer ground, with the mole's head stuck in it. A small before-and-after pair of sketches at the top shows the mole barely out by two centimeters on the first day and halfway out nine days later. In the soft background, the lander (${LANDER}). A low sun on the pit is the single warm light source, throwing the mole's thin shadow across the soil. Mood: stubborn ingenuity, a rescue of a small machine with a spoon.`,
    composition:
      "Low close shot, the pit and the half-out mole at the center third, the scoop pressing from the upper left, the lander blurred in the upper right background, the cutaway of the crust in the lower right corner in a thick ink frame, deep shadows in the corners.",
  },
  {
    id: "ins049",
    title: "The mole is given up on (14 January 2021)",
    scene: `The patch of flat ground in front of the lander (${LANDER}) on Mars at the end of the day, with a small round pit near the center, and the robotic arm bent over it with its scoop heaping loose soil back into the hollows beside a thin steel nail that barely shows above the ground, a half-finished attempt. The ground around the pit is torn up with shallow scars and little piles of crumbled soil. In the foreground at the left, a tall thin vertical bar drawn in ink beside the picture shows two marks: a very short one near the bottom, only a few centimeters, and a very tall one at the top, labelled by a small target circle, the three meters it never reached. To the right, in a thick ink frame, a cutaway of the soil shows the grains clumping together and leaving a hollow around the mole, so that it can find no grip. The low last light of the sun is the single warm light source and throws the arm's long shadow over the pit. Mood: effort and regret, a long fight that ends without victory, dignity in giving up.`,
    composition:
      "Medium shot at a low angle, the lander in the soft upper left background, the bent arm and the pit at the center, the tall height bar at the far left, the soil cutaway in the lower right corner in a thick ink frame, long shadows across the ground, deep shadows in the corners.",
  },
  {
    id: "ins051",
    title: "Cleaning a solar panel with sand (Sol 884, 22 May 2021)",
    scene: `Close to the lander (${LANDER}) at midday on a windy Mars: one of its big round solar panels fills the right of the picture, half covered in a fine rust-red layer of dust, while the other half is already clean and gleaming dark blue-black. Above it, the slim robotic arm tips its scoop over the panel's upper edge, and a thin stream of larger, pale grains of sand pours out and bounces down across the panel's surface like tiny hopping beads, each bounce knocking little puffs of the fine dust into the air where the strong wind carries them off toward the left in long soft streaks. In the upper left, a small round clock face with its hands at noon and an arrow showing the wind's direction. In the lower left, a tiny inset in a thick ink frame compares two panels as two full circles: one bright and clean at landing, the other dull and dusty. The high sun is the single warm light source, throwing sharp black shadows of the arm and the grains. Mood: playful ingenuity, a clever trick of nature put to work with a shovel.`,
    composition:
      "Medium close shot from above, the dusty panel filling the center and right, the arm and scoop pouring sand across the top, the wind-blown dust streaks sweeping to the left, the clock at the upper left, the two-panel comparison inset at the lower left, deep shadows in the corners.",
  },
  {
    id: "ins054",
    title: "Mapping the crust, the mantle and the core of Mars (July 2021)",
    scene: `A great round cutaway of the planet Mars, drawn like a page of a geology textbook in thick ink: a thin outer crust in burnt orange, a deep thick mantle in rust and brown, and a big liquid core in glowing dark gold at the center, each layer labelled only by its color and thickness (no words). Crossing the planet, thin bright lines of seismic waves leave a small starburst on the surface far to one side, bend through the layers, bounce off the boundary of the core and return up to the other side, where a small copper dome sits on the plain, with the lander (${LANDER}) next to it, shrunk to a tiny scale on the surface. Along the top of the sphere, a thin line of fissures marks the region where most of the quakes began. Floating beside the globe, a stack of three thick scientific journals bound in different colors, each with a tiny sketch of one layer on its cover. The glowing core and the seismic waves are the single warm focal accent. Mood: wonder at hearing the echo of a planet's inside, a doctor with an ultrasound on a world.`,
    composition:
      "Tall vertical composition, the great cutaway sphere filling the center, the wave paths bending through the layers, the tiny lander and the copper dome on the surface at the lower right, the three journals at the lower left, a dark starry background, deep shadows in the corners.",
  },
  {
    id: "ins059",
    title: "The biggest impact ever heard: a Christmas Eve meteoroid (24 December 2021)",
    scene: `A vast, flat, pale plain of Mars at the moment of impact, seen from a distance: a bright white-orange flash and a rising dark column of dust and rock erupt from a single point on the horizon, with a ring of ejected debris and boulders flying out in a wide arc and a visible pressure wave of dust racing across the ground toward the viewer. Above the point, a thin glowing trail from the sky marks the path of a small rock, a few meters wide, that reached the ground whole through the thin air. In the foreground, a freshly formed crater is drawn in cutaway in a thick ink frame, about a hundred and fifty meters wide and twenty deep, with a tiny human silhouette standing at its rim for scale, and little pale blocks of ice among the ejected rocks. Across the lower part of the picture, a long wavy line runs under the plain: a surface wave traveling through the crust toward a tiny copper dome and the lander (${LANDER}) at the far left edge, thousands of kilometers away. The flash of the impact is the single warm light source, throwing the debris' long shadows. Mood: awe and violence in silence, a rock from the sky announcing itself across a planet.`,
    composition:
      "Wide landscape shot, the flash and dust column on the right horizon, the debris arc across the upper right, the cutaway of the crater with the human silhouette at the lower right in a thick ink frame, the long wave line under the plain toward the small lander at the left edge, deep shadows in the corners.",
  },
  {
    id: "ins061",
    title: "The last selfie: the lander under red dust (Sol 1211, 24 April 2022)",
    scene: `${LANDER}, seen in the same patchwork mosaic composition as a first portrait, but now old and tired: the two big round solar panels are covered in a thick, uneven layer of rust-red dust so that they almost merge with the ground, only a few clean streaks left along the edges, the deck dull, its white paint faded, the slim arm bent as it takes the picture. The photo tiles of the mosaic are drawn with their seams and slightly misaligned, as before, over the same smooth, flat, rust-red plain under a low, dim butterscotch sky. In the lower left corner, a small inset in a thick ink frame shows the very first portrait, the same lander young, clean and bright, side by side with a thin pen-line gauge: a tall bar for five thousand units of energy and a very short bar for five hundred. In the lower right corner, a tiny inset shows the scoop pouring sand on a panel. The low, weak sun is the single warm light source. Mood: a bittersweet family portrait, the same face years later, calm and a little worn.`,
    composition:
      "Medium shot from above and in front, the dusty lander at the center of the mosaic with its seams visible, the two dull round panels at the left and right, the bright first-portrait comparison inset with the energy bars at the lower left, the sand-pouring inset at the lower right, deep shadows in the corners.",
  },
  {
    id: "ins063",
    title: "The biggest marsquake of the mission (Sol 1222, 4 May 2022)",
    scene: `The whole planet Mars hangs in black space, drawn as a bold burnt-orange sphere with thick ink outlines, seen from above one side. From a point on the far side, a huge series of concentric waves ripple across the surface like a stone thrown into a pond, spreading around the globe, passing over the poles and coming back, so that the same ring of waves wraps the planet several times, each ring drawn thinner and fainter than the last. On the near side, a tiny copper dome with the lander (${LANDER}) is shown on a small round magnifier inset in a thick ink frame at the lower left, with the seismograph needle drawn as a wild, scribbling line, almost jumping off the page, a very long ribbon of scribble that continues across the whole bottom of the picture and shrinks to a quiet line only at its far right end, to suggest ten hours. A single small gold clock, with its hands whirling, sits at the lower right. The glowing epicenter of the waves is the single warm light source. Mood: the planet rings like a bell, a great hush broken by the loudest voice it ever had.`,
    composition:
      "Tall vertical composition, the great Mars sphere in the upper two thirds with its concentric rings wrapping around it, the magnifier inset of the lander and the dome at the lower left, the long scribbling seismograph ribbon along the bottom, the small whirling clock at the lower right, deep black space in the corners.",
  },
  {
    id: "ins065",
    title: "Only the seismometer stays on (June 2022)",
    scene: `${LANDER}, seen from above and in front at dusk on a Martian plain, now deeply covered in dust, its two round solar panels dull and brown. Every instrument on the deck has gone dark and grey, drawn as flat silhouettes without light, except for the rounded copper dome on the ground a few meters away, which alone glows warmly from inside like a small lantern in the dark, a single warm dot in the vast blue-black dusk. A thin glowing wire of light runs from the lander to the dome, the only living line. In the lower left corner, a small inset in a thick ink frame shows two timelines drawn as two thin horizontal bars: the original plan with a long bar ending in the middle, and the revised plan where the instrument stays on and both bars end together at the same place, a battery icon empty at the end. In the lower right corner, a tiny cutaway of Mars with three layers and a dense scatter of little dots, the quakes heard so far. The glow of the dome is the single warm light source. Mood: a deliberate choice to listen to the very end, spending the last energy on the last question.`,
    composition:
      "Wide shot at a low angle, the dim lander at the center left, the glowing copper dome at the center right, the thin glowing wire between them, the dusk sky filling the upper half, the two timelines inset at the lower left and the small cutaway of Mars at the lower right, deep shadows in the corners.",
  },
  {
    id: "ins072",
    title: "«My power's really low»: a last message (19 December 2022)",
    scene: `${LANDER}, at the end of a Martian day, small on a vast empty rust-colored plain under a deep dusk sky of orange fading into violet and the first stars. Both of its big round solar panels are caked in thick, uneven dust and hang dull and lifeless, the slim arm resting on the deck. A small, faint, lonely glow comes from a single point on the deck, like the last ember of a campfire. From the glow, a thin dotted line of light rises straight up to the sky and ends at a very small, pale blue-white Earth. In the foreground, a long shadow of the lander stretches toward the viewer across the dust. In the upper right corner, a frame in a thick ink border holds a simple drawing of a square social-media post with a tiny picture of the Martian ground and a few abstract lines of writing (only scribbled lines, no readable text). A last sliver of the sun on the horizon and the little glow on the deck are the only warm focal accents. Mood: a calm goodbye, serene and productive, no panic.`,
    composition:
      "Wide shot from a low angle, the lander small at the lower center, its long shadow reaching toward the lower left, the dotted line rising to the small Earth in the upper center, the framed post at the upper right, the last sliver of the sun along the horizon at the left, deep shadows in the corners.",
  },
  {
    id: "ins074",
    title: "NASA ends the InSight mission (December 2022)",
    scene: `A split scene. At the top, the lander (${LANDER}) lies dark and silent on the flat Martian plain at the dusk of its last day, both round panels fully covered in a thick layer of red dust and a thin cold haze, no glow anywhere, a few long tracks of wind in the sand around it. At the bottom, a dim mission control room at the Jet Propulsion Laboratory late at night: a small group of anonymous engineers sit at consoles, one slowly takes off a headset, another rests their chin in a hand, a third lowers a hand from a keyboard after pressing a final key. Two screens in front of them show the same thing: a straight, flat line with no signal, side by side, one for each failed attempt to call. Across the wall behind them, a large map of Mars with a small marked point at the plain where the lander sits. A thin dotted line of radio waves travels from the control room's antenna to the lander and returns empty. A single lamp over the consoles and the faint last glow of dusk on the plain are the only warm light sources. Mood: a quiet, respectful end after twice the planned life, silence answering twice.`,
    composition:
      "Tall vertical composition divided horizontally by a thin dotted radio line, the silent dusty lander in the upper half, the engineers at their consoles with the two flat-line screens in the lower half, the map of Mars at the lower right, deep shadows in the corners.",
  },
  {
    id: "ins084",
    title: "An orbiter photographs the retired lander (23 October 2024)",
    scene: `A view from high above a flat, dusty Martian plain, drawn like an aerial photograph in rust, tan and brown: a small orbiter (a boxy spacecraft with two long solar wings and a big camera barrel pointing straight down) floats in the upper left corner above the plain, with a thin cream cone of view descending from its camera to a small square patch on the ground. In the center of the patch, the lander (${LANDER}) lies almost invisible, its two round panels the same dusty rust-brown as the ground around it, so that only its faint outline and its tiny shadow reveal it, as if the planet were slowly swallowing it. Around it, dark dust-devil tracks wind across the surface in long curving lines, and two faint dark smudges where its retro rockets once scoured the ground are fading to the color of the soil. In the lower right corner, a small inset in a thick ink frame repeats the same patch in 2018: the same lander bright and blue-white like a shining point, a little beacon on the plain. The low sun is the single warm light source, grazing the plain with long soft shadows. Mood: tender farewell, a machine melting back into the land that held it.`,
    composition:
      "Overhead view, the plain filling the whole frame, the orbiter in the upper left corner with its cone of view, the almost-hidden lander at the center, the dust-devil tracks sweeping across the middle, the 2018 bright comparison inset at the lower right in a thick ink frame, deep shadows in the corners.",
  },
];
