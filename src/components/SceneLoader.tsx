"use client";

import dynamic from "next/dynamic";
import Loading from "./Loading";

// the rover scene (terrain, vehicle, route…) is only downloaded on /<body>/<vehicle>
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => <Loading /> });

export default function SceneLoader({ missionId }: { missionId: string }) {
  return <Scene missionId={missionId} />;
}
