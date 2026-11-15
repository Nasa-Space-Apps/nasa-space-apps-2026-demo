/**
 * Story data of Beagle 2: the copy (English) of its 20 beats, in chronological order, plus where its facts, art and 3D terrain come from. Read by
 * scripts/build-story.mjs, which writes public/models/beagle2/story.json. Same format and rules as opportunity-story.mjs (docs/story.md): narration ~45 words,
 * numbers spelled out, every fact from the dossiers (misiones/beagle2/dossiers). Contested figures are left out (what the mass of the lander was: 33 kg on
 * the surface vs 69 kg all packed, so both are said as such; how many panels opened; the cost: £45 M vs $40 M, each in its own context).
 * Beagle 2 is a mission of ESA and the UK, not of NASA: the link with the challenge is that NASA's HiRISE found it in 2015.
 * part: intro = before the 3D (comic pages), mars = a 3D moment, outro = comic pages after the 3D.
 *
 * Beagle 2 never moved (it never even called home): STATIONARY = true. In the 3D scene the lander sits on the plain and Space (or the timeline) moves from one
 * moment of its story to the next (docs/story.md, «Vehículos inmóviles»); every stop of the route is the same spot, BASE.
 */
export const MISSION = "beagle2";
export const NAME = "Beagle 2";
export const TITLE = "Beagle 2: the lander that went quiet";
/** Research dossiers of the mission (bglNNN/dossier.json) */
export const DOSSIERS = "misiones/beagle2/dossiers";
// no `sourceImage`: the art is generated straight into public/models/beagle2/images (npm run story-images -- beagle2)
/** 3D terrain: the flat floor of the Gale model stands in for Isidis Planitia; the lander sits at BASE (flat ground inside the crater floor, ~0.2° slope) */
export const TERRAIN = "public/models/gale-terrain.stl";
export const STATIONARY = true;
export const BASE = [90, 80];
/** The closing card after the last page of the story */
export const CLOSING = { title: "thank you, Beagle 2", text: "A British lander built on a tiny budget reached Mars in 2003 and was found in 2015, less than two meters wide." };

export const BEATS = [
  // ───────────────────────────── before Mars: the comic ─────────────────────────────
  {
    id: "bgl001", part: "intro", date: "1997", title: "A lander for Mars Express",
    summary: "British scientist Colin Pillinger convinces ESA to add a lander to its first Mars mission, and names it after Darwin's ship.",
    narration:
      "Nineteen ninety-seven. Planetary scientist Colin Pillinger, of the Open University in Britain, thinks Europe's first Mars mission is missing something: a lander. He convinces the European Space Agency to add one, and names it Beagle 2, after Darwin's ship. The whole project gets about forty-five million pounds, a fraction of NASA's missions.",
    facts: [["Idea by", "Colin Pillinger"], ["Budget", "~£45 million"], ["Packed weight", "69 kg"]],
  },
  {
    id: "bgl002", part: "intro", date: "1997", title: "One of three proposals",
    summary: "ESA invites proposals for a lander and picks Beagle 2 out of three. The deadline is set by the planets: Mars will be closest in summer 2003.",
    narration:
      "The European Space Agency invites teams to propose a lander for Mars Express. Three proposals reach the table, and it picks Beagle 2. The planets set the deadline: in summer 2003 Mars will be at its closest to Earth, and that launch window cannot be missed. Weight, money and time are tight.",
    facts: [["Proposals", "3"], ["Packed weight", "69 kg"], ["Window", "Summer 2003"]],
  },
  {
    id: "bgl003", part: "intro", date: "1997–2003", title: "Named after Darwin's ship",
    summary: "Not an acronym but the HMS Beagle. An artist paints the dot chart that calibrates its instruments, and a rock band writes its call signal.",
    narration:
      "Pillinger skips the usual acronym and names the lander after the HMS Beagle, the ship that carried Charles Darwin. Darwin sought the origins of life on Earth; Beagle 2 will look for life on Mars. Artist Damien Hirst paints a chart of colored dots to calibrate its instruments, and the band Blur writes its call signal.",
    facts: [["Named for", "HMS Beagle"], ["Art", "Damien Hirst's colored dots"], ["Call signal", "Nine notes by Blur"]],
  },
  {
    id: "bgl009", part: "intro", date: "1997–2003", title: "A lab in sixty kilograms",
    summary: "A one-meter robotic arm carries cameras, a microscope, two spectrometers and a drill; a mole can dig 1.5 meters down. A whole laboratory, miniaturized.",
    narration:
      "The contest sets a limit of sixty kilograms for the lander, and Pillinger says Beagle was the only viable option. Everything hangs on a one-meter robotic arm, the PAW, with cameras, a microscope, two spectrometers and a drill. A small digging mole, PLUTO, can go one and a half meters down. It is a whole laboratory, miniaturized.",
    facts: [["Mass limit", "60 kg"], ["Arm reach", "109 cm"], ["Mole depth", "1.5 m"]],
  },
  {
    id: "bgl017", part: "intro", date: "Jun 2, 2003", title: "Liftoff from Baikonur",
    summary: "A Soyuz-Fregat rocket lifts off from Kazakhstan with Mars Express and Beagle 2: 400 million kilometers and six months to Mars.",
    narration:
      "June second, 2003, at a quarter to midnight. A Soyuz-Fregat rocket lifts off from Baikonur, in Kazakhstan, carrying Mars Express, Europe's first mission to another planet. Strapped to it rides Beagle 2. The launch window opens only every twenty-six months. The journey is four hundred million kilometers and six months long.",
    facts: [["Rocket", "Soyuz-Fregat"], ["Liftoff", "23:45 local time"], ["Trip", "~400 million km"]],
  },
  {
    id: "bgl019", part: "intro", date: "Dec 19, 2003", title: "Let go, spinning",
    summary: "Mars Express releases Beagle 2 with a spring, spinning like a top. The lander has no engine of its own, so its path was set beforehand.",
    narration:
      "December nineteenth, 2003. Mars Express releases Beagle 2. A spring pushes it away, spinning like a top to stay stable. The lander has no engine to correct its course, so its path was set with great precision beforehand. Two minutes later, the orbiter's camera takes the last picture of it, a small dot drifting away.",
    facts: [["Separation", "19 Dec 2003 · 08:31 GMT"], ["Landing mass", "~33 kg"], ["Target", "Isidis Planitia"]],
  },
  // ───────────────────────────── on Mars: the 3D, the lander never moves ─────────────────────────────
  {
    id: "bgl020", part: "mars", date: "Dec 25, 2003", place: "Isidis Planitia", title: "Christmas silence",
    summary: "Mars Express enters orbit perfectly on the day Beagle 2 should land. The first radio contact never comes, and the screens stay silent.",
    narration:
      "December twenty-fifth, 2003, Christmas Day. Mars Express enters orbit around Mars, perfectly. It is also the day Beagle 2 should land. The first radio contact, expected soon after, never comes. In the control rooms, the screens stay silent. Over the next weeks, many attempts end the same way.",
    facts: [["Orbiter", "Mars Express enters orbit"], ["Planned landing", "25 Dec 2003"], ["Signal", "None"]],
  },
  {
    id: "bgl023", part: "mars", date: "Dec 25, 2003", place: "Isidis Planitia", title: "What they hoped to hear",
    summary: "The first sign should have been nine notes by Blur. Then 13 more tries and a slow beacon: ten seconds on, fifty off, with five watts of power.",
    narration:
      "What the team expected on Christmas Day was nine notes by the band Blur. If that failed, the lander had thirteen more scheduled tries with NASA's Mars Odyssey, then a slow backup beacon: ten seconds on, fifty off. Its transmitter had five watts, about as much as a mobile phone.",
    facts: [["First signal", "9 notes by Blur"], ["Backup tries", "13"], ["Beacon", "10 s on, 50 s off"]],
  },
  {
    id: "bgl027", part: "mars", date: "Dec 29, 2003", place: "Isidis Planitia", title: "A crater in the landing zone",
    summary: "A NASA orbiter picture shows a 1-kilometer crater right in the middle of the landing ellipse, which had shrunk from 480 × 300 km to 70 × 10 km.",
    narration:
      "December twenty-ninth, 2003. A picture from NASA's Mars Global Surveyor, taken twenty minutes after the planned landing, shows a crater about one kilometer wide in the middle of the landing zone. Pillinger compares it to Arizona's Meteor Crater. The ellipse had shrunk from four hundred eighty by three hundred kilometers to seventy by ten.",
    facts: [["Crater", "~1 km wide"], ["Final ellipse", "70 × 10 km"], ["First estimate", "480 × 300 km"]],
  },
  {
    id: "bgl032", part: "mars", date: "Jan 26, 2004", place: "Isidis Planitia", title: "The last resort",
    summary: "Three days of searching with two orbiters and a radio telescope end in silence. One idea remains: a «hail» command sent by Mars Odyssey.",
    narration:
      "January twenty-sixth, 2004. Three days of intense searching with Mars Express, Mars Odyssey and the Jodrell Bank radio telescope end in silence. By now the lander should be in an emergency mode with its receiver always on. The likely explanation: a nearly flat battery. One last idea remains: a hail command, sent by Odyssey the next day.",
    facts: [["Channels tried", "Mars Express, Odyssey, Jodrell Bank"], ["Emergency mode", "CSM2"], ["Last resort", "The «hail» command"]],
  },
  {
    id: "bgl033", part: "mars", date: "Feb 6, 2004", place: "Isidis Planitia", title: "Declared lost",
    summary: "In London, the Beagle 2 management board formally declares the lander lost. An official inquiry is announced days later.",
    narration:
      "February sixth, 2004. In London, the Beagle 2 management board meets and formally declares the lander lost. More than a month has passed since the planned landing without a single signal. A few days later, British science minister Lord Sainsbury and the European Space Agency announce an official inquiry into the failure.",
    facts: [["Board", "Beagle 2 Management Board"], ["Meeting place", "London"], ["Silence", "More than a month"]],
  },
  {
    id: "bgl041", part: "mars", date: "Jan–Apr 2004", place: "Isidis Planitia", title: "Searching strip by strip",
    summary: "NASA's Mars Global Surveyor photographs over a third of the landing ellipse at 1.5 meters per pixel. The one dark candidate is not the lander.",
    narration:
      "January to April, 2004. NASA's Mars Global Surveyor searches the landing ellipse at one and a half meters per pixel. By April it has covered over a third of the area. Only one candidate stands out: a dark spot about twenty meters wide. A sharper look shows an old crater, not a lander.",
    facts: [["Camera", "MOC, on Mars Global Surveyor"], ["Coverage", "36% of the ellipse"], ["Detail", "1.5 m / pixel"]],
  },
  {
    id: "bgl037", part: "mars", date: "Apr 2004", place: "Isidis Planitia", title: "An instrument, not a spacecraft",
    summary: "The inquiry finds no single technical cause. It finds that Beagle 2 was managed like an instrument, with fewer controls than a spacecraft needs.",
    narration:
      "April, 2004. The inquiry delivers its report. It cannot name one technical cause. Instead it finds organizational reasons that raised the risk: Beagle 2 was treated like an instrument, not like a spacecraft that must survive alone on another planet. The window was fixed, time was short, and the report makes nineteen recommendations.",
    facts: [["Chair", "René Bonnefoy (ESA)"], ["Recommendations", "19"], ["Conclusion", "No single cause found"]],
  },
  {
    id: "bgl043", part: "mars", date: "2006–2014", place: "Isidis Planitia", title: "Eight years, 26 photos",
    summary: "Only one camera is sharp enough to find a 1.5-meter lander: HiRISE. Twenty-six of its images of the area show nothing.",
    narration:
      "From 2006 to 2014, nothing turns up. The ellipse has been narrowed to a fifty-seven kilometer axis, still over fourteen hundred square kilometers, and the lander is just one and a half meters wide. The only camera sharp enough, HiRISE on NASA's Mars Reconnaissance Orbiter, takes twenty-six images of the area without finding a trace.",
    facts: [["Camera", "HiRISE, 0.3 m / pixel"], ["Photos checked", "26"], ["Search area", "1,400+ km²"]],
  },
  {
    id: "bgl044", part: "mars", date: "Feb 28, 2013", place: "Isidis Planitia", title: "A photo already in the archive",
    summary: "HiRISE photographs the middle of the landing zone. Nobody knows it, but the lander may already be in the frame.",
    narration:
      "February twenty-eighth, 2013. HiRISE takes a picture of the middle of Beagle 2's landing zone, at twenty-eight centimeters per pixel. Nobody knows it, but the lander may already be in the frame. The image sits in the archive of the University of Arizona. A second picture, in June 2014, will let scientists compare the two.",
    facts: [["Image", "ESP_030908_1915"], ["Detail", "27.8 cm / pixel"], ["Place", "11.5° N, 90.5° E"]],
  },
  {
    id: "bgl045", part: "mars", date: "May 7, 2014", place: "Isidis Planitia", title: "The leader is gone",
    summary: "Colin Pillinger dies at 70, months before his lander is found. He never learns where it ended up.",
    narration:
      "May seventh, 2014. Colin Pillinger dies at seventy, two days before his birthday. His career began in 1968 analyzing Apollo moon samples. The European Space Agency called him the driving force behind Beagle 2, a lander that cost about forty million dollars, when NASA's Viking landers had cost a billion. He never learns where his lander is.",
    facts: [["Born", "1943"], ["Died", "7 May 2014"], ["Cost", "$40 M vs $1 billion for Viking"]],
  },
  {
    id: "bgl048", part: "mars", date: "Jan 2015", place: "Isidis Planitia", title: "A citizen scientist's lead",
    summary: "Michael Croon, a former Mars Express team member, asks for a picture through HiRISE's public program and spots a bright point at the frame's edge.",
    narration:
      "January, 2015. Michael Croon, a German amateur and former Mars Express operations team member, uses HiRISE's public request program, HiWish, to ask for a picture of the landing zone. Comparing images from 2013 and 2014, he spots a bright point at the edge of the frame. It leads to the first sight of Beagle 2.",
    facts: [["Who", "Michael Croon, Trier"], ["How", "HiWish, public requests"], ["Images", "Feb 2013 and Jun 2014"]],
  },
  {
    id: "bgl049", part: "mars", date: "Jan 2015", place: "Isidis Planitia", title: "Found on the surface",
    summary: "HiRISE shows Beagle 2 on the plain, more than eleven years after it vanished, with its panels at least partly open.",
    narration:
      "January, 2015. HiRISE shows Beagle 2 on the surface, more than eleven years after it vanished, with its solar panels at least partly open. A second picture, in different sunlight, shows glints in other places: more than one open panel. Nearby lie its back cover with the small parachute, and the main parachute.",
    facts: [["Place", "11.5° N, 90.4° E"], ["Size", "Under 2 m wide"], ["Nearby", "Back cover and parachutes"]],
  },
  // ───────────────────────────── after the discovery: the comic ─────────────────────────────
  {
    id: "bgl051", part: "outro", date: "Jan 16, 2015", title: "It landed, but did not call",
    summary: "NASA and the UK Space Agency announce it: the landing worked. A panel that stayed closed may have blocked the antenna.",
    narration:
      "January sixteenth, 2015. NASA and the UK Space Agency announce it: Beagle 2 reached the surface on Christmas Day, 2003, as planned. The entry, descent and landing had worked. But the radio antenna only comes out when all four panels open. The images suggest at least one stayed closed, which would explain eleven years of silence.",
    facts: [["Announced", "16 Jan 2015"], ["Landing", "It worked: 25 Dec 2003"], ["Likely problem", "Panels covering the antenna"]],
  },
  {
    id: "bgl052", part: "outro", date: "Jan 16, 2015", title: "«It hit the crossbar»",
    summary: "Pillinger's widow speaks of immense pride and great sadness: the lander almost made it. In football terms, it hit the crossbar.",
    narration:
      "January, 2015. Colin Pillinger's widow, Doctor Judith Pillinger, speaks of immense pride tinged with great sadness, because Colin could not share the news. Beagle 2, she says, hit the crossbar: it almost made it. It was not a plain failure or a success, but a small British lander that touched Mars on a very tight budget.",
    facts: [["Said by", "Dr Judith Pillinger"], ["Landed", "25 Dec 2003"], ["Found", "Jan 2015"]],
  },
];

export const PARTS = [
  { id: "intro", title: "Earth", blurb: "Before Mars: a bold idea, a tiny budget, a launch and a release, told as a comic." },
  { id: "mars", title: "Mars", blurb: "Twelve moments around a silent lander on Isidis Planitia: Beagle 2 never moves, so press Space to go from one moment to the next." },
  { id: "outro", title: "Legacy", blurb: "After the discovery." },
];
