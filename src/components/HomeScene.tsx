"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { PIECES, STAGE, fx, over, pointer, stageScale, stageState, type Piece } from "@/lib/home";
import { reducedMotion, springStep, type Spring } from "@/lib/motion";
import { PERF } from "@/lib/perf";
import { buildVehicle } from "@/lib/vehicles";

/**
 * The 3D vehicles of the home page: ONE transparent, full-screen canvas with an isometric camera whose scale follows the stage of the page, so each vehicle is placed
 * from the same stage coordinates as the cards (the DOM layers under and over it are the cards, and the clouds in front). Every vehicle springs in (staggered),
 * sways and turns with the pointer; the helicopter really flies a lazy loop above its card with its rotors turning; a click makes a vehicle hop, spin and throw sparkles.
 * The canvas does not catch the pointer: the page's root element is its event source, so the cards underneath keep working.
 */
const PX = 22; // stage units per world unit at scale 1
const FOCAL = STAGE.w / 2; // stage x and y of the centre of the screen
const MIDDLE = STAGE.h / 2;

const R = new Vector3();
const U = new Vector3();
const F = new Vector3();
const Q = new Vector3();

/** The camera: the same isometric view as the vehicle cards of the globe, scaled with the stage. */
function Eye() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    camera.zoom = stageScale(size.width, size.height) * PX;
    camera.position.set(66, 51, 72); // far, so that points slid along the view direction stay in front of the lens
    camera.near = 1;
    camera.far = 600;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }, [camera, size]);
  return null;
}

function Vehicle({ piece, hover }: { piece: Piece; hover: (on: boolean) => void }) {
  const rig = useMemo(() => buildVehicle(piece.rover.model, piece.rover.palette), [piece]);
  useEffect(() => () => rig.dispose(), [rig]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const group = useRef<Group>(null);
  const calm = useMemo(() => reducedMotion(), []);
  const st = useRef({ pop: { x: 0, v: 0 } as Spring, hop: { x: 0, v: 0 } as Spring, spin: { x: 0, v: 0 } as Spring, spinTarget: 0, yaw: piece.yaw, born: -1, px: 0, py: 0 });
  const phase = useMemo(() => piece.x * 0.013, [piece]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const s = st.current;
    if (!stageState.go) {
      g.visible = false;
      return;
    }
    if (s.born < 0) s.born = t + piece.delay / 1000;
    const pop = springStep(s.pop, t >= s.born ? 1 : 0, dt, 150, 10); // springs in from nothing, overshooting
    const hop = springStep(s.hop, 0, dt, 190, 9);
    const spin = springStep(s.spin, s.spinTarget, dt, 70, 9);
    g.visible = pop > 0.01;

    // where on the screen it is: the stage position, a little parallax, the helicopter's loop, a hop
    const W = size.width;
    const H = size.height;
    const sc = stageScale(W, H);
    const k = 1 - Math.exp(-4 * dt);
    s.px += (pointer.x - s.px) * k;
    s.py += (pointer.y - s.py) * k;
    let sx = W / 2 + (piece.x - FOCAL) * sc - s.px * 22 * sc;
    let sy = H / 2 + (piece.y - MIDDLE) * sc - s.py * 13 * sc;
    if (piece.fly) {
      const a = calm ? 0 : t;
      sx += Math.cos(a * 0.5 + phase) * 105 * sc;
      sy += (Math.sin(a * 1.0 + phase) * 34 + Math.sin(a * 0.37) * 14) * sc;
    }
    sy -= Math.max(0, hop) * 70 * sc;

    // screen → world: a point of the screen plane through the origin, slid along the view direction down to the ground (the helicopter just stays there)
    const Z = camera.zoom;
    const e = camera.matrixWorld.elements;
    R.set(e[0], e[1], e[2]);
    U.set(e[4], e[5], e[6]);
    F.set(-e[8], -e[9], -e[10]);
    Q.copy(R).multiplyScalar((sx - W / 2) / Z).addScaledVector(U, -(sy - H / 2) / Z);
    if (!piece.fly) Q.addScaledVector(F, -Q.y / F.y);
    g.position.copy(Q);

    const breath = calm ? 0 : Math.sin(t * 1.9 + phase) * 0.012;
    g.scale.setScalar(Math.max(0.001, pop) * piece.scale * (1 + breath) * (1 - Math.min(0.07, Math.max(0, -hop) * 0.05)));
    const follow = piece.fly ? 0.3 : 0.55;
    const yaw = piece.yaw + (calm ? 0 : Math.sin(t * 0.5 + phase) * 0.16) + pointer.x * follow + spin;
    s.yaw += (yaw - s.yaw) * (1 - Math.exp(-7 * dt));
    g.rotation.y = s.yaw;
    if (piece.fly && !calm) {
      g.rotation.z = Math.sin(t * 0.5 + phase) * 0.12; // leans into its loop
      g.rotation.x = Math.cos(t * 0.5 + phase) * 0.06;
    }
    if (!calm) for (const r of rig.rotors) r.obj.rotation.y += r.rate * dt;
  });

  const poke = (ev: { stopPropagation: () => void; nativeEvent: MouseEvent }) => {
    ev.stopPropagation();
    const s = st.current;
    s.hop.v = 11;
    s.spinTarget += Math.PI * 2;
    fx.burst(ev.nativeEvent.clientX, ev.nativeEvent.clientY);
  };

  return (
    <group
      ref={group}
      visible={false}
      onClick={poke}
      onPointerOver={(ev) => {
        ev.stopPropagation();
        over.vehicle = true;
        hover(true);
      }}
      onPointerOut={() => {
        over.vehicle = false;
        hover(false);
      }}
    >
      {/* the wheels are centred on the origin, the bodywork is not: centre the whole vehicle (the helicopter, which floats, also vertically) */}
      <group position={[-rig.center.x, piece.fly ? -rig.center.y : 0, -rig.center.z]}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}

export default function HomeScene({ source, hover, onReady }: { source: RefObject<HTMLElement | null>; hover: (on: boolean) => void; onReady: () => void }) {
  return (
    <Canvas
      orthographic
      dpr={PERF.dpr}
      eventSource={source as RefObject<HTMLElement>}
      eventPrefix="client"
      gl={{ antialias: true, alpha: true }}
      camera={{ zoom: 20, near: 1, far: 600, position: [66, 51, 72] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "transparent" }}
      onCreated={() => requestAnimationFrame(onReady)}
    >
      <Eye />
      {PIECES.map((p) => (
        <Vehicle key={p.id} piece={p} hover={hover} />
      ))}
    </Canvas>
  );
}
