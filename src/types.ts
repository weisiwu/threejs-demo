import type * as THREE from 'three';
export type Category = '界面与状态' | '生成与资产' | '机械机构' | '科学可视化' | '游戏与空间';
export interface DemoSpec {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  article: string;
  parameter: { label: string; min: number; max: number; step: number; value: number };
  action: string;
  mechanism: string;
  limit: string;
  sources: Array<{ url: string; title: string }>;
  research: string[];
}
export interface RuntimeState {
  time: number;
  parameter: number;
  paused: boolean;
  selection: string;
  variant: number;
  operations: number;
  status: string;
}
export interface SceneContext {
  spec: DemoSpec;
  scene: THREE.Scene;
  group: THREE.Group;
  state: RuntimeState;
  panel: HTMLElement;
  report: (fields: Record<string, string | number>) => void;
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
}
export interface Experiment {
  update: (dt: number) => void;
  parameter?: (value: number) => void;
  action: () => void;
  select?: (id: string) => void;
  dispose?: () => void;
}
