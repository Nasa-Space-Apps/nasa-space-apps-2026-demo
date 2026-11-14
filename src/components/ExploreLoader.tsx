"use client";

import dynamic from "next/dynamic";
import Loading from "./Loading";

// three / R3F are only downloaded on the globe routes (/moon, /mars)
const Explore = dynamic(() => import("./Explore"), { ssr: false, loading: () => <Loading title="Left behind" stage="Loading the globe" /> });

export default function ExploreLoader({ bodyId }: { bodyId: string }) {
  return <Explore initialBodyId={bodyId} />;
}
