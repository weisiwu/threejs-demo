import * as T from 'three';
import { box, sphere, rod, setRod, cylinder, torus, line, tube, mark, material } from '../graphics';
import { softBox, ellipsoid, gear, label, glass, petals } from './helpers';
import { frame, ground, hide, type Appearance } from '../presentation';
import { jansen, JANSEN_EDGES, TAU, type V3 } from '../math';
import type { SceneContext } from '../types';
export function mechanicalAppearance(c: SceneContext): Appearance | undefined {
  const { spec, state: s, group: g } = c;
  if (spec.slug === 'strandbeest') {
    hide(c);
    frame(c, [0, -1.3, 15], [0, -1.3, 0], 0x454d66);
    const limbs = Array.from({ length: 6 }, (_, i) => ({
      side: i < 3 ? 1 : -1,
      offset: ((i % 3) * TAU) / 3,
      lines: JANSEN_EDGES.map(() =>
        line(
          g,
          [
            [0, 0, 0],
            [0, 1, 0],
          ],
          0x009975,
        ),
      ),
      points: Array.from({ length: 8 }, () => {
        const m = sphere(g, 0.041, [0, 0, 0], 0xd9d872);
        m.material.dispose();
        (m as T.Mesh).material = new T.MeshBasicMaterial({ color: 0xd9d872, toneMapped: false });
        return m;
      }),
    }));
    let phase = 0;
    return {
      update(dt) {
        phase += dt * s.parameter;
        for (const f of limbs) {
          const result = jansen(f.side * phase + f.offset);
          if (!result.ok) continue;
          const p = result.points.map(
            (q) => [q.x * 0.052 * f.side, -q.y * 0.052, 0.01 * f.offset] as V3,
          );
          f.lines.forEach((m, i) => {
            const [a, b] = JANSEN_EDGES[i];
            const v = m.geometry.getAttribute('position');
            v.setXYZ(0, ...p[a]);
            v.setXYZ(1, ...p[b]);
            v.needsUpdate = true;
            (m.material as T.LineBasicMaterial).toneMapped = false;
            m.visible = !(s.variant % 2 && f.side < 0);
          });
          f.points.forEach((m, i) => {
            m.position.set(...p[i]);
            m.visible = !(s.variant % 2 && f.side < 0);
          });
        }
      },
    };
  }
  if (spec.slug === 'jet-engine' || spec.slug === 'turbofan-airflow') {
    const old = hide(c);
    const points = old.filter((o) => o instanceof T.Points);
    points.forEach((o) => (o.visible = true));
    const bright = spec.slug === 'turbofan-airflow';
    if (bright)
      points.forEach((p, i) => {
        const m = (p as T.Points).material as T.ShaderMaterial;
        m.blending = T.NormalBlending;
        m.uniforms.uColor.value.setHex(i ? 0x13aeca : 0xe76c20);
        m.vertexShader = m.vertexShader.replace('32./(-mv.z),1.,5.', '64./(-mv.z),2.,5.');
        m.needsUpdate = true;
      });
    frame(c, [-11, 7, 13], [0, 2.4, 0], bright ? 0xfafcfd : 0x000000);
    const root = new T.Group();
    g.add(root);
    root.position.y = 2.5;
    const shaft = cylinder(root, 0.2, 8, [0, 0, 0], 0x577184);
    shaft.rotation.z = Math.PI / 2;
    const shell = new T.Mesh(
      new T.CylinderGeometry(1.96, 1.55, 7.5, 48, 1, true, Math.PI / 2, Math.PI),
      new T.MeshStandardMaterial({
        color: bright ? 0xc7c9c9 : 0x5376a4,
        side: T.DoubleSide,
        metalness: 0.65,
        roughness: 0.33,
        transparent: true,
        opacity: bright ? 1 : 0.22,
      }),
    );
    shell.rotation.z = Math.PI / 2;

    root.add(shell);
    const rotors: T.Group[] = [];
    for (let stage = 0; stage < 11; stage++) {
      const x = -3.6 + stage * 0.62,
        r = stage === 0 ? 1.83 : 1.18 - stage * 0.035;
      const col = bright
        ? [
            0xd93136, 0xcb9258, 0xe0c230, 0x47b87a, 0x31a7b3, 0x398ad1, 0xb9cc3b, 0xe48431,
            0xd83036, 0x9151d1, 0x6f3dbf,
          ][stage]
        : 0x1a508b;
      const rotor = new T.Group();
      rotor.position.x = x;
      root.add(rotor);
      rotors.push(rotor);
      cylinder(rotor, 0.3, 0.35, [0, 0, 0], col).rotation.z = Math.PI / 2;
      for (let j = 0; j < 26; j++) {
        const a = (j * TAU) / 26;
        const blade = softBox(rotor, [0.14, 0.14, r * 0.76], [0, 0, r * 0.58], col, 0.04);
        const pivot = new T.Group();
        rotor.remove(blade);
        pivot.add(blade);
        pivot.rotation.x = a;
        pivot.rotation.y = 0.22;
        rotor.add(pivot);
      }
      torus(root, r, 0.04, [x, 0, 0], col).rotation.y = Math.PI / 2;
    }
    const nose = new T.Mesh(
      new T.ConeGeometry(0.56, 1.25, 32),
      material(bright ? 0x777f86 : 0x1a508b),
    );
    nose.rotation.z = Math.PI / 2;
    nose.position.x = -4.12;
    root.add(nose);
    return {
      update() {
        points.forEach(
          (p, i) => (p.visible = !bright || (i === 0 ? s.variant % 3 !== 1 : s.variant % 3 !== 2)),
        );
        rotors.forEach((m, i) => (m.rotation.x = s.time * s.parameter * (i % 2 ? -1 : 1)));
        shell.visible = s.variant % 2 === 0;
      },
    };
  }
  if (spec.slug === 'ornithopter') {
    const old = [...g.children];
    frame(c, [8, 7, 12], [0, 3, 0], 0xf8e7be);
    ground(c, 0xf4deb0, 22, true);
    (old[0] as T.Mesh).visible = false;
    const body = new T.Group();
    g.add(body);
    softBox(body, [1.3, 0.85, 2.1], [0, 2.75, 0.3], 0x865527);
    cylinder(body, 0.38, 0.8, [0, 2.75, 1.35], 0x30251c).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const cog = gear(body, 0.4 - i * 0.06, [i * 0.38 - 0.4, 3.35, 0.65], 0x795430);
      cog.rotation.y = Math.PI / 2;
    }
    const pivots = old.filter((o) => o instanceof T.Group);
    pivots.forEach((p, i) => {
      p.children[0].visible = false;
      const side = i === 0 ? 1 : -1;
      const span = 4.1;
      const cloth = box(p, [span, 0.035, 1.85], [(side * span) / 2, 0, 0], 0xe9dfc6);
      cloth.rotation.y = side * 0.07;
      for (let j = 0; j < 12; j++)
        rod(
          p,
          [(side * j * span) / 12, 0, -0.95],
          [(side * j * span) / 12, 0, 0.95],
          0.025,
          0x8c562b,
        );
      rod(p, [0, 0.04, 0], [side * span, 0.04, 0], 0.07, 0x8c562b);
    });
    old
      .filter((o) => o instanceof T.Mesh)
      .forEach((o) => {
        const m = o as T.Mesh;
        if (o !== old[0]) (m.material as T.MeshStandardMaterial).color?.setHex(0x996025);
      });
    return {
      update() {
        body.position.y = Math.sin(s.time * 1.1) * 0.05;
        pivots.forEach(
          (p, i) => (p.rotation.z = (i === 0 ? 1 : -1) * Math.sin(s.time * 1.1) * 0.35),
        );
      },
    };
  }
  if (spec.slug === 'industrial-arm') {
    const old = hide(c);
    frame(c, [9, 7, 12], [0, 2.1, 0], 0xebedf0);
    ground(c, 0xe2e3e1, 22, true);
    cylinder(g, 1, 0.45, [0, 0.25, 0], 0xaeb3b8);
    cylinder(g, 0.75, 0.15, [0, 0.55, 0], 0xe38531);
    const arms = [
      softBox(g, [0.6, 1, 0.5], [0, 0, 0], 0xe3e4df),
      softBox(g, [0.5, 1, 0.44], [0, 0, 0], 0xe3e4df),
    ];
    const joints = [0, 1, 2].map(() => cylinder(g, 0.31, 0.64, [0, 0, 0], 0x7c8488));
    joints.forEach((m) => (m.rotation.x = Math.PI / 2));
    const sourceBones = [old[1], old[2]] as T.Mesh[];
    const sourceJoints = [old[3], old[4], old[5]];
    const claw = new T.Group();
    g.add(claw);
    softBox(claw, [0.52, 0.3, 0.4], [0, 0, 0], 0x999c9c);
    for (const a of [-1, 1]) softBox(claw, [0.1, 0.4, 0.22], [a * 0.23, -0.25, 0], 0xe2e3df);
    const conveyor = new T.Group();
    g.add(conveyor);
    conveyor.position.set(2, 0, 2.5);
    box(conveyor, [7, 0.2, 1.8], [0, 1.3, 0], 0xa0a2a1);
    for (let i = 0; i < 24; i++)
      cylinder(conveyor, 0.08, 1.5, [i * 0.28 - 3.25, 1.48, 0], 0x7c8284).rotation.x = Math.PI / 2;
    for (const x of [-3, 3])
      for (const z of [-0.65, 0.65]) rod(conveyor, [x, 0, z], [x, 1.3, z], 0.05, 0xaaaeb1);
    const parcels = Array.from({ length: 4 }, (_, i) =>
      softBox(conveyor, [0.55, 0.6, 0.5], [i * 1.5 - 2.2, 1.85, 0], 0xb68b5e),
    );
    return {
      update() {
        arms.forEach((m, i) => {
          m.position.copy(sourceBones[i].position);
          m.quaternion.copy(sourceBones[i].quaternion);
          m.scale.y = sourceBones[i].scale.y;
        });
        joints.forEach((m, i) => m.position.copy(sourceJoints[i].position));
        claw.position.copy(old[7].position);
        parcels.forEach((m, i) => (m.position.x = ((s.time * 0.4 + i * 1.5) % 6) - 3));
      },
    };
  }
  if (spec.slug === 'kinetic-pavilion') {
    hide(c);
    frame(c, [13, 10, 18], [0, 4.2, 0], 0x181f31);
    const sky = new T.Mesh(
      new T.SphereGeometry(70, 32, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        vertexShader:
          'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec3 p;void main(){float h=normalize(p).y;vec3 c=mix(vec3(.08,.10,.15),vec3(.90,.46,.17),exp(-pow((h-.04)*9.,2.)));gl_FragColor=vec4(c,1.);}',
      }),
    );
    g.add(sky);
    cylinder(g, 3.8, 0.25, [0, 0.14, 0], 0x71502f);
    for (let i = 0; i < 48; i++) {
      const a = (i * TAU) / 48;
      rod(
        g,
        [0.7 * Math.cos(a), 0.29, 0.7 * Math.sin(a)],
        [3.7 * Math.cos(a), 0.29, 3.7 * Math.sin(a)],
        0.02,
        0x9e764d,
      );
    }
    const rings: T.Group[] = [];
    for (let level = 0; level < 3; level++) {
      const y = 0.4 + level * 1.65;
      const radius = 2.25 - level * 0.45;
      cylinder(g, radius, 0.13, [0, y, 0], 0x705134);
      cylinder(g, radius, 0.12, [0, y + 1.8, 0], 0x4c3324);
      for (let i = 0; i < 24; i++) {
        const a = (i * TAU) / 24;
        rod(
          g,
          [radius * Math.cos(a), y, radius * Math.sin(a)],
          [radius * Math.cos(a), y + 1.8, radius * Math.sin(a)],
          0.028,
          0xc4b8a7,
        );
      }
      const wall = cylinder(g, radius, 1.8, [0, y + 0.9, 0], 0xb8cbc9);
      (wall.material as T.MeshStandardMaterial).transparent = true;
      (wall.material as T.MeshStandardMaterial).opacity = 0.13;
      for (let i = 0; i < 12; i++) {
        const a = (i * TAU) / 12;
        const pivot = new T.Group();
        pivot.position.set(radius * Math.cos(a), y + 1.8, radius * Math.sin(a));
        pivot.rotation.y = -a + Math.PI / 2;
        const inner = new T.Group();
        pivot.add(inner);
        petals(inner, level === 2 ? 2.8 : 3.1, level === 2 ? 0.7 : 0.85, 0xe7e0d1);
        g.add(pivot);
        rings.push(inner);
      }
    }
    return {
      update() {
        rings.forEach(
          (p, i) =>
            (p.rotation.x = Math.PI * 0.44 * s.parameter * (i < 12 ? 1 : i < 24 ? 0.76 : 0.52)),
        );
      },
    };
  }
  if (spec.slug === 'portable-microscope') {
    hide(c);
    frame(c, [9, 8, 12], [0, 1.6, 0], 0xe8ebef);
    ground(c, 0xe0e3e8, 24);
    const caseRoot = new T.Group();
    g.add(caseRoot);
    softBox(caseRoot, [6, 0.9, 4], [0, 0.55, 0], 0xf48124, 0.3);
    softBox(caseRoot, [5.75, 0.13, 3.75], [0, 1.08, 0], 0xbac0c3);
    softBox(caseRoot, [5.45, 0.08, 3.42], [0, 1.17, 0], 0xe5e8e7);
    for (const x of [-2.6, 2.6])
      for (const z of [-1.65, 1.65]) softBox(caseRoot, [0.35, 0.5, 0.45], [x, 0.8, z], 0x30383d);
    const lid = new T.Group();
    g.add(lid);
    lid.position.set(-1.35, 1.25, -1.5);
    lid.rotation.x = -0.12;
    softBox(lid, [3.3, 2.75, 0.2], [0, 1.32, 0], 0xf48124, 0.18);
    softBox(lid, [2.94, 2.4, 0.07], [0, 1.32, 0.16], 0x212e3a, 0.04);
    const screen = box(lid, [2.6, 2.04, 0.035], [0, 1.33, 0.21], 0x183045);
    for (let i = 0; i < 21; i++) {
      const a = i * 2.39;
      const r = 0.12 + (i % 3) * 0.05;
      torus(
        lid,
        r,
        0.015,
        [Math.sin(a) * 1.1, 0.45 + (i % 7) * 0.27, 0.25],
        i % 2 ? 0x477f9d : 0x886cbc,
      );
    }
    label(lid, 'ORBIS / SPECIMEN VIEW', [0, 2.3, 0.24], 2.2, '#9ab8bf', '#15222e');
    for (let i = 0; i < 3; i++) {
      const x = -2.15 + i * 1.35;
      softBox(g, [1, 0.13, 1.4], [x, 1.27, 0.65], 0x8b9297);
      softBox(g, [0.85, 0.08, 1.2], [x, 1.36, 0.65], 0xe0e4e2);
      cylinder(g, 0.15, 0.12, [x, 1.48, 0.95], 0x1e272e);
    }
    const lens = new T.Group();
    g.add(lens);
    lens.position.set(1.9, 1.8, -0.65);
    const housing = cylinder(lens, 0.48, 0.55, [0, 0, 0], 0xe8eae8);
    cylinder(lens, 0.25, 0.4, [0, 0, 0], 0x37536b);
    cylinder(lens, 0.35, 0.08, [0, 0.32, 0], 0x303c47);
    const cap = torus(lens, 0.5, 0.1, [0, 0.95, -0.08], 0xef8b32);
    cap.rotation.x = 0.2;
    glass(lens, [0.7, 0.7, 0.04], [0, 0.95, -0.03], 0x6796b5, 0.55);
    for (let i = 0; i < 2; i++) {
      cylinder(g, 0.36, 0.27, [1.7 + i * 0.5, 1.35, 1.1], 0x1f2931);
      torus(g, 0.34, 0.035, [1.7 + i * 0.5, 1.5, 1.1], 0xf19a37).rotation.x = Math.PI / 2;
    }
    return {
      update() {
        lens.position.y = 1.8 + s.parameter * 0.3;
        housing.visible = s.variant % 2 === 0;
        screen.visible = true;
      },
    };
  }
  if (spec.slug === 'jellyfish-robot') {
    const old = [...g.children];
    frame(c, [8, 6, 12], [0, 2.5, 0], 0xdde0ce);
    ground(c, 0xe3e5d6, 22, true);
    const bell = old[0] as T.Mesh;
    const mat = bell.material as T.MeshPhysicalMaterial;
    mat.color.setHex(0x818c7b);
    mat.opacity = 0.3;
    const lattice = old[1];
    lattice.visible = true;
    const hub = cylinder(g, 0.55, 0.25, [0, 3.8, 0], 0x727b68);
    cylinder(g, 0.35, 1.3, [0, 2.95, 0], 0x929a89);
    cylinder(g, 0.2, 0.4, [0, 2.2, 0], 0xcf492b);
    const arms: Array<{ a: number; m: T.Mesh[] }> = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8;
      arms.push({
        a,
        m: Array.from({ length: 8 }, (_, j) => softBox(g, [0.18, 0.25, 0.16], [0, 0, 0], 0x879281)),
      });
    }
    return {
      update() {
        lattice.visible = true;
        hub.scale.x = hub.scale.z = bell.scale.x;
        arms.forEach(({ a, m }) =>
          m.forEach((o, j) => {
            const f = j / 7,
              r = 1.1 + f * 0.8 + Math.sin(s.time * 1.3 - f * 4 + a) * f * 0.25;
            o.position.set(Math.cos(a) * r, 3.7 - f * 2.5, Math.sin(a) * r);
            o.rotation.z = Math.sin(s.time - f * 3) * 0.25;
          }),
        );
      },
    };
  }
  if (spec.slug === 'v8-engine') {
    const old = [...g.children];
    frame(c, [10, 8, 12], [0, 2.2, 0], 0xe8ebef);
    ground(c, 0xe0e3e8);
    (old[0] as T.Mesh).visible = false;
    softBox(g, [5, 0.45, 2.8], [0, 0.55, 0], 0x202a34);
    box(g, [4.7, 0.38, 1.8], [0, 1.2, 0], 0x303b44);
    const flywheel = gear(g, 1.1, [-2.75, 1.4, 0], 0x2b3239, 44);
    flywheel.rotation.y = Math.PI / 2;
    const valves: Array<{ stem: T.Mesh; spring: T.Group; piston: T.Mesh }> = [];
    for (let i = 0; i < 8; i++) {
      const x = ((i % 4) - 1.5) * 1.15,
        side = i < 4 ? -1 : 1;
      const bank = new T.Group();
      bank.position.set(x, 1.4, 0);
      bank.rotation.x = side * 0.47;
      g.add(bank);
      const liner = cylinder(bank, 0.43, 1.55, [0, 1.9, 0], 0xa4afb5);
      (liner.material as T.MeshStandardMaterial).transparent = true;
      (liner.material as T.MeshStandardMaterial).opacity = 0.21;
      for (let j = 0; j < 2; j++) {
        const spring = new T.Group();
        spring.position.set(j * 0.35 - 0.175, 3.2, 0);
        bank.add(spring);
        const pts = Array.from(
          { length: 90 },
          (_, k) => [Math.cos(k * 0.58) * 0.12, k * 0.006, Math.sin(k * 0.58) * 0.12] as V3,
        );
        tube(spring, pts, 0.023, 0x4a535b);
        const stem = rod(
          bank,
          [j * 0.35 - 0.175, 2.95, 0],
          [j * 0.35 - 0.175, 3.95, 0],
          0.035,
          0xe1e7e7,
        );
        sphere(bank, 0.09, [j * 0.35 - 0.175, 3.94, 0], 0x202b35);
        valves.push({ stem, spring, piston: old[2 + i * 2] as T.Mesh });
      }
    }
    return {
      update() {
        old[0].visible = false;
        flywheel.rotation.x = (s.time * s.parameter * TAU) / 60;
        valves.forEach((v, i) => {
          const f = Math.max(0, Math.sin((s.time * s.parameter * TAU) / 120 + i));
          v.spring.scale.y = 1 - f * 0.25;
          v.stem.position.y = 3.45 - f * 0.11;
        });
      },
    };
  }
  if (spec.slug === 'landing-gear') {
    hide(c);
    frame(c, [10, 7, 12], [0, 1.65, 0], 0xfaecd3);
    ground(c, 0xf0e1c8, 30);
    const plate = softBox(g, [3.4, 0.28, 1.5], [0, 2.9, 0], 0xe8e7e0);
    softBox(g, [3.1, 0.2, 0.38], [0, 3.27, 0], 0xe7e7df);
    for (const x of [-1.2, 1.2]) softBox(g, [0.22, 0.5, 1.1], [x, 3.25, 0], 0xd4d7d6);
    const hinge = new T.Group();
    hinge.position.set(0, 2.8, 0);
    g.add(hinge);
    const legs: T.Group[] = [];
    for (const side of [-1, 1]) {
      const leg = new T.Group();
      hinge.add(leg);
      legs.push(leg);
      const path: [number, number, number][] = [
        [0, 0, 0],
        [side * 0.65, -0.08, 0],
        [side * 1.5, -0.35, 0],
        [side * 2.05, -1.2, 0],
      ];
      tube(leg, path, 0.15, 0xf47422);
      const wheel = new T.Group();
      wheel.position.set(side * 2.12, -1.45, 0);
      wheel.rotation.y = Math.PI / 2;
      leg.add(wheel);
      torus(wheel, 0.62, 0.21, [0, 0, 0], 0x171d23);
      cylinder(wheel, 0.4, 0.15, [0, 0, 0], 0xc8cccc).rotation.x = Math.PI / 2;
      for (let j = 0; j < 10; j++) {
        const a = (j * TAU) / 10;
        sphere(wheel, 0.038, [Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.09], 0x313840);
      }
    }
    const piston = rod(g, [-1.2, 3.55, -0.22], [0.95, 3.55, -0.22], 0.13, 0xb9c1c1);
    rod(g, [-0.8, 3.55, -0.22], [-1.6, 3.55, -0.22], 0.055, 0x424e55);
    const gearbox = gear(g, 0.28, [0, 2.75, 0.3], 0x515448, 18);
    return {
      update() {
        hinge.rotation.x = s.parameter * Math.PI;
        plate.visible = s.variant % 2 === 0;
        piston.scale.y = 2.1 - s.parameter * 0.5;
        gearbox.rotation.z = s.parameter * Math.PI;
      },
    };
  }
  if (spec.slug === 'hexapod-robot') {
    frame(c, [9, 7, 12], [0, 1.6, 0], 0x111820);
    ground(c, 0x15202b, 20, true);
    const armor = cylinder(g, 1, 0.24, [0, 2.47, 0], 0x454d55);
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      sphere(g, 0.1, [Math.cos(a) * 0.86, 2.62, Math.sin(a) * 0.86], 0x64caef);
    }
    label(g, 'HEXAPOD', [0, 2.6, 0.65], 1.15, '#82daef', '#162631');
    return {};
  }
  return undefined;
}
