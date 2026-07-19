import { describe, expect, it } from 'vitest';
import { createSolarDailyPathGroup } from '../../src/scene/createSolarDailyPathGroup';

const sources = import.meta.glob([
  '../../src/science/temporal/civilTime.ts',
  '../../src/science/temporal/solarDailyPath.ts',
  '../../src/presentation/solarDailyPathPresentationModel.ts',
  '../../src/scene/solarDailyPathCameraRelativeFrame.ts',
  '../../src/scene/createSolarDailyPathGroup.ts',
], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

describe('solar daily-path boundaries', () => {
  it('keeps civil time and astronomy out of Three.js scene code and raw celestial scale out of the GPU', () => {
    const sceneSource = [
      sources['../../src/presentation/solarDailyPathPresentationModel.ts'],
      sources['../../src/scene/solarDailyPathCameraRelativeFrame.ts'],
      sources['../../src/scene/createSolarDailyPathGroup.ts'],
    ].join('\n');
    expect(sceneSource).toContain('vec4(position, 0.0)');
    expect(sceneSource).toContain('NO_RAW_LARGE_WORLD_VERTEX_COORDINATES');
    expect(sceneSource).not.toContain('astronomy-engine');
    expect(sceneSource).not.toContain('Intl.DateTimeFormat');
    expect(sceneSource).not.toContain('10_000_000_000_000');
  });

  it('owns explicit linear non-writing overlay materials', () => {
    const handle = createSolarDailyPathGroup();
    for (const child of handle.group.children) {
      const material = (child as unknown as { material: { depthTest: boolean; depthWrite: boolean } }).material;
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);
    }
    handle.dispose();
  });
});
