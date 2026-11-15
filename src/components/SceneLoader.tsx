"use client";

import dynamic from "next/dynamic";
import { storyOf } from "@/lib/story";
import Loading from "./Loading";

// the rover scene (terrain, vehicle, route…) is only downloaded on /<body>/<vehicle>
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => <Loading /> });
// the missions with a story (Opportunity, Ingenuity) get the whole thing: comic pages, then the 3D route, then the legacy (components/Journey.tsx)
const Journey = dynamic(() => import("./Journey"), { ssr: false, loading: () => <Loading /> });

export default function SceneLoader({ missionId }: { missionId: string }) {
  return storyOf(missionId) ? <Journey missionId={missionId} /> : <Scene missionId={missionId} />;
}
