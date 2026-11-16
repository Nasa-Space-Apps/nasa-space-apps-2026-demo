// Globe view: celestial bodies and the vehicles abandoned on them (one per mission in `missions.ts`).

export type AbandonedVehicle = {
  missionId: string; // id in MISSIONS
  name: string;
  place: string;
  lat: number; // degrees, north positive
  lon: number; // degrees, east positive
  tag: string; // short status shown next to the marker on the globe
  status: string; // how it ended up abandoned
  facts: [string, string][]; // label / value pairs (up to 4)
};

export type Body = {
  id: string;
  name: string;
  blurb: string;
  facts: [string, string][];
  vehicles: AbandonedVehicle[];
};

export const BODIES: Body[] = [
  {
    id: "mars",
    name: "Mars",
    blurb: "A cold desert world. Its rovers were meant to last months; one kept going for fourteen years.",
    facts: [
      ["Diameter", "6,779 km"],
      ["Gravity", "3.7 m/s²"],
    ],
    vehicles: [
      {
        missionId: "opportunity",
        name: "Opportunity",
        place: "Perseverance Valley · Endeavour Crater",
        lat: -2.3,
        lon: -5.5,
        tag: "Lost in a dust storm · 2018",
        status:
          "Landed on Jan 24, 2004 (Pacific time; Jan 25 in UTC). Last signal on June 10, 2018 (Sol 5111), as a global dust storm blocked its solar panels. NASA declared the mission complete on Feb 13, 2019.",
        facts: [
          ["Landed", "Jan 24, 2004"],
          ["Planned", "90 sols"],
          ["Lasted", "5,111 sols"],
          ["Distance", "45.16 km"],
        ],
      },
      {
        missionId: "perseverance",
        name: "Perseverance",
        place: "Jezero Crater · test drive",
        // TODO(audit): the real position is Jezero (18.44° N, 77.45° E), the same spot as Ingenuity's. The marker is moved ~9° away (a default) so both can be clicked.
        lat: 25,
        lon: 69,
        tag: "Test drive · demo",
        status:
          "Powered down at sunset after caching its samples. Demo vehicle: the real Perseverance is still active and this ending is fictional. The ground is Gale Crater (Curiosity's landing site), used as a stand-in. On the globe its marker is moved ~9° from Jezero, so it does not cover Ingenuity's.",
        facts: [
          ["Landed", "Feb 18, 2021"],
          ["Site", "Jezero Crater"],
          ["Samples", "10 tubes cached"],
          ["Ending", "Fictional"],
        ],
      },
      // ---- Vehicles without a story yet («coming soon»): the markers sit on the real site of each mission, the ending is invented ----
      {
        missionId: "spirit",
        name: "Spirit",
        place: "Gusev Crater · Columbia Hills",
        lat: -14.57,
        lon: 175.47,
        tag: "Stuck in sand · 2009",
        status:
          "Sank into soft sand at «Troy» in April 2009 and sent its last signal on March 22, 2010, as winter starved its solar panels. NASA stopped trying to reach it on May 24, 2011. In the 3D view it drives on the Meridiani terrain of Opportunity, as a stand-in for Gusev.",
        facts: [
          ["Landed", "Jan 3, 2004"],
          ["Planned", "3 months"],
          ["Distance", "7.73 km"],
          ["Last signal", "Mar 22, 2010"],
        ],
      },
      {
        missionId: "ingenuity",
        name: "Ingenuity",
        place: "Jezero Crater · Valinor Hills",
        lat: 18.44, // Jezero Crater (Octavia E. Butler Landing, 18.44° N, 77.45° E); its last airfield, Valinor Hills, is a few kilometres away
        lon: 77.45,
        tag: "Last flight · Jan 2024",
        status:
          "Flew 72 times in almost three years, far beyond the five flights planned. Its last flight, on Jan 18, 2024, ended with damaged rotor blades and NASA closed the mission on Jan 25, 2024. It rests at «Valinor Hills», where Perseverance photographed it. In the 3D view it flies over the Gale Crater terrain, as a stand-in for Jezero.",
        facts: [
          ["Landed", "Feb 18, 2021"],
          ["Flights", "72"],
          ["Distance", "17 km"],
          ["Last flight", "Jan 18, 2024"],
        ],
      },
      {
        missionId: "insight",
        name: "InSight",
        place: "Elysium Planitia",
        lat: 4.5,
        lon: 135.6,
        tag: "Out of power · 2022",
        status:
          "Landed on Nov 26, 2018 and listened to Mars for more than four years. Dust on its solar panels cut its power; its last contact was on Dec 15, 2022. In the 3D view it stands still, as the real lander did.",
        facts: [
          ["Landed", "Nov 26, 2018"],
          ["Marsquakes", "1,319"],
          ["Planned", "1 Martian year"],
          ["Last contact", "Dec 15, 2022"],
        ],
      },
      {
        missionId: "beagle-2",
        name: "Beagle 2",
        place: "Isidis Planitia",
        lat: 11.5,
        lon: 90.4,
        tag: "Found in 2015",
        status:
          "A British lander carried by ESA's Mars Express. It reached the surface on Dec 25, 2003 but never called home; NASA's HiRISE found it in January 2015 with its panels partly open. In the 3D view it sits still, as the real one did.",
        facts: [
          ["Launched", "Jun 2, 2003"],
          ["Planned landing", "Dec 25, 2003"],
          ["Found", "Jan 2015"],
          ["Size", "Under 2 m wide"],
        ],
      },
    ],
  },
  {
    id: "moon",
    name: "Moon",
    blurb: "Airless and silent. Whatever is left here stays exactly where it stopped.",
    facts: [
      ["Diameter", "3,474 km"],
      ["Gravity", "1.62 m/s²"],
    ],
    vehicles: [
      {
        missionId: "sev",
        name: "SEV",
        place: "Mare Tranquillitatis · invented site",
        // TODO(audit): fictional vehicle with no real position. The (8° N, 20° E) default keeps it clear of Surveyor 3 (3° S, 23° W); Apollo 14, the mission it borrows, landed at Fra Mauro (3.6° S, 17.5° W).
        lat: 8,
        lon: 20,
        tag: "Fictional · demo",
        status:
          "Powered down as the sun set behind the ridge, and never woke up again. Demo vehicle: the SEV is a fictional stand-in on the Moon and this ending is fictional.",
        facts: [
          ["Site", "Mare Tranquillitatis"],
          ["Ending", "Fictional"],
        ],
      },
      {
        missionId: "surveyor-3",
        name: "Surveyor 3",
        place: "Surveyor crater · Oceanus Procellarum",
        lat: -3.014, // NSSDC: 3.0138° S, 23.4193° W
        lon: -23.419,
        tag: "Visited by Apollo 12",
        status:
          "Went silent at its first lunar sunset (last data on May 4, 1967) and never woke up. Apollo 12 landed about 160 meters away in November 1969 and its astronauts took the TV camera home. The real lander never moved after its two bounces, so in the 3D view it stands still.",
        facts: [
          ["Landed", "Apr 20, 1967"],
          ["Visited", "Nov 19, 1969"],
          ["TV images", "6,300+"],
          ["Silent since", "May 1967"],
        ],
      },
    ],
  },
];

/** Unit vector of a lat/lon on a three.js SphereGeometry textured with an equirectangular layout centred on lon 0. */
export function latLonDir(lat: number, lon: number): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
}

export const bodyOfMission = (missionId: string) => BODIES.find((b) => b.vehicles.some((v) => v.missionId === missionId));
