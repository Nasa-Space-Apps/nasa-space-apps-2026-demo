"use client";

import dynamic from "next/dynamic";
import Loading from "./Loading";

// three / R3F are only downloaded when a page that needs them opens (the home page has a 3D vehicle)
const Home = dynamic(() => import("./Home"), { ssr: false, loading: () => <Loading title="Left behind" stage="Waking up the rovers" /> });

export default function HomeLoader() {
  return <Home />;
}
