/**
 * Image prompts for the Spirit story (one per dossier in misiones/spirit/dossiers), written for Google's Nano Banana 2.1 on Replicate in the same house
 * style as the Opportunity, Ingenuity and Surveyor 3 illustrations (STYLE and ENDING are shared with the Ingenuity set, so the whole collection reads as one
 * comic): gritty graphic-novel ink and flat cel-shaded colour, a limited burnt-orange / rust / brown / taupe / cream palette, one warm light source, no text
 * anywhere (the app adds all the text itself). Each prompt was written from the dossier's context and its «ideas visuales»; `scene` carries the event,
 * `composition` the framing. scripts/generate-story-images.mjs glues STYLE + scene + composition + ENDING.
 *
 * Every person is a stylised, anonymous figure (no likenesses of real people); the rover keeps its real silhouette (see ROVER) so the set reads as one story.
 * Where a dossier could not verify a detail (spi006: the meeting in which a NASA administrator asks «what if two rovers?»), the image shows only what is
 * documented (the announcement of two rovers), never an invented scene.
 */
import { ENDING, STYLE } from "./ingenuity-image-prompts.mjs";

export { ENDING, STYLE };

/** The vehicle, described the same way in every prompt so that it is recognisable from one image to the next (from the real MER photos). */
const ROVER =
  "Spirit, a six-wheeled robotic geologist rover about the size of a golf cart: a low, boxy tan-and-gold body with a flat dust-covered solar-panel deck, six chunky metal wheels on a pivoting rocker-bogie suspension, a slim vertical mast carrying a pair of camera eyes like a head, a flat round dish antenna and a thin whip antenna on the deck, and a jointed robotic arm folded against the front end that carries a turret of small instruments";

export const PROMPTS = [
  {
    id: "spi001",
    title: "Steve Squyres conceives a robotic field geologist for Mars (1987)",
    scene: `A cramped university office at night, in the late 1980s. A young geologist in a rumpled sweater sits at a cluttered desk under a single warm desk lamp, a rock sample and a hand lens beside a stack of four thick proposal folders: the first three folders carry big red "rejected" stamps drawn as bold ink marks, the fourth, on top, glows with a calm, hopeful stamp. In his hands he holds a handwritten letter and a pencil. Pinned to the wall behind him is a large pencil sketch of a small six-wheeled rover drawn like a geologist's backpack on wheels, with arrows pointing to its tiny instruments, next to an old photograph of the red planet and a map of a huge crater. Through the dark window behind the desk, a distant snowy campus and a bright star. Above the desk, ghostly and translucent, floats the future rover itself, ${ROVER}, as if the idea were already taking shape in the lamplight. Mood: stubborn hope after three rejections, a patient dream taking shape.`,
    composition:
      "Medium shot from across the desk at a slightly low angle, the geologist in the lower left third with the stack of folders in the warm lamplight at the center, the ghostly rover floating in the upper right third above the desk, the sketch-covered wall behind, deep brown shadows swallowing the corners.",
  },
  {
    id: "spi004",
    title: "The Mars Climate Orbiter and the Mars Polar Lander are lost (1999)",
    scene: `A dim, hushed mission control room late at night in 1999, rows of bulky consoles with dials and paper printouts, and a handful of engineers frozen in place, some with their hands over their mouths, one slumped over his console. On the big wall display in front of them, a cartoon of Mars is drawn at the center, with two dashed approach lines: the first dips too low and ends in a small burning streak in the thin atmosphere above the planet, the second ends in a hard impact mark at the pale polar cap at the bottom. Between them, drawn in rough chalk-like ink on a rolling blackboard, two columns of numbers are written in two different systems of units, with a big question mark between them (just abstract scribbled marks, no readable text). A small model of a boxy orbiter and a four-legged lander sit side by side on a shelf, in shadow. The only glowing warm light comes from one amber console lamp and the glow of the wall display, lighting the stunned faces. Mood: two losses in ten weeks, a heavy silence, a space agency forced to rethink everything.`,
    composition:
      "Medium-wide shot from the back of the room, the engineers' silhouettes in the lower third, the big wall display with the two failed trajectories glowing at the center, the blackboard at the right, the small models on a shelf at the left, black shadows in the corners.",
  },
  {
    id: "spi006",
    title: "NASA announces two rovers instead of one (August 2000)",
    scene: `A packed NASA press briefing room in the summer of 2000, a long table on a low stage with two stylised, anonymous officials in suits seated behind microphones, one of them standing at a podium with an open hand extended toward the screen. A large projection screen behind them shows a simple, bold diagram: on the left, a single small rover on a red planet, crossed out with a gentle diagonal slash; on the right, two identical rovers on two different spots of the same planet, one inside a huge round crater and the other on a flat plain striped with pale layered mineral deposits. Rows of reporters in the foreground, drawn as dark silhouettes with notebooks and old television cameras, lit from the front by the glow of the screen. On the table in front of the officials, two identical small toy-sized rover models stand side by side, ${ROVER}, as twins. Mood: a bold doubling of the bet, excitement mixed with the weight of the new deadline.`,
    composition:
      "Wide shot from among the audience, the silhouetted reporters in the lower third, the stage and the two identical rover models at the center, the glowing screen with the one-versus-two diagram in the upper center, deep shadows in the corners.",
  },
  {
    id: "spi010",
    title: "A nine-year-old girl names the rovers Spirit and Opportunity (8 June 2003)",
    scene: `A podium at a space center on a bright summer morning, with a small nine-year-old girl in a simple dress standing on a stool beside it, reading from a sheet of paper in both hands, her face serious and a little shy. Beside her, an anonymous tall man in a suit looks down at her with a gentle smile. Behind them, a big clean-room window shows a gold-and-tan rover under a bright light, being prepared for flight, as if listening. In the air above the girl's head, drawn as faint translucent cream lines like a daydream, a starry night sky seen from a window of an old orphanage dormitory, a small child's silhouette pressed against the glass, looking up. On a table beside the podium, a tall tower of thousands of paper essays and envelopes, the topmost sheet lit by the sun. The warm morning sun through the tall windows is the single warm light source, glowing on the girl's paper and on her hair. Mood: a child's wish turned into a name that will cross space, tender and hopeful.`,
    composition:
      "Medium shot at the girl's eye level, her in the lower left third at the podium, the man at the left edge, the clean-room window with the rover in the center right, the faint daydream of the night window above her, the tower of essays at the lower right, deep shadows in the corners.",
  },
  {
    id: "spi011",
    title: "Spirit launches from Cape Canaveral aboard a Delta II (10 June 2003)",
    scene: `A slender white rocket with nine small solid boosters strapped around its base, lifting off from a launch pad at Cape Canaveral in the early evening, a column of blinding orange fire and billowing white smoke pouring out from under it and rolling across a flat coastal landscape of palmettos and still water. The tall steel launch tower stands dark beside it. In the foreground, a small crowd of silhouetted figures on the shore, arms raised or shading their eyes, their faces glowing orange. Superimposed faintly inside the nose of the rocket, as a ghostly translucent cutaway in thin cream lines, a folded-up rover rides curled up inside its protective shell, ${ROVER}, a small passenger on a seven-month journey. The blazing engines are the single warm light source, reflected orange on the water below. Mood: awe and a heavy hope, a golf-cart-sized robot leaving the Earth.`,
    composition:
      "Tall wide shot at a low camera angle, the rocket rising along the center-right with its fire and smoke at the bottom, the ghostly cutaway of the folded rover inside the nose near the top, the silhouetted crowd in the lower left foreground, the water reflecting the flames, deep shadows in the corners.",
  },
  {
    id: "spi013",
    title: "Spirit lands in Gusev Crater, bouncing on airbags (3 January 2004)",
    scene: `A comic-style multiple exposure of one violent landing over a vast, flat, boulder-strewn plain inside a huge Martian crater, under a butterscotch-pink sky, with a pale ridge of distant hills on the horizon. On the right, high in the sky, a tiny parachute still billowing above a cluster of tiny retro rockets, a discarded back shell drifting beside it. Below, a huge ball of silvery inflated airbags, like a cluster of giant bubbles, drawn three times along a long dotted arc across the plain: first slamming into the ground at the right in a burst of dust, then bounding high in a faint translucent ghost in the middle, then rolling slowly at the left across the rocks, small puffs of dust marking every touch point. In the foreground at the lower left, the airbags have deflated into limp folds of fabric, and four flat petals of a lander are opened out like a metal flower, with ${ROVER} sitting upright on top, folded and still, its mast just beginning to rise. The low rising sun and the dust it lights are the single warm light source. Mood: a violent, clumsy, triumphant arrival, the quiet that follows a crash that worked.`,
    composition:
      "Wide landscape shot, the parachute and retro rockets in the upper right, the three bouncing airbag ghosts arcing diagonally across the middle of the frame, the opened lander with the rover in the lower left foreground, the hills along the horizon, deep shadows in the corners.",
  },
  {
    id: "spi017",
    title: "Sol 18: Spirit falls silent in a loop of reboots (21 January 2004)",
    scene: `A split scene of one very bad night, divided by a jagged lightning-shaped line. At the top, on the rusty plain of Mars under a dim sky, ${ROVER}, stands motionless with its robotic arm extended toward a dark, rounded boulder, a small grinding tool held a few centimeters from the stone, unmoved and with its lights dark, a faint dust-colored shroud draped over it as if asleep. At the bottom, a cramped mission control room at the Jet Propulsion Laboratory at three in the morning, exhausted engineers with crumpled collars gathered around a glowing console, some holding paper cups, one resting his forehead on his hand. Their console screen shows a big circular arrow looping back on itself over a stack of overflowing little file icons and a small row of garbled symbols (abstract scribbles, no readable text). Across the middle, a cartoon of a small brain-like memory chip bursting its seams with files, drawn in thick ink. The glow of the console screen is the single warm light source on the weary faces. Mood: frozen helplessness, a machine caught in a loop, tired people refusing to give up.`,
    composition:
      "Tall vertical composition divided horizontally by the jagged line, the dark rover with its arm out in the upper half, the weary engineers around the glowing console in the lower half, the overflowing memory chip at the center, deep shadows in the corners.",
  },
  {
    id: "spi021",
    title: "The memory is reformatted and Spirit grinds the first rock on another planet (4–5 February 2004)",
    scene: `A close, dramatic view of ${ROVER}, standing in front of a large dark rounded rock on the rust-colored plain, its jointed arm extended and pressed against the stone, the small grinding tool at the end spinning and throwing out a faint spray of fine orange dust. On the rock, where the tool has been, a perfectly round, clean, much darker circle has been brushed into the dusty surface, with glittering mineral crystals and tiny sharp sparkles visible inside it, like a freshly opened eye. In the lower left corner, a floating comic inset in a thick ink frame shows a cartoon of a memory chip being wiped clean by a large hand holding a sponge, drops of sparkling water flying off. In the lower right corner, a second small inset shows a group of engineers in a control room with raised arms cheering, a banner of hand-drawn stars above them. The low morning sun slants across the rock and the rover and glows in the freshly ground circle, the single warm light source. Mood: a machine cured and back at work, the first time anyone has scrubbed a rock on another world.`,
    composition:
      "Medium shot at a slightly low angle, the rover on the left with its extended arm reaching toward the rock at the center-right, the dark brushed circle glowing at the exact center of the frame, the two small ink-framed insets in the lower corners, deep shadows at the edges.",
  },
  {
    id: "spi028",
    title: "Spirit starts driving backwards to spare its sick wheel (15 July 2004)",
    scene: `${ROVER} drives away from the viewer across a pale slope at the foot of a low brown range of hills, rolling in reverse, its rear toward the camera, and with its front right wheel clearly lifted slightly and locked, dragging a deep furrow behind it in the soft rust-colored soil like an anchor being pulled. The other five wheels leave clean, evenly spaced tire tracks that stretch into the distance behind it. The tracks and the dragged furrow trace a long, slightly crooked line back across the plain, with a scattering of small dark stones. In the foreground, a half-buried slab of pale outcrop rock catches the light, with the rover's wheels about to climb over it. Floating above the front right wheel, drawn like a diagnostic cutaway in thin cream lines, a small wheel motor with a thick, strained line of electric current glowing, three times as bright as the thin currents of the other wheels. The low, late sun behind the hills throws long, pink-brown shadows. Mood: ingenuity born of a failing part, stubborn, a little comical, tender.`,
    composition:
      "Low wide shot from behind and slightly to the side, the rover small at the center, its dragged furrow and five clean track lines sweeping from the lower foreground to the center, the outcrop slab in the lower right, the hills across the horizon, the cutaway callout of the strained wheel motor near the upper left, deep shadows at the edges.",
  },
  {
    id: "spi031",
    title: "Comanche: carbonates prove a once wet, mild Mars (2005, published 2010)",
    scene: `The rocky slope of a tall hill in a crater on Mars, with a pale outcrop of dark, pitted, olive-green stone, four or five meters long, bulging out of the rust-colored regolith in the foreground, a smaller spur of the same stone beside it. ${ROVER}, stands on the slope a few meters from the outcrop, its mast turned toward it, a thin film of dust visibly covering its deck. In the lower right corner of the slope, a floating comic-style cutaway through the rock, drawn in thick ink like a geology textbook page: a deep hot spring of warm, calm, clear water rising from below, flowing up through cracks in dark volcanic stone and leaving glittering, round, pale carbonate crystals like pearls in the pores, a ghostly sun above a blue shallow pool that once lay on this slope. In the sky above the hill, a faint translucent ghost of a drop of clean water. In the far background, a wide basin and a field of dark dunes below, under a butterscotch-pink sky. The low afternoon sun on the outcrop is the single warm light source. Mood: quiet scientific wonder, a four-year-old mystery finally read.`,
    composition:
      "Medium-wide shot at a slightly low angle, the outcrop filling the lower center, the rover on the left looking toward it, the ghostly cutaway of the hot spring and carbonate pearls at the lower right in a thick ink frame, the basin and the dunes along the upper horizon, deep shadows in the corners.",
  },
  {
    id: "spi035",
    title: "A dust devil sweeps Spirit's solar panels clean (sols 420–421, March 2005)",
    scene: `${ROVER}, stands on a wide, rust-colored plain with its deck panels half covered in a thick layer of dust, one side of the deck swept clean and gleaming dark blue-black and metallic where an invisible hand has just wiped it. A slender, spiraling, corkscrew-shaped whirlwind of orange dust, a Martian dust devil, rises from the plain behind the rover and leans across the sky like a giant brushstroke, two smaller ones on the horizon in the same pale pink sky; fine dust swirls and trails from the top of the nearest one. Just over the rover, drawn as thin translucent cream lines, a small bar of energy glows in two states: a thin short line on the dusty side, a long, bright line on the clean side. On the foreground, on the ground, a soft trail of swept dust, tiny dancing pebbles, and sharp ink-stroked grass-like shadows of rocks. The low sun behind the whirlwind is the single warm light source, glowing through the swirling dust. Mood: a gift from the weather, a small miracle for a dusty machine, lightness.`,
    composition:
      "Wide shot at a low camera angle, the rover small at the lower left third, the tall spiraling dust devil rising from the center right to the upper right, two smaller whirlwinds on the horizon, the thin energy bar glowing above the rover, deep shadows in the corners.",
  },
  {
    id: "spi037",
    title: "Spirit crowns Husband Hill, the first hill climbed by a rover on Mars (2005)",
    scene: `The broad, rocky summit of a hill on Mars at sunset, a wide plateau strewn with dark rocks, pale outcrops and small drifts of sand, with a 360-degree view dropping away to a vast plain inside a huge crater, a ring of distant hills on the horizon far below. ${ROVER}, is parked at the very top, small against the sky, its camera mast raised and turned toward the horizon like a person standing on a summit, a long line of its own wheel tracks climbing up the slope behind it all the way from the plain far below. On the plain, tiny and far away, a small pale mark where it landed. Floating over the sky in thin translucent cream lines, a faint comic-style inset of a mountaineer's silhouette on a summit with raised arms, like a ghost echoing the rover's pose. The setting sun, low and huge, is the single warm light source, igniting the dust in the air with a rust-orange halo and throwing the rover's long shadow across the plateau. Mood: quiet triumph, a robot built for flat plains that kept climbing.`,
    composition:
      "Wide shot at a slightly low angle, the rover small at the center left third at the summit, its long track line winding down toward the lower right, the huge crater plain and the ring of distant hills filling the lower half, the setting sun glowing at the upper right, deep shadows in the corners.",
  },
  {
    id: "spi040",
    title: "Sol 779: the motor of the right front wheel dies for good (13 March 2006)",
    scene: `A split scene. In the upper half, ${ROVER}, crawls across a pale, rust-colored plain beside a low, dark volcanic plateau, its front right wheel stuck, locked like a stone, dug in and dragging a deep, bright furrow behind it, the other five wheels spinning and leaving clean tracks, a low winter sun glowing on its tilted solar deck. In the lower half, an engineering test hall at a rocket laboratory, where a replica rover, wheels dusty and one wheel pinned, sits in a big sandbox of pale sand, surrounded by engineers in lab coats who crouch, point and sketch notes, one holding a tape measure against the replica's locked wheel. A big wall chart behind them shows a falling line of energy dropping toward a danger mark, drawn as a plain ink curve with no numbers. The cold, slanting winter sunlight on Mars and the warm cone of a work lamp over the sandbox are the two light sources, joined by the dividing line. Mood: a loss met with practice, hard work and stubborn improvisation.`,
    composition:
      "Tall vertical composition divided horizontally, the rover with its dragged wheel and furrow in the upper half, the replica in the sandbox ringed by engineers in the lower half, the falling energy chart at the lower right, deep shadows in the corners.",
  },
  {
    id: "spi048",
    title: "A dragged wheel digs up almost pure silica at Home Plate (2007)",
    scene: `A pale, dusty plain on Mars at the foot of a low, layered, dark volcanic plateau, with a long, straight trench just dug into the rusty soil by a dragging wheel, running toward the viewer, and the freshly turned earth at the bottom of the trench glowing a startling bright white against the red-brown surroundings, like a seam of fresh snow. ${ROVER}, stands near the end of the trench, its front right wheel obviously locked and buried at the end of the furrow, its arm swung down toward the white soil as if it were curiously inspecting its own accident. In the lower right corner, a floating comic-style inset in a thick ink frame: a hot spring pool on Earth, a steaming pale-white, mineral-crusted pond with terraces and bubbling vents, drawn as the same bright white, as if it were a twin of the white soil. A pair of scribbled thought-bubble-like cloud shapes above the rover each show a faint question mark and a glittering crystal, without any readable text. The low sun glancing across the trench and lighting up the white soil is the single warm light source. Mood: a happy accident, a broken part opening a door to a past full of hot water.`,
    composition:
      "Wide shot at a low camera angle, the bright white trench running diagonally from the lower left foreground to the rover at the center right, the plateau across the horizon, the ink-framed hot-spring inset at the lower right, deep shadows in the corners.",
  },
  {
    id: "spi057",
    title: "Spirit breaks the crust and sinks into the sand trap at Troy (spring 2009)",
    scene: `A quiet, wide Martian plain with a hidden trap: in the foreground, a thin, darker crust of surface soil has cracked into big, plate-like pieces, and under it lies a bright, pale, powdery sand, soft as flour. ${ROVER}, is half sunk into it, its wheels buried up to the hubs in the pale sand, the rover's body tilted, one side of its deck low and the other raised, a faint trail of its own wheel tracks coming from the distance behind it ending at the broken crust. The crust fragments are drawn like cracked ice around the wheels, with small plumes of pale powder rising where the wheels spun. In the far background at the right, the low, layered, dark plateau of Home Plate on the horizon. In the sky above, drawn as faint translucent cream lines, a small cutaway diagram of the rover sinking through a thin hard crust into a soft pale layer, with a wavy arrow pointing down. The low sun behind the rover is the single warm light source, throwing its shadow across the sand. Mood: the moment the ground gave way, quiet and a little ominous, a hidden trap under an ordinary surface.`,
    composition:
      "Medium-wide shot at a slightly low angle, the sunken rover at the center third, the broken crust plates and the pale sand filling the foreground, the tracks leading away into the left distance, the dark plateau on the right horizon, deep shadows in the corners.",
  },
  {
    id: "spi061",
    title: "«Free Spirit»: the rescue attempt begins (16 November 2009)",
    scene: `A split scene. In the upper half, on a dusty plain of Mars, ${ROVER}, is tilted at a steep angle on a small mound of rocks, one triangular rock poking its sharp point up under the rover's belly, its five working wheels dug into pale sand and its dead front wheel locked, a pair of long wheel tracks coming to it in a straight line from the distance behind, ready to be driven back along the same way. A dotted line from the rover's tracks leads to the horizon. In the lower half, a bright laboratory at a rocket laboratory where a team of engineers in lab coats work on a second, identical test rover tilted on a sandbox of fine pale sand, one pushing a small rock under its belly, another crouched with a ruler, a third with a laptop. On a whiteboard behind them, a drawing of the rover, the rock, and an arrow tracing a straight line out of the trap, no readable text. The sunlight over the Martian plain and the warm lab lamps are the two light sources, joined across the dividing line. Mood: patience, hope, careful hands on a faraway friend.`,
    composition:
      "Tall vertical composition divided horizontally, the tilted rover on its rock in the upper half, the engineers working around the test rover in the lower half, the whiteboard at the lower right, the dotted escape line crossing the divide, deep shadows in the corners.",
  },
  {
    id: "spi066",
    title: "NASA declares Spirit a stationary research platform (26 January 2010)",
    scene: `${ROVER}, sits still and tilted in a wide pit of pale sand on a barren Martian plain at winter dusk, its deck panels coated in a thin layer of rust-colored dust and angled away from a low, small, pale sun hanging near the horizon, a faint tree-like pattern of old wheel tracks and cracked crust in the foreground. Its arm is folded and its mast stands upright like a person at rest, a lone small figure in a huge landscape. Above the rover, drawn in thin translucent cream lines, a small sketched dish antenna on the rover pointing straight to a tiny pale Earth in the sky, with a dotted line of radio waves oscillating gently between them, and a tiny round Mars in the margin gently wobbling on its axis like a spinning top, to show that the rover is now a still observatory. In the lower left corner, a floating comic-style inset in a thick ink frame shows an anonymous official standing in a small conference room before a speakerphone and a cluster of listening faces, a hand raised calmly. The weak winter sun is the single warm light source, throwing a long, thin shadow of the rover across the sand. Mood: a quiet change of role, not an ending, patience and dignity.`,
    composition:
      "Wide shot at a slightly low angle, the rover small at the center left, the pale sun low at the right edge, the ghostly dish and Earth sketch in the upper center, the wobbling Mars in the upper right margin, the ink-framed conference-room inset at the lower left corner, deep shadows in the corners.",
  },
  {
    id: "spi069",
    title: "Spirit's last message from Mars (22 March 2010)",
    scene: `A bitterly cold Martian winter night falling over the dune-and-rock plain, a dark purple-brown sky with a few pale stars and a small, faint pale blue-white Earth low on the horizon. ${ROVER}, sits quiet and still in its sand trap, tilted away from the faint last glow of daylight, its deck panels dusty and dim, its tiny antenna pointed at the faint speck of Earth, a thin dotted line of radio waves leaving it and fading into the dark before it can reach the star. A frost-like rim of pale cream ice clings to the edges of its wheels and arm. Floating just above the rover, drawn in thin translucent cream lines, a small cutaway of its warm electronics box with a tiny glowing ember inside, surrounded by a ring of thin blue cold, and a small thermometer curving down. The very last sliver of the sun on the horizon at the left, a thin warm orange line, and the tiny ember inside the rover, are the only warm light sources. Mood: the last whisper of a machine that gave all it had, solitude, a quiet goodbye.`,
    composition:
      "Wide shot from a low angle, the rover small at the lower center, the thin orange sliver of the setting sun along the left horizon, the tiny pale Earth in the upper right sky with the fading dotted radio line leading to it, the cutaway ember callout above the rover, deep shadows in the corners.",
  },
  {
    id: "spi076",
    title: "NASA ends its attempts to reach Spirit (24 May 2011)",
    scene: `A giant white radio dish antenna in a desert at dusk, tilted up toward a dark purple evening sky where a small, calm, reddish point of light, Mars, glows near the horizon, and a thin line of radio waves, drawn as faint cream arcs, ripples from the dish up to the planet and returns empty. At the foot of the dish, a small control building with a lit window; inside, seen through the window, a small group of anonymous engineers standing in a dim room around a console, one with a hand on a colleague's shoulder, another looking down at a stack of hundreds of command printouts on a table. In the sky, high above the dish, drawn as a faint translucent cream ghost, the rover itself, ${ROVER}, resting on a low sandy hill of Mars with a small dusty flag-like rod of a whip antenna, as if it were watching back from far away, a small trail of old tracks behind it. In the bottom right corner, a tiny ink-framed inset of the same rover at its starting point, brand new and shining, beside a small calendar page torn off. The last orange light in the desert sky and the lit window are the single warm light sources. Mood: gratitude and farewell, a message left on an answering machine that will not be answered.`,
    composition:
      "Tall vertical wide shot, the huge dish antenna filling the left and center with the red point of Mars glowing above it in the upper right, the lit window of the control building with the engineers at the lower center, the ghostly rover in the sky at the upper left, the small inset at the lower right, deep shadows in the corners.",
  },
  {
    id: "spi080",
    title: "A new look at old data: hematite and altered magnetite in Gusev soil (2026)",
    scene: `A quiet university laboratory at night in the present day, where a lone anonymous scientist sits at a desk lit only by the warm glow of a computer screen and a desk lamp, with towering shelves of old hard drives, magnetic tapes and bound printouts rising behind him, labelled with small dots instead of text. On the screen, a messy cloud of dozens of faint, noisy little wavy lines stacks and merges into one single clean, strong curve with two sharp valleys, drawn as bold ink lines on a glowing screen, with a small spinning ring of thirty-two dots sketching a path across a drawing of a crater. Rising from the screen like a daydream in the warm light, a ghostly translucent ${ROVER}, stands on a faint red plain, its arm outstretched toward the soil as if still measuring it, tiny grains of iron-red dust and dark shiny magnetite crystals floating in the air between rover and scientist. Beside the keyboard, a coffee mug and a small model of the rover. Through the window behind him, a dark night sky with one small reddish star. The glowing screen and lamp are the single warm light source. Mood: a machine that never stops teaching, the quiet joy of finding something new in old data.`,
    composition:
      "Medium shot from across the desk at a slightly low angle, the scientist in the lower left third bent toward the glowing screen, the merging curves on the screen at the center, the ghostly rover rising from it into the upper right, the shelves of old drives and tapes fading into black shadow behind, the window with the reddish star at the upper left.",
  },
];
