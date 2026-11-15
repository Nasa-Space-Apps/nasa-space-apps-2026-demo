/**
 * Story data of Ingenuity: the copy (English) of its 20 beats, in chronological order, plus where its facts, art and 3D terrain come from. Read by
 * scripts/build-story.mjs, which writes public/models/ingenuity/story.json. Same format and rules as opportunity-story.mjs (docs/story.md): narration ~45 words,
 * numbers spelled out, every fact from the dossiers (misiones/ingenuity/dossiers). Contested figures (exact flight distances, flight-34 date…) are left out.
 * part: intro = before the 3D (comic pages), mars = a 3D stop, outro = comic pages after the 3D.
 */
export const MISSION = "ingenuity";
export const NAME = "Ingenuity";
export const TITLE = "Ingenuity: the first flight on another world";
/** Research dossiers of the mission (ingNNN/dossier.json) */
export const DOSSIERS = "misiones/ingenuity/dossiers";
// no `sourceImage`: the art is generated straight into public/models/ingenuity/images (npm run story-images -- ingenuity)
/** 3D terrain of the mission and the line its stops follow (Airfield Zero → Wright Brothers Field → the Jezero flights → the last flight) */
export const TERRAIN = "public/models/gale-terrain.stl";
export const ANCHORS = [[-277, -157], [-309, -91], [-299, -59], [-247, 45], [-149, 119], [75, 85]];
/** The closing card after the last page of the story */
export const CLOSING = { title: "thank you, Ingenuity", text: "Planned for five flights in thirty days, it flew seventy-two times and covered 17 km of Mars." };

export const BEATS = [
  // ───────────────────────────── before Mars: the comic ─────────────────────────────
  {
    id: "ing001", part: "intro", date: "1990s", title: "A helicopter for Mars",
    summary: "At a conference, JPL engineer Bob Balaram hears about a tiny flying vehicle and asks: could it fly on Mars? His proposal is praised, but not funded.",
    narration:
      "In the nineteen nineties, at a conference, JPL engineer Bob Balaram hears about the mesicopter, a tiny flying vehicle. He asks himself: could something like it fly on Mars? His proposal gets good reviews, but no funding. The idea sits on a shelf for fifteen years.",
    facts: [["Engineer", "Bob Balaram"], ["Idea", "A tiny flyer for Mars"], ["On the shelf", "15 years"]],
  },
  {
    id: "ing010", part: "intro", date: "May 31, 2016", title: "Flight in a fake Mars",
    summary: "In a huge vacuum chamber filled with thin carbon dioxide, a full-size prototype hovers. Powered, controlled flight can work in Mars-like air.",
    narration:
      "May thirty-first, 2016. Inside a huge vacuum chamber at JPL, filled with thin carbon dioxide to imitate Mars, a full-size prototype hovers on its own. It is the first proof that powered, controlled flight can work in Mars-like air. The team calls it their Wright Brothers moment.",
    facts: [["Place", "JPL Space Simulator"], ["Air", "Thin carbon dioxide"], ["Result", "First Mars-like hover"]],
  },
  {
    id: "ing018", part: "intro", date: "Apr 29, 2020", title: "A student names it",
    summary: "NASA names the helicopter Ingenuity, an idea from Vaneeza Rupani, an eleventh-grade student from Alabama.",
    narration:
      "April twenty-ninth, 2020. NASA gives the little helicopter its name: Ingenuity. It comes from Vaneeza Rupani, an eleventh-grade student from Alabama, who took part in a naming contest that drew about twenty-eight thousand essays. The helicopter weighs just four pounds, two kilograms.",
    facts: [["Name by", "Vaneeza Rupani"], ["Essays", "~28,000"], ["Weight", "2 kg"]],
  },
  {
    id: "ing019", part: "intro", date: "Jul 30, 2020", title: "Riding under the rover",
    summary: "An Atlas V lifts off with Perseverance. Strapped to its belly is Ingenuity, a tech demo with no science instruments and a plan of five flights.",
    narration:
      "July thirtieth, 2020. An Atlas Five rocket lifts off from Cape Canaveral, carrying Perseverance. Strapped to the rover's belly rides a small passenger: Ingenuity. It has no science instruments. Its only job is to prove that flight is possible on Mars. The plan: up to five flights in thirty days.",
    facts: [["Rocket", "Atlas V 541"], ["Liftoff", "7:50 am EDT"], ["Plan", "5 flights · 30 days"]],
  },
  {
    id: "ing021", part: "intro", date: "Feb 18, 2021", title: "Landing in Jezero",
    summary: "Perseverance lands in Jezero Crater with Ingenuity under its belly. Flying here is hard: the air is thin and the nights are deadly cold.",
    narration:
      "February eighteenth, 2021. Perseverance lands in Jezero Crater, with Ingenuity under its belly. Mars is brutal for flying: its air is only one percent as dense as Earth's, and the nights fall to minus ninety degrees Celsius. The team has picked a flat airfield, ten meters by ten.",
    facts: [["Landing", "Jezero Crater"], ["Air density", "1% of Earth's"], ["Airfield", "10 × 10 m"]],
  },
  // ───────────────────────────── on Mars: the 3D route ─────────────────────────────
  {
    id: "ing023", part: "mars", date: "Mar 23, 2021", place: "Jezero Crater", title: "A piece of the Wright Flyer",
    summary: "Ingenuity carries a tiny swatch of fabric from the Wright brothers' first airplane, wrapped in protective film.",
    narration:
      "March twenty-third, 2021. Chief engineer Bob Balaram reveals a secret: Ingenuity carries a tiny swatch of fabric from the Wright brothers' first airplane, wrapped in protective film. It is only one point three centimeters wide. The first airplane to fly on Earth sends a piece of itself to Mars.",
    facts: [["Fabric", "Wright Flyer 1 muslin"], ["Size", "1.3 × 1.3 cm"], ["Revealed", "23 Mar 2021"]],
  },
  {
    id: "ing026", part: "mars", date: "Apr 3, 2021", place: "Octavia E. Butler Landing", title: "Set down on Mars",
    summary: "Perseverance lowers Ingenuity onto the ground and drives about four meters away, so sunlight can start charging its batteries.",
    narration:
      "April third, 2021. Perseverance lowers Ingenuity onto the surface of Mars. Then the rover drives about four meters away, so sunlight can start charging the helicopter's six batteries. It has to happen within twenty-five hours. From now on, Ingenuity is on its own.",
    facts: [["Distance", "~4 m from the rover"], ["Batteries", "6 lithium-ion"], ["Deadline", "25 hours"]],
  },
  {
    id: "ing027", part: "mars", date: "Apr 4, 2021", place: "Octavia E. Butler Landing", title: "The first night",
    summary: "Nights in Jezero fall to minus ninety degrees. Ingenuity has to survive its first one alone, and it does.",
    narration:
      "April fourth, 2021. The first night alone is the biggest test. Temperatures in Jezero can fall to minus ninety degrees Celsius, cold enough to crack electronics and damage batteries. Ingenuity has the insulation, the heaters and the energy. In the morning, Perseverance's camera sees it: the helicopter survived.",
    facts: [["Night cold", "Down to −90 °C"], ["Sol", "44"], ["Project lead", "MiMi Aung"]],
  },
  {
    id: "ing029", part: "mars", date: "Apr 9, 2021", place: "Jezero airfield", title: "The watchdog says stop",
    summary: "A high-speed rotor test ends early when a watchdog timer stops it. It did its job. The first flight is postponed.",
    narration:
      "April ninth, 2021. During a high-speed spin test of the rotors, the command sequence ends early: a watchdog timer stops it. The watchdog did exactly what it was built to do. The helicopter is safe, and sends all its data home. The first flight slips to no earlier than April fourteenth.",
    facts: [["Test", "Rotor spin-up"], ["Cause", "Watchdog timer"], ["Sol", "49"]],
  },
  {
    id: "ing032", part: "mars", date: "Apr 19, 2021", place: "Wright Brothers Field", title: "Flight 1",
    summary: "Ingenuity rises three meters, hovers and lands. It is the first powered, controlled flight on another planet, and it flies itself.",
    narration:
      "April nineteenth, 2021. Ingenuity rises three meters, hovers for thirty seconds and lands. The whole flight lasts thirty-nine point one seconds. It is the first powered, controlled flight on another planet, and nobody is steering: the helicopter flies itself. Confirmation reaches JPL at six forty-six in the morning.",
    facts: [["Altitude", "3 m"], ["Duration", "39.1 s"], ["First", "Powered flight on another planet"]],
  },
  {
    id: "ing034", part: "mars", date: "Apr 22, 2021", place: "Wright Brothers Field", title: "Flight 2: a view from above",
    summary: "Flight two goes higher and sideways. At about five meters, the color camera takes the first aerial color photo of Mars.",
    narration:
      "April twenty-second, 2021. Flight two goes higher, longer, and sideways: Ingenuity tilts five degrees and slides two meters west. At about five meters up, its color camera takes the first aerial color photograph of Mars, showing the rover's wheel tracks and the helicopter's own landing legs.",
    facts: [["Duration", "51.9 s"], ["Altitude", "~5 m"], ["Photo", "First aerial color image"]],
  },
  {
    id: "ing038", part: "mars", date: "Apr 30, 2021", place: "Wright Brothers Field", title: "From demo to scout",
    summary: "Ingenuity beat every expectation, so NASA changes its job: from a technology demo to an aerial scout for the rover.",
    narration:
      "April thirtieth, 2021. Ingenuity beat every expectation, so NASA changes its job. The technology demonstration is over. A new phase begins to test how an aerial scout can help explore Mars. Flights will come every two or three weeks, starting with flight six.",
    facts: [["Announced", "30 Apr 2021"], ["New phase", "Operations demo"], ["Pace", "1 flight / 2–3 weeks"]],
  },
  {
    id: "ing043", part: "mars", date: "May 22, 2021", place: "Jezero Crater", title: "Flight 6: a lost picture",
    summary: "One navigation image is lost and every later one carries the wrong timestamp. The helicopter wobbles hard, and still lands safely.",
    narration:
      "May twenty-second, 2021. Flight six, the first of the extended mission. About fifty-four seconds in, one navigation image is lost, and every later image carries the wrong timestamp. The software corrects errors that are not real, and the helicopter tilts more than twenty degrees. It still lands safely.",
    facts: [["Lost image", "After ~54 s"], ["Tilt", "More than 20°"], ["Control rate", "500 times / s"]],
  },
  {
    id: "ing069", part: "mars", date: "Apr 19, 2022", place: "Jezero Crater", title: "Flight 26: the leftovers of a landing",
    summary: "One year after its first flight, Ingenuity photographs the parachute and back shell of Perseverance's landing, a request from Mars Sample Return engineers.",
    narration:
      "April nineteenth, 2022, exactly one year after the first flight. Ingenuity photographs the wreckage of Perseverance's landing: ten color pictures of the parachute and back shell. Engineers planning a future sample return asked for them. The parachute is twenty-one and a half meters wide.",
    facts: [["Flight", "159 s · 8 m high"], ["Photos", "10 in color"], ["Parachute", "21.5 m wide"]],
  },
  {
    id: "ing072", part: "mars", date: "May 3, 2022", place: "Jezero Crater", title: "Missing the appointment",
    summary: "In winter, Ingenuity's battery drops below a critical level, its electronics shut down and it misses its call with Perseverance. A signal returns the next sol.",
    narration:
      "May third, 2022. It is winter on Mars. Ingenuity's battery falls below a critical level, its control electronics shut down, and it misses its radio appointment with Perseverance. The rover listens for almost a whole sol. At last, around eleven forty-five in the morning, a signal returns.",
    facts: [["Battery at contact", "41%"], ["Needed for the night", "At least 70%"], ["Winter night", "~−80 °C"]],
  },
  {
    id: "ing083", part: "mars", date: "Nov 2022", place: "Jezero Crater", title: "Flight 34: a new brain",
    summary: "A short flight tests a software update: Ingenuity can now pick a safe landing spot in mid-air and read digital elevation maps.",
    narration:
      "November, 2022. Flight thirty-four lasts only eighteen seconds, and climbs to about five meters. But it debuts a new brain: a software update that lets Ingenuity pick a safe landing spot in mid-air, and use digital elevation maps to tell hills from its own motion.",
    facts: [["Duration", "18 s"], ["New skill 1", "Hazard avoidance"], ["New skill 2", "Elevation maps"]],
  },
  {
    id: "ing107", part: "mars", date: "Sep–Oct 2023", place: "Jurabi Point", title: "Records at Jurabi Point",
    summary: "On flat ground, the team pushes the limits: twice the old altitude, nearly twice the speed, and soft landings for a future helicopter.",
    narration:
      "September and October, 2023. On the flat ground of Jurabi Point, the team pushes Ingenuity's limits. Flight sixty-one reaches twenty-four meters, double the old record. Flight sixty-two flies forward at ten meters per second. They also test soft landings, a lesson for the future Sample Recovery Helicopter.",
    facts: [["Altitude record", "24 m (was 12 m)"], ["Speed record", "10 m/s"], ["Soft landing", "0.75 m/s"]],
  },
  {
    id: "ing127", part: "mars", date: "Jan 18, 2024", place: "Jezero Crater", title: "Flight 72: the last flight",
    summary: "A quick vertical hop to check the helicopter's systems. About one meter above the ground, contact is lost. Later photos show damaged rotor blades.",
    narration:
      "January eighteenth, 2024. Flight seventy-two is meant to be a quick vertical hop to check the helicopter's systems. Ingenuity climbs to twelve meters and hovers for four and a half seconds. About one meter above the ground on the way down, contact is lost. Photos later show damaged rotor blades.",
    facts: [["Altitude", "12 m"], ["Hover", "4.5 s"], ["Contact lost", "~1 m above ground"]],
  },
  // ───────────────────────────── after the last flight: the comic ─────────────────────────────
  {
    id: "ing130", part: "outro", date: "Jan 25, 2024", title: "The mission ends",
    summary: "NASA declares the mission complete: designed for five flights in thirty days, Ingenuity flew seventy-two times in almost three years.",
    narration:
      "January twenty-fifth, 2024. NASA declares Ingenuity's mission complete. It was designed for up to five test flights in thirty days. Instead, it flew seventy-two times in almost three years: one hundred twenty-eight point eight minutes in the air, seventeen kilometers, from forty-eight airfields.",
    facts: [["Flights", "72"], ["Airtime", "128.8 min"], ["Distance", "17.0 km"]],
  },
  {
    id: "ing137", part: "outro", date: "Dec 11, 2024", title: "The next helicopter",
    summary: "NASA presents Mars Chopper, a concept for Ingenuity's successor: six rotors, the size of an SUV, twenty times heavier. It has no launch date yet.",
    narration:
      "December eleventh, 2024. NASA presents Mars Chopper, a concept for Ingenuity's successor. It has six rotors, thirty-six blades in all, the size of an SUV, and is twenty times heavier than Ingenuity. It is still only a concept, with no launch date. The next helicopter will stand on Ingenuity's shoulders.",
    facts: [["Rotors", "6 · 36 blades"], ["Weight", "20× Ingenuity"], ["Status", "Concept"]],
  },
];

export const PARTS = [
  { id: "intro", title: "Earth", blurb: "Before Mars: a shelved idea, a prototype, a name and a launch, told as a comic." },
  { id: "mars", title: "Mars", blurb: "Three years in Jezero Crater: fly the helicopter from one story to the next." },
  { id: "outro", title: "Legacy", blurb: "After the last flight." },
];
