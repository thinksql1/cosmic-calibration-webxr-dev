import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { MoonDailyPathPresentationModel } from '../../src/presentation/moonDailyPathPresentationModel';
import { createMoonDailyPathGroup } from '../../src/scene/createMoonDailyPathGroup';

const model: MoonDailyPathPresentationModel = Object.freeze({
  kind: 'READY_MOON_DAILY_PATH_PRESENTATION',
  samples: Object.freeze([
    Object.freeze({ directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 1, y: 0, z: 0 }), opacity: 0.5, aboveHorizon: true, sourceSample: true }),
    Object.freeze({ directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: 1, z: 0 }), opacity: 0.5, aboveHorizon: true, sourceSample: true }),
  ]),
  pathVisible: true,
  timeZone: 'America/Detroit',
  selectedCivilDate: '2025-06-21',
  belowHorizonSampleCount: 0,
  samplingDiagnostics: Object.freeze({
    providerSampleCount: 2,
    renderedSampleCount: 2,
    timestampsMonotonic: true,
    duplicateSourceSamplesSuppressed: 0,
    maximumTimeStepMinutes: 5,
    maximumSourceAngularSpacingDeg: 90,
    maximumRenderedAngularSpacingDeg: 90,
    maximumAngularStepDeg: 1,
  }),
  provenance: Object.freeze({
    provider: 'Astronomy Engine',
    providerVersion: '2.1.19',
    correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
    sourceFrame: 'EQD_TRUE',
    outputFrame: 'HORIZONTAL_ENU',
    topocentricParallax: 'included',
    samplingPolicy: 'fixture',
  }),
  cacheKey: 'moon-path',
});

describe('Moon daily path XR renderer', () => {
  it('uploads finite immutable directions and lets native cameras project one shared geometry', () => {
    const handle = createMoonDailyPathGroup();
    handle.update(model);
    const line = handle.group.getObjectByName('apparent-moon-civil-day-projective-path') as THREE.Line;
    expect(line.geometry.drawRange.count).toBe(2);
    expect((line.material as THREE.ShaderMaterial).vertexShader).toContain('modelViewMatrix');
    const before = Array.from((line.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    const beforeHash = handle.getDiagnostics().geometryHash;
    handle.setLunarPalette('legacy-purple');
    handle.setLunarPalette('moonlit-water');
    line.onBeforeRender({} as THREE.WebGLRenderer, new THREE.Scene(), new THREE.PerspectiveCamera(), line.geometry, line.material as THREE.Material, new THREE.Group());
    line.onBeforeRender({} as THREE.WebGLRenderer, new THREE.Scene(), new THREE.PerspectiveCamera(), line.geometry, line.material as THREE.Material, new THREE.Group());
    expect(Array.from((line.geometry.getAttribute('position') as THREE.BufferAttribute).array)).toEqual(before);
    expect(handle.getDiagnostics().perEyeMutation).toBe(false);
    expect(handle.getDiagnostics().geometryHash).toBe(beforeHash);
    expect((line.material as THREE.ShaderMaterial).uniforms.uColor.value.getHex()).toBe(0x9eaef0);
    handle.dispose();
  });

  it('suppresses not-ready state locally and disposes exactly once', () => {
    const report = vi.fn();
    const handle = createMoonDailyPathGroup(report);
    const line = handle.group.children[0] as THREE.Line;
    const disposed = vi.fn();
    line.geometry.addEventListener('dispose', disposed);
    handle.clear('science pending');
    expect(() => line.onBeforeRender({} as THREE.WebGLRenderer, new THREE.Scene(), new THREE.PerspectiveCamera(), line.geometry, line.material as THREE.Material, new THREE.Group())).not.toThrow();
    expect(handle.group.visible).toBe(false);
    expect(handle.getDiagnostics().suppressionReason).toBe('science pending');
    handle.dispose();
    handle.dispose();
    expect(disposed).toHaveBeenCalledTimes(1);
  });
});
