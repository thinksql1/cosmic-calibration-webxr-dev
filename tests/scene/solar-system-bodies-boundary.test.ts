import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createSolarSystemBodiesGroup } from '../../src/scene/createSolarSystemBodiesGroup';

const sources = import.meta.glob(
  [
    '../../src/presentation/solarSystemBodyPresentationModel.ts',
    '../../src/scene/solarSystemBodiesCameraRelativeFrame.ts',
    '../../src/scene/createSolarSystemBodiesGroup.ts',
  ],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

describe('solar-system body rendering boundaries', () => {
  it('keeps actual body placement projective and excludes raw celestial-scale finite coordinates or provider calculations', () => {
    const combined = Object.values(sources).join('\n');
    expect(combined).toContain('vec4(position, 0.0)');
    expect(combined).toContain('NO_RAW_LARGE_WORLD_VERTEX_COORDINATES');
    expect(combined).not.toContain('10_000_000_000_000');
    expect(combined).not.toContain('astronomy-engine');
    expect(combined).not.toContain('new Date(');
  });

  it('uses explicit non-writing overlay material behavior without logarithmic depth state', () => {
    const handle = createSolarSystemBodiesGroup();
    const points = handle.group.children[0] as THREE.Points;
    const material = points.material as THREE.ShaderMaterial;
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(material.transparent).toBe(true);
    expect(points.renderOrder).toBe(24);
    expect(points.frustumCulled).toBe(false);
    handle.dispose();
  });
});
