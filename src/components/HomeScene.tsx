"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { PIECES, layoutFor, stageScale, type Piece } from "@/lib/home";
import { PERF } from "@/lib/perf";
import { buildVehicle } from "@/lib/vehicles";

/**
 * The 3D vehicle of the home page: a transparent, full-screen canvas with an isometric camera whose scale follows the stage of the page, so the vehicle is placed from the
 * same stage coordinates as the cards. It is STILL (no animation, no interaction): it is drawn once, and again only when the window is resized. The canvas does not catch
 * the pointer, so the cards underneath keep working.
 */
const PX = 22; // stage units per world unit at scale 1

const R = new Vector3();
const U = new Vector3();
const F = new Vector3();
const Q = new Vector3();

/** The camera: the same isometric view as the vehicle cards of the globe, scaled with the stage. */
function Eye() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.zoom = stageScale(size.width, size.height) * PX;
    camera.position.set(66, 51, 72); // far, so that points slid along the view direction stay in front of the lens
    camera.near = 1;
    camera.far = 600;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}

function Vehicle({ piece, show }: { piece: Piece; show: boolean }) {
  const rig = useMemo(() => buildVehicle(piece.rover.model, piece.rover.palette), [piece]);
  useEffect(() => () => rig.dispose(), [rig]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const group = useRef<Group>(null);
  const reach = useMemo(() => Math.hypot(rig.size.x, rig.size.z) * 0.235, [rig]); // half the footprint as seen on screen (× sin of the camera's elevation)

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.visible = show;
    // stage position (where its nearest wheels touch the ground) → screen → world: a point of the screen plane through the origin, slid along the view direction down to y = 0
    const lay = layoutFor(size.width, size.height);
    const at = lay.piece;
    const sc = stageScale(size.width, size.height);
    const sx = size.width / 2 + (at.x - lay.w / 2) * sc;
    const sy = size.height / 2 + (at.y - lay.h / 2) * sc - reach * camera.zoom * at.scale;
    const e = camera.matrixWorld.elements;
    R.set(e[0], e[1], e[2]);
    U.set(e[4], e[5], e[6]);
    F.set(-e[8], -e[9], -e[10]);
    Q.copy(R).multiplyScalar((sx - size.width / 2) / camera.zoom).addScaledVector(U, -(sy - size.height / 2) / camera.zoom);
    Q.addScaledVector(F, -Q.y / F.y);
    g.position.copy(Q);
    g.scale.setScalar(at.scale);
    g.rotation.y = at.yaw;
    invalidate();
  }, [camera, size, show, reach, invalidate]);

  return (
    <group ref={group} visible={false}>
      {/* the wheels are centred on the origin, the bodywork is not: centre the whole vehicle */}
      <group position={[-rig.center.x, 0, -rig.center.z]}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}

export default function HomeScene({ show, onReady }: { show: boolean; onReady: () => void }) {
  return (
    <Canvas
      orthographic
      frameloop="demand"
      dpr={PERF.dpr}
      gl={{ antialias: true, alpha: true }}
      camera={{ zoom: 20, near: 1, far: 600, position: [66, 51, 72] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "transparent" }}
      onCreated={() => requestAnimationFrame(onReady)}
    >
      <Eye />
      {PIECES.map((p) => (
        <Vehicle key={p.id} piece={p} show={show} />
      ))}
    </Canvas>
  );
}
