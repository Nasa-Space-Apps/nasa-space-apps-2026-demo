#!/usr/bin/env node
/**
 * Builds everything the Opportunity story consumes into public/models/opportunity/ (the app imports story.json and serves images and audio from there):
 *
 *   story.json      the 20 beats in chronological order: English copy (title, short summary, spoken narration, 3 facts), source, image, audio and — for the
 *                   Mars beats — the 3D stop (x, z, via) from scripts/data/opportunity-route.json
 *   images/<id>.jpg the AI illustrations (4:5) from the folder of generated art, resized for the web
 *   audio/          narration clips + manifest.json (recorded with scripts/generate-story-audio.mjs, not here)
 *
 * The facts and sources come from the research dossiers (agents/opportunity-research/salida/oppNNN) and story/data/linea_de_tiempo_opportunity.json; the
 * copy below is editorial English written from the verified facts (docs/story.md). Run:
 *
 *   node scripts/build-opportunity-story.mjs [path to the folder with 001.jpeg … 081.jpeg]     (default: ~/Downloads/images/v2)
 *
 * If you change a `narration`, run `npm run story-audio` afterwards to re-record that clip.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/models/opportunity");
const SRC_IMAGES = process.argv[2] ?? path.join(os.homedir(), "Downloads/images/v2");
const DOSSIERS = path.join(ROOT, "agents/opportunity-research/salida");

/** part: intro = before the 3D (comic pages), mars = a 3D stop, outro = comic pages after the 3D. */
const BEATS = [
  // ───────────────────────────── before Mars: the comic ─────────────────────────────
  {
    id: "opp001", part: "intro", date: "1987", title: "A robot geologist",
    summary: "Cornell scientist Steve Squyres wants to answer one question: was Mars once wet? His idea is a robot geologist on wheels.",
    narration:
      "Nineteen eighty-seven. At Cornell University, scientist Steve Squyres dreams up a robot geologist for Mars. Over the next ten years he writes four proposals to NASA. Three are rejected. He keeps improving the idea, because he wants to answer one question: was Mars once wet?",
    facts: [["Scientist", "Steve Squyres"], ["Proposals", "4 · 1987–1997"], ["Question", "Was Mars wet?"]],
  },
  {
    id: "opp005", part: "intro", date: "2000", title: "A gray clue from orbit",
    summary: "From orbit, an instrument finds a huge patch of gray hematite on Meridiani Planum, a mineral that often forms in water.",
    narration:
      "Year two thousand. An instrument called TES, orbiting Mars aboard Mars Global Surveyor, spots a huge patch of gray hematite on Meridiani Planum. Hematite is an iron mineral that often forms in water. And the plain looks flat and safe. Scientists have found their landing site.",
    facts: [["Instrument", "TES"], ["Mineral", "Gray hematite"], ["Place", "Meridiani Planum"]],
  },
  {
    id: "opp008", part: "intro", date: "Aug 2000", title: "What if there are two?",
    summary: "NASA plans a single rover for 2003. Then comes a bolder idea: two identical rovers, sent to two very different places.",
    narration:
      "Summer, two thousand. NASA plans to send one rover to Mars in 2003. Then a bold question changes everything: what if we send two? On August tenth, NASA announces it. Two identical rovers will go to two very different places.",
    facts: [["Announced", "10 Aug 2000"], ["Rovers", "2 identical"], ["Launch", "2003"]],
  },
  {
    id: "opp015", part: "intro", date: "Jul 7, 2003", title: "Liftoff at night",
    summary: "Delayed by cracked insulation, a battery cell and a valve, Opportunity races the clock and lifts off on a Delta II Heavy.",
    narration:
      "July seventh, 2003. Opportunity must launch before July fifteenth, or it misses its window to Mars. Cracked insulation, a faulty battery cell and a bad valve cause delay after delay. Finally, at eleven eighteen at night, a Delta Two Heavy lifts off from Cape Canaveral.",
    facts: [["Rocket", "Delta II Heavy"], ["Liftoff", "11:18 pm EDT"], ["Deadline", "15 Jul 2003"]],
  },
  {
    id: "opp018", part: "intro", date: "Jan 24, 2004", title: "Six minutes of fall",
    summary: "Parachute, rockets and airbags. At 9:05 pm in Pasadena, the first signal from the surface arrives: Opportunity has landed.",
    narration:
      "January twenty-fourth, 2004. Opportunity hits the atmosphere of Mars at about five thousand four hundred meters per second. Parachute, rockets, airbags: six minutes of fall. At nine oh five pm, mission control receives a signal from the surface. Opportunity is alive, and bouncing across Mars.",
    facts: [["Entry speed", "~5,400 m/s"], ["Signal", "9:05 pm PST"], ["Landing", "Eagle Crater"]],
  },
  // ───────────────────────────── on Mars: the 3D route ─────────────────────────────
  {
    id: "opp021", part: "mars", date: "Mar 2, 2004", place: "Eagle Crater", title: "Rocks soaked in water",
    summary: "Opportunity lands beside an outcrop called El Capitan. Its minerals prove that liquid water once soaked these rocks.",
    narration:
      "March second, 2004. Opportunity has landed next to a rock outcrop called El Capitan. Inside it, the rover finds jarosite, a mineral that forms in water. At NASA headquarters, Steve Squyres announces the news: the rocks of Meridiani Planum were once soaked in liquid water.",
    facts: [["Outcrop", "El Capitan"], ["Mineral", "Jarosite"], ["Announced", "2 Mar 2004"]],
  },
  {
    id: "opp025", part: "mars", date: "Apr 2004", place: "Near Fram Crater", title: "Blueberries",
    summary: "The ground is sprinkled with tiny dark spheres of hematite. Scientists nickname them blueberries: another fingerprint of water.",
    narration:
      "April two thousand four. Near Fram Crater, the ground is sprinkled with tiny dark spheres of hematite. Scientists call them blueberries. They are thought to have grown inside rock soaked in water, then spilled out as the rock wore away. Another fingerprint of a wet Mars.",
    facts: [["Nickname", "Blueberries"], ["Mineral", "Hematite"], ["Place", "Fram Crater"]],
  },
  {
    id: "opp028", part: "mars", date: "Nov 2004", place: "Endurance Crater", title: "Burns Cliff",
    summary: "Inside Endurance Crater, Opportunity photographs a wall of layered rock in a giant panorama of forty-six images.",
    narration:
      "November 2004, inside Endurance Crater. Opportunity rolls to the foot of Burns Cliff, a wall of finely layered rock. Over eight days it takes forty-six images to build one giant panorama. Every layer is a page in the story of the wet past of Mars.",
    facts: [["Crater", "~130 m wide"], ["Panorama", "46 images"], ["Sols", "287–294"]],
  },
  {
    id: "opp030", part: "mars", date: "Jan 6, 2005", place: "Heat Shield Rock", title: "A rock from the sky",
    summary: "Beside its own discarded heat shield, Opportunity finds a pitted rock of iron and nickel: the first meteorite found on another planet.",
    narration:
      "January 2005. Opportunity drives to inspect its own discarded heat shield, and finds a surprise. A dark, pitted rock, the size of a basketball. It is made of iron and nickel. It is a meteorite, the first one ever identified on another planet.",
    facts: [["Sol", "339"], ["Size", "~31 cm"], ["Metal", "Iron + nickel"]],
  },
  {
    id: "opp033", part: "mars", date: "Apr 26, 2005", place: "Purgatory Dune", title: "Stuck in the sand",
    summary: "Driving backwards, the rover sinks into a small dune. Engineers test a twin rover on Earth and free it after almost five weeks.",
    narration:
      "April twenty-sixth, 2005. Driving backwards, Opportunity sinks its wheels into a small dune called Purgatory. On Earth, engineers test a twin rover in a sandbox for over a week. Then they free Opportunity, slowly, in almost five weeks. The mission goes on.",
    facts: [["Dune", "~30 cm high"], ["Wheels sunk", "10+ cm"], ["Stuck", "Sols 446–484"]],
  },
  {
    id: "opp045", part: "mars", date: "May 25, 2011", place: "Meridiani Planum", title: "Goodbye, Spirit",
    summary: "NASA ends the mission of Spirit, Opportunity's twin. Planned for 90 sols, it worked for more than six years.",
    narration:
      "May twenty-fifth, 2011. NASA ends the mission of Spirit, Opportunity's twin. Planned for ninety sols, Spirit worked for more than six years. Its last message came in March 2010. Now Opportunity is on its own, and it keeps rolling.",
    facts: [["Spirit's life", "6 yr 2 mo"], ["Distance", "7.73 km"], ["Planned", "90 sols"]],
  },
  {
    id: "opp047", part: "mars", date: "Nov 2011", place: "Cape York", title: "The Homestake vein",
    summary: "On the rim of Endeavour Crater, a bright mineral vein as wide as a thumb: gypsum left by water flowing through rock.",
    narration:
      "November 2011, Cape York. On the rim of Endeavour Crater, Opportunity finds a bright mineral vein called Homestake, as wide as a thumb. It is calcium sulfate, probably gypsum, left behind by water that once flowed through cracks in the rock. The team announces it in December.",
    facts: [["Vein", "40–50 cm long"], ["Mineral", "Gypsum (likely)"], ["Announced", "7 Dec 2011"]],
  },
  {
    id: "opp052", part: "mars", date: "May 15, 2013", place: "Endeavour west rim", title: "Beating the moon buggy",
    summary: "An 80-meter drive pushes the odometer past the Apollo 17 moon buggy: the most traveled NASA vehicle on another world.",
    narration:
      "May fifteenth, 2013. An eighty-meter drive, in reverse, pushes Opportunity's odometer past the record of the Apollo Seventeen moon buggy. Astronaut Eugene Cernan says the record was made to be broken, and he is proud to pass the torch to Opportunity.",
    facts: [["Sol", "3309"], ["Odometer", "35.76 km"], ["Beat Apollo 17 by", "16 m"]],
  },
  {
    id: "opp054", part: "mars", date: "Jan 8, 2014", place: "Solander Point", title: "The jelly doughnut",
    summary: "A small rock, white outside and deep red inside, appears where nothing was four days before. A rover wheel had flipped it.",
    narration:
      "January 2014. A small rock, white outside and deep red inside, shows up where there was nothing four days earlier. Scientists call it the jelly doughnut. The mystery is solved: Opportunity's own wheel had flipped a piece of a nearby rock. Its chemistry is rich in manganese and sulfur.",
    facts: [["Size", "~4 cm"], ["Rich in", "Manganese + sulfur"], ["Nickname", "Jelly doughnut"]],
  },
  {
    id: "opp059", part: "mars", date: "Dec 2014", place: "Endeavour rim", title: "A rover that forgets",
    summary: "Opportunity's flash memory starts to fail. Engineers work around it and rewrite the software to ignore the damaged bank.",
    narration:
      "December 2014. After a decade on Mars, Opportunity starts to forget. Its flash memory glitches and keeps resetting the computer. Engineers switch the memory off, work without it, then rewrite the software to ignore the damaged bank. In March 2015, the fix works.",
    facts: [["Problem", "Flash memory"], ["Damaged", "Bank 7"], ["Fixed", "20 Mar 2015"]],
  },
  {
    id: "opp062", part: "mars", date: "Mar 24, 2015", place: "Marathon Valley", title: "A marathon on Mars",
    summary: "A 46-meter drive takes the odometer past 42.195 kilometers: the first marathon on another world. Then, Marathon Valley.",
    narration:
      "March twenty-fourth, 2015. After a short forty-six-meter drive, the odometer reads forty-two point one nine eight kilometers. A full marathon, the first ever completed on another world. Opportunity then explores Marathon Valley, until 2016.",
    facts: [["Sol", "3968"], ["Odometer", "42.198 km"], ["Valley", "~330 m long"]],
  },
  {
    id: "opp070", part: "mars", date: "May 30, 2018", place: "Perseverance Valley", title: "The storm approaches",
    summary: "An orbiter spots a dust storm racing toward Opportunity. In two weeks it covers a quarter of Mars, and the sunlight fades.",
    narration:
      "May thirtieth, 2018. Orbiting high above, the Mars Reconnaissance Orbiter spots a dust storm racing toward Opportunity. In two weeks it covers a quarter of the planet. The sky darkens, and the solar-powered rover's energy falls from six hundred forty-five watt-hours to just twenty-two.",
    facts: [["Spotted", "30 May 2018"], ["Storm size", "~35 million km²"], ["Power", "645 → 22 Wh"]],
  },
  {
    id: "opp072", part: "mars", date: "Jun 10, 2018", place: "Perseverance Valley", title: "The last signal",
    summary: "Opportunity finishes a 354-image panorama, sends its final data, and falls silent. It was sol 5111.",
    narration:
      "June tenth, 2018. Sol five thousand one hundred eleven. In Perseverance Valley, Opportunity finishes its last panorama: three hundred fifty-four images. The final ones are in black and white, because the storm left no time for color filters. Then it sends its last data to Earth. After that, silence.",
    facts: [["Sol", "5111"], ["Panorama", "354 images"], ["Place", "Perseverance Valley"]],
  },
  // ───────────────────────────── after the 3D: the comic again ─────────────────────────────
  {
    id: "opp077", part: "outro", date: "Feb 12–13, 2019", title: "Farewell, Opportunity",
    summary: "After eight months of trying, engineers send the last commands. The next day, NASA declares the mission complete.",
    narration:
      "February twelfth, 2019. After eight months of trying, engineers send Opportunity its last commands while the song I'll Be Seeing You plays in the room. No answer comes. The next day NASA declares the mission complete. John Callas says: Farewell, Opportunity, and well done.",
    facts: [["Planned life", "90 sols"], ["Lasted", "~15 years"], ["Images", "217,000+"]],
  },
  {
    id: "opp081", part: "outro", date: "Oct 11, 2026", title: "The torch passes on",
    summary: "Perseverance passes Opportunity's distance record. It needs five and a half years instead of almost fifteen, driving itself.",
    narration:
      "October eleventh, 2026. Perseverance passes the distance record of Opportunity: forty-five point two two kilometers. It needs only five and a half years, instead of almost fifteen, because it drives itself with AutoNav. The torch has passed on, and the story of exploration goes on.",
    facts: [["Perseverance", "45.22 km"], ["Opportunity", "45.16 km"], ["Time", "5.5 vs ~15 yr"]],
  },
];

const PARTS = [
  { id: "intro", title: "Earth", blurb: "Before Mars: the idea, the decision, the launch and the landing, told as a comic." },
  { id: "mars", title: "Mars", blurb: "Fourteen years on Meridiani Planum: drive the rover from one story to the next." },
  { id: "outro", title: "Legacy", blurb: "After the last signal." },
];

/** Best source of a dossier: official NASA/JPL first, then scientific, then anything. */
function sourceOf(id) {
  const file = path.join(DOSSIERS, id, "dossier.json");
  if (!existsSync(file)) return null;
  const list = JSON.parse(readFileSync(file, "utf8")).fuentes_nuevas ?? [];
  const pick = list.find((f) => f.tipo === "oficial NASA/JPL") ?? list.find((f) => f.tipo === "científica") ?? list[0];
  return pick ? { label: pick.editor, title: pick.titulo, url: pick.url } : null;
}

const route = JSON.parse(readFileSync(path.join(ROOT, "scripts/data/opportunity-route.json"), "utf8"));
const marsBeats = BEATS.filter((b) => b.part === "mars");
if (route.length !== marsBeats.length) throw new Error(`The route has ${route.length} stops but there are ${marsBeats.length} Mars beats: run scripts/plan-opportunity-route.mjs ${marsBeats.length}`);

mkdirSync(path.join(OUT, "images"), { recursive: true });
mkdirSync(path.join(OUT, "audio"), { recursive: true });

let n = 0;
let stop = 0;
const beats = [];
for (const b of BEATS) {
  n++;
  const num = b.id.slice(3);
  const srcImg = path.join(SRC_IMAGES, `${num}.jpeg`);
  if (!existsSync(srcImg)) throw new Error(`Missing illustration ${srcImg}`);
  await sharp(srcImg).resize({ width: 1040 }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, "images", `${b.id}.jpg`));
  const beat = {
    id: b.id, n, part: b.part, date: b.date, ...(b.place ? { place: b.place } : {}), title: b.title, summary: b.summary, narration: b.narration, facts: b.facts,
    source: sourceOf(b.id), image: `/models/opportunity/images/${b.id}.jpg`, imageRatio: "4 / 5", audio: `/models/opportunity/audio/${b.id}.mp3`,
  };
  if (b.part === "mars") {
    const r = route[stop++];
    beat.route = { x: r.x, z: r.z, ...(r.via ? { via: r.via } : {}) };
  }
  beats.push(beat);
}

const story = {
  version: 1,
  mission: "opportunity",
  language: "en",
  title: "Opportunity: from an idea to the last signal",
  note: "Illustrations are AI-generated artwork based on the verified events; every fact and its source come from the research dossiers (agents/opportunity-research). Narration is written for short, clear audio (~50 words).",
  parts: PARTS.map((p) => ({ ...p, beats: beats.filter((b) => b.part === p.id).map((b) => b.id) })),
  beats,
};
writeFileSync(path.join(OUT, "story.json"), JSON.stringify(story, null, 2) + "\n");
const words = beats.map((b) => b.narration.split(/\s+/).length);
console.log(`story.json: ${beats.length} beats (${PARTS.map((p) => `${p.id} ${beats.filter((b) => b.part === p.id).length}`).join(", ")}) · narration ${Math.min(...words)}–${Math.max(...words)} words, ${beats.reduce((a, b) => a + b.narration.length, 0)} characters`);
