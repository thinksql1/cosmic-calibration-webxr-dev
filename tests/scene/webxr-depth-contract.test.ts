import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  EARTH_AXIS_LINEAR_SCENE_FAR_METERS,
} from '../../src/presentation/earthAxisPresentationModel';
import { createEarthAxisGroup } from '../../src/scene/createEarthAxisGroup';

const sources = import.meta.glob(
  ['../../src/main.ts', '../../src/scene/createEarthAxisGroup.ts'],
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
) as Record<string, string>;

const mainSource = sources['../../src/main.ts'];
const rendererSource = sources['../../src/scene/createEarthAxisGroup.ts'];

describe('WebXR-safe geocentric depth and GPU boundary', () => {
  it('keeps the shared renderer on ordinary linear depth with a tight local far plane', () => {
    expect(EARTH_AXIS_LINEAR_SCENE_FAR_METERS).toBe(100);
    expect(mainSource).not.toContain('logarithmicDepthBuffer');
    expect(mainSource).toContain('EARTH_AXIS_LINEAR_SCENE_FAR_METERS');
  });

  it('uses a homogeneous direction and camera-relative core without raw finite proxies', () => {
    expect(rendererSource).toContain('vec4(uCoreView, 1.0)');
    expect(rendererSource).toContain('vec4(uDirectionView, 0.0)');
    expect(rendererSource).not.toContain('diagnosticFiniteProxyPosition');
    expect(rendererSource).not.toContain('CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS');
    expect(rendererSource).not.toContain('10_000_000_000_000');
  });

  it('declares every celestial material as a non-testing, non-writing overlay', () => {
    const handle = createEarthAxisGroup(() => new THREE.Texture());
    for (const child of handle.group.children) {
      const material = (child as THREE.Mesh | THREE.Line).material as THREE.Material;
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);
      expect(material.transparent).toBe(true);
    }
    handle.dispose();
  });

  it('keeps ordinary scene materials outside the celestial overlay policy', () => {
    const ordinary = new THREE.MeshBasicMaterial();
    expect(ordinary.depthTest).toBe(true);
    expect(ordinary.depthWrite).toBe(true);
    ordinary.dispose();
  });

  it('owns an explicit page-teardown disposal path', () => {
    expect(mainSource).toContain("window.addEventListener('pagehide'");
    expect(mainSource).toContain('celestialAxis.dispose()');
    expect(mainSource).toContain('localHorizon.dispose()');
  });
});
