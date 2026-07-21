import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  BoundedDiagnosticBuffer,
  applyBasicDiagnosticMaterials,
  diagnosticEye,
  finiteNumbers,
  parseXrDiagnosticLaunch,
  PerEyeDiagnosticDrawNames,
  PerEyeDiagnosticCounters,
  shouldFlushDiagnosticPanel,
  XR_DIAGNOSTIC_PANEL_INTERVAL_MS,
  XR_DIAGNOSTIC_PRESETS,
} from '../../src/diagnostics/xrPerEyeDiagnostics';
import { createEarthAxisGroup } from '../../src/scene/createEarthAxisGroup';

describe('query-gated XR per-eye diagnostics', () => {
  it('is disabled by default and restores a valid persisted preset only in diagnostic mode', () => {
    expect(parseXrDiagnosticLaunch('')).toMatchObject({ enabled: false, preset: { id: 0 }, isolation: { id: 'all' } });
    expect(parseXrDiagnosticLaunch('?diag=1', '6', 'north-spindle')).toMatchObject({ enabled: true, preset: { id: 6 }, isolation: { id: 'north-spindle' } });
    expect(parseXrDiagnosticLaunch('?diag=1&preset=9', '2')).toMatchObject({ enabled: true, preset: { id: 9 } });
    expect(parseXrDiagnosticLaunch('?diag=1&preset=invalid')).toMatchObject({ preset: { id: 0 } });
  });

  it('reports an exact bounded set of submitted object names for each eye', () => {
    const draws = new PerEyeDiagnosticDrawNames();
    draws.beginFrame();
    draws.record('left', 'north-spindle');
    draws.record('left', 'north-spindle');
    draws.record('right', 'south-spindle');
    draws.record('right', 'earth-core');
    draws.completeFrame();
    expect(draws.names('left')).toEqual(['north-spindle']);
    expect(draws.names('right')).toEqual(['earth-core', 'south-spindle']);
    draws.beginFrame();
    draws.record('mono', 'floor-horizon-ring');
    draws.completeFrame();
    expect(draws.names('left')).toEqual([]);
    expect(draws.names('right')).toEqual([]);
    expect(draws.names('mono')).toEqual(['floor-horizon-ring']);
  });

  it('keeps a bounded chronological ring without per-frame growth', () => {
    const buffer = new BoundedDiagnosticBuffer(3);
    for (let index = 0; index < 100; index += 1) buffer.push(String(index));
    expect(buffer.values()).toEqual(['97', '98', '99']);
    expect(buffer.values()).toHaveLength(3);
    buffer.clear();
    expect(buffer.values()).toEqual([]);
  });

  it('classifies and counts left and right XR sub-camera layers independently', () => {
    const left = new THREE.PerspectiveCamera();
    const right = new THREE.PerspectiveCamera();
    left.layers.mask = 0b0011;
    right.layers.mask = 0b0101;
    expect(diagnosticEye(left)).toBe('left');
    expect(diagnosticEye(right)).toBe('right');
    const counters = new PerEyeDiagnosticCounters();
    counters.increment(diagnosticEye(left));
    counters.increment(diagnosticEye(left));
    counters.increment(diagnosticEye(right));
    expect(counters).toMatchObject({ left: 2, right: 1 });
  });

  it('detects finite and non-finite render state', () => {
    expect(finiteNumbers(new THREE.Matrix4().elements)).toBe(true);
    expect(finiteNumbers([0, 1, Number.NaN])).toBe(false);
    expect(finiteNumbers([0, Number.POSITIVE_INFINITY])).toBe(false);
  });

  it('defines all ten bounded diagnostic compositions', () => {
    expect(XR_DIAGNOSTIC_PRESETS.map((preset) => preset.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(XR_DIAGNOSTIC_PRESETS[1]).toMatchObject({ horizon: true, axis: false, equator: false, bodies: false });
    expect(XR_DIAGNOSTIC_PRESETS[2]).toMatchObject({ simpleUnifiedRoot: true, basicTarget: 'none' });
    expect(XR_DIAGNOSTIC_PRESETS[3]).toMatchObject({ legacyAxisRoot: true, axis: true, equator: false });
    expect(XR_DIAGNOSTIC_PRESETS[7].disableFrustumCulling).toBe(true);
    expect(XR_DIAGNOSTIC_PRESETS[8].disableApplicationClipping).toBe(true);
    expect(XR_DIAGNOSTIC_PRESETS[9].basicTarget).toBe('all');
  });

  it('does not bypass the per-eye projection shader for open spindle segments', () => {
    const handle = createEarthAxisGroup(() => new THREE.Texture());
    const segment = handle.group.getObjectByName(
      'mean-earth-axis-rigid-spindle-north-segment',
    ) as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    const material = segment.material;
    const callback = segment.onBeforeRender;
    applyBasicDiagnosticMaterials(handle.group, 'all');
    expect(segment.material).toBe(material);
    expect(segment.onBeforeRender).toBe(callback);
    expect(segment.userData.diagnosticBasicMaterialSkipped).toBe(
      'projective-open-segment-requires-projection-shader',
    );
    handle.dispose();
  });

  it('throttles panel rendering independently of callback frequency', () => {
    expect(shouldFlushDiagnosticPanel(true, 0, XR_DIAGNOSTIC_PANEL_INTERVAL_MS - 1)).toBe(false);
    expect(shouldFlushDiagnosticPanel(true, 0, XR_DIAGNOSTIC_PANEL_INTERVAL_MS)).toBe(true);
    expect(shouldFlushDiagnosticPanel(false, 0, XR_DIAGNOSTIC_PANEL_INTERVAL_MS * 10)).toBe(false);
  });
});
