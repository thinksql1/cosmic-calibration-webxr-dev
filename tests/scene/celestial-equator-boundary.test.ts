import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCelestialEquatorGroup } from '../../src/scene/createCelestialEquatorGroup';
import { CELESTIAL_EQUATOR_SAMPLE_COUNT } from '../../src/presentation/celestialEquatorPresentationModel';

const sources = import.meta.glob(
  [
    '../../src/presentation/celestialEquatorPresentationModel.ts',
    '../../src/scene/celestialEquatorCameraRelativeFrame.ts',
    '../../src/scene/createCelestialEquatorGroup.ts',
  ],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

describe('celestial-equator rendering boundaries', () => {
  it('keeps finite-core incidence in bounded homogeneous coordinates', () => {
    const combined = Object.values(sources).join('\n');
    expect(combined).toContain('projectionMatrix * modelViewMatrix');
    expect(combined).toContain('vec4(position, uRingProjectiveW)');
    expect(combined).toContain('coreViewVector.clone().multiplyScalar(inverseRadius)');
    expect(combined).toContain('NO_RAW_LARGE_WORLD_VERTEX_COORDINATES');
    expect(combined).not.toContain('10_000_000_000_000');
    expect(combined).not.toContain('diagnosticFiniteProxyPosition');
    expect(combined).not.toContain('computeP03BiasPrecessionMatrix');
    expect(combined).not.toContain('vec4(position, 0.0)');
    expect(combined).not.toContain('uCoreViewScaled');
  });

  it('uses the established non-writing overlay contract and bounded local geometry', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    const line = handle.group.children[0] as THREE.LineLoop;
    const material = line.material as THREE.ShaderMaterial;
    const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(material.transparent).toBe(true);
    expect(line.renderOrder).toBe(21);
    expect(line.frustumCulled).toBe(false);
    expect(Math.max(...Array.from(positions.array, Math.abs))).toBeLessThanOrEqual(1);
    handle.dispose();
  });
});
