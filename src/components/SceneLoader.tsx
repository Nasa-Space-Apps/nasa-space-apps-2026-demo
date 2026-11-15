"use client";

import dynamic from "next/dynamic";
import Loading from "./Loading";

// the rover scene (terrain, vehicle, route…) is only downloaded on /<body>/<vehicle>
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => <Loading /> });
// Opportunity has the whole story (comic pages, then the 3D route, then the legacy): see components/Journey.tsx
const Journey = dynamic(() => import("./Journey"), { ssr: false, loading: () => <Loading /> });

export default function SceneLoader({ missionId }: { missionId: string }) {
  return missionId === "opportunity" ? <Journey missionId={missionId} /> : <Scene missionId={missionId} />;
}
