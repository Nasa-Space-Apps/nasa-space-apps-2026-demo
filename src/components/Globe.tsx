"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { latLonDir, type AbandonedVehicle, type Body } from "@/lib/bodies";
import { MISSIONS } from "@/lib/missions";
import { reducedMotion, springStep, type Spring } from "@/lib/motion";
import { PERF } from "@/lib/perf";
import type { Theme } from "@/lib/themes";
import { buildMarker } from "@/lib/vehicles/mini";
import type { VehicleModel } from "@/lib/vehicles";
import { labelEls, placeFloating } from "./GlobeLabels";

const R = 1.5; // globe radius at scale 1
const IDLE = 0.1; // automatic spin, rad/s
const TILT = 0.5; // fixed elevation (~29°) of the view: shows the north pole like an isometric drawing; the globe only spins around its vertical axis, which stays vertical on screen

/**
 * Orthographic framing (no perspective: the sphere is a true circle and the grid doesn't lean, wherever it sits on screen).
 * `zoom` = pixels per world unit. The globe is centred (there is no side panel any more); `BodyGlobe` nudges it aside when a vehicle's card floats next to it.
 */
function frame(w: number, h: number) {
  const portrait = w < h;
  const zoom = Math.min(h / 5.68, w / (portrait ? 3.6 : 4.9));
  return { portrait, zoom, x: 0 };
}

/** Keeps the orthographic zoom in sync with the canvas size. */
function Fit() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    camera.zoom = frame(size.width, size.height).zoom;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** Thin circle at the limb of the globe (always facing the camera): gives the wireframe a clean silhouette. */
function Limb({ color }: { color: string }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(Math.cos(a) * R, Math.sin(a) * R, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineLoop geometry={geo}>
      <lineBasicMaterial color={color} />
    </lineLoop>
  );
}
const Z = new THREE.Vector3(0, 0, 1);
type PointerTarget = { setPointerCapture(id: number): void; releasePointerCapture(id: number): void };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rotation about the vertical axis that brings a longitude to the front (towards the camera). */
const faceAngle = (lon: number) => {
  const l = (lon * Math.PI) / 180;
  return -Math.atan2(Math.cos(l), -Math.sin(l));
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Black squares orbiting around the globe (like the reference chart). They live inside the spinning group, so they turn with the globe,
 * and the ones on the far side (behind the globe's centre plane) are not drawn: only what is in front at this moment shows.
 */
function Orbiters({ color }: { color: string }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geo, mat } = useMemo(() => {
    const r = rng(7);
    const sizes: number[] = [];
    const pos: number[] = [];
    for (const [n, px] of [
      [380, 2],
      [200, 3.5],
      [60, 5.5],
    ]) {
      for (let i = 0; i < n; i++) {
        const u = r() * 2 - 1; // uniform direction
        const a = r() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        const d = R * (1.06 + 3.8 * Math.pow(r(), 1.4)); // from just above the surface to well beyond the limb
        pos.push(s * Math.cos(a) * d, u * d, s * Math.sin(a) * d);
        sizes.push(px);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uDpr: { value: dpr } },
      vertexShader: `
        attribute float aSize;
        uniform float uDpr;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float front = dot(normalize(mv.xyz - c.xyz), vec3(0.0, 0.0, 1.0)); // orthographic: the view direction is constant
          gl_Position = front > 0.0 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
          gl_PointSize = aSize * uDpr;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    return { geo: g, mat: m };
  }, [color, dpr]);
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/** Latitude/longitude grid of a sphere (every 15°) as line segments. */
function graticule(step = 15) {
  const pos: number[] = [];
  const at = (lat: number, lon: number) => latLonDir(lat, lon).map((c) => c * R);
  const seg = (a: number[], b: number[]) => pos.push(...a, ...b);
  for (let lat = -90 + step; lat < 90; lat += step) {
    for (let i = 0; i < 96; i++) seg(at(lat, (i * 360) / 96), at(lat, ((i + 1) * 360) / 96));
  }
  for (let lon = 0; lon < 360; lon += step) {
    for (let i = 0; i < 72; i++) seg(at(-90 + (i * 180) / 72, lon), at(-90 + ((i + 1) * 180) / 72, lon));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** Wireframe globe: only the lines on the near side are drawn (the far side is discarded). */
function Grid({ color }: { color: string }) {
  const geo = useMemo(() => graticule(), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) } },
        vertexShader: `
          varying float vFacing;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vec3 n = normalize(mat3(modelViewMatrix) * position);
            vFacing = n.z; // orthographic: the view direction is constant
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vFacing;
          void main() {
            if (vFacing < 0.0) discard;
            gl_FragColor = vec4(uColor, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [color],
  );
  return <lineSegments geometry={geo} material={mat} />;
}

/** World units per model unit of the globe vehicles: a ~10-unit vehicle comes out ~0.17 units long (~24 px), about twice the old square pin. */
const S = 0.017;
const hot = { n: 0 }; // vehicles under the pointer: the idle spin pauses meanwhile, so a moving target can be clicked
const SINK = 1.3; // model units of the vehicle buried in the ground (the wheels are half under the surface)

/**
 * A tiny vehicle standing on the surface at its lat/lon, a little buried (the invisible ground sphere hides what is below). Counter-scaled so it keeps its
 * size when the globe zooms. It is clickable (an invisible hit sphere a bit bigger than the vehicle), grows when hovered or selected, and sits on a
 * pulsing square ring. Its DOM label follows it; while it is selected the label hides and the floating card follows it instead (GlobeLabels.tsx).
 */
function Marker({
  vehicle,
  model,
  theme,
  outer,
  index,
  selected,
  onClick,
}: {
  vehicle: AbandonedVehicle;
  model: VehicleModel;
  theme: Theme;
  outer: RefObject<THREE.Group | null>;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const hover = useRef(false);
  const grow = useRef<Spring>({ x: 0, v: 0 }); // starts at 0: each vehicle pops in (staggered) when its globe appears
  const born = useRef(-1);
  const phase = (index * 0.9) % 3.4; // each vehicle hops at its own moment
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), c: new THREE.Vector3(), cam: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  const q = useMemo(() => {
    const d = new THREE.Vector3(...latLonDir(vehicle.lat, vehicle.lon));
    return { pos: d.clone().multiplyScalar(R), quat: new THREE.Quaternion().setFromUnitVectors(Z, d) };
  }, [vehicle]);
  const rig = useMemo(() => buildMarker(model, { ...theme.globe.vehicle, bg: theme.globe.bg }), [model, theme]);
  useEffect(() => () => rig.dispose(), [rig]);
  const yaw = useMemo(() => ([...vehicle.missionId].reduce((a, c) => a + c.charCodeAt(0), 0) % 8) * 0.8, [vehicle]); // varied headings, fixed per vehicle
  const g = theme.globe;
  const key = `v:${vehicle.missionId}`;

  useEffect(
    () => () => {
      const el = labelEls.get(key);
      if (el) el.style.opacity = "0";
      if (hover.current) hot.n = Math.max(0, hot.n - 1); // unmounted while hovered (world switch)
    },
    [key],
  );

  useFrame((state, dtRaw) => {
    const r = root.current;
    const o = outer.current;
    const b = body.current;
    if (!r || !o || !b) return;
    const dt = Math.min(dtRaw, 0.05);
    r.scale.setScalar(1 / Math.max(o.scale.x, 0.001));
    const t = state.clock.elapsedTime;
    if (born.current < 0) born.current = t;
    // playful: a springy pop-in, a quick hop every few seconds, a happy bounce while selected and a wiggle while hovered
    const alive = t - born.current > 0.3 + index * 0.12;
    const gs = springStep(grow.current, !alive ? 0 : hover.current ? 1.5 : selected ? 1.3 : 1, dt, 260, 11);
    let hop = 0;
    let wob = 0;
    if (!reducedMotion()) {
      if (hover.current) {
        hop = 0.7 + Math.abs(Math.sin(t * 9)) * 1.2;
        wob = Math.sin(t * 16) * 0.22;
      } else if (selected) hop = Math.abs(Math.sin(t * 4)) * 1.4;
      else {
        const hp = ((t + phase) % 3.4) / 0.75;
        if (hp < 1) hop = Math.sin(hp * Math.PI) * 2.2;
      }
    }
    b.position.y = (hop - SINK) * S;
    b.rotation.y = yaw + wob;
    b.scale.setScalar(S * Math.max(gs, 0.0001));
    const k = (t * 0.8) % 1;
    if (ring.current) {
      ring.current.scale.setScalar(0.8 + k * 1.1);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (selected || hover.current ? 0.95 : 0.55) * (1 - k);
    }
    // screen position: the label follows the vehicle, the floating card too while it is selected; both hide while the vehicle is on the far side
    r.getWorldPosition(tmp.p);
    o.getWorldPosition(tmp.c);
    tmp.s.copy(tmp.p).project(state.camera);
    const px = (tmp.s.x * 0.5 + 0.5) * state.size.width;
    const py = (-tmp.s.y * 0.5 + 0.5) * state.size.height;
    tmp.cam.set(0, 0, 1).applyQuaternion(state.camera.quaternion); // towards the (orthographic) camera
    const front = tmp.p.sub(tmp.c).dot(tmp.cam) > 0;
    const el = labelEls.get(key);
    if (el) {
      el.style.transform = `translate(${px}px,${py}px)`;
      el.style.opacity = front && !selected && hover.current ? "1" : "0"; // the name appears on hover (six labels at once crowd the Jezero cluster)
    }
    if (selected) placeFloating(px, py, front, state.size.width, state.size.height, dt);
  });

  return (
    <group ref={root} position={q.pos} quaternion={q.quat}>
      <group rotation-x={Math.PI / 2}>
        {/* the model stands on +y: turned so +y is the surface normal (the group's +z); sunk into the ground */}
        <group ref={body} rotation-y={yaw} position-y={-SINK * S} scale={0.0001}>
          <primitive object={rig.root} />
        </group>
      </group>
      <mesh ref={ring} position-z={0.003} rotation-z={Math.PI / 4}>
        <ringGeometry args={[0.13, 0.15, 4]} />
        <meshBasicMaterial color={g.pin} transparent depthWrite={false} />
      </mesh>
      <mesh
        position-z={0.05}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => {
          hover.current = true;
          hot.n++;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (hover.current) hot.n = Math.max(0, hot.n - 1);
          hover.current = false;
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.17, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

type GlobeProps = {
  body: Body;
  selectedId: string | null; // selected vehicle (mission id): its card is open, the globe holds still and can't be dragged
  faceId: string | null; // vehicle to turn towards when the view appears (coming back from the trip); a click never moves the globe
  theme: Theme;
  onSelect: (missionId: string) => void;
};

function BodyGlobe({ body, selectedId, faceId, theme, onSelect }: GlobeProps) {
  const outer = useRef<THREE.Group>(null); // position + scale
  const spin = useRef<THREE.Group>(null); // rotation about the vertical axis (the only one the user can change)
  const size = useThree((s) => s.size);
  const st = useMemo(() => ({ drag: false, moved: 0, v: 0, angle: 0, settle: 0, free: false }), []);
  const pop = useMemo<Spring>(() => ({ x: 0.25, v: 0 }), []); // the globe's size: it pops in with an overshoot
  const target = useMemo(() => {
    const v = body.vehicles.find((x) => x.missionId === faceId) ?? body.vehicles[0];
    return faceAngle(v.lon);
  }, [body, faceId]);

  // a newly shown body spins in from the side and pops up (a springy grow)
  useEffect(() => {
    st.angle = faceAngle(body.vehicles[0].lon) + 1.4;
    pop.x = 0.25;
    pop.v = 0;
  }, [body, st, pop]);
  // switching body (or coming back with a vehicle open): turn the globe so that vehicle faces the viewer, then the user takes over
  useEffect(() => {
    st.settle = 0;
  }, [body, faceId, st]);
  useEffect(() => {
    st.free = false;
  }, [selectedId, st]);

  useFrame((_, dtRaw) => {
    const o = outer.current;
    const g = spin.current;
    if (!o || !g) return;
    const dt = Math.min(dtRaw, 0.05);
    const { portrait, x } = frame(size.width, size.height);
    // the globe never moves or zooms because of a click: it stays where it is, the card floats beside the vehicle
    o.scale.setScalar(springStep(pop, portrait ? 0.85 : 1.5, dt, 70, 8));
    o.position.set(x, 0, 0);

    if (!st.drag && st.settle < 2.2) {
      st.settle += dt;
      st.angle += wrap(target - st.angle) * (1 - Math.exp(-2.8 * dt));
      st.v = 0;
    } else if (!st.drag) {
      if (selectedId !== null) st.v = 0; // a card is open: the globe stops dead (no drifting after a flick)
      else {
        // after a drag the globe keeps its momentum and settles back to the idle spin; it pauses while the pointer is over a vehicle
        const idle = hot.n > 0 ? 0 : IDLE;
        st.v += (idle - st.v) * (1 - Math.exp(-1.5 * dt));
        st.angle += st.v * dt;
      }
    }
    g.rotation.y = st.angle;
  });

  const drag = (e: ThreeEvent<PointerEvent>) => {
    if (!st.drag) return;
    const o = outer.current;
    if (!o) return;
    const k = 0.0075 / Math.max(o.scale.x, 0.6);
    const mx = e.nativeEvent.movementX; // horizontal only: the globe can't be tilted
    st.moved += Math.abs(mx);
    st.angle += mx * k;
    st.v = THREE.MathUtils.clamp(st.v * 0.5 + ((mx * k) / 0.016) * 0.5, -6, 6); // smoothed flick velocity, kept when the pointer is released
  };

  return (
    <group ref={outer}>
      <Limb color={theme.globe.star} />
      <group rotation-x={TILT}>
        <group ref={spin}>
          {/* invisible sphere: catches the drag */}
          <mesh
            onPointerDown={(e) => {
              if (selectedId !== null) return; // a card is open: the pointer can't turn the globe (a click outside closes the card)
              e.stopPropagation();
              (e.target as unknown as PointerTarget).setPointerCapture(e.pointerId);
              st.drag = true;
              st.free = true;
              st.settle = 2.2; // a drag cancels the "face the vehicle" turn
              st.moved = 0;
              st.v = 0;
              document.body.style.cursor = "grabbing";
            }}
            onPointerMove={drag}
            onPointerUp={(e) => {
              if (!st.drag) return;
              (e.target as unknown as PointerTarget).releasePointerCapture(e.pointerId);
              st.drag = false;
              document.body.style.cursor = "grab";
            }}
            onPointerOver={() => (document.body.style.cursor = selectedId !== null ? "" : "grab")}
            onPointerOut={() => !st.drag && (document.body.style.cursor = "")}
          >
            <sphereGeometry args={[R, 48, 32]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {/* invisible solid ground: it only writes depth (drawn first), so the buried part of each vehicle and everything on the far side stay hidden */}
          <mesh renderOrder={-1}>
            <sphereGeometry args={[R * 0.997, 48, 32]} />
            <meshBasicMaterial colorWrite={false} />
          </mesh>
          <Grid color={theme.globe.line} />
          <Orbiters color={theme.globe.star} />
          {body.vehicles.map((v, i) => (
            <Marker
              key={v.missionId}
              index={i}
              vehicle={v}
              model={MISSIONS.find((m) => m.id === v.missionId)?.rover.model ?? "opportunity"}
              theme={theme}
              outer={outer}
              selected={v.missionId === selectedId}
              onClick={() => onSelect(v.missionId)}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

export default function Globe({ body, selectedId, faceId, theme, onSelect }: GlobeProps) {
  // the globe eases in once its canvas exists (shaders compiled), instead of popping onto the page
  const [made, setMade] = useState(false);
  return (
    <div className="absolute inset-0" style={{ opacity: made ? 1 : 0, transition: `opacity ${theme.dur.slow}ms ${theme.ease}` }}>
    <Canvas orthographic dpr={PERF.dpr} camera={{ zoom: 140, near: 0.1, far: 100, position: [0, 0, 20] }} gl={{ antialias: PERF.globeAntialias }} onCreated={() => requestAnimationFrame(() => setMade(true))}
    >
      <color attach="background" args={[theme.globe.bg]} />
      <Fit />
      <Suspense fallback={null}>
        <BodyGlobe body={body} selectedId={selectedId} faceId={faceId} theme={theme} onSelect={onSelect} />
      </Suspense>
    </Canvas>
    </div>
  );
}
