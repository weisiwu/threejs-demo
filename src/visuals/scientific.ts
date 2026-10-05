import * as T from 'three';
import { sphere, box, cylinder, torus, line, tube, mark, material, clear } from '../graphics';
import { frame, ground, hide, type Appearance } from '../presentation';
import { ellipsoid, label } from './helpers';
import { TAU, seeded, type V3 } from '../math';
import type { SceneContext } from '../types';
import { fabrik } from '../math';
import land from '../data/land.json';
import aurora from '../data/aurora.svg?raw';
import crambin from '../data/crambin.json';
import { symbols } from '../data/elements';
export function worldTexture(dark = false) {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 512;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = dark ? '#100c20' : '#284c74';
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = dark ? '#8c6db0' : '#799387';
  ctx.strokeStyle = dark ? '#9278a9' : '#b3bead';
  ctx.lineWidth = 0.4;
  for (const feature of land.features) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    for (const polygon of polygons) {
      ctx.beginPath();
      for (const ring of polygon as number[][][]) {
        ring.forEach(([lon, lat], i) => {
          const x = ((lon + 180) / 360) * 1024,
            y = ((90 - lat) / 180) * 512;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.closePath();
      }
      ctx.fill('evenodd');
      ctx.stroke();
    }
  }
  if (dark) {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    for (let x = 0; x < 1024; x += 4) for (let y = 0; y < 512; y += 4) ctx.rect(x, y, 1.8, 1.8);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  const tx = new T.CanvasTexture(cv);
  tx.colorSpace = T.SRGBColorSpace;
  return tx;
}
export function scientificAppearance(c: SceneContext): Appearance | undefined {
  const { spec, state: s, group: g } = c;
  if (['solar-system-basics', 'solar-system-orbits'].includes(spec.slug)) {
    hide(c);
    frame(c, [0, 24, 32], [0, 0, 0], 0x03030b);
    const loader = new T.TextureLoader();
    let alive = true;
    const textures: T.Texture[] = [];
    const tex = (name: string) => {
      const t = loader.load(import.meta.env.BASE_URL + 'assets/solar/' + name, () => {
        if (!alive) t.dispose();
      });
      t.colorSpace = T.SRGBColorSpace;
      textures.push(t);
      return t;
    };
    const sun = sphere(g, 1.7, [0, 0, 0], 0xffffff);
    (sun.material as T.MeshStandardMaterial).map = tex('sun.jpg');
    (sun.material as T.MeshStandardMaterial).emissiveMap = (
      sun.material as T.MeshStandardMaterial
    ).map;
    (sun.material as T.MeshStandardMaterial).emissive.setHex(0x885b22);
    const planets = Array.from({ length: 6 }, (_, i) => {
      const m = sphere(g, 0.44 + i * 0.05, [0, 0, 0], 0xffffff);
      (m.material as T.MeshStandardMaterial).map = tex(`${i + 1}.jpg`);
      mark(m, 'planet-' + i);
      const orbit = line(
        g,
        Array.from(
          { length: 96 },
          (_, j) =>
            [
              (i + 1.5) * 2.8 * Math.cos((j * TAU) / 96),
              0,
              (i + 1.5) * 1.4 * Math.sin((j * TAU) / 96),
            ] as V3,
        ),
        0x626574,
        true,
      );
      return { m, orbit };
    });
    const rnd = seeded(60),
      xyz = new Float32Array(1500 * 3);
    for (let i = 0; i < xyz.length; i++) xyz[i] = (rnd() - 0.5) * 90;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(xyz, 3));
    g.add(new T.Points(geo, new T.PointsMaterial({ color: 0xd9dbe8, size: 0.035 })));
    return {
      update() {
        const speed = spec.slug === 'solar-system-orbits' ? s.parameter : 0.15;
        const scale = spec.slug === 'solar-system-basics' ? s.parameter : 1;
        planets.forEach(({ m, orbit }, i) => {
          const a = (s.time * speed) / (1 + i * 0.5) + i * 0.7;
          m.position.set(
            (i + 1.5) * 2.8 * scale * Math.sin(a),
            0,
            (i + 1.5) * 1.4 * scale * Math.cos(a),
          );
          m.rotation.y = s.time * 0.5;
          orbit.scale.set(scale, 1, scale);
          orbit.visible = spec.slug === 'solar-system-basics' ? s.variant % 2 === 0 : true;
        });
      },
      dispose() {
        alive = false;
      },
    };
  }
  if (spec.slug === 'planet-explorer') {
    hide(c);
    frame(c, [7, 4.4, 12], [0, 2.6, 0], 0xe9e8ef);
    ground(c, 0xe1dfeb);
    const mat = new T.ShaderMaterial({
      uniforms: { phase: { value: 0 }, variant: { value: 0 } },
      vertexShader:
        'varying vec3 p;varying vec3 n;void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec3 p;varying vec3 n;uniform float phase;uniform float variant;void main(){float a=sin(p.y*7.+sin(p.x*3.+phase)*1.4+sin(p.z*4.)*.8);vec3 amber=mix(vec3(.88,.51,.29),vec3(.99,.88,.7),a*.5+.5);float v=sin(p.y*5.+sin(p.x*4.)+sin(p.z*3.));vec3 col=mix(amber,vec3(.45,.76,.72),smoothstep(.45,.85,v));col=mix(col,col.bgr,variant*.24);float light=.65+.35*max(0.,dot(normalize(n),normalize(vec3(-.3,.5,1.))));gl_FragColor=vec4(col*light,1.);}',
    });
    const p = new T.Mesh(new T.SphereGeometry(2.3, 80, 48), mat);
    p.position.y = 2.7;
    g.add(p);
    mark(p, 'planet-0');
    const ring = torus(g, 3, 0.012, [0, 2.7, 0], 0xb6bac2);
    ring.rotation.x = 1.1;
    const moons = [sphere(g, 0.14, [3, 3.2, 0], 0xb9ad92), sphere(g, 0.21, [-2, 2.7, 1], 0xb4b29a)];
    cylinder(g, 1.2, 0.16, [0, 0.12, 0], 0xeef0e9);
    torus(g, 1.3, 0.02, [0, 0.22, 0], 0xd6b67b).rotation.x = Math.PI / 2;
    return {
      update() {
        p.rotation.y = s.time * 0.12 * s.parameter;
        mat.uniforms.phase.value = s.time * 0.05;
        mat.uniforms.variant.value = Number((s.selection || 'planet-0').split('-')[1]);
        moons.forEach((m, i) => {
          const a = s.time * 0.15 + i * 2.5;
          m.position.set(Math.cos(a) * 2.9, 2.9 + i * 0.7, Math.sin(a) * 2.9);
        });
      },
    };
  }
  if (spec.slug === 'kinematic-creature') {
    hide(c);
    frame(c, [0, 0, 18], [0, 0, 0], 0x000000);
    const backdrop = new T.Mesh(
      new T.PlaneGeometry(30, 20),
      new T.ShaderMaterial({
        vertexShader:
          'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec2 v;void main(){gl_FragColor=vec4(vec3(.075,.176,.52)*pow(v.y,2.),1.);}',
      }),
    );
    backdrop.position.z = -1;
    g.add(backdrop);
    const chains = Array.from({ length: 16 }, (_, i) => {
      const root: [number, number, number] = [(i - 7.5) * 0.65, -4.5, 0];
      const points = Array.from({ length: 71 }, (_, j) => [root[0], root[1] + j * 0.12, 0] as V3);
      const mesh = new T.InstancedMesh(
        new T.CircleGeometry(1, 16),
        new T.MeshBasicMaterial({
          color: 0x535204,
          transparent: true,
          opacity: 0.65,
          toneMapped: false,
        }),
        70,
      );
      g.add(mesh);
      return { root, points, mesh };
    });
    const matrix = new T.Matrix4();
    return {
      update() {
        chains.forEach((chain, i) => {
          const target: [number, number, number] = [
            Math.sin(s.time * 0.17 + i * 2.37) * s.parameter,
            Math.sin(s.time * 0.24 + i) * 2 + 0.8,
            0,
          ];
          const solved = fabrik(chain.points, target, 0.12, 5);
          chain.points = solved.points;
          for (let j = 0; j < 70; j++) {
            const p = chain.points[70 - j];
            matrix.makeScale(0.08 + j * 0.004, 0.08 + j * 0.004, 1);
            matrix.setPosition(...p);
            chain.mesh.setMatrixAt(j, matrix);
            chain.mesh.setColorAt(
              j,
              new T.Color().setRGB(0.32 * (1 - j / 70), 0.32 * (1 - j / 70), 0.015),
            );
          }
          chain.mesh.instanceMatrix.needsUpdate = true;
          if (chain.mesh.instanceColor) chain.mesh.instanceColor.needsUpdate = true;
        });
      },
    };
  }
  if (spec.slug === 'dna-structure') {
    hide(c);
    frame(c, [0, 0, 16], [0, 0, 0], 0x000000);
    let points: T.Points | undefined,
      last = -1;
    return {
      update() {
        if (last !== s.parameter) {
          last = s.parameter;
          if (points) {
            g.remove(points);
            points.geometry.dispose();
            (points.material as T.Material).dispose();
          }
          const rnd = seeded(28),
            arr: number[] = [];
          const density = Math.max(3, Math.round(s.parameter));
          const emit = (x: number, y: number, z: number, n: number) => {
            for (let k = 0; k < n; k++)
              arr.push(x + (rnd() - 0.5) * 0.2, y + (rnd() - 0.5) * 0.2, z + (rnd() - 0.5) * 0.2);
          };
          for (let i = 0; i < 360; i++) {
            const a = (i * Math.PI) / 180;
            for (const offset of [0, TAU / 3])
              emit(
                Math.sin(a + offset) * 1.3,
                (i - 180) * 0.0195,
                Math.cos(a + offset) * 1.3,
                density * 16,
              );
            if (i % 36 === 0)
              for (let j = 0; j < 100; j++) {
                const t = j / 100;
                emit(
                  (Math.sin(a) * (1 - t) + Math.sin(a + TAU / 3) * t) * 1.3,
                  (i - 180) * 0.0195,
                  (Math.cos(a) * (1 - t) + Math.cos(a + TAU / 3) * t) * 1.3,
                  density * 10,
                );
              }
          }
          const geo = new T.BufferGeometry();
          geo.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
          points = new T.Points(
            geo,
            new T.PointsMaterial({
              color: 0x0099ff,
              size: 0.025,
              transparent: true,
              opacity: 0.55,
              depthWrite: false,
            }),
          );
          g.add(points);
          const anchor = box(g, [0.0001, 0.0001, 0.0001], [0, 0, 0], 0x000000);
          anchor.visible = true;
        }
        points!.rotation.y = s.time * 0.6;
      },
    };
  }
  if (spec.slug === 'periodic-table' || spec.slug === 'atomic-explorer') {
    hide(c);
    const bright = spec.slug === 'atomic-explorer';
    frame(c, [0, 2.8, 20], [0, 2.8, 0], bright ? 0xf9f5f3 : 0x262c35);
    const cells: T.Mesh[] = [],
      phases: T.Mesh[] = [];
    const rows: number[][] = [
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 7, 8, 9, 10],
      [11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 14, 15, 16, 17, 18],
      Array.from({ length: 18 }, (_, i) => 19 + i),
      Array.from({ length: 18 }, (_, i) => 37 + i),
      [55, 56, 57, ...Array.from({ length: 15 }, (_, i) => 72 + i)],
      [87, 88, 89, ...Array.from({ length: 15 }, (_, i) => 104 + i)],
      Array.from({ length: 15 }, (_, i) => 58 + i),
      Array.from({ length: 15 }, (_, i) => 90 + i),
    ];
    for (let y = 0; y < rows.length; y++)
      rows[y].forEach((n, x) => {
        if (!n) return;
        const category = x === 17 ? 5 : x < 2 ? x : x < 12 ? 2 : x < 16 ? 3 : 4;
        const colors = bright
          ? [0xeea5a0, 0xf7c589, 0xf5df7f, 0x8ed3bd, 0x90bdde, 0xd79dce]
          : [0xf05454, 0xffa36c, 0xfcf876, 0xc0e218, 0x3d7ea6, 0xbc6ff1];
        const pos: V3 = [(x - 8.5) * 0.45 + (y % 2) * 0.15, 4.8 - y * 0.45, 0];
        const m = new T.Mesh(
          new T.CylinderGeometry(0.235, 0.235, 0.045, 6),
          material(colors[category]),
        );
        m.rotation.x = Math.PI / 2;
        m.position.set(...pos);
        g.add(m);
        mark(m, 'element-' + n);
        cells.push(m);
        label(
          g,
          symbols[n - 1],
          [pos[0], pos[1] + 0.03, 0.075],
          0.35,
          bright ? '#314255' : '#cdd3da',
          bright ? '#ffffff00' : '#262c35',
        );
        const dot = sphere(g, 0.025, [pos[0], pos[1] - 0.13, 0.08], colors[category]);
        phases.push(dot);
      });
    return {
      update() {
        phases.forEach(
          (m, i) =>
            (m.position.x = cells[i].position.x + Math.sin(s.time * s.parameter + i) * 0.055),
        );
        cells.forEach((m) => {
          const selected = m.userData.entityId === s.selection;
          m.scale.setScalar(selected ? 1.2 : 1);
          (m.material as T.MeshStandardMaterial).emissive.setHex(selected ? 0x527b65 : 0);
        });
      },
    };
  }
  if (spec.slug === 'aurora') {
    hide(c);
    frame(c, [0, 0, 14], [0, 0, 0], 0x111f46);
    const host = document.querySelector('#viewport')!;
    const el = document.createElement('div');
    el.className = 'aurora-original';
    el.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:#111f46';
    el.innerHTML = aurora;
    el.querySelector('svg')!.style.cssText = 'width:100%;height:100%;display:block';
    host.append(el);
    sphere(g, 0.001, [0, 0, 0]);
    box(g, [0.001, 0.001, 0.001], [0, 0, 0]);
    const wind = [...el.querySelectorAll<SVGElement>('.wind-particle')];
    const particles = [...el.querySelectorAll<SVGElement>('.particle')];
    return {
      update() {
        const t = (s.time * s.parameter + s.variant * 2) % 8;
        wind.forEach((o, i) => {
          const p = el.querySelector<SVGPathElement>('#solar-wind-' + ((i % 8) + 1));
          if (p) {
            const q = p.getPointAtLength(((t / 5 + i * 0.04) % 1) * p.getTotalLength());
            o.setAttribute('transform', `translate(${q.x},${q.y})`);
            o.style.opacity = t < 5 ? '1' : '0';
          }
        });
        particles.forEach((o, i) => {
          const p = el.querySelector<SVGPathElement>('#particle-path-' + ((i % 4) + 1));
          if (p) {
            const q = p.getPointAtLength(((t / 3 + i * 0.06) % 1) * p.getTotalLength());
            o.setAttribute('transform', `translate(${q.x},${q.y})`);
            o.style.opacity = t > 2 && t < 5 ? '1' : '0';
          }
        });
        el.querySelector('#aurora-stop-1')?.setAttribute(
          'stop-color',
          t > 2 && t < 5 ? '#17bd33' : '#111f46',
        );
        el.querySelector('#aurora-stop-2')?.setAttribute(
          'stop-color',
          t > 2 && t < 5 ? '#8527ff' : '#111f46',
        );
      },
      dispose() {
        el.remove();
      },
    };
  }
  if (spec.slug === 'black-hole') {
    const old = [...g.children];
    frame(c, [10, 6, 12], [0, -1.2, 0], 0xd0d5c4);
    (old[0] as T.Mesh).material = new T.MeshBasicMaterial({ color: 0x626e5d, wireframe: true });
    old[1].visible = false;
    const ball = old[2] as T.Mesh;
    (ball.material as T.Material).dispose();
    ball.material = new T.MeshBasicMaterial({ color: 0x3b4438, wireframe: true });
    ball.scale.setScalar(1.35);
    return {
      update() {
        old[1].visible = false;
        ball.rotation.y = s.time * 0.1;
      },
    };
  }
  if (spec.slug === 'protein-folding') {
    const old = hide(c);
    frame(c, [5, 4.4, 7], [0, 3, 0], 0xf4f0e7);
    const segments: Array<{ mesh: T.Mesh; start: number; end: number }> = [
      { start: 0, end: 3 },
      { start: 6, end: 18 },
      { start: 22, end: 29 },
      { start: 31, end: 34 },
    ].map((o) => {
      const geo = new T.BufferGeometry();
      const n = (o.end - o.start) * 8 + 1;
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 6), 3));
      const indices = [];
      for (let i = 0; i < n - 1; i++)
        indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      geo.setIndex(indices);
      const mesh = new T.Mesh(
        geo,
        new T.MeshStandardMaterial({
          color: o.end - o.start > 5 ? 0xc74546 : 0x375bb2,
          side: T.DoubleSide,
          roughness: 0.5,
        }),
      );
      g.add(mesh);
      return { ...o, mesh };
    });
    const loop = new T.Line(
      new T.BufferGeometry().setFromPoints(Array.from({ length: 46 }, () => new T.Vector3())),
      new T.LineBasicMaterial({ color: 0x44795e }),
    );
    g.add(loop);
    return {
      update() {
        const p = old.slice(0, 46).map((m) => m.position.clone());
        const lp = loop.geometry.getAttribute('position');
        p.forEach((v, i) => lp.setXYZ(i, v.x, v.y, v.z));
        lp.needsUpdate = true;
        for (const seg of segments) {
          const curve = new T.CatmullRomCurve3(p.slice(seg.start, seg.end + 1)),
            attr = seg.mesh.geometry.getAttribute('position'),
            frames = curve.computeFrenetFrames(attr.count / 2 - 1, false);
          for (let i = 0; i < attr.count / 2; i++) {
            const q = curve.getPoint(i / (attr.count / 2 - 1)),
              n = frames.normals[i].clone().multiplyScalar(0.17);
            attr.setXYZ(i * 2, q.x + n.x, q.y + n.y, q.z + n.z);
            attr.setXYZ(i * 2 + 1, q.x - n.x, q.y - n.y, q.z - n.z);
          }
          attr.needsUpdate = true;
          seg.mesh.geometry.computeVertexNormals();
        }
        old.slice(0, 46).forEach((m) => (m.visible = s.variant % 2 === 0));
      },
    };
  }
  if (spec.slug === 'molecular-structure') {
    frame(c, [7, 5, 10], [0, 3, 0], 0xeadfc0);
    ground(c, 0xe9dec5);
    return {
      update() {
        g.children[0].traverse((o) => {
          const m = o as T.Mesh;
          if (m.material instanceof T.MeshStandardMaterial) {
            if (m.material.color.getHex() === 0x57dfdd) m.material.color.setHex(0xbcb6a2);
            m.material.roughness = 0.25;
          }
        });
      },
    };
  }
  if (spec.slug === 'sales-timeline') {
    const old = [...g.children];
    frame(c, [6, 4, 13], [0, 2, 0], 0xffffff);
    ground(c, 0x718f5d, 30);
    const labels = old.slice(0, 20).map((m, i) => {
      (m as T.Mesh).material = new T.MeshStandardMaterial({ color: i % 2 ? 0x3e66d2 : 0x5685e5 });
      const l = label(g, `#${i + 1} / GAME ${i + 1}`, [0, 0, 0], 0.75, '#fff', '#667dca');
      const post = box(g, [0.55, 0.8, 0.06], [0, 0, 0], 0xe8dfba);
      return { l, post };
    });
    for (let i = 0; i < 16; i++) {
      const x = i * 0.75 - 6,
        z = -2.5 + (i % 2) * 1.6;
      const crown = new T.Mesh(
        new T.IcosahedronGeometry(0.7, 1),
        material(i % 2 ? 0xb6cb7e : 0x8ca65f),
      );
      crown.position.set(x, 1.8, z);
      g.add(crown);
      cylinder(g, 0.09, 1.4, [x, 0.7, z], 0x996e4e);
    }
    return {
      update() {
        labels.forEach(({ l, post }, i) => {
          l.position.set(old[i].position.x, old[i].scale.y - 0.18, 0.34);
          post.position.set(old[i].position.x, old[i].scale.y + 0.5, 0);
        });
      },
    };
  }
  if (spec.slug === 'rule-universe') {
    frame(c, [10, 7, 12], [0, 2.8, 0], 0xf5f5f1);
    ground(c, 0xecece5);
    return {
      update() {
        g.children[0].traverse((o) => {
          const m = o as T.Mesh;
          if (m.material instanceof T.MeshStandardMaterial) {
            const t = (m.position.y - 1.8) / 2;
            m.material.color.setHSL(0.65 - t * 0.6, 0.46, 0.4);
          }
        });
      },
    };
  }
  if (['anomaly-monitor', 'futuristic-interface', 'interactive-map'].includes(spec.slug)) {
    hide(c);
    const dark = spec.slug === 'anomaly-monitor';
    frame(
      c,
      [0, 3.1, 13],
      [0, 3.1, 0],
      dark ? 0x09090e : spec.slug === 'interactive-map' ? 0xe5e6de : 0xe9e9e6,
    );
    const root = new T.Group();
    g.add(root);
    const earth = sphere(root, 2.55, [0, 3.1, 0], 0xffffff);
    (earth.material as T.MeshStandardMaterial).map = worldTexture(dark);
    (earth.material as T.MeshStandardMaterial).roughness = 0.72;
    if (spec.slug === 'interactive-map') {
      earth.visible = false;
      const map = new T.Mesh(
        new T.PlaneGeometry(9, 4.5),
        new T.MeshBasicMaterial({ map: worldTexture(false), toneMapped: false }),
      );
      map.position.y = 3.1;
      root.add(map);
    }
    const signals = Array.from({ length: 12 }, (_, i) => {
      const a = i * 2.39,
        b = ((i % 6) - 2.5) * 0.38;
      const m = sphere(
        root,
        0.07,
        [Math.cos(a) * Math.cos(b) * 2.6, 3.1 + Math.sin(b) * 2.6, Math.sin(a) * Math.cos(b) * 2.6],
        dark ? 0xf86479 : 0xe57838,
      );
      mark(m, 'node-' + i);
      return m;
    });
    return {
      update() {
        if (spec.slug !== 'interactive-map') root.rotation.y = s.time * 0.04;
        signals.forEach((m, i) => m.scale.setScalar(1 + 0.25 * Math.sin(s.time * 2 + i)));
      },
    };
  }
  return undefined;
}
