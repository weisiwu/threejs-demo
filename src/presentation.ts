import * as T from 'three';
import { box, material } from './graphics';
import type { SceneContext, Experiment } from './types';
import { mechanicalAppearance } from './visuals/mechanical';
import { spatialAppearance } from './visuals/spatial';
import { scientificAppearance } from './visuals/scientific';
import './presentation.css';
import { interfaceAppearance } from './visuals/interfaces';
export type Appearance = { update?: (dt: number) => void; dispose?: () => void };
export function frame(
  c: SceneContext,
  position: [number, number, number],
  target: [number, number, number],
  color: number,
) {
  c.scene.background = new T.Color(color);
  c.camera.position.set(...position);
  c.target.set(...target);
  c.camera.fov = 38;
  c.camera.updateProjectionMatrix();
}
export function ground(c: SceneContext, color: number, size = 24, grid = false) {
  const p = box(c.group, [200, 0.08, 200], [0, -0.09, 0], color);
  p.receiveShadow = true;
  (p.material as T.MeshStandardMaterial).metalness = 0;
  (p.material as T.MeshStandardMaterial).roughness = 1;
  if (grid)
    c.group.add(new T.GridHelper(size, 24, color === 0xebe5d4 ? 0xbbb7a5 : 0xc5c7c9, 0xc5c7c9));
}
export function hide(c: SceneContext) {
  const old = [...c.group.children];
  old.forEach((o) => {
    o.visible = false;
    o.userData.presentationHidden = true;
  });
  return old;
}
const names: Record<string, [string, string, string, string]> = {
  'anomaly-monitor': [
    'ANOMALIES',
    'System status|Detection zones|Frequency analyser',
    'Global anomaly feed|Active signals',
    'dark',
  ],
  ornithopter: [
    'FLYING MACHINE',
    'Wing integrity|Navigation controls|Mechanical linkage',
    'Flight controls|Mechanical wings',
    'parchment',
  ],
  'ship-selection': [
    'STELLAR EXPANSE',
    'Fleet catalogue|Available ships',
    'Selected ship|Equipment',
    'lavender',
  ],
  'industrial-arm': [
    'ROBOTIC ARM / SIMULATION',
    'Joint angles|Manual control',
    'Velocity metrics|Command terminal',
    'silver',
  ],
  'smart-home': ['Home overview', 'Devices|Lighting|Energy usage', 'Room details|Activity', 'home'],
  'interactive-map': [
    'GLOBAL NETWORK',
    'Network metrics|Node selection',
    'Event log|Data stream',
    'sage',
  ],
  'futuristic-interface': [
    'GLOBAL GEOSPATIAL DATA',
    'Active sensors|System alerts',
    'Featured locations|Locations info',
    'silver',
  ],
  'robot-roster': [
    'ROBOT INDUSTRIES',
    'Select robot unit|Loadout',
    'Unit specifications|Schematics',
    'lavender',
  ],
  'character-selection': [
    'CHARACTERS / LOADOUTS',
    'Cyber-mech roster|Select unit',
    'Armor|Mobility|Power',
    'silver',
  ],
  'planet-explorer': [
    'PLANET EXPEDITION',
    'Planet catalogue|Expedition log',
    'Planet overview|Missions',
    'home',
  ],
  'black-hole': [
    'GRAVITATIONAL SPACE-TIME',
    'Stellar objects|Simulation setup',
    'Gravitational shear|Temperature',
    'sage',
  ],
  'biological-structure': [
    'Cell Architecture Studio',
    'Cell types|Organelles',
    'Organelle details|Biological notes',
    'cream',
  ],
  'turbofan-airflow': [
    'JET STREAM',
    'Airflow / intake|Compression',
    'Combustion|Expansion',
    'white',
  ],
  'atomic-explorer': [
    'Element Explorer',
    'Element spotlight|Explore & learn',
    'Discovery timeline|Lab challenge',
    'white',
  ],
  'molecular-structure': [
    'MOLECULARIUM',
    'The catalogue|Ball & stick',
    'Composition|Field notes',
    'cream',
  ],
  'circuit-builder': [
    'ELECTRO FORGE',
    'Components|Circuit netlist',
    'History|Circuit state',
    'cream',
  ],
  'reactor-diagnostics': [
    'ARC REACTOR DIAGNOSTICS',
    'Core monitor|Neutrino flux',
    'Component index|Containment',
    'reactor',
  ],
  'kinetic-pavilion': [
    'Lotus Pavilion',
    'Parametric bloom study|Structure',
    'Petal control|Interior light',
    'sunset',
  ],
  'portable-microscope': [
    'ORBIS-7 / CLASS III',
    'Portable specimen imager',
    'Optics|Focus control',
    'silver',
  ],
  'protein-folding': [
    'Foldscape',
    'Protein library|Folding stages',
    'Live readouts|Sequence',
    'cream',
  ],
  'jellyfish-robot': [
    'ROBOTIC JELLYFISH SIMULATOR',
    'Neural node activity|Environmental sensors',
    'Power consumption|Subsystem registry',
    'sage',
  ],
  'v8-engine': [
    'V8 / Four-Stroke',
    'Cross-plane crank|Slider-crank',
    'Cylinder state|Valve timing',
    'silver',
  ],
  'landing-gear': [
    'Cessna 337 Skymaster',
    'Mechanism state|Flight',
    'System overview|Sequence',
    'cream',
  ],
  'schematic-transition': [
    'TIMBER STACK COMMONS',
    'Materials|Concept|Plan',
    'Design intention|Module diagram',
    'parchment',
  ],
  'warehouse-strategy': [
    'WareTrack / Riverside Hub',
    'Stock on hand|Truck dispatch',
    'Depot overview|Inventory',
    'home',
  ],
  'rule-universe': ['Wolfram Model Atlas', 'Universes|Rewrite rule', 'Generations|Growth', 'white'],
  'customizable-dashboard': [
    'Dashboard',
    'Overview|Revenue|Orders',
    'Traffic|Saved layout',
    'white',
  ],
  'visibility-dashboard': [
    'Visibility Analytics',
    'Sessions|Engagement',
    'Visible time|Element activity',
    'white',
  ],
  'network-management': [
    'Network Management',
    'Devices|Access control',
    'Selection|Batch operations',
    'white',
  ],
  'state-management': [
    'React State Management',
    'Counter|State updates',
    'Subscriptions|Render counts',
    'white',
  ],
  'scene-builder': [
    'SCENE STUDIO',
    'Scene commands|Object catalogue',
    'Selection|Command results',
    'dark',
  ],
  'hexapod-robot': [
    'HEXAPOD SIMULATOR',
    'Body pose|Leg configuration',
    'Gait parameters|Inverse kinematics',
    'dark',
  ],
};
export function present(c: SceneContext, base: Experiment): Experiment {
  const root = document.querySelector<HTMLElement>('#viewport')!;
  const config = names[c.spec.slug];
  let hud: HTMLElement | undefined;
  if (config) {
    const [title, left, right, theme] = config;
    root.dataset.theme = theme;
    hud = document.createElement('div');
    hud.className = 'scene-hud';
    const cards = (s: string) =>
      s
        .split('|')
        .map(
          (t, i) =>
            `<section><h3>${t}</h3><div class="hud-chart" style="--chart:${i}">${Array.from({ length: 12 }, (_, j) => `<i style="height:${20 + ((j * 17 + i * 31) % 70)}%"></i>`).join('')}</div></section>`,
        )
        .join('');
    hud.innerHTML = `<header><span class="hud-emblem">◈</span><strong>${title}</strong><small>INTERACTIVE RECONSTRUCTION</small></header><aside class="hud-left">${cards(left)}</aside><aside class="hud-right">${cards(right)}<section class="hud-live"></section></aside><footer><span>ROTATE / ZOOM / SELECT</span><b class="hud-state">READY</b></footer>`;
    root.append(hud);
  }
  const visuals =
    mechanicalAppearance(c) ??
    spatialAppearance(c) ??
    scientificAppearance(c) ??
    interfaceAppearance(c);
  if (!visuals) {
    const light = config?.[3] === 'white';
    frame(c, [10, 8, 12], [0, 2.4, 0], light ? 0xf3f4f8 : 0x0d1924);
    ground(c, light ? 0xe9ebf0 : 0x101d29, 18);
  }
  c.group.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const key = c.scene.children.find((o) => o instanceof T.DirectionalLight) as T.DirectionalLight;
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
  key.shadow.bias = -0.001;
  let stamp = '';
  return {
    ...base,
    update(dt) {
      base.update(dt);
      c.group.children
        .filter((o) => o.userData.presentationHidden)
        .forEach((o) => (o.visible = false));
      visuals?.update?.(dt);
      if (hud) {
        const next = `${c.state.operations}:${c.state.selection}:${c.state.status}`;
        if (next !== stamp) {
          stamp = next;
          hud.querySelector('.hud-state')!.textContent = c.state.status;
          const out = hud.querySelector('.hud-live')!;
          out.replaceChildren();
          for (const [label, value] of [
            ['SELECTION', c.state.selection || '—'],
            ['OPERATIONS', String(c.state.operations)],
          ]) {
            const p = document.createElement('p');
            p.textContent = label + '  ' + value;
            out.append(p);
          }
        }
      }
    },
    dispose() {
      base.dispose?.();
      visuals?.dispose?.();
      hud?.remove();
      delete root.dataset.theme;
    },
  };
}
