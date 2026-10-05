import type { ModelId } from './model-kit';
export const modelNames: Record<ModelId, string> = {
  'winged-skeleton': '翼兽骨架',
  'cyber-scout': '绿甲侦察角色',
  'cyber-engineer': '紫甲工程角色',
  'cyber-guardian': '蓝甲守卫角色',
  'robot-assault': '双炮突击机器人',
  'robot-sentry': '重装哨兵机器人',
  'robot-engineer': '三臂悬浮维修机器人',
  'ship-hauler': '标准货运艇',
  'ship-freighter': '重载货运艇',
  'ship-explorer': '双翼探索艇',
  'industrial-robot': '工业舱室机器人',
  'industrial-hangar': '工业舱室',
  'plant-cell': '植物细胞剖面',
  'timber-house': '木框模块建筑',
};
export const sceneModels: Record<string, ModelId[]> = {
  'skeleton-explorer': ['winged-skeleton'],
  'character-selection': ['cyber-scout', 'cyber-engineer', 'cyber-guardian'],
  'robot-roster': ['robot-assault', 'robot-sentry', 'robot-engineer'],
  'ship-selection': ['ship-hauler', 'ship-freighter', 'ship-explorer'],
  'world-environment': ['industrial-hangar', 'industrial-robot'],
  'biological-structure': ['plant-cell'],
  'schematic-transition': ['timber-house'],
};
