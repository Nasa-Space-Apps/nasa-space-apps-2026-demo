/**
 * Story data of Spirit: the copy (English) of its 20 beats, in chronological order, plus where its facts, art and 3D terrain come from. Read by
 * scripts/build-story.mjs, which writes public/models/spirit/story.json. Same format and rules as opportunity-story.mjs (docs/story.md): narration ~45 words,
 * numbers spelled out, every fact from the dossiers (misiones/spirit/dossiers). Contested figures are left out: the date of the Goldin meeting (spi006, only the
 * official announcement is told), the exact day Husband Hill was topped (spi037: 29 Sep vs «590 days») and the tilt of the rover in Troy (spi061), the date Spirit
 * got stuck (spi057: 23 Apr vs 1 May 2009), the mass of the rover (spi006 vs spi011).
 * part: intro = before the 3D (comic pages), mars = a 3D stop, outro = comic pages after the 3D.
 */
export const MISSION = "spirit";
export const NAME = "Spirit";
export const TITLE = "Spirit: the geologist that outlived its plan";
/** Research dossiers of the mission (spiNNN/dossier.json) */
export const DOSSIERS = "misiones/spirit/dossiers";
// no `sourceImage`: the art is generated straight into public/models/spirit/images (npm run story-images -- spirit)
/**
 * 3D terrain of the mission and the line its stops follow. The Meridiani terrain (the one of Opportunity, its twin) stands in for Gusev: Gale's central mound is
 * too steep to drive. The stops start on the low flat plain in the east, climb the long rise of the west (Husband Hill, stop 5), come down along the south and end
 * on the flat ground that plays Home Plate (Troy, the last four stops).
 */
export const TERRAIN = "public/models/terrain.stl";
export const ANCHORS = [[160, 40], [60, 30], [-40, 32], [-120, 30], [-165, 28], [-235, 100], [-120, 175], [0, 172], [100, 190], [230, 190]];
/** The closing card after the last page of the story */
export const CLOSING = { title: "thank you, Spirit", text: "Planned for three months, it worked for more than six years and drove 7.7 km across Gusev Crater." };

export const BEATS = [
  // ───────────────────────────── before Mars: the comic ─────────────────────────────
  {
    id: "spi001", part: "intro", date: "1987", title: "A geologist on wheels",
    summary: "Cornell geologist Steve Squyres dreams of a robotic field geologist. Over ten years he writes four proposals to NASA; the first three are rejected.",
    narration:
      "Nineteen eighty-seven. Geologist Steve Squyres, of Cornell University, dreams of a robotic field geologist: a rover carrying the tools a geologist would pack for the field. Over ten years he writes four proposals to NASA. The first three are rejected, but each one makes the idea better.",
    facts: [["Proposals", "4 · 1987–1997"], ["Rejected", "The first 3"], ["Idea", "A robotic field geologist"]],
  },
  {
    id: "spi004", part: "intro", date: "Sep–Dec 1999", title: "Two losses in ten weeks",
    summary: "NASA loses the Mars Climate Orbiter and then the Mars Polar Lander. The agency has to rethink how it goes to Mars.",
    narration:
      "Autumn, 1999. NASA loses two missions to Mars in ten weeks. On September twenty-third, the Climate Orbiter burns up in the atmosphere: one team used imperial units, another metric, and it arrived about one hundred seventy kilometers too low. On December third, the Polar Lander is lost on arrival.",
    facts: [["Orbiter lost", "23 Sep 1999"], ["Lander lost", "3 Dec 1999"], ["Orbit error", "~170 km too low"]],
  },
  {
    id: "spi006", part: "intro", date: "Aug 10, 2000", title: "Two rovers, not one",
    summary: "NASA announces two identical science rovers for 2003 instead of one. They will land far apart, doubling the science and adding a safety net.",
    narration:
      "August tenth, 2000. NASA announces it will send two big science rovers to Mars in 2003, not one. Ed Weiler, who leads space science, calls it incredibly exciting. Identical twins landing in very different places: twice the science, and a safety net if one of them fails.",
    facts: [["Announced", "10 Aug 2000"], ["Rovers", "2 identical twins"], ["Sites", "Gusev and Meridiani"]],
  },
  {
    id: "spi010", part: "intro", date: "Jun 8, 2003", title: "A girl names them",
    summary: "At Kennedy Space Center, nine-year-old Sofi Collis reveals the names of the twin rovers: Spirit and Opportunity.",
    narration:
      "June eighth, 2003. At Kennedy Space Center, nine-year-old Sofi Collis reveals the names of the twin rovers: Spirit and Opportunity. Born in Siberia and adopted at two, she won a contest of almost ten thousand essays. She wrote about looking at the stars from an orphanage, and dreaming of flying there.",
    facts: [["Winner", "Sofi Collis, age 9"], ["Essays", "Nearly 10,000"], ["Names", "Spirit and Opportunity"]],
  },
  {
    id: "spi011", part: "intro", date: "Jun 10, 2003", title: "Liftoff",
    summary: "A Delta II lifts off from Cape Canaveral with Spirit aboard, a rover the size of a golf cart. Its twin follows 27 days later.",
    narration:
      "June tenth, 2003. A Delta Two rocket lifts off from Cape Canaveral carrying Spirit, a rover about the size of a golf cart. Four months earlier, the space shuttle Columbia was lost, and Spirit's landing site will carry its name. Its twin, Opportunity, will follow twenty-seven days later.",
    facts: [["Rocket", "Delta II 7925-9.5"], ["Launch pad", "SLC-17A, Cape Canaveral"], ["Twin follows", "27 days later"]],
  },
  {
    id: "spi013", part: "intro", date: "Jan 3, 2004", title: "Twenty-eight bounces",
    summary: "Spirit hits Gusev Crater inside a ball of airbags and bounces twenty-eight times before it stops, 13 km from its target.",
    narration:
      "January third, 2004, eight thirty-five pm, Pacific time. Spirit hits Mars inside a ball of airbags at about fourteen meters per second, and bounces twenty-eight times before rolling to a stop in Gusev Crater, a possible ancient lake. It lands thirteen kilometers from its target, but safe.",
    facts: [["Landing", "3 Jan 2004 · 8:35 pm PST"], ["Bounces", "28"], ["Off target", "13.4 km"]],
  },
  // ───────────────────────────── on Mars: the 3D route ─────────────────────────────
  {
    id: "spi017", part: "mars", date: "Jan 21, 2004", place: "Columbia Memorial Station", title: "Sol 18: a rover in a loop",
    summary: "With its arm out toward a rock, Spirit's computer reboots over and over. Too many files fill its flash memory, and the working memory cannot cope.",
    narration:
      "January twenty-first, 2004, sol eighteen. Spirit has its arm out toward a rock called Adirondack when its computer starts rebooting, more than one hundred twenty-five times. Too many files fill its flash memory, and the working memory cannot manage them. The longest test before launch lasted only ten days.",
    facts: [["Reboots", "125+"], ["Flash memory", "256 MB"], ["Longest test", "10 days"]],
  },
  {
    id: "spi021", part: "mars", date: "Feb 4–5, 2004", place: "Adirondack", title: "Wiped clean, back to work",
    summary: "Engineers erase Spirit's flash memory and start over. The next day it brushes a rock, a first on another planet.",
    narration:
      "February fourth, 2004. Engineers erase Spirit's flash memory and rebuild its file system from scratch, like reformatting a broken computer. The next day, Spirit brushes a rock named Adirondack for five minutes, the first rock cleaned on another planet. The spot comes out much darker than the dust around it.",
    facts: [["Fix", "Flash memory reformatted"], ["First", "Rock brushed on another planet"], ["Brushing", "5 minutes"]],
  },
  {
    id: "spi028", part: "mars", date: "Jul 15, 2004", place: "Columbia Hills", title: "Driving backwards",
    summary: "Spirit's front right wheel is failing, so it starts driving in reverse and drags it like an anchor, using it only on the hardest ground.",
    narration:
      "July fifteenth, 2004. Spirit has driven over three and a half kilometers, six times its design distance, but its front right wheel is failing: its motor draws three times the current of the others. The fix: drive backwards, dragging that wheel like an anchor and using it only when needed.",
    facts: [["Driven so far", "3.5+ km"], ["Wheel current", "3× the others"], ["First backward drive", "8 m"]],
  },
  {
    id: "spi035", part: "mars", date: "Mar 9, 2005", place: "Columbia Hills", title: "A cleaning wind",
    summary: "Dust has choked Spirit's solar panels. Then a dust devil seems to sweep them clean, and its power jumps by about half.",
    narration:
      "March ninth, 2005, sol four hundred twenty. Spirit's solar panels are caked in dust, and its power has fallen to a few hundred watt-hours a day. Then, engineers think, a dust devil sweeps over it. Power jumps by half. The next sol, its cameras catch two dust devils on the plain.",
    facts: [["Power before", "~300–400 Wh / sol"], ["Power after", "700+ Wh / sol"], ["At landing", "~900 Wh / sol"]],
  },
  {
    id: "spi037", part: "mars", date: "Sep 2005", place: "Husband Hill", title: "The top of Husband Hill",
    summary: "Spirit reaches the summit of Husband Hill, the first hill ever climbed by a rover on Mars, and takes a 360° view of the crater.",
    narration:
      "September, 2005. Spirit reaches the top of Husband Hill, one hundred six meters above its landing site: the first hill ever climbed by a rover on Mars. It was built for flat ground, but every climb brought new rocks. From the summit, it takes three hundred sixty degree panoramas.",
    facts: [["Height", "106 m above the landing site"], ["Named for", "Rick Husband"], ["First", "Hill climbed by a rover"]],
  },
  {
    id: "spi031", part: "mars", date: "Dec 2005", place: "Comanche outcrop", title: "Comanche",
    summary: "On Husband Hill's slope, Spirit studies a rock outcrop. Four years later, cleaned-up data show it is rich in carbonate, a sign of mild water.",
    narration:
      "December, 2005. On Husband Hill's slope, Spirit visits an outcrop named Comanche, but its thermal spectrometer is coated in dust, and the data stay a puzzle for four years. In twenty-ten, scientists correct them: about a quarter of the rock is carbonate, which only forms in mild, neutral water.",
    facts: [["Carbonate", "~25% of the rock"], ["Vs. other rocks", "10× more"], ["Published", "Science · Jun 2010"]],
  },
  {
    id: "spi040", part: "mars", date: "Mar 13, 2006", place: "Home Plate", title: "Sol 779: the wheel dies",
    summary: "The motor of Spirit's front right wheel fails for good and the wheel locks. Spirit will drag it from now on.",
    narration:
      "March thirteenth, 2006, sol seven hundred seventy-nine. Spirit's front right wheel motor dies for good, and the wheel locks. Spirit will have to drag it like a stuck shopping cart wheel. The next day it still drives ten meters, while engineers at JPL rehearse five-wheel moves with a replica rover in a sandbox.",
    facts: [["Sol", "779"], ["Wheel motors", "1 of 10 failed"], ["Next day", "Drove 10 m"]],
  },
  {
    id: "spi048", part: "mars", date: "2007", place: "Home Plate", title: "Silica from a broken wheel",
    summary: "Spirit's dragging wheel digs a trench that gleams white. It is almost pure silica, a record on Mars and a sign of hot water.",
    narration:
      "Two thousand seven. Spirit drags its dead wheel near Home Plate and digs a trench that gleams white. Its spectrometer says silica, and its X-ray instrument finds more than ninety percent, a record on Mars. On Earth, so much silica needs hot water reacting with rock: a warm, wet, possibly habitable past.",
    facts: [["Silica", "More than 90%"], ["Found by", "A dragging wheel"], ["Place", "Near Tyrone, Home Plate"]],
  },
  {
    id: "spi057", part: "mars", date: "Apr 2009", place: "Troy", title: "Sinking at Troy",
    summary: "Driving backwards, Spirit breaks a dark crust and sinks into soft, bright sand hidden beneath it. The place is nicknamed Troy.",
    narration:
      "April, 2009. Driving backwards west of Home Plate, Spirit's wheels break through a dark crust and sink into bright, soft sand hidden underneath. The place is nicknamed Troy. The sand barely holds together, so the wheels find no grip. Spirit was planned for three months. It has worked for more than five years.",
    facts: [["Place", "Troy, west of Home Plate"], ["Trap", "Soft sand under a crust"], ["Planned life", "3 months"]],
  },
  {
    id: "spi061", part: "mars", date: "Nov 16, 2009", place: "Troy", title: "Free Spirit",
    summary: "After months of rehearsals with test rovers on Earth, NASA starts the rescue: drive out along the rover's own tracks.",
    narration:
      "November sixteenth, 2009, sol two thousand eighty-seven. After months of rehearsals with test rovers on Earth, NASA sends the first commands of Free Spirit. The plan: drive forward, to the north, exactly along its own tracks, dragging its dead wheel. A pointed rock under the rover's belly makes every meter delicate.",
    facts: [["Start", "Sol 2087"], ["Plan", "Drive out on its own tracks"], ["Rehearsed", "With test rovers on Earth"]],
  },
  {
    id: "spi066", part: "mars", date: "Jan 26, 2010", place: "Troy", title: "A rover becomes a station",
    summary: "After months of failed attempts, NASA declares Spirit a stationary research platform. Its new goals: survive the winter and study Mars' wobble.",
    narration:
      "January twenty-sixth, 2010. After months of failed attempts, NASA declares Spirit a stationary research platform. Doug McCuistion says: Spirit is not dead; it has just entered another phase of its long life. The new goals: survive the Martian winter, and measure the planet's tiny wobble to learn about its core.",
    facts: [["Announced", "26 Jan 2010"], ["New role", "Stationary research platform"], ["New goal", "Mars' wobble → its core"]],
  },
  {
    id: "spi069", part: "mars", date: "Mar 22, 2010", place: "Troy", title: "The last message",
    summary: "Winter closes in: Spirit's panels face away from the Sun and its electronics fall to −41.5 °C. That day, it sends its last signal.",
    narration:
      "March twenty-second, 2010. Winter is closing in. Spirit's solar panels face away from the Sun, and its electronics have dropped to minus forty-one point five degrees Celsius. Power falls to one hundred thirty-three watt-hours, below the threshold the team feared. That day, Spirit sends its last signal to Earth.",
    facts: [["Electronics", "−41.5 °C"], ["Power", "133 Wh (needed 155)"], ["Last signal", "22 Mar 2010"]],
  },
  // ───────────────────────────── after the last signal: the comic ─────────────────────────────
  {
    id: "spi076", part: "outro", date: "May 24, 2011", title: "The silence is declared",
    summary: "After more than 1,300 commands with no answer, NASA ends its attempts to reach Spirit. Built for three months, it worked for over six years.",
    narration:
      "May twenty-fourth, 2011. After more than one thousand three hundred commands with no answer, NASA ends its attempts to contact Spirit. Built for three months, it worked for over six years and drove seven point seven kilometers. Engineers think its insides fell to about minus fifty-five Celsius, too cold to wake.",
    facts: [["Commands sent", "1,300+"], ["Distance", "7.7 km"], ["Planned", "3 months"]],
  },
  {
    id: "spi080", part: "outro", date: "2026", title: "New lessons in old data",
    summary: "Researcher Paulo de Souza merges 32 old soil measurements from Spirit and finds crystalline hematite and magnetite in ordinary Martian soil.",
    narration:
      "Twenty twenty-six. Researcher Paulo de Souza revisits Spirit's old data. He merges thirty-two soil measurements from its iron spectrometer into one signal, like six days of continuous work. It shows crystalline hematite and magnetite in ordinary Martian soil: a hint, not proof, that water was once widespread.",
    facts: [["Researcher", "Paulo de Souza"], ["Data merged", "32 soil spots"], ["Finding", "Crystalline hematite + magnetite"]],
  },
];

export const PARTS = [
  { id: "intro", title: "Earth", blurb: "Before Mars: a dream, two failures, a decision, a name, a launch and a landing, told as a comic." },
  { id: "mars", title: "Mars", blurb: "Six years in Gusev Crater: from a rebooting computer to a summit to a trap of sand." },
  { id: "outro", title: "Legacy", blurb: "After the last signal." },
];
