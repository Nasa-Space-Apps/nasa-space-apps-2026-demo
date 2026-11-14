import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BODIES } from "@/lib/bodies";
import Loading from "@/components/Loading";
import SceneLoader from "@/components/SceneLoader";

/** /moon/sev, /mars/opportunity — the trip into the past (the vehicle's route). The vehicle slug is its mission id. */
export function generateStaticParams() {
  return BODIES.flatMap((b) => b.vehicles.map((v) => ({ body: b.id, vehicle: v.missionId })));
}

async function Trip({ params }: { params: Promise<{ body: string; vehicle: string }> }) {
  const { body, vehicle } = await params;
  const ok = BODIES.find((b) => b.id === body)?.vehicles.some((v) => v.missionId === vehicle);
  if (!ok) notFound();
  return <SceneLoader missionId={vehicle} />;
}

export default function Page({ params }: { params: Promise<{ body: string; vehicle: string }> }) {
  return (
    <main className="fixed inset-0">
      <Suspense fallback={<Loading />}>
        <Trip params={params} />
      </Suspense>
    </main>
  );
}
