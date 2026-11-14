"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { RoverConfig } from "@/lib/missions";
import { PERF } from "@/lib/perf";
import { buildVehicle } from "@/lib/vehicles";

/** Still isometric view: orthographic camera at a fixed elevation, the vehicle turned so its front faces the viewer's right. */
function Still({ config }: { config: RoverConfig }) {
  const rig = useMemo(() => buildVehicle(config.model, config.palette), [config]);
  useEffect(() => () => rig.dispose(), [rig]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const diag = Math.hypot(rig.size.x, rig.size.z);

  useEffect(() => {
    camera.zoom = Math.min(size.width / (diag * 0.72), size.height / (rig.size.y + diag * 0.3));
    camera.position.set(22, 17, 24);
    camera.lookAt(0, rig.size.y * 0.4, 0);
    camera.updateProjectionMatrix();
    invalidate(); // the canvas renders on demand: draw once more after framing
  }, [camera, size, diag, rig, invalidate]);

  return (
    <group rotation-y={Math.PI * 0.4}>
      {/* the wheels are centred on the origin, the bodywork is not (noses, tails, arms): frame the whole vehicle */}
      <group position={[-rig.center.x, 0, -rig.center.z]}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}

/** The vehicle in the flat illustration style on a plain background (static, no interaction, rendered on demand). */
export default function VehicleView({ config, label }: { config: RoverConfig; label: string }) {
  const [made, setMade] = useState(false); // the vehicle eases in over the plain background once it is drawn
  return (
    <div className="pointer-events-none w-full" style={{ aspectRatio: "16 / 10", background: config.palette.bg }} role="img" aria-label={label}>
      <div className="h-full w-full" style={{ opacity: made ? 1 : 0, transition: "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
      <Canvas orthographic frameloop="demand" dpr={PERF.dpr} camera={{ zoom: 20, near: 0.1, far: 200, position: [22, 17, 24] }} gl={{ antialias: true }} onCreated={() => requestAnimationFrame(() => setMade(true))}>
        <color attach="background" args={[config.palette.bg]} />
        <Still config={config} />
      </Canvas>
      </div>
    </div>
  );
}
