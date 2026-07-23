import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { SolarDailyPathPresentationModel } from '../../src/presentation/solarDailyPathPresentationModel';
import { createSolarDailyPathGroup } from '../../src/scene/createSolarDailyPathGroup';

function model(visible = true): SolarDailyPathPresentationModel {
  const samples = Object.freeze([
    Object.freeze({ directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 1, y: 0, z: 0 }), aboveHorizon: true, opacity: 0.6, sourceSample: true }),
    Object.freeze({ directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: 1, z: 0 }), aboveHorizon: true, opacity: 0.6, sourceSample: true }),
    Object.freeze({ directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: -1, y: 0, z: 0 }), aboveHorizon: false, opacity: 0.18, sourceSample: true }),
  ]);
  return Object.freeze({
    kind: 'ready' as const,
    presentationKind: 'OBSERVER_RELATIVE_PROJECTIVE_APPARENT_SUN_CIVIL_DAY_PATH' as const,
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_SUN_PATH_AND_CIVIL_NOTCHES' as const,
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY' as const,
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES' as const,
    timeZone: 'America/Detroit', selectedCivilDate: '2025-06-21', samples,
    hourNotches: Object.freeze([Object.freeze({ ...samples[0], localLabel: '2025-06-21 00:00', utcOffsetLabel: 'GMT-04:00', fold: 0 as const, pathSampleIndex: 0, emphasized: true, pixelDiameter: 10 })]),
    currentHourNotchIndex: 0,
    pathVisible: visible,
    hourNotchesVisible: visible,
    samplingDiagnostics: Object.freeze({
      sourceSampleCount: 3,
      renderedSampleCount: 3,
      timestampsMonotonic: true,
      duplicateSourceSamplesSuppressed: 0,
      maximumSourceAngularSpacingDeg: 90,
      maximumRenderedAngularSpacingDeg: 90,
      maximumAngularStepDeg: 1,
    }),
    snapshotIdentity: Object.freeze({ pathCacheKey: 'path', bodyCacheKey: 'body', observerRevision: 1, timeRevision: 1, calibrationRevision: 1, configurationRevision: 1 }),
    provenance: Object.freeze({ provider: 'Astronomy Engine', providerVersion: '2.1.19', correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' as const, samplingPolicy: 'fixture', civilTimeResolver: 'fixture' }),
  });
}

describe('solar daily-path Three.js group', () => {
  it('owns bounded homogeneous path/notch geometry with explicit non-writing depth behavior', () => {
    const handle = createSolarDailyPathGroup();
    handle.update(model());
    const path = handle.group.children[0] as THREE.Line;
    const notches = handle.group.children[1] as THREE.Points;
    expect(handle.group.visible).toBe(true);
    expect(path.geometry.drawRange.count).toBe(3);
    expect(notches.geometry.drawRange.count).toBe(1);
    expect((path.material as THREE.ShaderMaterial).depthTest).toBe(false);
    expect((path.material as THREE.ShaderMaterial).depthWrite).toBe(false);
    expect((notches.material as THREE.ShaderMaterial).depthWrite).toBe(false);
    expect(Math.max(...Array.from((path.geometry.getAttribute('position') as THREE.BufferAttribute).array, Math.abs))).toBeLessThanOrEqual(1);
    expect((path.material as THREE.ShaderMaterial).vertexShader).toContain('vec4(position, 0.0)');
    handle.dispose();
  });

  it('is eye-translation invariant, clear is reusable, and disposal is idempotent', () => {
    const handle = createSolarDailyPathGroup();
    handle.update(model());
    const path = handle.group.children[0] as THREE.Line;
    const disposed = vi.fn();
    path.geometry.addEventListener('dispose', disposed);
    const left = new THREE.PerspectiveCamera(); left.position.set(-0.032, 1.7, 0);
    const right = new THREE.PerspectiveCamera(); right.position.set(0.032, 1.7, 0);
    expect(handle.createFrameForCamera(left)?.pathDirectionsView).toEqual(handle.createFrameForCamera(right)?.pathDirectionsView);
    handle.clear();
    expect(disposed).not.toHaveBeenCalled();
    handle.update(model(false));
    handle.dispose(); handle.dispose();
    expect(disposed).toHaveBeenCalledTimes(1);
  });

  it('locally suppresses ordinary not-ready science without throwing or mutating shared geometry', () => {
    const report = vi.fn();
    const handle = createSolarDailyPathGroup(report);
    const path = handle.group.children[0] as THREE.Line;
    const before = Array.from((path.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    handle.clear('scientific state not ready');
    expect(() => path.onBeforeRender(
      {} as THREE.WebGLRenderer,
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
      path.geometry,
      path.material as THREE.Material,
      new THREE.Group(),
    )).not.toThrow();
    expect(handle.getDiagnostics()).toMatchObject({
      readiness: 'not-ready',
      suppressionReason: 'scientific state not ready',
      callbackExceptionCount: 0,
      perEyeMutation: false,
    });
    expect(Array.from((path.geometry.getAttribute('position') as THREE.BufferAttribute).array)).toEqual(before);
    handle.enforceVisibilityControls();
    expect(handle.group.visible).toBe(false);
    handle.dispose();
  });
});
