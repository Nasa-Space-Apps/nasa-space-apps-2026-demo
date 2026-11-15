/**
 * Story data of InSight: the copy (English) of its 20 beats, in chronological order, plus where its facts, art and 3D terrain come from. Read by
 * scripts/build-story.mjs, which writes public/models/insight/story.json. Same format and rules as opportunity-story.mjs (docs/story.md): narration ~45 words,
 * numbers spelled out, every fact from the dossiers (misiones/insight/dossiers). Contested figures are left out (how deep the mole got: 30 or 40 cm; the day
 * the mission was declared over: 20 or 21 Dec; the core radius is given as the 2021 estimate and not the 2023 revision).
 * part: intro = before the 3D (comic pages), mars = a 3D moment, outro = comic pages after the 3D.
 *
 * InSight never moved: STATIONARY = true. In the 3D scene the lander stays where it is and Space (or the timeline) moves from one moment of its story to
 * the next (docs/story.md, «Vehículos inmóviles»); every stop of the route is the same spot, BASE.
 */
export const MISSION = "insight";
export const NAME = "InSight";
export const TITLE = "InSight: the lander that listened to Mars";
/** Research dossiers of the mission (insNNN/dossier.json) */
export const DOSSIERS = "misiones/insight/dossiers";
// no `sourceImage`: the art is generated straight into public/models/insight/images (npm run story-images -- insight)
/** 3D terrain: the flat plain of the Meridiani model stands in for Elysium Planitia; the lander sits at BASE (flat ground, ~1° slope) */
export const TERRAIN = "public/models/terrain.stl";
export const STATIONARY = true;
export const BASE = [0, 75];
/** The closing card after the last page of the story */
export const CLOSING = { title: "thank you, InSight", text: "Designed for one Martian year, it listened to Mars for more than four and recorded 1,319 marsquakes." };

export const BEATS = [
  // ───────────────────────────── before Mars: the comic ─────────────────────────────
  {
    id: "ins003", part: "intro", date: "Aug 20, 2012", title: "A mission to hear inside Mars",
    summary: "NASA picks InSight from 28 proposals to explore the inside of Mars. Two rivals lose: a boat for a sea on Titan and a comet hopper.",
    narration:
      "August twentieth, 2012. NASA picks InSight as its next Discovery mission, out of twenty-eight proposals. It beats a boat for a methane sea on Titan and a comet hopper. Its goal is new: to listen to the inside of Mars, with a seismometer, a heat probe and a radio experiment.",
    facts: [["Selected", "20 Aug 2012"], ["Rivals", "TiME and Comet Hopper"], ["Budget cap", "$425 M (2010 dollars)"]],
  },
  {
    id: "ins006", part: "intro", date: "Dec 22, 2015", title: "A leak stops the launch",
    summary: "NASA cancels the March 2016 launch: the French seismometer keeps losing its vacuum seal in the final cold tests.",
    narration:
      "December twenty-second, 2015. NASA calls off the launch planned for March. The French-built seismometer, so sensitive it can feel ground motion smaller than an atom, keeps leaking its vacuum. In the final tests at minus forty-five degrees Celsius it fails again. There is no time left to fix it before the window closes.",
    facts: [["Window", "4–30 Mar 2016"], ["Cause", "Vacuum leaks in SEIS"], ["Final test", "−45 °C"]],
  },
  {
    id: "ins012", part: "intro", date: "May 5, 2018", title: "First to Mars from the West Coast",
    summary: "An Atlas V lifts off from Vandenberg, California: the first mission to another planet to leave from the West Coast. Two tiny CubeSats ride along.",
    narration:
      "May fifth, 2018, at four oh five in the morning. An Atlas Five lifts off from Vandenberg, in California. It is the first time a mission to another planet leaves from the West Coast. Two tiny CubeSats, called MarCO, ride along. The trip to Mars will take two hundred five days.",
    facts: [["Rocket", "Atlas V 401"], ["Pad", "Vandenberg, California"], ["Trip", "205 days"]],
  },
  {
    id: "ins019", part: "intro", date: "Nov 26, 2018", title: "Six and a half minutes",
    summary: "InSight hits the Martian air at 12,300 mph and lands by itself in six and a half minutes. Two CubeSats relay the news to Earth.",
    narration:
      "November twenty-sixth, 2018. InSight hits the Martian atmosphere at twelve thousand three hundred miles per hour. For about six and a half minutes it works alone: parachute, then rockets. Two small CubeSats relay the news. At eleven fifty-three in the morning, Pacific time, Earth hears: InSight has landed.",
    facts: [["Entry speed", "12,300 mph"], ["Landing", "~6.5 minutes"], ["Signal", "11:52:59 am PST"]],
  },
  // ───────────────────────────── on Mars: the 3D, the lander never moves ─────────────────────────────
  {
    id: "ins022", part: "mars", date: "Dec 1, 2018", place: "Elysium Planitia", title: "Hearing the wind",
    summary: "Five days after landing, wind shakes the two big solar panels and the seismometer feels it: the whole lander is a giant ear.",
    narration:
      "December first, 2018, five days after landing. The seismometer, still sitting on the deck, feels something: wind. Gusts of ten to fifteen miles per hour shake the two big solar panels, each two point two meters wide. The whole lander acts like a giant ear. The team calls the sound an unplanned gift.",
    facts: [["Wind", "16–24 km/h"], ["Direction", "Northwest → southeast"], ["Panels", "2.2 m wide"]],
  },
  {
    id: "ins023", part: "mars", date: "Dec 6, 2018", place: "Elysium Planitia", title: "The first selfie",
    summary: "On sol 10 the arm's camera takes eleven pictures that are stitched into the first portrait of the lander, with spotless panels.",
    narration:
      "December sixth, 2018, sol ten. InSight takes its first selfie. A camera on the elbow of its one point eight meter arm shoots eleven pictures that are stitched into one. The solar panels are spotless. A second mosaic of fifty-two photos maps the workspace in front of the lander.",
    facts: [["Sol", "10"], ["Photos stitched", "11"], ["Camera", "IDC, on the arm's elbow"]],
  },
  {
    id: "ins026", part: "mars", date: "Dec 19, 2018", place: "Elysium Planitia", title: "The seismometer touches ground",
    summary: "The robotic arm lifts the French seismometer from the deck and sets it on the ground at dusk: a first on another planet.",
    narration:
      "December nineteenth, 2018. The robotic arm lifts the seismometer from the deck and sets it on the ground, at dusk. It is the first time a spacecraft places a seismometer on the surface of another planet. The arm reaches one point eight meters. An instrument built in France now touches Mars.",
    facts: [["Arm reach", "1.8 m"], ["Placed", "19 Dec 2018"], ["Built by", "CNES (France)"]],
  },
  {
    id: "ins029", part: "mars", date: "Feb 12, 2019", place: "Elysium Planitia", title: "The mole is set down",
    summary: "The arm sets the German heat probe on the ground. Inside is the mole, a self-hammering nail that must dig 3–5 meters.",
    narration:
      "February twelfth, 2019. The arm sets down the German heat probe, HP3, about one and a half meters from the lander. Inside is the mole: a self-hammering nail forty centimeters long. It must dig at least three meters, and up to five, to measure how much heat Mars loses from its inside.",
    facts: [["Mole", "40 cm × 2.7 cm"], ["Target depth", "3–5 m"], ["Built by", "DLR (Germany)"]],
  },
  {
    id: "ins032", part: "mars", date: "Apr 6, 2019", place: "Elysium Planitia", title: "A first marsquake",
    summary: "On sol 128 the seismometer feels a faint rumble that seems to come from inside Mars: the third world, after Earth and the Moon, with a quake.",
    narration:
      "April sixth, 2019, sol one twenty-eight. The seismometer picks up a faint rumble. It looks like the first quake from inside Mars, not from the wind. Mars becomes the third body, after Earth and the Moon, where a quake has been recorded. The planet is so quiet that SEIS can hear tiny tremors.",
    facts: [["Sol", "128"], ["First", "Quake from inside Mars"], ["Third body", "After Earth and the Moon"]],
  },
  {
    id: "ins038", part: "mars", date: "Oct 26, 2019", place: "Elysium Planitia", title: "Helping the mole with a scoop",
    summary: "The mole has been stuck since February: the ground has a hard crust. The scoop presses it against the wall of the hole, and it backs halfway out.",
    narration:
      "October twenty-sixth, 2019. The mole has been stuck since February: a hard crust, five to ten centimeters thick, gives it no grip. The team gets creative. The arm's scoop presses the mole against the wall of the hole, like a hand holding a nail. Instead of going down, the mole backs halfway out.",
    facts: [["Stuck since", "28 Feb 2019"], ["Hard crust", "5–10 cm thick"], ["Fix tried", "Scoop pressing the mole"]],
  },
  {
    id: "ins049", part: "mars", date: "Jan 14, 2021", place: "Elysium Planitia", title: "The end of the mole",
    summary: "After almost two years, NASA and the German space agency stop trying: the soil clumps and the mole never found the grip it needed.",
    narration:
      "January fourteenth, 2021. After almost two years, NASA and the German space agency stop trying. The soil clumps, so the mole never has the grip it needs. It was designed from the soil of Spirit and Opportunity, but Elysium is different. The goal was three meters. The mole never got far below the surface.",
    facts: [["Goal", "3 m deep"], ["Started", "28 Feb 2019"], ["Ended", "14 Jan 2021"]],
  },
  {
    id: "ins051", part: "mars", date: "May 22, 2021", place: "Elysium Planitia", title: "Cleaning panels with sand",
    summary: "Dust is choking the panels. An idea: pour sand at midday and let the wind-blown grains hop across and sweep the dust away.",
    narration:
      "May twenty-second, 2021, sol eight eighty-four. Dust is choking InSight's panels. Scientist Matt Golombek has an idea: pour sand near a panel at midday, in the windy hour. Bigger grains hop across and sweep the dust away. It works, a little. Power was five thousand watt-hours a day at landing; by 2022, about five hundred.",
    facts: [["Sol", "884"], ["Power at landing", "~5,000 Wh / sol"], ["Power in 2022", "~500 Wh / sol"]],
  },
  {
    id: "ins054", part: "mars", date: "Jul 2021", place: "Elysium Planitia", title: "The inside of Mars, mapped",
    summary: "Three studies in Science use about 35 of the best marsquakes to measure the crust, the mantle and the liquid core, like an ultrasound of a planet.",
    narration:
      "July, 2021. Three studies in the journal Science use InSight's quakes to see inside Mars. Seismic waves bounce between layers like echoes. About thirty-five good quakes are enough to measure the crust, the mantle and a liquid core. It is like an ultrasound of a whole planet.",
    facts: [["Quakes recorded", "733 in the first years"], ["Crust", "20–37 km thick"], ["Core", "Liquid · 1,830 km (2021)"]],
  },
  {
    id: "ins059", part: "mars", date: "Dec 24, 2021", place: "Elysium Planitia", title: "A Christmas Eve impact",
    summary: "On sol 1094 a strong quake turns out to be a space rock hitting Mars 3,500 km away and digging a 150-meter crater.",
    narration:
      "December twenty-fourth, 2021, sol one thousand ninety-four. The seismometer feels a strong quake. Months later, scientists find the cause: a space rock, five to twelve meters wide, struck Mars about thirty-five hundred kilometers away and dug a crater one hundred fifty meters across. Its waves give the first clear surface waves ever seen on Mars.",
    facts: [["Sol", "1094"], ["Crater", "~150 m wide, 21 m deep"], ["Distance", "~3,500 km away"]],
  },
  {
    id: "ins061", part: "mars", date: "Apr 24, 2022", place: "Elysium Planitia", title: "The last selfie",
    summary: "On sol 1211 InSight takes its last selfie: the panels are covered in red dust and make a tenth of the power they gave at landing.",
    narration:
      "April twenty-fourth, 2022, sol one thousand two hundred eleven. InSight takes its last selfie. Compared with the first one, in 2018, the panels are clearly covered in red dust. Power has fallen from about five thousand watt-hours a day to about five hundred, a tenth. Sand poured from the scoop helped, but could not stop the decline.",
    facts: [["Sol", "1211"], ["Power then", "~500 Wh / sol"], ["First selfie", "Sol 10, clean panels"]],
  },
  {
    id: "ins063", part: "mars", date: "May 4, 2022", place: "Elysium Planitia", title: "The biggest marsquake",
    summary: "The magnitude 4.7 quake of sol 1222 rings Mars for about ten hours, and its waves circle the planet several times.",
    narration:
      "May fourth, 2022, sol twelve twenty-two. InSight records the biggest marsquake of its life: magnitude four point seven, at least five times bigger than the previous record. Its waves last about ten hours and nearly saturate the seismometer, even though the epicenter is over two thousand kilometers away. Surface waves circle the planet several times.",
    facts: [["Sol", "1222"], ["Magnitude", "4.7"], ["Duration", "~10 hours"]],
  },
  {
    id: "ins065", part: "mars", date: "Jun 2022", place: "Elysium Planitia", title: "Only SEIS stays on",
    summary: "Dust has cut the lander's power. Every instrument is switched off except the seismometer, which keeps listening a little longer.",
    narration:
      "June, 2022. Dust has cut the lander's power to almost nothing. One by one, every instrument is turned off. The team decides that the seismometer, the only one left, keeps listening a little longer, even if it drains the batteries sooner. It has already recorded more than thirteen hundred marsquakes.",
    facts: [["Quakes heard", "1,300+"], ["First plan", "Off by end of June"], ["New plan", "On until Aug–Sep"]],
  },
  {
    id: "ins072", part: "mars", date: "Dec 19, 2022", place: "Elysium Planitia", title: "«My power's really low»",
    summary: "The mission's social media account posts what may be the last image: the lander's time has been both productive and serene.",
    narration:
      "December nineteenth, 2022. The mission's account on social media posts a message: my power's really low, so this may be the last image I can send. Don't worry about me, my time here has been both productive and serene. InSight last spoke to Earth on December fifteenth, after hearing one thousand three hundred nineteen marsquakes.",
    facts: [["Last contact", "15 Dec 2022"], ["Last post", "19 Dec 2022"], ["Marsquakes", "1,319"]],
  },
  // ───────────────────────────── after the last signal: the comic ─────────────────────────────
  {
    id: "ins074", part: "outro", date: "Dec 2022", title: "The end of the mission",
    summary: "After two missed calls in a row, NASA declares the mission over: the batteries are dead. It worked more than twice as long as planned.",
    narration:
      "December, 2022. After two missed calls in a row, NASA declares the mission over: the batteries are dead. Years of dust on the panels cut the power. InSight was designed for one Martian year, about two Earth years, and worked more than four. It detected one thousand three hundred nineteen marsquakes.",
    facts: [["Last contact", "15 Dec 2022"], ["Planned life", "1 Martian year"], ["Lasted", "4+ years"]],
  },
  {
    id: "ins084", part: "outro", date: "Oct 23, 2024", title: "A last look from orbit",
    summary: "The HiRISE camera photographs InSight: its panels are now the same red-brown as the ground, and the lander almost disappears.",
    narration:
      "October twenty-third, 2024. The HiRISE camera on the Mars Reconnaissance Orbiter photographs InSight as a farewell. The panels are now the same red-brown as the ground, and the lander almost disappears. In 2018 it showed as a bright blue dot. After two years of silence, NASA planned to stop listening for it by the end of 2024.",
    facts: [["Camera", "HiRISE, on MRO"], ["Altitude", "272 km"], ["Detail", "27.3 cm / pixel"]],
  },
];

export const PARTS = [
  { id: "intro", title: "Earth", blurb: "Before Mars: a contest, a leak, a launch and a landing, told as a comic." },
  { id: "mars", title: "Mars", blurb: "Four years on Elysium Planitia: InSight never moves, so press Space to go from one moment to the next." },
  { id: "outro", title: "Legacy", blurb: "After the last signal." },
];
