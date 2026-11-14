import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BODIES } from "@/lib/bodies";
import ExploreLoader from "@/components/ExploreLoader";
import Loading from "@/components/Loading";

/** /moon, /mars — the globe with its abandoned vehicles. */
export function generateStaticParams() {
  return BODIES.map((b) => ({ body: b.id }));
}

async function Globe({ params }: { params: Promise<{ body: string }> }) {
  const { body } = await params;
  if (!BODIES.some((b) => b.id === body)) notFound();
  return <ExploreLoader bodyId={body} />;
}

export default function Page({ params }: { params: Promise<{ body: string }> }) {
  return (
    <main className="fixed inset-0">
      <Suspense fallback={<Loading title="Left behind" stage="Loading the globe" />}>
        <Globe params={params} />
      </Suspense>
    </main>
  );
}
