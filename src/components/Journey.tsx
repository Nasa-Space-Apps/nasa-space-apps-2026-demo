"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { bodyOfMission } from "@/lib/bodies";
import { game } from "@/lib/game";
import { loadNarration, stopNarration } from "@/lib/narration";
import { MISSIONS } from "@/lib/missions";
import { beatToCheckpoint, storyOf, type Story } from "@/lib/story";
import { useTheme } from "@/lib/use-theme";
import Ambient from "./Ambient";
import Comic from "./Comic";
import Icon from "./Icon";
import Loading from "./Loading";
import Pop from "./Pop";

// the 3D scene (terrain, vehicle, route…) is only downloaded once the story gets close to Mars
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

type Phase = "intro" | "mars" | "outro";

/**
 * The whole story of a mission on one route (/mars/opportunity, /mars/ingenuity), in three acts that share one blue field:
 *
 *   intro  comic pages: the idea, the decision, the launch, the landing (the events before the vehicle is on Mars)
 *   mars   the 3D route: one stop per event on the Martian surface (the scene loads behind the last comic pages and waits: `game.hold`)
 *   outro  comic pages again (the farewell and the legacy) and a closing card with «play again» / «globe»
 *
 * Like the scene, it releases everything when its route is not the current one (Next keeps visited routes alive) and starts over on the way back.
 */
export default function Journey({ missionId }: { missionId: string }) {
  const pathname = usePathname();
  const story = storyOf(missionId);
  const [run, setRun] = useState(0); // «play again» remounts the whole experience
  if (!story || pathname !== `/${bodyOfMission(missionId)?.id ?? "mars"}/${missionId}`) return null;
  return <JourneyView key={run} missionId={missionId} story={story} onReplay={() => setRun((r) => r + 1)} />;
}

const decode = (src: string) =>
  new Promise<void>((done) => {
    const img = new Image();
    img.src = src;
    img.decode().then(() => done(), () => done()); // a missing picture must not block the story
  });

/**
 * Gets everything the story needs READY before the first page: the narration clips (into memory, see lib/narration.ts) and the illustrations (downloaded and
 * decoded). Without this, a page narrated for the first time waited on the network ("loading" for seconds, no subtitles). Never waits more than 25 s, and never
 * flashes: at least 0.8 s of the loading screen.
 */
function useStoryAssets(beats: Story["beats"]) {
  const [done, setDone] = useState(0);
  const [ready, setReady] = useState(false);
  const total = beats.length * 2;
  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    let n = 0;
    const tick = () => {
      n++;
      if (alive) setDone(n);
    };
    const jobs = beats.flatMap((b) => [loadNarration(beatToCheckpoint(b)).then(tick), decode(b.image).then(tick)]);
    const cap = new Promise<void>((r) => window.setTimeout(r, 25000));
    void Promise.race([Promise.all(jobs), cap]).then(() => {
      window.setTimeout(() => alive && setReady(true), Math.max(0, 800 - (performance.now() - t0)));
    });
    return () => {
      alive = false;
    };
  }, [beats]);
  return { ready, progress: Math.round((Math.min(done, total) / total) * 100) };
}

function JourneyView({ missionId, story, onReplay }: { missionId: string; story: Story; onReplay: () => void }) {
  const theme = useTheme();
  const { ready, progress } = useStoryAssets(story.beats);
  const router = useRouter();
  const body = bodyOfMission(missionId)?.id ?? "mars";
  const place = story.parts[1].title.toLowerCase(); // «mars», «moon»: where the 3D route is
  const [phase, setPhase] = useState<Phase>("intro");
  const [sceneOn, setSceneOn] = useState(false); // the 3D scene is mounted (hidden behind the comic until it is its turn)
  const [comicOn, setComicOn] = useState(true);
  const [introStart, setIntroStart] = useState(0); // page the intro opens on (the last one when the player comes back from the 3D)
  const warmed = useRef(false);

  // the scene waits behind the comic pages: no driving, no checkpoint card, no narration, no guide
  useEffect(() => {
    game.hold = true;
    return () => {
      game.hold = false;
      stopNarration();
    };
  }, []);

  const toGlobe = () => router.push(`/${body}#${missionId}`);
  // The terrain is only DOWNLOADED while the player reads (a plain fetch fills the browser cache); the 3D scene is MOUNTED when they land, behind the dissolving
  // comic: building the terrain and compiling the shaders blocks the page for seconds, which froze the buttons and the subtitles when it ran on page 3.
  const warmTerrain = () => {
    if (warmed.current) return;
    warmed.current = true;
    const url = MISSIONS.find((m) => m.id === missionId)?.terrainUrl;
    if (url) void fetch(url).catch(() => {});
  };
  const startMars = () => {
    setSceneOn(true);
    setPhase("mars");
    setComicOn(false);
    game.hold = false; // the first checkpoint opens (card + narration) as the comic dissolves
  };
  /** «← Story» in the 3D: back to the last comic page (the landing); the scene stays where it is, waiting. */
  const backToIntro = () => {
    stopNarration();
    game.hold = true;
    setIntroStart(story.intro.length - 1);
    setPhase("intro");
    setComicOn(true);
  };
  /** ← on the first page of the epilogue: back to the 3D route, at the last stop. */
  const backToMars = () => {
    setPhase("mars");
    setComicOn(false);
    game.hold = false;
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
      {sceneOn && <Scene missionId={missionId} onBack={backToIntro} backLabel="Story" lockVehicle />}
      {phase === "mars" && <MarsActions lastId={story.mars[story.mars.length - 1].id} onClick={startOutro} />}
      {!ready && <Loading title={story.name} stage="Preparing the story" progress={progress} />}

      {ready && comicOn && phase === "intro" && (
        <Comic
          key="intro"
          name={story.name}
          beats={story.intro}
          label={story.parts[0].title.toLowerCase()}
          doneLabel={`land on ${place}`}
          skipLabel={`skip to ${place}`}
          onDone={startMars}
          onSkip={startMars}
          onBack={toGlobe}
          startAt={introStart}
          onPage={(i) => {
            if (i >= 2) warmTerrain();
          }}
          onLeave={() => setSceneOn(true)}
        />
      )}
      {ready && comicOn && phase === "outro" && (
        <Comic
          key="outro"
          name={story.name}
          beats={story.outro}
          label={story.parts[2].title.toLowerCase()}
          doneLabel=""
          onDone={() => {}}
          onBack={toGlobe}
          onBackPast={backToMars}
          end={
            <>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.95, color: theme.ink }}>{story.closing.title}</div>
              <p style={{ marginTop: 14, fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: theme.ink }}>
                {story.closing.text}
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

/** Top right while driving: «skip the 3D» goes straight to the epilogue; at the last stop it becomes «continue the story». */
function MarsActions({ lastId, onClick }: { lastId: string; onClick: () => void }) {
  const theme = useTheme();
  const [on, setOn] = useState(false); // the rover is at the last stop
  useEffect(() => {
    const id = window.setInterval(() => setOn(game.active === lastId), 400);
    return () => window.clearInterval(id);
  }, [lastId]);
  return (
    <div className="fixed right-5 top-5 z-20">
      {/* re-keyed when it changes, so the button pops again as it turns from «skip» into «continue» */}
      <Pop key={on ? "end" : "mid"} theme={theme} delay={on ? 900 : 1200} origin="right center" from="scale(0.4) rotate(8deg) translateY(-20px)">
        <button type="button" className={`ui-btn ${on ? "" : "is-accent"}`} onClick={(e) => (e.currentTarget.blur(), onClick())}>
          {on ? "continue the story" : "skip the 3D"} <Icon className="ui-arrow" name="arrow-right" size={16} />
        </button>
      </Pop>
    </div>
  );
}
