"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { latLonDir, type AbandonedVehicle, type Body } from "@/lib/bodies";
import { PERF } from "@/lib/perf";
import type { Theme } from "@/lib/themes";
import { labelEls } from "./GlobeLabels";

const R = 1.5; // globe radius at scale 1
const IDLE = 0.1; // automatic spin, rad/s
const TILT = 0.5; // fixed elevation (~29°) of the view: shows the north pole like an isometric drawing; the globe only spins around its vertical axis, which stays vertical on screen
const damp = THREE.MathUtils.damp;

/**
 * Orthographic framing (no perspective: the sphere is a true circle and the grid doesn't lean, wherever it sits on screen).
 * `zoom` = pixels per world unit; `x` shifts the globe (world units) to the middle of the free area right of the left panel.
 */
function frame(w: number, h: number) {
  const portrait = w < h;
  const panel = portrait ? 0 : Math.min(380, Math.max(290, w * 0.28)) + 44; // left panel (see Explore) + margins
  const zoom = Math.min(h / 5.68, (w - panel) / (portrait ? 3.6 : 4.9));
  return { portrait, zoom, x: panel / 2 / zoom };
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

/** Flat marker planted on the surface: black square + pulsing square outline; its DOM label follows it. Counter-scaled so it keeps its size when the globe zooms. */
function Pin({
  vehicle,
  theme,
  outer,
  onClick,
}: {
  vehicle: AbandonedVehicle;
  theme: Theme;
  outer: RefObject<THREE.Group | null>;
  onClick: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), c: new THREE.Vector3(), cam: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  const q = useMemo(() => {
    const d = new THREE.Vector3(...latLonDir(vehicle.lat, vehicle.lon));
    return { pos: d.clone().multiplyScalar(R), quat: new THREE.Quaternion().setFromUnitVectors(Z, d) };
  }, [vehicle]);
  const g = theme.globe;
  const key = `v:${vehicle.missionId}`;

  useEffect(
    () => () => {
      const el = labelEls.get(key);
      if (el) el.style.opacity = "0";
    },
    [key],
  );

  useFrame((state) => {
    const r = root.current;
    const o = outer.current;
    if (!r || !o) return;
    r.scale.setScalar(1 / Math.max(o.scale.x, 0.001));
    const k = (state.clock.elapsedTime * 0.8) % 1;
    if (ring.current) {
      ring.current.scale.setScalar(0.7 + k * 1.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k);
    }
    // label: follows the marker on screen and hides while the marker is on the far side
    const el = labelEls.get(key);
    if (!el) return;
    r.getWorldPosition(tmp.p);
    o.getWorldPosition(tmp.c);
    tmp.s.copy(tmp.p).project(state.camera);
    el.style.transform = `translate(${(tmp.s.x * 0.5 + 0.5) * state.size.width}px,${(-tmp.s.y * 0.5 + 0.5) * state.size.height}px)`;
    tmp.cam.set(0, 0, 1).applyQuaternion(state.camera.quaternion); // towards the (orthographic) camera
    const front = tmp.p.sub(tmp.c).dot(tmp.cam) > 0;
    el.style.opacity = front ? "1" : "0";
  });

  return (
    <group ref={root} position={q.pos} quaternion={q.quat}>
      <mesh position-z={0.004}>
        <planeGeometry args={[0.075, 0.075]} />
        <meshBasicMaterial color={g.pin} />
      </mesh>
      <mesh ref={ring} position-z={0.003} rotation-z={Math.PI / 4}>
        <ringGeometry args={[0.07, 0.082, 4]} />
        <meshBasicMaterial color={g.pin} transparent depthWrite={false} />
      </mesh>
      <mesh
        position-z={0.02}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

type GlobeProps = {
  body: Body;
  selectedId: string | null; // selected vehicle (mission id)
  theme: Theme;
  onSelect: (missionId: string) => void;
};

function BodyGlobe({ body, selectedId, theme, onSelect }: GlobeProps) {
  const outer = useRef<THREE.Group>(null); // position + scale
  const spin = useRef<THREE.Group>(null); // rotation about the vertical axis (the only one the user can change)
  const size = useThree((s) => s.size);
  const st = useMemo(() => ({ drag: false, moved: 0, v: 0, angle: 0, settle: 0, free: false }), []);
  const target = useMemo(() => {
    const v = body.vehicles.find((x) => x.missionId === selectedId) ?? body.vehicles[0];
    return faceAngle(v.lon);
  }, [body, selectedId]);

  // a newly shown body spins in from the side and grows
  useEffect(() => {
    st.angle = faceAngle(body.vehicles[0].lon) + 1.4;
    if (outer.current) outer.current.scale.setScalar(0.8);
  }, [body, st]);
  // switching body or selecting a vehicle: turn the globe so the vehicle faces the viewer (then the user takes over)
  useEffect(() => {
    st.settle = 0;
    st.free = false;
  }, [body, selectedId, st]);

  useFrame((_, dtRaw) => {
    const o = outer.current;
    const g = spin.current;
    if (!o || !g) return;
    const dt = Math.min(dtRaw, 0.05);
    const { portrait, x } = frame(size.width, size.height);
    const selected = selectedId !== null;
    const s = portrait ? (selected ? 1 : 0.85) : selected ? 1.55 : 1.5;
    const y = portrait ? -0.6 : 0;
    o.scale.setScalar(damp(o.scale.x, s, 3.2, dt));
    o.position.set(damp(o.position.x, x, 3.2, dt), damp(o.position.y, y, 3.2, dt), 0);

    if (!st.drag && st.settle < 2.2) {
      st.settle += dt;
      st.angle += wrap(target - st.angle) * (1 - Math.exp(-2.8 * dt));
      st.v = 0;
    } else if (!st.drag) {
      // after a drag the globe keeps its momentum and settles back to the idle spin; with a vehicle selected it holds still until the user turns it
      const idle = selectedId !== null && !st.free ? 0 : IDLE;
      st.v += (idle - st.v) * (1 - Math.exp(-1.5 * dt));
      st.angle += st.v * dt;
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
            onPointerOver={() => (document.body.style.cursor = "grab")}
            onPointerOut={() => !st.drag && (document.body.style.cursor = "")}
          >
            <sphereGeometry args={[R, 48, 32]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <Grid color={theme.globe.line} />
          <Orbiters color={theme.globe.star} />
          {body.vehicles.map((v) => (
            <Pin key={v.missionId} vehicle={v} theme={theme} outer={outer} onClick={() => onSelect(v.missionId)} />
          ))}
        </group>
      </group>
    </group>
  );
}

export default function Globe({ body, selectedId, theme, onSelect }: GlobeProps) {
  // the globe eases in once its canvas exists (shaders compiled), instead of popping onto the page
  const [made, setMade] = useState(false);
  return (
    <div className="absolute inset-0" style={{ opacity: made ? 1 : 0, transition: `opacity ${theme.dur.slow}ms ${theme.ease}` }}>
    <Canvas orthographic dpr={PERF.dpr} camera={{ zoom: 140, near: 0.1, far: 100, position: [0, 0, 20] }} gl={{ antialias: PERF.globeAntialias }} onCreated={() => requestAnimationFrame(() => setMade(true))}
    >
      <color attach="background" args={[theme.globe.bg]} />
      <Fit />
      <Suspense fallback={null}>
        <BodyGlobe body={body} selectedId={selectedId} theme={theme} onSelect={onSelect} />
      </Suspense>
    </Canvas>
    </div>
  );
}
