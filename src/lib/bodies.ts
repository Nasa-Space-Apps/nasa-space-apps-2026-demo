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
          "Last signal on June 10, 2018 (Sol 5111), as a global dust storm blocked its solar panels. NASA declared the mission complete on Feb 13, 2019.",
        facts: [
          ["Landed", "Jan 25, 2004"],
          ["Planned", "90 sols"],
          ["Lasted", "5,111 sols"],
          ["Distance", "45.16 km"],
        ],
      },
      {
        missionId: "perseverance",
        name: "Perseverance",
        place: "Jezero Crater · test drive",
        lat: 18.44,
        lon: 77.45,
        tag: "Test drive · demo",
        status:
          "Powered down at sunset after caching its samples. Demo vehicle: the real Perseverance is still active and this ending is fictional. The ground is Gale Crater (Curiosity's landing site), used as a stand-in.",
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
        place: "Jezero Crater · demo airfield",
        lat: 24,
        lon: 65,
        tag: "Last flight · demo",
        status: "Demo vehicle with an invented story: it flies from airfield to airfield and lands for good after a last hover. The ground is Gale Crater, as a stand-in.",
        facts: [
          ["Type", "Helicopter"],
          ["Flights", "41 (fiction)"],
          ["Ending", "Fictional"],
        ],
      },
      {
        missionId: "insight",
        name: "InSight",
        place: "Elysium Planitia · demo",
        lat: 4.5,
        lon: 135.6,
        tag: "Out of power · demo",
        status: "Demo vehicle with an invented story: a lander that rolls on three wheels, listens for quakes and loses power under red dust. The real InSight never moved.",
        facts: [
          ["Site", "Elysium Planitia"],
          ["Legs", "3, on wheels"],
          ["Ending", "Fictional"],
        ],
      },
      {
        missionId: "beagle-2",
        name: "Beagle 2",
        place: "Isidis Planitia · demo",
        lat: 11.5,
        lon: 90.4,
        tag: "Resting · demo",
        status: "Demo vehicle with an invented story: this Beagle 2 opens all its petals, rolls on a small base and calls home. The real one never did.",
        facts: [
          ["Site", "Isidis Planitia"],
          ["Panels", "4"],
          ["Ending", "Fictional"],
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
        place: "Mare Tranquillitatis · demo site",
        lat: 8,
        lon: 20, // far from Surveyor 3 (-3, -23): the two markers used to overlap on the globe
        tag: "Powered down · demo",
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
        lat: -3.016,
        lon: -23.418,
        tag: "Visited by Apollo 12",
        status:
          "Went silent at its first lunar sunset, in early May 1967, and never woke up. Apollo 12 landed next to it in November 1969 and took its camera home. In the 3D view it rolls on three wheels: the real lander never moved.",
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
