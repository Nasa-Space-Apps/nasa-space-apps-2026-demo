import HomeLoader from "@/components/HomeLoader";

/** `/` — the home page: a window onto the six stories (components/Home.tsx). The globe, the menu of the game, is /mars and /moon. */
export default function Home() {
  return (
    <main className="fixed inset-0">
      <HomeLoader />
    </main>
  );
}
