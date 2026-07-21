import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  EARTH_AXIS_LINEAR_SCENE_FAR_METERS,
} from '../../src/presentation/earthAxisPresentationModel';
import { createEarthAxisGroup } from '../../src/scene/createEarthAxisGroup';

const sources = import.meta.glob(
  [
    '../../src/main.ts',
    '../../src/scene/createEarthAxisGroup.ts',
    '../../src/scene/earthAxisCameraRelativeFrame.ts',
    '../../src/scene/earthAxisProjectedSegments.ts',
  ],
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
) as Record<string, string>;

const mainSource = sources['../../src/main.ts'];
const rendererSource = sources['../../src/scene/createEarthAxisGroup.ts'];
const frameSource = sources['../../src/scene/earthAxisCameraRelativeFrame.ts'];
const segmentSource = sources['../../src/scene/earthAxisProjectedSegments.ts'];

describe('WebXR-safe geocentric depth and GPU boundary', () => {
  it('keeps the shared renderer on ordinary linear depth with a tight local far plane', () => {
    expect(EARTH_AXIS_LINEAR_SCENE_FAR_METERS).toBe(100);
    expect(mainSource).not.toContain('logarithmicDepthBuffer');
    expect(mainSource).toContain('EARTH_AXIS_LINEAR_SCENE_FAR_METERS');
  });

  it('uses two independently projected homogeneous half-lines without raw finite proxies', () => {
    expect(rendererSource).toContain('uniform vec2 uStartNdc');
    expect(rendererSource).toContain('uniform vec2 uBoundaryNdc');
    expect(rendererSource).toContain('mix(uStartNdc, uBoundaryNdc, position.x)');
    expect(segmentSource).toContain('directionView.z,');
    expect(segmentSource).toContain('0,');
    expect(segmentSource).toContain('frame.coreView.z,');
    expect(segmentSource).toContain('1,');
    expect(segmentSource).toContain('NON_INDEXED_GL_TRIANGLES_OPEN_QUAD');
    for (const cyclicPrimitive of [
      'LineLoop', 'TriangleFan', 'TriangleStrip', 'RingGeometry', 'circle', 'angular',
      'atan(', 'sin(', 'cos(',
    ]) {
      expect(segmentSource).not.toContain(cyclicPrimitive);
    }
    expect(frameSource).toContain('frame.spindleCore.w');
    expect(frameSource).toContain('frame.northDirectionView.z');
    expect(frameSource).toContain(').applyMatrix4(projectionMatrix)');
    expect(rendererSource).not.toContain('camera.cameras[0]');
    expect(rendererSource).not.toContain('diagnosticFiniteProxyPosition');
    expect(rendererSource).not.toContain('CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS');
    expect(rendererSource).not.toContain('10_000_000_000_000');
    expect(frameSource).not.toContain('10_000_000_000_000');
  });

  it('declares every celestial material as a non-testing, non-writing overlay', () => {
    const handle = createEarthAxisGroup(() => new THREE.Texture());
    handle.group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material as THREE.Material;
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);
      expect(material.transparent).toBe(true);
    });
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
