import * as T from 'three';
import { box, sphere, rod, cylinder, torus, tube, mark, material } from '../graphics';
import { softBox, ellipsoid, glass, label } from './helpers';
import { frame, ground, hide, type Appearance } from '../presentation';
import { TAU, type V3 } from '../math';
import type { SceneContext } from '../types';
export function interfaceAppearance(c: SceneContext): Appearance | undefined {
  const { spec, state: s, group: g } = c;
  if (spec.slug === 'circuit-builder') {
    hide(c);
    frame(c, [8, 8, 12], [0, 1, 0], 0xe5dfcd);
    ground(c, 0xe0d6c0);
    softBox(g, [6, 0.4, 3.6], [0, 0.3, 0], 0x297c7e, 0.2);
    box(g, [5.7, 0.08, 3.3], [0, 0.54, 0], 0x469293);
    const holes = new T.InstancedMesh(
      new T.CylinderGeometry(0.035, 0.035, 0.04, 8),
      new T.MeshStandardMaterial({ color: 0x245e61 }),
      600,
    );
    const mat = new T.Matrix4();
    for (let i = 0; i < 600; i++) {
      mat.makeTranslation((i % 40) * 0.14 - 2.73, 0.6, Math.floor(i / 40) * 0.2 - 1.4);
      holes.setMatrixAt(i, mat);
    }
    g.add(holes);
    const cap = cylinder(g, 0.36, 0.95, [-1.85, 1.1, -0.65], 0x35426c);
    torus(g, 0.29, 0.02, [-1.85, 1.58, -0.65], 0x65748b).rotation.x = Math.PI / 2;
    label(g, '220 µF', [-1.84, 1.24, -0.27], 0.52, '#d9deef', '#35426c');
    softBox(g, [0.75, 0.16, 0.52], [0, 0.8, -0.2], 0x232b30, 0.03);
    for (let i = 0; i < 4; i++)
      for (const z of [-1, 1])
        rod(
          g,
          [i * 0.17 - 0.26, 0.82, z * 0.22],
          [i * 0.17 - 0.26, 0.58, z * 0.43],
          0.025,
          0xbbbfc0,
        );
    for (let i = 0; i < 3; i++) {
      const x = -0.75 + i * 1.1;
      const r = cylinder(g, 0.13, 0.75, [x, 0.88, 0.6], 0xd5bc87);
      r.rotation.z = Math.PI / 2;
      for (let j = 0; j < 4; j++) {
        const b = torus(
          g,
          0.135,
          0.013,
          [x + j * 0.12 - 0.18, 0.88, 0.6],
          [0x764c35, 0xd84d3a, 0x5b4832, 0xc9a44f][j],
        );
        b.rotation.y = Math.PI / 2;
      }
      rod(g, [x - 0.5, 0.63, 0.6], [x - 0.4, 0.88, 0.6], 0.022, 0xd6dcda);
      rod(g, [x + 0.4, 0.88, 0.6], [x + 0.5, 0.63, 0.6], 0.022, 0xd6dcda);
    }
    const led = sphere(g, 0.17, [1.85, 0.96, -0.3], 0xdf4a43);
    led.scale.y = 1.4;
    rod(g, [1.78, 0.61, -0.3], [1.78, 0.91, -0.3], 0.018, 0xc0c8c8);
    rod(g, [1.93, 0.61, -0.3], [1.93, 0.91, -0.3], 0.018, 0xc0c8c8);
    for (let i = 0; i < 7; i++)
      tube(
        g,
        [
          [i * 0.7 - 2.1, 0.6, -1.2],
          [i * 0.7 - 2.1, 0.6 + (0.4 + (i % 3) * 0.13), -0.8],
          [i * 0.7 - 1.6, 0.6 + (0.4 + (i % 3) * 0.13), 0.25],
          [i * 0.7 - 1.6, 0.6, 0.7],
        ],
        0.028,
        i % 2 ? 0x2363b4 : 0xdf3a40,
      );
    for (let i = 0; i < 3; i++)
      label(g, ['V1', 'R1', 'R2'][i], [i * 1.6 - 1.6, 0.7, 1.35], 0.65, '#185555', '#60aaaa');
    return {
      update() {
        (led.material as T.MeshStandardMaterial).emissive.setHex(
          s.variant % 2 ? 0x7c0905 : 0x200401,
        );
        cap.rotation.y = s.parameter * 0.0001;
      },
    };
  }
  if (spec.slug === 'reactor-diagnostics') {
    hide(c);
    frame(c, [0, 2.8, 14], [0, 2.8, 0], 0x08161e);
    const root = new T.Group();
    root.position.y = 2.8;
    g.add(root);
    for (const r of [1.15, 1.9, 2.65]) torus(root, r, 0.06, [0, 0, 0], 0x45636d);
    const core = cylinder(root, 0.62, 0.22, [0, 0, 0], 0x9de6e2);
    core.rotation.x = Math.PI / 2;
    (core.material as T.MeshStandardMaterial).emissive.setHex(0x4aa7a1);
    torus(root, 0.74, 0.09, [0, 0, 0.15], 0x345760);
    const blocks: T.Group[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i * TAU) / 10,
        p = new T.Group();
      p.position.set(Math.sin(a) * 1.85, Math.cos(a) * 1.85, 0);
      p.rotation.z = -a;
      root.add(p);
      softBox(p, [0.67, 0.85, 0.25], [0, 0, 0], 0x1a2d38, 0.08);
      for (let j = 0; j < 7; j++)
        box(p, [0.52, 0.037, 0.045], [0, j * 0.092 - 0.28, 0.17], 0xe8a844);
      rod(
        root,
        [Math.sin(a) * 0.8, Math.cos(a) * 0.8, 0],
        [Math.sin(a) * 2.55, Math.cos(a) * 2.55, 0],
        0.04,
        0x52666a,
      );
      blocks.push(p);
    }
    const light = new T.PointLight(0x9fedec, 8, 10);
    light.position.set(0, 2.8, 2);
    g.add(light);
    return {
      update() {
        const fault = s.variant % 2 === 1;
        (core.material as T.MeshStandardMaterial).emissive.setHex(fault ? 0xb93116 : 0x4aa7a1);
        light.intensity = 4 + s.parameter * 5;
        root.rotation.z = Math.sin(s.time * 0.08) * 0.08;
        blocks.forEach((p) => p.scale.setScalar(1 + 0.015 * Math.sin(s.time * 2)));
      },
    };
  }
  if (spec.slug === 'smart-home') {
    const old = hide(c);
    frame(c, [10, 11, 13], [0, 1, 0], 0xe5eff6);
    ground(c, 0xdce6f0, 25);
    const lamps: T.PointLight[] = [];
    for (let i = 0; i < 4; i++) {
      const room = new T.Group();
      room.position.copy(old[i].position);
      g.add(room);
      mark(room, 'room-' + i);
      softBox(room, [3.7, 0.18, 3.7], [0, 0.1, 0], 0xc0a884);
      for (let j = 0; j < 16; j++)
        box(room, [0.2, 0.015, 3.6], [j * 0.23 - 1.73, 0.22, 0], j % 2 ? 0xcfb797 : 0xc7ad89);
      box(room, [3.65, 1.8, 0.1], [0, 1.12, -1.75], 0xe4ded1);
      box(room, [0.1, 1.8, 3.65], [-1.75, 1.12, 0], 0xe4ded1);
      const light = new T.PointLight(0xffd5a0, 8, 5);
      light.position.set(0, 2, 0);
      room.add(light);
      lamps.push(light);
      if (i === 0) {
        softBox(room, [2, 0.45, 0.65], [-0.1, 0.48, -0.6], 0xaaa999);
        softBox(room, [2, 0.5, 0.18], [-0.1, 0.85, -0.9], 0xbebba7);
        softBox(room, [1, 0.13, 0.65], [0.1, 0.58, 0.65], 0x6f5132);
        softBox(room, [1.5, 0.9, 0.12], [1.1, 1.1, -1.6], 0x283845);
      }
      if (i === 1) {
        for (let j = 0; j < 3; j++)
          softBox(room, [0.8, 0.8, 0.7], [-1.2 + j * 0.9, 0.6, -1.2], 0xc3b39c);
        box(room, [2.7, 0.06, 0.8], [0, 1.04, -1.2], 0xf5f1df);
        cylinder(room, 0.28, 0.06, [0.4, 1.09, -1.2], 0x8b9391);
        softBox(room, [1, 0.1, 1], [0.4, 0.85, 0.65], 0xa58b63);
      }
      if (i === 2) {
        softBox(room, [2, 0.35, 2.65], [0.25, 0.42, 0], 0xc1ad87);
        softBox(room, [1.85, 0.22, 2.5], [0.25, 0.7, 0], 0xece8d6);
        box(room, [1.85, 0.08, 1.5], [0.25, 0.86, 0.35], 0x789384);
        for (const x of [-0.25, 0.7]) softBox(room, [0.7, 0.15, 0.45], [x, 0.9, -0.83], 0xecebe1);
      }
      if (i === 3) {
        softBox(room, [2, 0.16, 0.75], [0, 0.85, -1], 0x9f875e);
        for (const x of [-0.9, 0.9]) rod(room, [x, 0.2, -1], [x, 0.85, -1], 0.055, 0x9f875e);
        softBox(room, [0.65, 0.5, 0.08], [0, 1.2, -1.15], 0x384654);
        softBox(room, [0.6, 0.1, 0.6], [0, 0.65, 0.3], 0x979b92);
      }
      const pot = cylinder(room, 0.14, 0.25, [1.4, 0.35, 1.25], 0xf1ebda);
      ellipsoid(room, [0.25, 0.4, 0.25], [1.4, 0.67, 1.25], 0x719466);
      mark(room, 'room-' + i);
    }
    return {
      update() {
        lamps.forEach((l, i) => {
          const mat = (old[i].children[2] as T.Mesh).material as T.MeshStandardMaterial;
          l.intensity = mat.emissive.getHex() ? s.parameter * 6 : 0;
        });
      },
    };
  }
  if (
    [
      'customizable-dashboard',
      'visibility-dashboard',
      'state-management',
      'network-management',
    ].includes(spec.slug)
  ) {
    frame(c, [10, 8, 12], [0, 2.4, 0], 0xf3f4f8);
    ground(c, 0xe9ebf0);
    const host = document.querySelector('#viewport')!;
    const ui = document.createElement('div');
    ui.className = 'dashboard-replica';
    ui.style.cssText =
      'position:absolute;inset:65px 17% 40px;background:#f4f5f8;color:#46546b;padding:16px;overflow:hidden;pointer-events:auto';
    host.append(ui);
    let stamp = '';
    const svg = (i: number) => {
      const points = Array.from(
        { length: 20 },
        (_, j) => `${j * 12},${80 - Math.abs(Math.sin(j * 0.8 + i)) * 60}`,
      ).join(' ');
      return `<svg viewBox="0 0 228 100"><path d="M0 90H228M0 60H228M0 30H228" stroke="#e7e8f0" fill="none"/><polyline points="${points}" stroke="${i % 2 ? '#7e5bcc' : '#64a7d1'}" stroke-width="3" fill="none"/></svg>`;
    };
    return {
      update() {
        const rows = [...c.panel.querySelectorAll<HTMLElement>('.widget-row')].map(
          (o) => o.firstChild?.textContent || '',
        );
        const values = [...document.querySelectorAll<HTMLElement>('[data-metric]')].map(
          (o) => o.dataset.metric + ': ' + o.textContent,
        );
        const next = rows.join('|') + values.join('|');
        if (next === stamp) return;
        stamp = next;
        if (spec.slug === 'customizable-dashboard') {
          ui.innerHTML = `<h3 style="margin:0 0 16px">Overview <small style="float:right;font-weight:400">合成示例数据</small></h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${rows.map((id, i) => `<article style="background:white;border-radius:8px;padding:10px"><b>${id}</b>${svg(i)}</article>`).join('')}</div>`;
        } else if (spec.slug === 'state-management') {
          ui.innerHTML = `<h3>React State Management</h3><div style="display:grid;gap:12px">${values
            .slice(0, 5)
            .map(
              (v, i) =>
                `<article style="padding:15px;background:${['#e3ecf7', '#ede3f7', '#e4f2ed', '#fff0de'][i % 4]};border:1px solid #bfcce0;border-radius:6px">${v}</article>`,
            )
            .join('')}</div>`;
        } else if (spec.slug === 'network-management') {
          const devices = [...c.panel.querySelectorAll<HTMLElement>('.check-row')].filter(
            (o) => !o.hidden,
          );
          ui.innerHTML = `<h3>Devices <small style="float:right">${devices.length} units</small></h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${devices.map((o) => `<article style="background:white;padding:9px;border-radius:4px;color:${(o.querySelector('input') as HTMLInputElement).checked ? '#539a88' : '#677084'}">◉ ${o.textContent}</article>`).join('')}</div>`;
        } else {
          ui.innerHTML = `<h3>Visibility Analytics</h3>${svg(s.operations)}<div style="display:grid;gap:14px">${values.map((v) => `<article style="background:white;padding:14px;border-radius:7px">${v}</article>`).join('')}</div>`;
        }
      },
      dispose() {
        ui.remove();
      },
    };
  }
  return undefined;
}
