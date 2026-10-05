import * as T from 'three';
import { box, sphere, rod, cylinder, torus, material } from '../graphics';
import type { V3 } from '../math';
export { box, sphere, rod, cylinder, torus, material };
export function softBox(parent: T.Object3D, size: V3, pos: V3, color: number, r = 0.12) {
  const [w, h, d] = size,
    s = new T.Shape();
  r = Math.min(r, w / 3, h / 3);
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const m = new T.Mesh(
    new T.ExtrudeGeometry(s, {
      depth: d,
      bevelEnabled: true,
      bevelSize: r / 4,
      bevelThickness: r / 4,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 5,
    }),
    material(color),
  );
  m.position.set(pos[0], pos[1], pos[2] - d / 2);
  parent.add(m);
  return m;
}
export function ellipsoid(p: T.Object3D, size: V3, pos: V3, color: number) {
  const m = sphere(p, 1, pos, color);
  m.scale.set(...size);
  return m;
}
export function label(
  p: T.Object3D,
  text: string,
  pos: V3,
  w = 1,
  color = '#343d51',
  background = '#edf0f4',
) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 128;
  const x = cv.getContext('2d')!;
  x.fillStyle = background;
  x.fillRect(0, 0, 512, 128);
  x.fillStyle = color;
  x.font = 'bold 38px Arial';
  x.textAlign = 'center';
  x.fillText(text, 256, 80);
  const tx = new T.CanvasTexture(cv);
  tx.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.PlaneGeometry(w, w / 4),
    new T.MeshBasicMaterial({ map: tx, side: T.DoubleSide, toneMapped: false }),
  );
  m.position.set(...pos);
  p.add(m);
  return m;
}
export function glass(p: T.Object3D, size: V3, pos: V3, color = 0x97ccdb, opacity = 0.25) {
  const m = softBox(p, size, pos, color);
  m.material.dispose();
  m.material = new T.MeshPhysicalMaterial({
    color,
    metalness: 0.15,
    roughness: 0.1,
    transparent: true,
    opacity,
    side: T.DoubleSide,
    depthWrite: false,
  });
  return m;
}
export function gear(p: T.Object3D, r: number, pos: V3, color = 0x4b4d4f, teeth = 24) {
  const g = new T.Group();
  g.position.set(...pos);
  p.add(g);
  const disk = cylinder(g, r, 0.14, [0, 0, 0], color);
  disk.rotation.x = Math.PI / 2;
  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI * 2) / teeth;
    const t = box(g, [0.16, 0.22, 0.18], [Math.cos(a) * r, Math.sin(a) * r, 0], color);
    t.rotation.z = a - Math.PI / 2;
  }
  torus(g, r * 0.65, 0.035, [0, 0, 0.09], 0xaaaeb0);
  return g;
}
export function petals(p: T.Object3D, length: number, width: number, color: number) {
  const vertices: number[] = [],
    indices: number[] = [];
  const rows = 20,
    cols = 12;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= cols; i++) {
      const u = (i / cols - 0.5) * 2;
      vertices.push(
        u * width * Math.sin(Math.PI * t),
        length * t,
        0.55 * Math.sin(Math.PI * t) + 0.35 * u * u,
      );
    }
  }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i;
      indices.push(k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const m = new T.Mesh(
    geo,
    new T.MeshStandardMaterial({ color, side: T.DoubleSide, metalness: 0.18, roughness: 0.43 }),
  );
  p.add(m);
  return m;
}
