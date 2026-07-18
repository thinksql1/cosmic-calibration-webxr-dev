import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEyePresentationLayerFilter } from '../../src/scene/eyePresentationLayerFilter';

function fixture() {
  const root = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial();
  const line = new THREE.Line(geometry, material);
  root.add(line);
  return { root, line, geometry, material };
}

function viewCamera(viewIndex: number): THREE.Camera {
  const camera = new THREE.PerspectiveCamera();
  camera.layers.disableAll();
  camera.layers.enable(viewIndex + 1);
  return camera;
}

describe('Three.js XR eye-presentation layer filter', () => {
  it('uses visible layer zero for every mode outside XR', () => {
    const { root, line } = fixture();
    const filter = createEyePresentationLayerFilter(root, 'left');
    expect(line.layers.mask).toBe(1);
    expect(filter.diagnostics).toMatchObject({
      mode: 'left',
      context: 'desktop-mono-fallback',
      renderedEyes: ['none'],
    });
  });

  it('uses XRView.eye rather than view order for a left-only layer', () => {
    const { root, line } = fixture();
    const filter = createEyePresentationLayerFilter(root, 'left');
    filter.applyViews([{ eye: 'right' }, { eye: 'left' }]);
    expect(line.layers.test(viewCamera(0).layers)).toBe(false);
    expect(line.layers.test(viewCamera(1).layers)).toBe(true);
    expect(filter.diagnostics).toMatchObject({
      viewEyes: ['right', 'left'],
      renderedEyes: ['left'],
      suppressedEyes: ['right'],
    });
  });

  it('selects the physical right eye when XR view order is reversed', () => {
    const { root, line } = fixture();
    const filter = createEyePresentationLayerFilter(root, 'right');
    filter.applyViews([{ eye: 'right' }, { eye: 'left' }]);
    expect(line.layers.test(viewCamera(0).layers)).toBe(true);
    expect(line.layers.test(viewCamera(1).layers)).toBe(false);
  });

  it('renders both eyes and handles a mono XR view explicitly', () => {
    const { root, line } = fixture();
    const filter = createEyePresentationLayerFilter(root);
    filter.applyViews([{ eye: 'left' }, { eye: 'right' }]);
    expect(line.layers.test(viewCamera(0).layers)).toBe(true);
    expect(line.layers.test(viewCamera(1).layers)).toBe(true);
    filter.setMode('right');
    filter.applyViews([{ eye: 'none' }]);
    expect(line.layers.test(viewCamera(0).layers)).toBe(true);
    expect(filter.diagnostics.renderedEyes).toEqual(['none']);
  });

  it('suppresses XR rendering when no actual view identity is available', () => {
    const { root, line } = fixture();
    const filter = createEyePresentationLayerFilter(root, 'left');
    filter.applyViews(undefined, true);
    expect(line.layers.mask).toBe(0);
    expect(filter.diagnostics).toMatchObject({
      context: 'xr-no-view',
      renderedEyes: [],
    });
  });

  it('keeps independent layer modes isolated', () => {
    const axis = fixture();
    const equator = fixture();
    const horizon = fixture();
    const axisFilter = createEyePresentationLayerFilter(axis.root, 'right');
    const equatorFilter = createEyePresentationLayerFilter(equator.root, 'left');
    const horizonFilter = createEyePresentationLayerFilter(horizon.root, 'both');
    const views = [{ eye: 'left' as const }, { eye: 'right' as const }];
    axisFilter.applyViews(views);
    equatorFilter.applyViews(views);
    horizonFilter.applyViews(views);
    expect(axis.line.layers.mask).toBe(4);
    expect(equator.line.layers.mask).toBe(2);
    expect(horizon.line.layers.mask).toBe(6);
  });

  it('changes visibility masks without allocating or replacing geometry', () => {
    const { root, line, geometry, material } = fixture();
    const filter = createEyePresentationLayerFilter(root);
    filter.applyViews([{ eye: 'left' }, { eye: 'right' }]);
    filter.setMode('left');
    filter.setMode('right');
    filter.setMode('both');
    expect(line.geometry).toBe(geometry);
    expect(line.material).toBe(material);
    expect(root.children).toEqual([line]);
  });

  it('rejects unknown runtime eye identities instead of inferring from camera position', () => {
    const { root } = fixture();
    const filter = createEyePresentationLayerFilter(root);
    expect(() => filter.applyViews([{ eye: 'center' as never }])).toThrow('left, right, or none');
  });

  it('disposes idempotently without owning scene resources', () => {
    const { root, geometry, material } = fixture();
    const filter = createEyePresentationLayerFilter(root);
    filter.dispose();
    filter.dispose();
    expect(geometry.type).toBe('BufferGeometry');
    expect(material.type).toBe('LineBasicMaterial');
    expect(() => filter.setMode('left')).toThrow('disposed');
  });
});
