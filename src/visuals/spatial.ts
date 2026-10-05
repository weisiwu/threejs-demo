import * as T from 'three';
import { box, sphere, rod, cylinder, torus, line, tube, mark, material } from '../graphics';
import { softBox, ellipsoid, glass, label, gear } from './helpers';
import { frame, ground, hide, type Appearance } from '../presentation';
import { TAU, lerp, type V3 } from '../math';
import type { SceneContext } from '../types';
import { createModel, animateModel, type ModelId } from '../models/model-kit';
function tree(p: T.Object3D, pos: V3, scale = 1) {
  const g = new T.Group();
  p.add(g);
  g.position.set(...pos);
  g.scale.setScalar(scale);
  rod(g, [0, 0, 0], [0, 1.65, 0], 0.09, 0x947452);
  for (let i = 0; i < 3; i++) {
    const m = new T.Mesh(
      new T.IcosahedronGeometry(0.72, 1),
      new T.MeshStandardMaterial({ color: [0xa5bf6d, 0xb0c878, 0x86a961][i], flatShading: true }),
    );
    m.position.set((i - 1) * 0.34, 1.65 + (i % 2) * 0.3, 0);
    g.add(m);
  }
  return g;
}
export function spatialAppearance(c: SceneContext): Appearance | undefined {
  const { spec, state: s, group: g } = c;
  if (spec.slug === 'skeleton-explorer') {
    frame(c, [10, 6, 12], [0, 2.6, 0], 0x080808);
    const root = g.children[0];
    return {
      update() {
        root.rotation.y = -0.12 + Math.sin(s.time * 0.12) * 0.12;
      },
    };
  }
  if (spec.slug === 'character-selection' || spec.slug === 'robot-roster') {
    const roster = spec.slug === 'robot-roster';
    const main = [...g.children];
    frame(c, [8, 5.8, 13], [0, 2.4, 0], roster ? 0xdeddf0 : 0xd1d2d8);
    ground(c, roster ? 0xc7c4e5 : 0xc7c8cf);
    const ids = ['scout', 'engineer', 'guardian'];
    const assets: ModelId[] = roster
      ? ['robot-assault', 'robot-sentry', 'robot-engineer']
      : ['cyber-scout', 'cyber-engineer', 'cyber-guardian'];
    const mini = assets.map((asset, i) => {
      const model = createModel(asset);
      g.add(model);
      model.userData.miniature = true;
      model.position.set(-3.5 + i * 1.06, 0.05, 1.2);
      mark(model, ids[i]);
      return model;
    });
    return {
      update() {
        main.forEach((model, i) => {
          model.visible = ids[i] === s.selection;
          model.position.set(0.8, 0, 0);
          model.scale.setScalar(1.22);
          model.rotation.y = -0.22 + Math.sin(s.time * s.parameter * 0.2) * 0.12;
          animateModel(model, s.time, roster ? 1 : s.parameter);
          if (roster)
            model.traverse((o) => {
              const m = o as T.Mesh;
              if (m.material instanceof T.MeshStandardMaterial) m.material.roughness = s.parameter;
            });
        });
        mini.forEach((m, i) => m.scale.setScalar(ids[i] === s.selection ? 0.36 : 0.3));
      },
    };
  }
  if (spec.slug === 'ship-selection') {
    const main = [...g.children];
    frame(c, [-9, 6, 12], [0, 2.1, 0], 0xdeddef);
    ground(c, 0xd0cfe6);
    const ids = ['arrow', 'freighter', 'drifter'];
    const assets: ModelId[] = ['ship-hauler', 'ship-freighter', 'ship-explorer'];
    const mini = assets.map((asset, i) => {
      const m = createModel(asset);
      g.add(m);
      m.userData.miniature = true;
      m.position.set((i - 1) * 2.8, 0, 3.9);
      m.scale.setScalar(0.29);
      mark(m, ids[i]);
      return m;
    });
    return {
      update() {
        main.forEach((m, i) => {
          m.visible = ids[i] === s.selection;
          m.position.set(0, 0, 0);
          m.rotation.y = Math.sin(s.time * s.parameter) * 0.2;
          m.scale.setScalar(1.12);
        });
        mini.forEach((m, i) => {
          m.position.y = ids[i] === s.selection ? 0.15 : 0;
        });
      },
    };
  }
  if (spec.slug === 'world-environment') {
    const old = hide(c);
    frame(c, [7, 4.3, 11], [0, 2, 0], 0x0c161c);
    const hall = createModel('industrial-hangar');
    g.add(hall);
    const actor = old[0];
    actor.visible = true;
    actor.userData.presentationHidden = false;
    actor.scale.setScalar(1.05);
    const light = new T.PointLight(0xf99b49, 35, 14);
    light.position.set(-3, 4, 0);
    g.add(light);
    return {
      update() {
        actor.visible = true;
        actor.scale.setScalar(1.05);
        animateModel(actor, s.time);
        light.intensity = (s.variant % 2 ? 12 : 50) * s.parameter;
      },
    };
  }
  if (spec.slug === 'biological-structure') {
    frame(c, [9, 8, 12], [0, 1.65, 0], 0xf1ead8);
    ground(c, 0xece3cc);
    return {};
  }
  if (spec.slug === 'schematic-transition') {
    hide(c);
    frame(c, [12, 10, 14], [0, 2.2, 0], 0xcec7b1);
    ground(c, 0xc4bfa8, 24);
    const house = createModel('timber-house');
    g.add(house);
    const modules = house.children.filter((o) => o.name.startsWith('part-'));
    modules.forEach((m) => mark(m, m.name));
    for (let i = 0; i < 8; i++) tree(g, [-5 + (i % 2) * 10, 0, -4 + Math.floor(i / 2) * 2.6], 0.6);
    return {
      update() {
        const f = s.parameter;
        modules.forEach((m, i) => {
          m.position.y = m.userData.baseY + f * i * 0.13;
        });
        house.traverse((o) => {
          const m = o as T.Mesh;
          if (m.material instanceof T.MeshStandardMaterial) m.material.wireframe = f > 0.85;
        });
        c.camera.position.set(lerp(12, 0, f), lerp(10, 20, f), lerp(14, 0.01, f));
        c.target.set(0, 2.2, 0);
      },
    };
  }
  if (spec.slug === 'warehouse-strategy') {
    const old = hide(c);
    frame(c, [11, 10, 13], [0, 0.9, 0], 0xe5ecf7);
    ground(c, 0xe4e9f0, 26);
    const site = new T.Group();
    g.add(site);
    for (let n = 0; n < 3; n++) {
      const x = -2 + n * 2.2;
      softBox(site, [1.65, 1.6, 5.4], [x, 0.8, 0], 0x2874df);
      box(site, [1.82, 0.15, 5.6], [x, 1.7, 0], 0x4c91f5);
      for (let j = 0; j < 20; j++)
        box(site, [1.8, 0.025, 0.035], [x, 1.8, j * 0.27 - 2.6], 0x2165be);
      for (const z of [-2.76, 2.76]) {
        softBox(site, [1.1, 1.3, 0.06], [x, 0.7, z], 0xeae2be);
        for (let j = 0; j < 9; j++)
          box(site, [1.05, 0.022, 0.08], [x, 0.16 + j * 0.14, z + 0.045], 0xcacbc6);
      }
      label(site, 'WARETRACK', [x, 1.48, 2.8], 1.2, '#ecf5ff', '#2874df');
    }
    for (let n = 0; n < 8; n++) {
      const x = -4 + (n % 2) * 8,
        z = -3 + Math.floor(n / 2) * 2;
      for (let j = 0; j < 3; j++)
        softBox(site, [0.65, 0.55, 0.62], [x, 0.3 + j * 0.56, z], 0xbfa173, 0.045);
      box(site, [0.9, 0.08, 0.85], [x, 0.03, z], 0xa88953);
    }
    for (let i = 0; i < 7; i++)
      tree(g, [-5.3 + (i % 2) * 10.6, 0, -5 + Math.floor(i / 2) * 3], 0.6);
    const forklift = new T.Group();
    g.add(forklift);
    softBox(forklift, [0.55, 0.4, 0.85], [0, 0.2, 0], 0xeebf2e);
    for (const x of [-0.25, 0.25])
      for (const z of [-0.28, 0.28])
        torus(forklift, 0.13, 0.06, [x, 0.08, z], 0x242c31).rotation.y = Math.PI / 2;
    for (const x of [-0.23, 0.23]) rod(forklift, [x, 0.2, -0.25], [x, 1, -0.25], 0.035, 0x2c3a44);
    box(forklift, [0.55, 0.07, 0.55], [0, 1, 0], 0x34434b);
    for (const x of [-0.2, 0.2]) rod(forklift, [x, 0.05, 0.4], [x, 0.05, 0.9], 0.035, 0x374049);
    const load = softBox(g, [0.46, 0.42, 0.46], [0, 0, 0], 0xcaa67b);
    return {
      update() {
        forklift.position.copy(old[21].position);
        forklift.position.y = 0.1;
        load.position.copy(old[22].position);
        load.position.y += 0.3;
        old[24].visible = true;
      },
    };
  }
  return undefined;
}
