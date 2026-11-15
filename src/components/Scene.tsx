"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Preload, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { buildTerrain } from "@/lib/terrain";
import { buildRoute } from "@/lib/route";
import { game } from "@/lib/game";
import { MISSIONS, type Mission } from "@/lib/missions";
import { THEME as theme } from "@/lib/themes";
import { PERF } from "@/lib/perf";
import { ease } from "@/lib/ui";
import { bodyOfMission } from "@/lib/bodies";
import { toggleGuide } from "@/lib/guide";
import { toggleNarration } from "@/lib/narration";
import FrameGovernor from "./FrameGovernor";
import { LoadingContent } from "./Loading";
import Rover from "./Rover";
import Checkpoints from "./Checkpoints";
import CheckpointCard from "./CheckpointCard";
import Guide from "./Guide";
import Ambient from "./Ambient";
import Captions from "./Captions";
import Dust from "./Dust";
import Tracks from "./Tracks";
import Minimap from "./Minimap";
import Timeline from "./Timeline";
import { Hints, TopBar } from "./Hud";

const damp = THREE.MathUtils.damp;

function Sun({ mission }: { mission: Mission }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const [ox, oy, oz] = mission.env.sun.offset;
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.set(game.x + ox, game.y + oy, game.z + oz);
    target.position.set(game.x, game.y, game.z);
  });
  return (
    <>
      <directionalLight
        ref={light}
        target={target}
        intensity={mission.env.sun.intensity}
        color={mission.env.sun.color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={250}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <primitive object={target} />
    </>
  );
}

function CameraRig() {
  const cur = useMemo(() => ({ x: NaN, y: 0, z: 0, fov: 35 }), []);
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    const ahead = THREE.MathUtils.clamp(game.speed, -10, game.topSpeed) * 0.35;
    const tx = game.x + Math.sin(game.heading) * ahead;
    const tz = game.z + Math.cos(game.heading) * ahead;
    if (Number.isNaN(cur.x)) {
      cur.x = tx;
      cur.y = game.y;
      cur.z = tz;
    }
    cur.x = damp(cur.x, tx, 3.5, dt);
    cur.y = damp(cur.y, game.y, 3.5, dt);
    cur.z = damp(cur.z, tz, 3.5, dt);
    const shake = game.boost ? 0.05 : 0;
    cam.position.set(
      cur.x + 22 + (Math.random() - 0.5) * shake,
      cur.y + 16 + (Math.random() - 0.5) * shake,
      cur.z + 24,
    );
    cam.lookAt(cur.x, cur.y + 2, cur.z);
    const targetFov = 35 + Math.min(1, Math.abs(game.speed) / game.topSpeed) * 9;
    cur.fov = damp(cur.fov, targetFov, 3, dt);
    if (Math.abs(cam.fov - cur.fov) > 0.01) {
      cam.fov = cur.fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

function Experience({ mission }: { mission: Mission }) {
  const stl = useLoader(STLLoader, mission.terrainUrl);
  const { mesh, data } = useMemo(() => buildTerrain(stl, mission.terrain), [stl, mission]);
  const route = useMemo(() => buildRoute(mission.checkpoints), [mission]);

  // (re)start the mission: put the rover at the start of the route and publish the terrain and the route
  useEffect(() => {
    const start = route.at(0);
    Object.assign(game, {
      terrain: data,
      route,
      s: 0,
      travel: null,
      x: start.x,
      z: start.z,
      y: data.heightAt(start.x, start.z),
      heading: start.heading,
      speed: 0,
      boost: false,
      topSpeed: mission.rover.boostSpeed,
      wheels: [],
      checkpoints: mission.checkpoints,
      checkpointRadius: mission.checkpointRadius,
      visited: new Set<string>(),
      active: null,
      mission: mission.id,
    });
    return () => {
      game.terrain = null;
      game.route = null;
    };
  }, [data, route, mission]);

  const { env } = mission;
  return (
    <>
      <color attach="background" args={[env.sky]} />
      <fog attach="fog" args={[env.sky, env.fogNear, env.fogFar]} />
      <hemisphereLight args={env.hemi} />
      <Sun mission={mission} />
      <primitive object={mesh} />
      <mesh rotation-x={-Math.PI / 2} position-y={data.baseH - 0.02} receiveShadow>
        <circleGeometry args={[1600, 48]} />
        <meshToonMaterial color={data.edgeColor} />
      </mesh>
      <Tracks color={mission.tracks.color} opacity={mission.tracks.opacity} />
      <Checkpoints
        checkpoints={mission.checkpoints}
        radius={mission.checkpointRadius}
        terrain={data}
        colors={theme.beacon}
      />
      <Guide />
      <Rover config={mission.rover} />
      <Dust config={mission.dust} />
      <CameraRig />
      <Preload all /> {/* compile shaders and upload geometry now, behind the loading screen, so the first visible frames don't hitch */}
    </>
  );
}

/**
 * The scene of a vehicle. Next keeps visited routes alive (hidden); with the light perf profile the whole scene — and its WebGL canvas, terrain and
 * textures — is released while its route is not the current one, and rebuilt (with its fade-in) when the user comes back. See lib/perf.ts.
 */
type SceneOptions = {
  onBack?: () => void; // replaces «← Globe» (the story sends the player back to its comic instead)
  backLabel?: string;
  lockVehicle?: boolean; // no vehicle picker and no M key (the story has one vehicle)
};

export default function Scene({ missionId, ...options }: { missionId: string } & SceneOptions) {
  const pathname = usePathname();
  const active = pathname === `/${bodyOfMission(missionId)?.id ?? "moon"}/${missionId}`;
  if (PERF.releaseHiddenViews && !active) return null;
  return <SceneView missionId={missionId} {...options} />;
}

function SceneView({ missionId, onBack, backLabel, lockVehicle }: { missionId: string } & SceneOptions) {
  const router = useRouter();
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];
  const vehicle = bodyOfMission(mission.id);

  // Loading screen: covers the scene from the first paint until the terrain is downloaded AND built (game.terrain is published), for at least a
  // beat so it never flashes; then it dissolves into the scene. Leaving fades back to the canvas colour before navigating (no cuts either way).
  const { progress } = useProgress();
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const poll = () => {
      if (game.terrain && game.mission === mission.id && performance.now() - t0 > 900) {
        raf = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true))); // two frames: the first picture is drawn behind the cover
        return;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [mission.id]);
  const leave = useRef(0);
  useEffect(() => () => window.clearTimeout(leave.current), []);
  const go = (url: string) => {
    if (leaving) return;
    setLeaving(true);
    leave.current = window.setTimeout(() => router.push(url), theme.dur.base + 150);
  };

  // each vehicle has its own route (/<body>/<vehicle>): switching vehicle navigates, so only that vehicle's assets load
  const goMission = (id: string) => go(`/${bodyOfMission(id)?.id ?? "moon"}/${id}`);
  const goGlobe = () => go(`/${vehicle?.id ?? "moon"}#${mission.id}`);

  // keys: M cycles vehicle, N narration, G guide (S music lives in <Ambient/>; Space, which drives, is handled in lib/game.ts)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.code === "KeyN") toggleNarration();
      if (e.code === "KeyG") toggleGuide();
      if (e.code === "KeyM" && !lockVehicle) {
        goMission(MISSIONS[(MISSIONS.findIndex((x) => x.id === mission.id) + 1) % MISSIONS.length].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goMission/mission only change with the route (the whole Scene remounts)
  }, []);

  return (
    <>
      <Canvas
        flat
        shadows
        frameloop={PERF.idleFps < 60 ? "demand" : "always"}
        dpr={PERF.dpr}
        camera={{ fov: 35, near: 0.5, far: 700, position: [22, 16, 24] }}
        gl={{ antialias: PERF.sceneAntialias }}
      >
        {PERF.idleFps < 60 && <FrameGovernor idleFps={PERF.idleFps} />}
        <Suspense fallback={null}>
          <Experience key={mission.id} mission={mission} />
        </Suspense>
      </Canvas>
      <div className="fixed left-5 top-5 z-20">
        <TopBar
          theme={theme}
          onGlobe={onBack ?? goGlobe}
          backLabel={backLabel}
          items={lockVehicle ? undefined : MISSIONS.map((m) => ({ id: m.id, name: m.name }))}
          value={mission.id}
          onChange={goMission}
        />
      </div>
      <Ambient track="timeline" />
      <Minimap theme={theme} title={mission.title} accent={mission.rover.palette.dark} />
      <CheckpointCard theme={theme} />
      {/* bottom centre, between the card (left) and the minimap (right): caption above, then the key chips, then the timeline */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-10 flex w-[clamp(300px,calc(100vw-760px),640px)] -translate-x-1/2 flex-col items-stretch gap-2.5">
        <Captions theme={theme} />
        <Hints theme={theme} />
        <Timeline theme={theme} accent={mission.rover.palette.dark} />
      </div>
      <div
        aria-hidden={ready}
        className="pointer-events-none fixed inset-0 z-30"
        style={{ background: theme.canvas, opacity: ready && !leaving ? 0 : 1, transition: ease(theme, ["opacity"], ready && !leaving ? theme.dur.slow + 400 : theme.dur.base + 100) }}
      >
        <LoadingContent
          visible={!ready}
          title={vehicle?.vehicles.find((v) => v.missionId === mission.id)?.name ?? mission.name}
          stage={`${vehicle?.name ?? ""} · ${progress < 100 ? "Downloading terrain" : "Building terrain"}`}
          progress={ready ? 100 : Math.min(progress, 97)}
        />
      </div>
    </>
  );
}
