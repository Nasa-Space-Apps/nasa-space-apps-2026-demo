"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { latLonDir, type AbandonedVehicle, type Body } from "@/lib/bodies";
import { MISSIONS } from "@/lib/missions";
import { reducedMotion, springStep, type Spring } from "@/lib/motion";
import { PERF } from "@/lib/perf";
import type { Theme } from "@/lib/themes";
import { blobFrom } from "@/lib/vehicles/blob";
import { buildMarker } from "@/lib/vehicles/mini";
import type { VehicleModel } from "@/lib/vehicles";
import { labelEls, placeFloating } from "./GlobeLabels";

const R = 1.5; // globe radius at scale 1
const IDLE = 0.1; // automatic spin, rad/s
const TILT = 0.5; // starting elevation (~29°): shows the north pole like an isometric drawing. The globe is free: drag turns it about both screen axes
/**
 * While the user steers the globe by hand, the centre of the face the camera sees must stay within MAX_OFF of at least one vehicle, so the visible side always has
 * a vehicle in it (the automatic spin is free: it may show empty ground). If the user grabs the globe while it shows none, it first turns quickly (the snap) until
 * the nearest vehicle is SNAP_OFF from the centre. Angles in radians.
 */
const MAX_OFF = (45 * Math.PI) / 180;
const SNAP_OFF = (25 * Math.PI) / 180;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3.2;
/** Zoom of the globe view (a multiplier of the framing zoom). Module-level so the wheel handler and the render loop share it. */
const view = { target: 1, cur: 1 };
const zoomBy = (f: number) => {
  view.target = THREE.MathUtils.clamp(view.target * f, ZOOM_MIN, ZOOM_MAX);
};
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);

/**
 * Orthographic framing (no perspective: the sphere is a true circle and the grid doesn't lean, wherever it sits on screen).
 * `zoom` = pixels per world unit. The globe is centred (there is no side panel any more); `BodyGlobe` nudges it aside when a vehicle's card floats next to it.
 */
function frame(w: number, h: number) {
  const portrait = w < h;
  const zoom = Math.min(h / 5.68, w / (portrait ? 3.6 : 4.9));
  return { portrait, zoom, x: 0 };
}

/**
 * Keeps the orthographic zoom in sync with the canvas size and the user's zoom. The user zooms with the wheel over the globe, Ctrl + wheel / pinch (which the
 * browser would use to zoom the whole page, buttons included) and Ctrl + / − / 0: it is the camera that zooms, so only the globe and its vehicles scale; the
 * DOM (buttons, labels, cards) keeps its size and just follows the projected positions.
 */
function Fit() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const onGlobe = () => /^\/(mars|moon)\/?$/.test(window.location.pathname); // the view is kept mounted but hidden under other routes: don't hijack the browser there
    const onWheel = (e: WheelEvent) => {
      if (!onGlobe()) return;
      if (e.ctrlKey || (e.target as Element | null)?.tagName === "CANVAS") {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!onGlobe() || !(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === "+" || e.key === "=") zoomBy(1.2);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.2);
      else if (e.key === "0") view.target = 1;
      else return;
      e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  useFrame((_, dtRaw) => {
    view.cur += (view.target - view.cur) * (1 - Math.exp(-8 * Math.min(dtRaw, 0.05)));
    const z = frame(size.width, size.height).zoom * view.cur;
    if (Math.abs(camera.zoom - z) > 1e-4) {
      camera.zoom = z;
      camera.updateProjectionMatrix();
    }
  });
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

/** World units per model unit of the globe vehicles: a ~10-unit vehicle comes out ~0.34 units long (~48 px). */
const S = 0.034;
const hot = { n: 0 }; // vehicles under the pointer: the idle spin pauses meanwhile, so a moving target can be clicked
const SINK = 1.0; // model units the blob's flat base lies below the surface (the invisible ground hides it, so the blob rises out of the ground)

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
  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), c: new THREE.Vector3(), cam: new THREE.Vector3(), s: new THREE.Vector3(), n: new THREE.Vector3(), f: new THREE.Vector3(), q: new THREE.Quaternion() }),
    [],
  );
  const q = useMemo(() => {
    const d = new THREE.Vector3(...latLonDir(vehicle.lat, vehicle.lon));
    return { pos: d.clone().multiplyScalar(R), quat: new THREE.Quaternion().setFromUnitVectors(Z, d) };
  }, [vehicle]);
  // one melted blob per vehicle (lib/vehicles/blob.ts), made from its low-detail model
  const blob = useMemo(() => {
    const palette = { ...theme.globe.vehicle, bg: theme.globe.bg };
    const rig = buildMarker(model, palette);
    const made = blobFrom(rig, palette, vehicle.missionId, (R * 1.5) / S); // 1.5 = the globe's size on screen
    rig.dispose();
    return made;
  }, [model, theme, vehicle.missionId]);
  useEffect(() => () => blob.dispose(), [blob]);
  const facing = useRef<number | null>(null); // heading of the vehicle about the surface normal: it keeps turning to look at the viewer
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
    const gs = springStep(grow.current, !alive ? 0 : hover.current ? 1.25 : selected ? 1.15 : 1, dt, 260, 11);
    // the blob is jelly stuck to the ground: it breathes, ripples every few seconds, stretches up when hovered and throbs while selected
    let sy = 1;
    let wob = 0;
    if (!reducedMotion()) {
      if (hover.current) {
        sy = 1.2 + Math.sin(t * 15) * 0.04;
        wob = Math.sin(t * 9) * 0.12;
      } else if (selected) sy = 1.1 + Math.abs(Math.sin(t * 3.5)) * 0.1;
      else {
        const hp = ((t + phase) % 3.4) / 1.1;
        const ripple = hp < 1 ? Math.sin(hp * Math.PI * 3) * (1 - hp) * 0.16 : 0;
        sy = 1 + Math.sin(t * 1.7 + phase) * 0.05 + ripple;
      }
    }
    const sxz = 1 / Math.sqrt(sy); // squash and stretch keeps the volume
    const gk = S * Math.max(gs, 0.0001);
    b.position.y = -SINK * S;
    // it turns to look at you: the nose points to the top of the screen (the camera sits on that side of the surface), seen three-quarters
    r.getWorldQuaternion(tmp.q);
    tmp.n.set(0, 0, 1).applyQuaternion(tmp.q);
    tmp.f.set(0, 1, 0).addScaledVector(tmp.n, -tmp.n.y);
    if (tmp.f.lengthSq() > 1e-4) {
      tmp.f.applyQuaternion(tmp.q.invert());
      const want = Math.atan2(tmp.f.x, -tmp.f.y) + 0.6;
      facing.current = facing.current === null ? want : facing.current + wrap(want - facing.current) * (1 - Math.exp(-5 * dt));
    }
    b.rotation.y = (facing.current ?? 0) + wob;
    b.scale.set(gk * sxz, gk * sy, gk * sxz);
    const k = (t * 0.8) % 1;
    if (ring.current) {
      ring.current.scale.setScalar(0.8 + k * 0.7);
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
        <group ref={body} position-y={-SINK * S} scale={0.0001}>
          <primitive object={blob.mesh} />
        </group>
      </group>
      <mesh ref={ring} position-z={0.003} rotation-z={Math.PI / 4}>
        <ringGeometry args={[0.24, 0.27, 4]} />
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
        <sphereGeometry args={[0.22, 8, 8]} />
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
  const spin = useRef<THREE.Group>(null); // the globe's orientation (free: the user can turn it about both screen axes)
  const size = useThree((s) => s.size);
  const st = useMemo(
    () => ({
      drag: false, moved: 0, vx: 0, vy: 0, settle: 0, free: false,
      manual: false, // the user has grabbed the globe and it has not yet settled back to its idle spin: the limit applies
      snap: false, // turning quickly to bring a vehicle into view (see SNAP_OFF)
      norm: false, // after letting go: turning quickly back to the upright orientation (see `upright`)
      q: new THREE.Quaternion(), tq: new THREE.Quaternion(), dq: new THREE.Quaternion(), qi: new THREE.Quaternion(), rot: new THREE.Quaternion(),
      c: new THREE.Vector3(), t: new THREE.Vector3(),
    }),
    [],
  );
  /** The vehicles as unit vectors in the globe's own frame. */
  const dirs = useMemo(() => body.vehicles.map((v) => new THREE.Vector3(...latLonDir(v.lat, v.lon))), [body]);
  /** The point of the globe at the centre of the screen (in the globe's frame), the vehicle nearest to it and their angular distance. */
  const look = () => {
    st.c.set(0, 0, 1).applyQuaternion(st.qi.copy(st.q).invert());
    let best = 0;
    let bd = Infinity;
    dirs.forEach((d, i) => {
      const a = Math.acos(THREE.MathUtils.clamp(d.dot(st.c), -1, 1));
      if (a < bd) {
        bd = a;
        best = i;
      }
    });
    return { i: best, a: bd };
  };
  /** `out` = the current orientation turned by the smallest rotation that leaves the screen centre exactly `off` away from vehicle `i`, on the side it is now (call `look()` first). */
  const toward = (i: number, off: number, out: THREE.Quaternion) => {
    const v = dirs[i];
    st.t.copy(st.c).addScaledVector(v, -v.dot(st.c)); // tangent at the vehicle, pointing to the centre
    if (st.t.lengthSq() < 1e-8) st.t.crossVectors(v, Math.abs(v.y) < 0.9 ? AY : AX); // the centre is right on it (or opposite): any direction
    st.t.normalize();
    const goal = v.clone().multiplyScalar(Math.cos(off)).addScaledVector(st.t, Math.sin(off));
    st.rot.setFromUnitVectors(st.c, goal); // takes the current centre to the goal in the globe's frame
    return out.copy(st.q).multiply(st.rot.invert());
  };
  /** Does the upright view centred on longitude `lon` (degrees) have a vehicle within MAX_OFF? Its centre is at the starting elevation's latitude. */
  const showsVehicle = (lon: number) => {
    const c = new THREE.Vector3(...latLonDir((TILT * 180) / Math.PI, lon));
    return dirs.some((d) => Math.acos(THREE.MathUtils.clamp(d.dot(c), -1, 1)) <= MAX_OFF);
  };
  /**
   * The upright orientation nearest to the current one that keeps its longitude: the pole axis vertical on screen (no roll) at the starting elevation, turned
   * about the globe's own axis so that it looks at the same longitude as now (the spin the user gave is kept; the tilt and roll are the ones that are undone).
   * If no vehicle is visible at that longitude it takes the closest longitude that has one. Writes it to `out`.
   */
  const upright = (out: THREE.Quaternion) => {
    look();
    const lon0 = (Math.atan2(-st.c.z, st.c.x) * 180) / Math.PI;
    let lon = lon0;
    for (let d = 1; d <= 180 && !showsVehicle(lon); d++) {
      lon = lon0 + d;
      if (!showsVehicle(lon)) lon = lon0 - d;
    }
    return orient(out, faceAngle(lon));
  };
  /** Keep the visible face within MAX_OFF of a vehicle; true if it had to be pulled back. */
  const constrain = () => {
    const { i, a } = look();
    if (a <= MAX_OFF) return false;
    toward(i, MAX_OFF, st.q);
    return true;
  };
  /** Orientation with the starting elevation and the given turn about the globe's own axis. */
  const orient = (out: THREE.Quaternion, angle: number) => out.setFromAxisAngle(AX, TILT).multiply(st.dq.setFromAxisAngle(AY, angle));
  const pop = useMemo<Spring>(() => ({ x: 0.25, v: 0 }), []); // the globe's size: it pops in with an overshoot
  const target = useMemo(() => {
    const v = body.vehicles.find((x) => x.missionId === faceId) ?? body.vehicles[0];
    return faceAngle(v.lon);
  }, [body, faceId]);

  // a newly shown body spins in from the side and pops up (a springy grow)
  useEffect(() => {
    st.q.setFromAxisAngle(AX, TILT).multiply(st.dq.setFromAxisAngle(AY, faceAngle(body.vehicles[0].lon) + 1.4));
    st.manual = false;
    st.snap = false;
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

    if (st.snap) {
      // the user grabbed a face with no vehicle: turn quickly until one is in view, then the drag takes over
      st.q.slerp(st.tq, 1 - Math.exp(-14 * dt));
      if (st.q.angleTo(st.tq) < 0.004) {
        st.q.copy(st.tq);
        st.snap = false;
      }
      st.vx = 0;
      st.vy = 0;
    } else if (!st.drag && st.settle < 2.2) {
      st.settle += dt;
      st.q.slerp(orient(st.tq, target), 1 - Math.exp(-2.8 * dt)); // turn to face the vehicle
      st.vx = 0;
      st.vy = 0;
    } else if (!st.drag) {
      if (selectedId !== null) {
        // a card is open: the globe stops dead (no drifting after a flick)
        st.vx = 0;
        st.vy = 0;
      } else {
        // after a drag the globe keeps its momentum and settles back to the idle spin about its own axis; it pauses while the pointer is over a vehicle
        const idle = hot.n > 0 ? 0 : IDLE;
        st.vx += (idle - st.vx) * (1 - Math.exp(-1.5 * dt));
        st.vy += (0 - st.vy) * (1 - Math.exp(-2.5 * dt));
        st.q.premultiply(st.dq.setFromAxisAngle(AX, st.vy * dt)); // a flick up or down: about the screen's horizontal axis
        st.q.multiply(st.dq.setFromAxisAngle(AY, st.vx * dt)); // the idle spin and a sideways flick: about the globe's own axis
        if (st.norm) {
          // let go: the globe turns quickly back upright (tilt and roll to zero) while keeping the longitude it was left at
          st.q.slerp(upright(st.tq), 1 - Math.exp(-9 * dt));
          if (st.q.angleTo(st.tq) < 0.003) {
            st.q.copy(st.tq);
            st.norm = false;
          }
        }
        if (st.manual) {
          // the flick after a manual drag is still under the limit; once the globe is back to its idle spin the limit is released
          if (constrain()) {
            st.vx *= 0.6;
            st.vy *= 0.6;
          }
          if (!st.norm && Math.abs(st.vy) < 0.03 && Math.abs(st.vx - IDLE) < 0.03) st.manual = false;
        }
      }
    }
    if (selectedId !== null) {
      st.manual = false;
      st.norm = false; // a vehicle was picked: the globe holds still where it is
    }
    st.q.normalize();
    g.quaternion.copy(st.q);
  });

  const drag = (e: ThreeEvent<PointerEvent>) => {
    if (!st.drag || st.snap) return; // (while the globe snaps to a vehicle the pointer is ignored)
    const o = outer.current;
    if (!o) return;
    const k = 0.0075 / Math.max(o.scale.x, 0.6);
    const mx = e.nativeEvent.movementX;
    const my = e.nativeEvent.movementY;
    st.moved += Math.abs(mx) + Math.abs(my);
    // free trackball: the pointer turns the globe about the screen's vertical and horizontal axes (both applied in world space)
    st.q.premultiply(st.dq.setFromAxisAngle(AY, mx * k));
    st.q.premultiply(st.dq.setFromAxisAngle(AX, my * k));
    st.vx = THREE.MathUtils.clamp(st.vx * 0.5 + ((mx * k) / 0.016) * 0.5, -6, 6); // smoothed flick velocity, kept when the pointer is released
    st.vy = THREE.MathUtils.clamp(st.vy * 0.5 + ((my * k) / 0.016) * 0.5, -6, 6);
    if (constrain()) {
      // it hit the edge of the allowed area: the globe slides along it, and the flick dies
      st.vx *= 0.3;
      st.vy *= 0.3;
    }
  };

  return (
    <group ref={outer}>
      <Limb color={theme.globe.star} />
      <group>
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
              st.vx = 0;
              st.vy = 0;
              st.manual = true;
              st.norm = false; // grabbing it again cancels the turn back upright
              const seen = look();
              if (seen.a > MAX_OFF) {
                toward(seen.i, SNAP_OFF, st.tq); // no vehicle on this face: turn quickly to one
                st.snap = true;
              }
              document.body.style.cursor = "grabbing";
            }}
            onPointerMove={drag}
            onPointerUp={(e) => {
              if (!st.drag) return;
              (e.target as unknown as PointerTarget).releasePointerCapture(e.pointerId);
              st.drag = false;
              st.norm = true; // let go: back upright, quickly (the tilt and roll go to zero; the longitude stays)
              st.vy = 0;
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
