/**
 * Story data of Surveyor 3: the copy (English) of its 20 beats, in chronological order, plus where its facts, art and 3D terrain come from. Read by
 * scripts/build-story.mjs, which writes public/models/surveyor3/story.json. Same format and rules as opportunity-story.mjs (docs/story.md): narration ~45 words,
 * numbers spelled out, every fact from the dossiers (misiones/surveyor3/dossiers). Contested figures are left out or rounded: the number of TV pictures (6,315 vs
 * 6,326), the number of bearing tests (4 vs 7), the reach of the arm (1.5 vs 1.63 m), the distance to the Apollo 12 module (155 / 163 / 180 m: the card says «~160 m», the figure most sources give: 535 ft).
 * part: intro = before the 3D (comic pages), mars = a 3D moment (here: on the Moon), outro = comic pages after the 3D.
 *
 * Surveyor 3 never moved after its two bounces (it sat tilted on a slope inside the crater for the rest of its life): STATIONARY = true (hito 54). In the 3D the
 * lander stays at BASE and Space (or the timeline) goes from one moment of its story to the next (docs/story.md, «Vehículos inmóviles»).
 */
export const MISSION = "surveyor3";
export const NAME = "Surveyor 3";
export const TITLE = "Surveyor 3: the robot Apollo came to visit";
/** Research dossiers of the mission (surNNN/dossier.json) */
export const DOSSIERS = "misiones/surveyor3/dossiers";
// no `sourceImage`: the art is generated straight into public/models/surveyor3/images (npm run story-images -- surveyor3)
/** 3D terrain of the mission (the Moon model, 256 × 256 u) and the line its stops follow (the line the earlier demo routes of the Moon took) */
export const TERRAIN = "public/models/moon-terrain.stl";
export const STATIONARY = true;
export const BASE = [-30, -20]; // a gently sloping spot of the Moon model (mean slope ~5°: the real lander rested tilted on a ~12° slope)
export const ANCHORS = [[55, -60], [-30, -30], [70, 50], [-85, 10], [-35, 100]];
/** Planner settings for this terrain (see scripts/plan-story-route.mjs): the Moon model is small, so the safe area is smaller and the stops are closer */
export const BOUNDS = { x0: -100, x1: 100, z0: -105, z1: 105 };
export const FADE = 30;
export const MIN_APART = 38;
export const SNAP_REACH = 12;
/** The closing card after the last page of the story */
export const CLOSING = { title: "thank you, Surveyor 3", text: "A robot that tested the ground for Apollo and then received Apollo's visit: still the only probe humans have ever walked up to on another world." };

export const BEATS = [
  // ───────────────────────────── before the Moon: the comic ─────────────────────────────
  {
    id: "sur001", part: "intro", date: "May 1960", title: "A plan for the Moon",
    summary: "NASA approves Surveyor, a robot to land softly on the Moon, and gives it to JPL. The first plan is far bigger than what will fly.",
    narration:
      "May, 1960. NASA approves Surveyor, a robot that will land softly on the Moon, and gives the job to the Jet Propulsion Laboratory. At first the plan is huge: more than two dozen instruments, and even an orbiter. Then President Kennedy promises people on the Moon, and everything changes.",
    facts: [["Approved", "May 1960"], ["Managed by", "JPL"], ["Builder", "Hughes Aircraft"]],
  },
  {
    id: "sur005", part: "intro", date: "1962", title: "Three Rangers miss the Moon",
    summary: "The three Ranger probes of 1962, built by the same laboratory, all fail. Everyone wonders if a machine can land on the Moon.",
    narration:
      "Nineteen sixty-two. Three Ranger probes, built by the same laboratory, fly toward the Moon. Ranger three misses it. Ranger four fails completely. Ranger five misses too. Now the same team must build Surveyor, and everyone wonders whether a machine can really land on the Moon.",
    facts: [["Probes", "Ranger 3, 4 and 5"], ["Year", "1962"], ["Science returned", "None"]],
  },
  {
    id: "sur008", part: "intro", date: "Late 1962", title: "A thinner Surveyor",
    summary: "The Atlas-Centaur rocket keeps getting heavier and weaker, so Surveyor goes on a diet: about 950 kilograms, with 52 for instruments.",
    narration:
      "Late nineteen sixty-two. Surveyor depends on the Atlas-Centaur, the first rocket to burn liquid hydrogen in its upper stage, and the Centaur keeps getting heavier and weaker. So the lander must go on a diet: about nine hundred fifty kilograms, with only fifty-two for instruments.",
    facts: [["Mass", "~950 kg"], ["Instruments", "52 kg"], ["Rocket", "Atlas-Centaur"]],
  },
  {
    id: "sur011", part: "intro", date: "Jun 2, 1966", title: "The first soft landing",
    summary: "Surveyor 1 brakes from almost 10,000 km/h to about 5 km/h and sets down in the Ocean of Storms: the first American soft landing on the Moon.",
    narration:
      "June second, 1966. Surveyor One drops from the sky, slowing from almost ten thousand kilometers per hour to about five. Its engines stop three point four meters above the ground, and it settles. It is the first American soft landing on the Moon, in the Ocean of Storms.",
    facts: [["Landing", "2 Jun 1966"], ["Final speed", "~5 km/h"], ["Site", "Oceanus Procellarum"]],
  },
  {
    id: "sur022", part: "intro", date: "Apr 17, 1967", title: "Liftoff at night",
    summary: "An Atlas-Centaur rises from Cape Canaveral in the early hours carrying Surveyor 3, which weighs 1,026 kilograms at launch.",
    narration:
      "April seventeenth, 1967. In the dark early hours, an Atlas-Centaur lifts off from launch complex thirty-six B at Cape Canaveral, carrying Surveyor Three. Its upper stage burns liquid hydrogen and liquid oxygen. The lander weighs one thousand twenty-six kilograms now, and will weigh two hundred ninety-six on the Moon.",
    facts: [["Rocket", "Atlas-Centaur AC-12"], ["Liftoff", "07:05 UT"], ["Launch mass", "1,026 kg"]],
  },
  {
    id: "sur027", part: "intro", date: "Apr 17, 1967", title: "Finding Canopus",
    summary: "On the way to the Moon, Surveyor locks onto the Sun and then the star Canopus. For the first time in the program, the star lock works automatically.",
    narration:
      "Later that day, in deep space, Surveyor Three has to know where it is pointing. Its sensors lock onto the Sun, and then, nine hours after launch, onto the star Canopus. For the first time in the whole program, the star lock works by itself.",
    facts: [["Star", "Canopus"], ["Locked", "9 h 23 min after liftoff"], ["Guides", "Sun, star, gyros"]],
  },
  // ───────────────────────────── on the Moon: the 3D route ─────────────────────────────
  {
    id: "sur031", part: "mars", date: "Apr 20, 1967", place: "Oceanus Procellarum", title: "The radar loses its way",
    summary: "Seconds before touchdown the radar loses its link, probably fooled by glittering rocks. The engines do not cut off.",
    narration:
      "April twentieth, 1967. Seconds before touchdown, the radar loses its link, probably confused by glittering, reflective rocks. The guidance falls back to an inertial mode, and that prevents the engines from shutting off. Surveyor Three is still firing, a few meters above the Moon.",
    facts: [["Cause", "Reflective rocks (likely)"], ["Cutoff planned at", "~4.3 m"], ["Guidance", "Inertial mode"]],
  },
  {
    id: "sur032", part: "mars", date: "Apr 20, 1967", place: "Surveyor crater", title: "Two bounces",
    summary: "Surveyor 3 touches down still firing, rises about 10 meters, bounces again to about 3, and comes to rest in a crater when Earth switches the engines off.",
    narration:
      "Surveyor Three touches the Moon with its engines still burning, and rises again, about ten meters. It falls, bounces to about three meters, and finally settles inside a crater, tilted on a slope. About half a minute after the first touch, controllers on Earth command the engines off.",
    facts: [["Touchdowns", "3"], ["First bounce", "~10 m"], ["Second bounce", "~3 m"]],
  },
  {
    id: "sur035", part: "mars", date: "Apr 20, 1967", place: "Surveyor crater", title: "The first pictures",
    summary: "Less than an hour after landing, the camera starts sending pictures: more than six thousand in all, each one line by line, like a giant fax.",
    narration:
      "Less than an hour after landing, the camera starts to send pictures: more than six thousand in all. Each one travels line by line across almost four hundred thousand kilometers, like a giant fax. The simplest pictures take twenty seconds to arrive. Earth watches the Moon, slowly.",
    facts: [["Pictures", "More than 6,300"], ["Lenses", "25 and 100 mm"], ["Lines", "200 or 600"]],
  },
  {
    id: "sur015", part: "mars", date: "Apr 1967", place: "Surveyor crater", title: "A scoop on an arm",
    summary: "Surveyor 3 is the first of its series with a digging arm: a scissor-like pantograph with a 12-centimeter scoop, in place of an approach camera.",
    narration:
      "Surveyor Three is the first in its series with a digging arm. A scissor-like pantograph reaches about one and a half meters, with a scoop twelve centimeters long. It replaces the approach camera of earlier flights. Its job is to touch the Moon, so Apollo will know what its feet will land on.",
    facts: [["Reach", "~1.5 m"], ["Scoop", "12 × 5 cm"], ["Builder", "Hughes Aircraft"]],
  },
  {
    id: "sur038", part: "mars", date: "Apr 22, 1967", place: "Surveyor crater", title: "The first dig",
    summary: "Two days after landing, commands from Earth bring the scoop to life: trenches up to 18 centimeters deep, 18 hours and 22 minutes of work.",
    narration:
      "About April twenty-second, 1967. Two days after landing, commands from Earth bring the scoop to life. It digs trenches up to eighteen centimeters deep, lifts soil up to the camera, and tests the ground with the arm. In total, it works for eighteen hours and twenty-two minutes.",
    facts: [["Date", "~22 Apr 1967"], ["Trench depth", "Up to 18 cm"], ["Working time", "18 h 22 min"]],
  },
  {
    id: "sur016", part: "mars", date: "Apr 1967", place: "Surveyor crater", title: "Firm as wet sand",
    summary: "The tests give scientists their answer: the lunar soil is firm, like wet sand, and strong enough to carry an Apollo lunar module.",
    narration:
      "April, 1967. The tests give scientists the answer they wanted. The lunar soil is firm, like wet sand, and can bear about ten pounds per square inch. That is enough to hold up an Apollo lunar module. The Moon will not swallow the astronauts' lander.",
    facts: [["Soil", "Like wet sand"], ["Strength", "~10 psi (98 kPa)"], ["Verdict", "Safe for Apollo"]],
  },
  {
    id: "sur040", part: "mars", date: "Apr 24, 1967", place: "Surveyor crater", title: "The Sun hidden by the Earth",
    summary: "The Earth slides in front of the Sun: an eclipse seen from the Moon, photographed for the first time from its surface by the tilted camera.",
    narration:
      "April twenty-fourth, 1967. The Earth slides in front of the Sun. From the Moon, it is an eclipse of the Sun, and Surveyor's tilted camera can look up at it. These are the first photographs of a solar eclipse taken from the surface of the Moon. The total phase lasts seventy-seven minutes.",
    facts: [["Total phase", "77 min 56 s"], ["Partial phase", "202 min 46 s"], ["First", "Eclipse photos from the Moon"]],
  },
  {
    id: "sur045", part: "mars", date: "May 4, 1967", place: "Surveyor crater", title: "The night that never ended",
    summary: "The Sun sets and the solar panel stops making power. The last data arrive on May 4. The two-week night is too cold, and Surveyor 3 never wakes up.",
    narration:
      "May, 1967. The Sun sets, and the solar panel stops making power. A last command puts the lander in its best position to survive, and its final data arrive on May fourth. But the lunar night lasts about two weeks, and the cold is too much. Surveyor Three never wakes up.",
    facts: [["Last data", "4 May 1967"], ["Lunar night", "~336 hours"], ["Status", "Never reactivated"]],
  },
  {
    id: "sur048", part: "mars", date: "Jul 25, 1969", place: "Site 7", title: "Aim at Surveyor",
    summary: "NASA planners want Apollo 12 to land beside Surveyor 3. Two site committees object, but the program director decides: the old robot is the target.",
    narration:
      "July twenty-fifth, 1969. NASA planners want Apollo Twelve to land next to Surveyor Three, so astronauts can bring parts home. Two site committees oppose it. The Apollo program director decides anyway: the crater with the old robot will be the target.",
    facts: [["Decision", "25 Jul 1969"], ["Site", "Site 7"], ["Goal", "Bring parts back"]],
  },
  {
    id: "sur054", part: "mars", date: "Nov 19, 1969", place: "Surveyor crater", title: "Landing by the old robot",
    summary: "An astronomer had located Surveyor 3 from old pictures. Apollo 12's lunar module comes in through blowing dust, and the commander spots the lander.",
    narration:
      "November nineteenth, 1969. An astronomer, Ewen Whitaker, had pinpointed Surveyor Three from old pictures, and now the Apollo Twelve lunar module, Intrepid, comes in through blowing dust. The commander spots the lander on the crater's rim. It is the first precision landing on another world.",
    facts: [["Landing", "19 Nov 1969"], ["Distance", "~160 m"], ["First", "Precision landing"]],
  },
  {
    id: "sur055", part: "mars", date: "Nov 20, 1969", place: "Surveyor crater", title: "Parts for Earth",
    summary: "Pete Conrad and Alan Bean spend 33 minutes at Surveyor 3 and cut off its camera, cable, tubing and scoop: about 10 kilograms in all.",
    narration:
      "November twentieth, 1969. Pete Conrad and Alan Bean spend thirty-three minutes at Surveyor Three. With bolt cutters, they remove the television camera, some cable, a piece of tubing and, as a bonus, the scoop. About ten kilograms of the old robot ride home.",
    facts: [["Visit", "33 min"], ["Parts", "~10 kg"], ["Date", "20 Nov 1969"]],
  },
  // ───────────────────────────── after the Moon: the comic ─────────────────────────────
  {
    id: "sur059", part: "outro", date: "1970–2011", title: "A microbe on the Moon?",
    summary: "In 1970 a bacterium is found in the camera's foam, and some wonder if it survived on the Moon. In 2011 the claim is refuted: it was probably contamination on Earth.",
    narration:
      "In nineteen seventy, scientists find a bacterium, Streptococcus mitis, in the foam of the returned camera, and some wonder if it survived on the Moon. But the camera was never sterilized before launch. In twenty eleven, new analysis refutes the claim: the contamination likely happened on Earth.",
    facts: [["Bacterium", "S. mitis"], ["Found", "1970"], ["Refuted", "2011"]],
  },
  {
    id: "sur064", part: "outro", date: "1972", title: "A tough little camera",
    summary: "The camera spent 947 days on the Moon through 32 lunar nights. In 1972 engineers find it nearly all working, with only its white surfaces turned tan.",
    narration:
      "The returned camera had spent nine hundred forty-seven days on the Moon, through thirty-two lunar nights colder than minus one hundred thirty degrees Celsius. Engineers find most of it still working, with only its white surfaces turned tan from dust and radiation. In nineteen seventy-two, they call the analysis a success.",
    facts: [["Time on the Moon", "947 days"], ["Lunar nights", "32"], ["Verdict", "Nearly all working"]],
  },
  {
    id: "sur066", part: "outro", date: "Sep 2009", title: "Seen from orbit",
    summary: "The Lunar Reconnaissance Orbiter photographs the site: Surveyor 3, the Apollo 12 descent stage and the trails of footprints, still there 40 years later.",
    narration:
      "September, 2009. The Lunar Reconnaissance Orbiter photographs the old landing site from above. In one crater: Surveyor Three, the Apollo lunar module's descent stage, the science station, and the faint trails of footprints, still there forty years later. Surveyor Three remains the only probe ever visited by humans.",
    facts: [["Orbiter", "LRO"], ["Image width", "824 m"], ["Seen", "Footprints still visible"]],
  },
];

export const PARTS = [
  { id: "intro", title: "Earth", blurb: "Before the Moon: a plan, three failures, a first landing and a night launch, told as a comic." },
  { id: "mars", title: "Moon", blurb: "Two weeks on the Moon, and the visit that followed: drive the lander from one story to the next." },
  { id: "outro", title: "Legacy", blurb: "After the visit: what the robot taught us." },
];
