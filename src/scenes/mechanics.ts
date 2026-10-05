import * as T from 'three';
import {
  COLORS as C,
  box,
  sphere,
  rod,
  setRod,
  cylinder,
  torus,
  tube,
  material,
  line,
  mark,
  clear,
} from '../graphics';
import {
  TAU,
  clamp,
  lerp,
  planarIK,
  jansen,
  JANSEN_EDGES,
  fabrik,
  crankSlider,
  seeded,
  type V3,
} from '../math';
import type { SceneContext, Experiment } from '../types';

export const mechanicsIds = new Set([
  'hexapod-robot',
  'strandbeest',
  'kinematic-creature',
  'jet-engine',
  'turbofan-airflow',
  'ornithopter',
  'industrial-arm',
  'kinetic-pavilion',
  'portable-microscope',
  'jellyfish-robot',
  'v8-engine',
  'landing-gear',
]);
export function mechanics(ctx: SceneContext): Experiment {
  const { group: g, state: s, spec, report, panel } = ctx;
  let phase = 0;
  if (spec.slug === 'hexapod-robot') {
    const body = new T.Group();
    g.add(body);
    const plate = cylinder(body, 1.2, 0.35, [0, 2.2, 0], C.dark);
    plate.geometry.dispose();
    plate.geometry = new T.CylinderGeometry(1.3, 1.3, 0.35, 6);
    const legs = Array.from({ length: 6 }, (_, i) => ({
      angle: (i * TAU) / 6,
      bones: [rod(g, [0, 0, 0], [0, 1, 0]), rod(g, [0, 0, 0], [0, 1, 0], 0.08, C.gold)],
      foot: sphere(g, 0.13, [0, 0, 0], C.white),
    }));
    const update = (dt: number) => {
      phase += dt * 0.9;
      let error = 0;
      for (let i = 0; i < 6; i++) {
        const l = legs[i],
          offset = s.variant % 2 ? i / 6 : (i % 2) / 2,
          p = (phase + offset) % 1;
        const lift = p < 0.5 ? Math.sin(p * TAU) * s.parameter : 0;
        const lateral = Math.cos(p * TAU) * 0.45;
        const hip: V3 = [Math.cos(l.angle) * 1.2, 2.2, Math.sin(l.angle) * 1.2],
          target = planarIK(1.7 + lateral, -2.2 + lift, 1.55, 1.8, -1);
        if (!target.ok) {
          s.status = '目标不可达';
          continue;
        }
        const world = (p: { x: number; y: number }): V3 => [
          hip[0] + Math.cos(l.angle) * p.x,
          hip[1] + p.y,
          hip[2] + Math.sin(l.angle) * p.x,
        ];
        const knee = world(target.knee),
          end = world(target.end);
        setRod(l.bones[0], hip, knee);
        setRod(l.bones[1], knee, end);
        l.foot.position.set(...end);
        error = Math.max(error, target.error);
      }
      report({
        步态: s.variant % 2 ? 'ripple' : 'tripod',
        腿数: 6,
        'IK 最大误差': error.toExponential(2),
      });
    };
    return {
      update,
      action() {
        s.variant++;
        s.status = '步态已切换';
      },
    };
  }
  if (spec.slug === 'strandbeest') {
    const frames = Array.from({ length: 6 }, (_, i) => ({
      side: i < 3 ? 1 : -1,
      offset: ((i % 3) * TAU) / 3,
      bones: JANSEN_EDGES.map(() => rod(g, [0, 0, 0], [0, 1, 0], 0.045, i < 3 ? C.cyan : C.gold)),
      joints: Array.from({ length: 8 }, () => sphere(g, 0.075, [0, 0, 0], C.white)),
    }));
    box(g, [2.5, 0.35, 2.2], [0, 4, 0], C.dark);
    return {
      update(dt) {
        phase += dt * s.parameter;
        let error = 0,
          fail = 0;
        for (const f of frames) {
          const result = jansen(phase + f.offset, s.variant % 2 === 1);
          if (!result.ok) {
            fail++;
            continue;
          }
          const p = result.points.map(
            (q) =>
              [
                q.x * 0.052 * f.side,
                4.5 - q.y * 0.052,
                (f.side > 0 ? 1 : -1) * (0.5 + (f.offset / TAU) * 0.65),
              ] as V3,
          );
          JANSEN_EDGES.forEach(([a, b], i) => setRod(f.bones[i], p[a], p[b]));
          p.forEach((q, i) => f.joints[i].position.set(...q));
          error = Math.max(error, result.error);
        }
        s.status = fail ? '存在无解装配' : '杆长约束有效';
        report({
          显示侧数: s.variant % 2 ? 1 : 2,
          曲柄相位: phase.toFixed(2),
          杆长最大残差: error.toExponential(2),
          无解数: fail,
        });
      },
      action() {
        s.variant++;
      },
    };
  }
  if (spec.slug === 'kinematic-creature') {
    const root: V3 = [-4, 2, 0],
      count = 70,
      length = 0.15;
    let points: V3[] = Array.from({ length: count + 1 }, (_, i) => [
      root[0] + i * length,
      root[1],
      0,
    ]);
    const joints = Array.from({ length: count + 1 }, (_, i) =>
      sphere(g, 0.045 + (0.12 * i) / count, points[i], i % 2 ? C.cyan : C.purple),
    );
    const bones = Array.from({ length: count }, (_, i) =>
      rod(g, points[i], points[i + 1], 0.06, C.cyan),
    );
    const targetMesh = sphere(g, 0.18, [0, 4, 0], C.gold);
    return {
      update(dt) {
        phase += dt * 0.5;
        const target: V3 = [
          root[0] + s.parameter * Math.cos(phase * 0.4),
          3 + Math.sin(phase) * 1.5,
          s.parameter * Math.sin(phase * 0.4) * (s.variant % 2 ? 0.7 : 0.3),
        ];
        const solved = fabrik(points, target, length, 32);
        points = solved.points;
        points.forEach((q, i) => joints[i].position.set(...q));
        bones.forEach((m, i) => setRod(m, points[i], points[i + 1]));
        targetMesh.position.set(...target);
        s.status = solved.reachable ? '目标可达' : '目标超出链长';
        report({
          节段数: count,
          '根部 X': points[0][0].toFixed(2),
          末端误差: solved.error.toFixed(4),
          迭代上限: 32,
        });
      },
      action() {
        s.variant++;
        s.status = '目标轨迹已切换';
      },
    };
  }
  if (spec.slug === 'jet-engine' || spec.slug === 'turbofan-airflow') return engine(ctx);
  if (spec.slug === 'ornithopter') {
    box(g, [1.2, 0.5, 2.5], [0, 3, 0], C.dark);
    const rods = Array.from({ length: 6 }, () => rod(g, [0, 0, 0], [0, 1, 0], 0.07, C.gold));
    const pivots = [new T.Group(), new T.Group()];
    for (const p of pivots) g.add(p);
    const wings = pivots.map((p, i) => {
      const m = box(p, [2.3, 0.08, 2.5], [i ? -1.1 : 1.1, 0, 0], C.white);
      return m;
    });
    const hub = sphere(g, 0.12, [0, 3, 0], C.cyan);
    return {
      update(dt) {
        phase += dt * 1.1;
        let error = 0;
        for (let side = 0; side < 2; side++) {
          const sign = side ? -1 : 1,
            hip: V3 = [sign * 0.4, 3, 0],
            a = { x: 0.35 * Math.cos(phase), y: 0.35 * Math.sin(phase) },
            b = { x: 1.5, y: 0 };
          const { circleIntersections } = mechanicalMath;
          const result = circleIntersections(a, 1.5, b, 1.35);
          if (!result.ok) {
            s.status = result.reason;
            continue;
          }
          const q = result.points[s.variant % 2],
            toWorld = (p: { x: number; y: number }): V3 => [hip[0] + sign * p.x, hip[1] + p.y, 0];
          const p0 = toWorld({ x: 0, y: 0 }),
            p1 = toWorld(a),
            p2 = toWorld(q),
            p3 = toWorld(b);
          setRod(rods[side * 3], p0, p1);
          setRod(rods[side * 3 + 1], p1, p2);
          setRod(rods[side * 3 + 2], p2, p3);
          pivots[side].position.set(...p3);
          pivots[side].rotation.z = sign * Math.atan2(q.y, q.x - b.x) * 0.4;
          wings[side].scale.x = s.parameter / 1.6;
          error = Math.max(error, Math.abs(Math.hypot(q.x - a.x, q.y - a.y) - 1.5));
        }
        hub.rotation.y = phase;
        report({
          驱动相位: phase.toFixed(2),
          杆长残差: error.toExponential(2),
          装配分支: s.variant % 2,
        });
      },
      action() {
        s.variant++;
        s.status = '装配分支已切换';
      },
    };
  }
  if (spec.slug === 'industrial-arm') {
    cylinder(g, 1, 0.45, [0, 0.25, 0], C.dark);
    const bones = [
        rod(g, [0, 0.5, 0], [0, 3, 0], 0.22, C.cyan),
        rod(g, [0, 3, 0], [0, 5, 0], 0.17, C.gold),
      ],
      joints = [
        sphere(g, 0.3, [0, 0.5, 0], C.dark),
        sphere(g, 0.26, [0, 3, 0], C.dark),
        sphere(g, 0.2, [0, 5, 0], C.white),
      ];
    const target = sphere(g, 0.17, [4, 3, 0], C.red),
      gripper = box(g, [0.6, 0.18, 0.5], [4, 3, 0], C.dark);
    let azimuth = 0.2;
    return {
      update(dt) {
        phase += dt * 0.2;
        const x = 3.5 * Math.cos(azimuth),
          z = 3.5 * Math.sin(azimuth),
          y = s.parameter;
        target.position.set(x, y, z);
        const solved = planarIK(3.5, y - 0.5, 3, 2.6, -1);
        if (solved.ok) {
          const world = (p: { x: number; y: number }): V3 => [
            Math.cos(azimuth) * p.x,
            p.y + 0.5,
            Math.sin(azimuth) * p.x,
          ];
          const knee = world(solved.knee),
            end = world(solved.end);
          setRod(bones[0], [0, 0.5, 0], knee);
          setRod(bones[1], knee, end);
          joints[1].position.set(...knee);
          joints[2].position.set(...end);
          gripper.position.set(...end);
          gripper.rotation.y = azimuth;
          s.status = '目标求解成功';
          report({
            位置误差: solved.error.toExponential(2),
            '肩角（度）': ((solved.shoulder * 180) / Math.PI).toFixed(1),
            '肘角（度）': ((solved.elbow * 180) / Math.PI).toFixed(1),
            请求高度: y.toFixed(1),
          });
        } else {
          s.status = '目标不可达，保留有效姿态';
          report({ 请求高度: y.toFixed(1), 求解状态: '不可达' });
        }
      },
      action() {
        azimuth += Math.PI / 3;
        s.status = '目标方位已改变';
      },
    };
  }
  if (spec.slug === 'kinetic-pavilion') {
    cylinder(g, 2, 0.25, [0, 0.15, 0], C.dark);
    for (let i = 0; i < 6; i++)
      cylinder(
        g,
        0.09,
        3,
        [1.5 * Math.cos((i * TAU) / 6), 1.6, 1.5 * Math.sin((i * TAU) / 6)],
        C.gold,
      );
    const petals = Array.from({ length: 6 }, (_, i) => {
      const yaw = new T.Group();
      yaw.rotation.y = (i * TAU) / 6;
      g.add(yaw);
      const hinge = new T.Group();
      hinge.position.set(0, 3.1, 1.2);
      yaw.add(hinge);
      const shape = new T.Mesh(new T.SphereGeometry(1.8, 24, 16, 0, Math.PI), material(C.cyan));
      shape.scale.set(0.65, 0.12, 1);
      shape.position.z = 1.3;
      hinge.add(shape);
      return hinge;
    });
    let target: number | null = null;
    return {
      update(dt) {
        if (target !== null) {
          s.parameter = lerp(s.parameter, target, Math.min(1, dt * 3));
          if (Math.abs(target - s.parameter) < 0.005) {
            s.parameter = target;
            target = null;
          }
        }
        petals.forEach((p) => (p.rotation.x = -s.parameter * 1.2));
        report({
          展开程度: s.parameter.toFixed(2),
          铰链数: 6,
          状态: target === null ? '已到位' : '移动中',
        });
      },
      parameter() {
        target = null;
      },
      action() {
        target = s.parameter > 0.5 ? 0 : 1;
        s.status = '花瓣正在移动';
      },
    };
  }
  if (spec.slug === 'portable-microscope') {
    box(g, [4, 0.4, 3], [0, 0.2, 0], C.dark);
    box(g, [0.6, 4, 0.8], [-1.2, 2.2, 0], C.gold);
    const carriage = new T.Group();
    g.add(carriage);
    cylinder(carriage, 0.45, 1.9, [0, 0, 0], C.cyan);
    cylinder(carriage, 0.24, 0.65, [0, -1.2, 0], C.dark);
    torus(carriage, 0.46, 0.06, [0, 0.9, 0], C.gold).rotation.x = Math.PI / 2;
    const stage = box(g, [2.5, 0.15, 2], [0, 1, 0], C.white);
    cylinder(g, 0.35, 0.18, [0, 1.12, 0], C.purple);
    const casing = box(g, [0.8, 2.8, 1], [-1.1, 2, 0], C.dark);
    return {
      update() {
        carriage.position.y = 1.8 + 0.3 * s.parameter;
        carriage.children.forEach((c) => ((c as T.Mesh).visible = true));
        casing.visible = s.variant % 2 === 0;
        stage.rotation.y = 0.15;
        report({
          镜筒示意高度: (1.8 + 0.3 * s.parameter).toFixed(2),
          展示部件: 6,
          制造文件: '未提供',
        });
      },
      action() {
        s.variant++;
        s.status = s.variant % 2 ? '剖面已打开' : '外壳已恢复';
      },
    };
  }
  if (spec.slug === 'jellyfish-robot') {
    const geometry = new T.SphereGeometry(2, 40, 24, 0, TAU, 0, Math.PI * 0.55);
    const bell = new T.Mesh(
      geometry,
      new T.MeshPhysicalMaterial({
        color: C.cyan,
        transparent: true,
        opacity: 0.72,
        metalness: 0.2,
        roughness: 0.25,
        side: T.DoubleSide,
      }),
    );
    bell.position.y = 4;
    g.add(bell);
    const lattice = new T.LineSegments(
      new T.WireframeGeometry(geometry),
      new T.LineBasicMaterial({ color: C.gold, transparent: true, opacity: 0.28 }),
    );
    lattice.position.y = 4;
    lattice.visible = false;
    g.add(lattice);
    const tentacles = Array.from({ length: 12 }, (_, i) => {
      const pts = Array.from(
        { length: 24 },
        (_, j) =>
          [Math.cos((i * TAU) / 12) * 1.5, 3 - j * 0.1, Math.sin((i * TAU) / 12) * 1.5] as V3,
      );
      const l = line(g, pts, i % 2 ? C.cyan : C.purple);
      return { l, angle: (i * TAU) / 12 };
    });
    return {
      update(dt) {
        phase += dt * 1.3;
        const scale = 1 + Math.sin(phase) * s.parameter;
        bell.scale.set(scale, 1 / Math.sqrt(scale), scale);
        lattice.scale.copy(bell.scale);
        for (const t of tentacles) {
          const a = t.l.geometry.getAttribute('position');
          for (let j = 0; j < a.count; j++) {
            const f = j / (a.count - 1),
              r = 1.5 * scale + Math.sin(phase - f * 5 + t.angle) * f * 0.5;
            a.setXYZ(j, Math.cos(t.angle) * r, 3 - f * 2.6, Math.sin(t.angle) * r);
          }
          a.needsUpdate = true;
        }
        report({ 伞面尺度: scale.toFixed(2), 触须数: 12, 材料验证: '未执行' });
      },
      action() {
        s.variant++;
        lattice.visible = s.variant % 2 === 1;
        s.status = lattice.visible ? '晶格显示已打开' : '晶格显示已关闭';
      },
    };
  }
  if (spec.slug === 'v8-engine') {
    const caseMesh = box(g, [5, 2.8, 4.2], [0, 2.8, 0], C.dark);
    const crank = rod(g, [-2.5, 1.4, 0], [2.5, 1.4, 0], 0.2, C.gold);
    const pistons = Array.from({ length: 8 }, (_, i) => ({
      piston: cylinder(g, 0.34, 0.5, [0, 0, 0], C.white),
      rod: rod(g, [0, 0, 0], [0, 1, 0], 0.075, C.cyan),
      phase: ((i % 4) * Math.PI) / 2 + (i < 4 ? 0 : Math.PI),
      x: ((i % 4) - 1.5) * 1.15,
      bank: i < 4 ? -1 : 1,
    }));
    return {
      update(dt) {
        phase += ((dt * s.parameter) / 60) * TAU;
        crank.rotation.x = phase;
        let residual = 0;
        caseMesh.visible = s.variant % 2 === 0;
        (caseMesh.material as T.MeshStandardMaterial).transparent = true;
        (caseMesh.material as T.MeshStandardMaterial).opacity = 0.22;
        for (const p of pistons) {
          const angle = phase + p.phase,
            travel = crankSlider(angle, 0.45, 1.8),
            direction = new T.Vector3(0, 1, p.bank * 0.5).normalize(),
            perpendicular = new T.Vector3(0, -direction.z, direction.y);
          const bottom: V3 = [
            p.x,
            1.4 + 0.45 * (Math.cos(angle) * direction.y + Math.sin(angle) * perpendicular.y),
            0.45 * (Math.cos(angle) * direction.z + Math.sin(angle) * perpendicular.z),
          ];
          const top: V3 = [p.x, 1.4 + travel * direction.y, travel * direction.z];
          p.piston.position.set(...top);
          p.piston.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction);
          setRod(p.rod, bottom, top);
          residual = Math.max(
            residual,
            Math.abs(Math.hypot(top[0] - bottom[0], top[1] - bottom[1], top[2] - bottom[2]) - 1.8),
          );
        }
        report({
          '转速（RPM）': s.parameter,
          曲轴相位: (phase % TAU).toFixed(2),
          气缸数: 8,
          连杆长度残差: residual.toExponential(2),
        });
      },
      action() {
        s.variant++;
        s.status = '剖面状态已切换';
      },
    };
  }
  // 起落架的原创简化机构，参数不冒充原机型尺寸。
  const mount = box(g, [4, 0.4, 2], [0, 4.8, 0], C.dark),
    hinge = new T.Group();
  hinge.position.set(0, 4.5, 0);
  g.add(hinge);
  rod(hinge, [0, 0, 0], [0, -3, 0], 0.14, C.cyan);
  const axle = rod(hinge, [-0.7, -3, 0], [0.7, -3, 0], 0.1, C.gold);
  const wheels = [
    torus(hinge, 0.5, 0.16, [-0.6, -3, 0], C.dark),
    torus(hinge, 0.5, 0.16, [0.6, -3, 0], C.dark),
  ];
  wheels.forEach((w) => (w.rotation.y = Math.PI / 2));
  const brace = rod(g, [-1.7, 4.5, 0], [0, 2, 0], 0.08, C.gold);
  let target: number | null = null;
  return {
    update(dt) {
      if (target !== null) {
        s.parameter = lerp(s.parameter, target, Math.min(1, dt * 2.5));
        if (Math.abs(target - s.parameter) < 0.005) {
          s.parameter = target;
          target = null;
        }
      }
      hinge.rotation.z = s.parameter * 1.4;
      const end: V3 = [Math.sin(hinge.rotation.z) * 1.8, 4.5 - Math.cos(hinge.rotation.z) * 1.8, 0];
      setRod(brace, [-1.7, 4.5, 0], end);
      report({
        收放进度: s.parameter.toFixed(2),
        状态: target === null ? (s.parameter > 0.5 ? '收起' : '展开') : '收放中',
        机构范围: '原创简化示意',
      });
    },
    parameter() {
      target = null;
    },
    action() {
      target = s.parameter > 0.5 ? 0 : 1;
      s.status = '收放命令已提交';
    },
  };
}
import { circleIntersections } from '../math';
const mechanicalMath = { circleIntersections };

function engine(ctx: SceneContext): Experiment {
  const { group: g, state: s, spec, report } = ctx;
  let phase = 0;
  const housing = cylinder(g, 2.1, 8, [0, 2.5, 0], C.dark);
  housing.rotation.z = Math.PI / 2;
  (housing.material as T.MeshStandardMaterial).transparent = true;
  (housing.material as T.MeshStandardMaterial).opacity = 0.25;
  const fan = new T.Group();
  fan.position.set(-3.8, 2.5, 0);
  g.add(fan);
  for (let i = 0; i < 16; i++) {
    const hub = new T.Group();
    hub.rotation.x = (i * TAU) / 16;
    fan.add(hub);
    const blade = box(hub, [0.18, 0.12, 1.75], [0, 0, 0.9], i % 2 ? C.cyan : C.gold);
    blade.rotation.y = 0.35;
  }
  cylinder(fan, 0.35, 0.6, [0, 0, 0], C.gold).rotation.z = Math.PI / 2;
  for (let x = -2; x <= 2; x += 1) {
    const t = torus(g, 1.05, 0.08, [x, 2.5, 0], C.gold);
    t.rotation.y = Math.PI / 2;
  }
  const random = seeded(83);
  const flows = [0, 1].map((kind) => {
    const n = 4000,
      config = new Float32Array(n * 3),
      position = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      config[i * 3] = random();
      config[i * 3 + 1] = random() * TAU;
      config[i * 3 + 2] = random();
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(position, 3));
    geometry.setAttribute('config', new T.BufferAttribute(config, 3));
    const mat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uKind: { value: kind },
        uColor: { value: new T.Color(kind ? C.cyan : C.gold) },
      },
      vertexShader: `attribute vec3 config;uniform float uTime;uniform float uKind;varying float vFade;void main(){float p=fract(config.x+uTime*.22);float x=-4.+8.*p;float radius=mix(.35+.45*sin(p*3.14159),1.4+.3*sin(p*3.14159),uKind);radius*=.55+.45*config.z;vec3 q=vec3(x,2.5+cos(config.y)*radius,sin(config.y)*radius);vFade=sin(p*3.14159);vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(32./(-mv.z),1.,5.);}`,
      fragmentShader: `uniform vec3 uColor;varying float vFade;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(uColor,(1.-d*2.)*vFade*.85);}`,
    });
    const points = new T.Points(geometry, mat);
    points.frustumCulled = false;
    g.add(points);
    return { points, mat };
  });
  return {
    update(dt) {
      phase += dt * s.parameter;
      fan.rotation.x = phase * 3;
      flows.forEach((f) => (f.mat.uniforms.uTime.value = phase));
      if (spec.slug === 'turbofan-airflow') {
        flows[0].points.visible = s.variant % 3 !== 1;
        flows[1].points.visible = s.variant % 3 !== 2;
      }
      report({
        粒子数量: flows.filter((f) => f.points.visible).length * 4000,
        流分支:
          spec.slug === 'turbofan-airflow'
            ? ['核心 + 外涵', '外涵', '核心'][s.variant % 3]
            : '核心 + 外涵',
        '时间（秒）': phase.toFixed(2),
        颜色含义: '流路归属',
      });
    },
    action() {
      s.variant++;
      if (spec.slug === 'jet-engine') housing.visible = !housing.visible;
      s.status =
        spec.slug === 'jet-engine' ? (housing.visible ? '机匣显示' : '剖视显示') : '气流分支已切换';
    },
  };
}
