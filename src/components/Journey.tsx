"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bodyOfMission } from "@/lib/bodies";
import { game } from "@/lib/game";
import { stopNarration } from "@/lib/narration";
import { INTRO_BEATS, MARS_BEATS, OUTRO_BEATS } from "@/lib/opportunity";
import { THEME as theme } from "@/lib/themes";
import Ambient from "./Ambient";
import Comic from "./Comic";
import Icon from "./Icon";
import Pop from "./Pop";

// the 3D scene (terrain, vehicle, route…) is only downloaded once the story gets close to Mars
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

type Phase = "intro" | "mars" | "outro";

/**
 * The whole Opportunity experience on one route (/mars/opportunity), in three acts that share one blue field:
 *
 *   intro  comic pages: the idea, the decision, the launch, the landing (the 5 events before the rover is on Mars)
 *   mars   the 3D route: one stop per event on Meridiani Planum (the scene loads behind the last comic pages and waits: `game.hold`)
 *   outro  comic pages again (the farewell and the legacy) and a closing card with «play again» / «globe»
 *
 * Like the scene, it releases everything when its route is not the current one (Next keeps visited routes alive) and starts over on the way back.
 */
export default function Journey({ missionId }: { missionId: string }) {
  const pathname = usePathname();
  const [run, setRun] = useState(0); // «play again» remounts the whole experience
  if (pathname !== `/${bodyOfMission(missionId)?.id ?? "mars"}/${missionId}`) return null;
  return <JourneyView key={run} missionId={missionId} onReplay={() => setRun((r) => r + 1)} />;
}

function JourneyView({ missionId, onReplay }: { missionId: string; onReplay: () => void }) {
  const router = useRouter();
  const body = bodyOfMission(missionId)?.id ?? "mars";
  const [phase, setPhase] = useState<Phase>("intro");
  const [sceneOn, setSceneOn] = useState(false); // the 3D scene is mounted (hidden behind the comic until it is its turn)
  const [comicOn, setComicOn] = useState(true);

  // the scene waits behind the comic pages: no driving, no checkpoint card, no narration, no guide
  useEffect(() => {
    game.hold = true;
    return () => {
      game.hold = false;
      stopNarration();
    };
  }, []);

  const toGlobe = () => router.push(`/${body}#${missionId}`);
  const startMars = () => {
    setSceneOn(true);
    setPhase("mars");
    setComicOn(false);
    game.hold = false; // the first checkpoint opens (card + narration) as the comic dissolves
  };
  const startOutro = () => {
    stopNarration();
    game.hold = true;
    setPhase("outro");
    setComicOn(true);
  };

  return (
    <>
      <Ambient track="timeline" />
      {sceneOn && <Scene missionId={missionId} />}
      {phase === "mars" && <ContinuePrompt lastId={MARS_BEATS[MARS_BEATS.length - 1].id} onClick={startOutro} />}

      {comicOn && phase === "intro" && (
        <Comic
          key="intro"
          beats={INTRO_BEATS}
          label="earth"
          doneLabel="land on mars"
          onDone={startMars}
          onSkip={startMars}
          onBack={toGlobe}
          onPage={(i) => i >= 2 && setSceneOn(true)}
        />
      )}
      {comicOn && phase === "outro" && (
        <Comic
          key="outro"
          beats={OUTRO_BEATS}
          label="legacy"
          doneLabel=""
          onDone={() => {}}
          onBack={toGlobe}
          end={
            <>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.95, color: theme.ink }}>thank you, Opportunity</div>
              <p style={{ marginTop: 14, fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: theme.ink }}>
                Planned for 90 sols, it worked for almost 15 years and drove 45.16 km across Mars.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button type="button" className="ui-btn" onClick={onReplay}>
                  play again <Icon className="ui-arrow" name="arrow-right" size={16} />
                </button>
                <button type="button" className="ui-btn is-ghost" onClick={toGlobe}>
                  <Icon name="arrow-left" size={16} /> back to the globe
                </button>
              </div>
            </>
          }
        />
      )}
    </>
  );
}

/** Appears when the rover reaches the last stop of the route: «continue the story» opens the epilogue. */
function ContinuePrompt({ lastId, onClick }: { lastId: string; onClick: () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setOn(game.active === lastId), 400);
    return () => window.clearInterval(id);
  }, [lastId]);
  return (
    <div className="fixed right-5 top-5 z-20" style={{ pointerEvents: on ? "auto" : "none" }}>
      <Pop theme={theme} show={on} delay={900} origin="right center" from="scale(0.4) rotate(8deg) translateY(-20px)">
        <button type="button" className="ui-btn" onClick={(e) => (e.currentTarget.blur(), onClick())}>
          continue the story <Icon className="ui-arrow" name="arrow-right" size={16} />
        </button>
      </Pop>
    </div>
  );
}
