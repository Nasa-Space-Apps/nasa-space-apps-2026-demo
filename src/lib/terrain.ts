import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const RES = 0.5; // height-field resolution (world units)

/** Three flat tone steps (dark / mid / light) for the terrain: the same cel-shading language as the vehicles (docs/design.md). */
const RAMP = (() => {
  const t = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

export type TerrainStyle = {
  fade: number; // width of the border zone that is flattened (world units)
  lo: string; // color of the lowest ground
  hi: string; // color of the highest ground
  edge: string; // color of the flattened border / infinite ground plane
  lines: string; // colour of the contour lines drawn on the ground
  step: number; // height between two contour lines (world units); every 4th one is a stronger "major" line
};

export type TerrainData = {
  fade: number;
  edgeColor: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minH: number;
  maxH: number;
  baseH: number;
  heightAt: (x: number, z: number) => number;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function buildHeightField(geo: THREE.BufferGeometry): Omit<TerrainData, "fade" | "edgeColor"> {
  const bb = geo.boundingBox!;
  const nx = Math.ceil((bb.max.x - bb.min.x) / RES) + 1;
  const nz = Math.ceil((bb.max.z - bb.min.z) / RES) + 1;
  const grid = new Float32Array(nx * nz).fill(NaN);
  const pos = geo.attributes.position.array as Float32Array;
  const idx = geo.index!.array;

  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ax = pos[a], ay = pos[a + 1], az = pos[a + 2];
    const bx = pos[b], by = pos[b + 1], bz = pos[b + 2];
    const cx = pos[c], cy = pos[c + 1], cz = pos[c + 2];
    const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(det) < 1e-9) continue;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - bb.min.x) / RES));
    const i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, bx, cx) - bb.min.x) / RES));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - bb.min.z) / RES));
    const j1 = Math.min(nz - 1, Math.ceil((Math.max(az, bz, cz) - bb.min.z) / RES));
    for (let j = j0; j <= j1; j++) {
      const pz = bb.min.z + j * RES;
      for (let i = i0; i <= i1; i++) {
        const px = bb.min.x + i * RES;
        const l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / det;
        const l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / det;
        const l3 = 1 - l1 - l2;
        if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
        const h = l1 * ay + l2 * by + l3 * cy;
        const k = j * nx + i;
        if (!(grid[k] >= h)) grid[k] = h;
      }
    }
  }

  // fill holes from neighbours
  for (let pass = 0; pass < 24; pass++) {
    let holes = 0;
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (!Number.isNaN(grid[k])) continue;
        let s = 0, n = 0;
        if (i > 0 && !Number.isNaN(grid[k - 1])) { s += grid[k - 1]; n++; }
        if (i < nx - 1 && !Number.isNaN(grid[k + 1])) { s += grid[k + 1]; n++; }
        if (j > 0 && !Number.isNaN(grid[k - nx])) { s += grid[k - nx]; n++; }
        if (j < nz - 1 && !Number.isNaN(grid[k + nx])) { s += grid[k + nx]; n++; }
        if (n) grid[k] = s / n; else holes++;
      }
    }
    if (!holes) break;
  }
  for (let k = 0; k < grid.length; k++) if (Number.isNaN(grid[k])) grid[k] = bb.min.y;

  const heightAt = (x: number, z: number) => {
    const fx = Math.min(nx - 1.001, Math.max(0, (x - bb.min.x) / RES));
    const fz = Math.min(nz - 1.001, Math.max(0, (z - bb.min.z) / RES));
    const i = Math.floor(fx), j = Math.floor(fz);
    const tx = fx - i, tz = fz - j;
    const k = j * nx + i;
    const h0 = grid[k] * (1 - tx) + grid[k + 1] * tx;
    const h1 = grid[k + nx] * (1 - tx) + grid[k + nx + 1] * tx;
    return h0 * (1 - tz) + h1 * tz;
  };

  return {
    minX: bb.min.x, maxX: bb.max.x, minZ: bb.min.z, maxZ: bb.max.z,
    minH: bb.min.y, maxH: bb.max.y, baseH: bb.min.y, heightAt,
  };
}

/**
 * Contour lines drawn by the ground's own shader (iso-height lines like the minimap's): thin, constant on-screen width, and faded where
 * they would crowd together far away. They give the flat tones the "drawn" edges that make the relief readable.
 */
function withContours(mat: THREE.MeshToonMaterial, style: TerrainStyle) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uStep = { value: style.step };
    shader.uniforms.uLine = { value: new THREE.Color(style.lines) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vH;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvH = transformed.y;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vH;\nuniform float uStep;\nuniform vec3 uLine;")
      .replace(
        "#include <dithering_fragment>",
        `
        float hh = vH / uStep;
        float w = max(fwidth(hh), 1e-5);
        float dMinor = abs(fract(hh - 0.5) - 0.5) / w;
        float hm = hh / 4.0;
        float wm = max(fwidth(hm), 1e-5);
        float dMajor = abs(fract(hm - 0.5) - 0.5) / wm;
        float minorLine = (1.0 - clamp(dMinor - 0.35, 0.0, 1.0)) * (1.0 - smoothstep(0.2, 0.55, w));
        float majorLine = (1.0 - clamp(dMajor - 0.7, 0.0, 1.0)) * (1.0 - smoothstep(0.1, 0.3, wm));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uLine, max(minorLine * 0.2, majorLine * 0.45));
        #include <dithering_fragment>`,
      );
  };
}

export function buildTerrain(source: THREE.BufferGeometry, style: TerrainStyle) {
  let geo = source.clone();
  geo.deleteAttribute("normal");
  geo = mergeVertices(geo, 1e-3);
  geo.rotateX(-Math.PI / 2); // STL is Z-up (Blender) -> Y-up
  geo.computeBoundingBox();
  let bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, 0, -(bb.min.z + bb.max.z) / 2);
  geo.computeBoundingBox();
  bb = geo.boundingBox!;

  // flatten borders towards the lowest level
  const pos = geo.attributes.position;
  const base = bb.min.y;
  const origY = new Float32Array(pos.count);
  const edgeW = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const d = Math.min(x - bb.min.x, bb.max.x - x, z - bb.min.z, bb.max.z - z);
    const w = smooth(0, style.fade, d);
    origY[i] = pos.getY(i);
    edgeW[i] = w;
    pos.setY(i, base + (pos.getY(i) - base) * w);
  }
  const lo0 = bb.min.y, hi0 = bb.max.y;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  bb = geo.boundingBox!;

  // height-based vertex colors
  const lo = new THREE.Color(style.lo);
  const hi = new THREE.Color(style.hi);
  const c = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  const span = hi0 - lo0 || 1;
  const edge = new THREE.Color(style.edge);
  for (let i = 0; i < pos.count; i++) {
    c.lerpColors(lo, hi, Math.min(1, (origY[i] - lo0) / span));
    c.lerp(edge, 1 - edgeW[i]);
    c.toArray(colors, i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP, side: THREE.DoubleSide });
  withContours(mat, style);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return { mesh, data: { ...buildHeightField(geo), fade: style.fade, edgeColor: style.edge } };
}
