import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCelestialEquatorPresentationModel } from '../../src/presentation/celestialEquatorPresentationModel';
import { createEarthAxisPresentationModel } from '../../src/presentation/earthAxisPresentationModel';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { applyCalibrationToGeographicGroup } from '../../src/scene/createGeographicReference';
import { createCelestialEquatorGroup } from '../../src/scene/createCelestialEquatorGroup';
import { createEarthAxisGroup } from '../../src/scene/createEarthAxisGroup';
import { createGeocentricCelestialStructureGroup } from '../../src/scene/createGeocentricCelestialStructureGroup';

const viewport = new THREE.Vector4(0, 0, 1440, 900);
const rendererStub = {
  getCurrentViewport(target: THREE.Vector4) {
    return target.copy(viewport);
  },
} as unknown as THREE.WebGLRenderer;

function fixture() {
  const observer = new ObserverStateStore();
  observer.set({
    latitudeDeg: 42.7325,
    longitudeDegEast: -84.5555,
    elevationMeters: 250,
    source: 'Michigan production-render fixture',
  });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: {
      acceptedRevision: 1,
      yawRadians: 0.37,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: 1,
      simulated: true,
    },
  });
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  });
  if (result.kind !== 'ready') throw new Error('Production-render fixture must be ready.');
  const structure = createGeocentricCelestialStructurePresentation(result.snapshot);
  return {
    structure,
    equator: createCelestialEquatorPresentationModel(
      result.snapshot,
      { showEquator: true },
      structure,
    ),
    axis: createEarthAxisPresentationModel(result.snapshot, undefined, structure),
  };
}

function cameraLookingAt(
  target: THREE.Vector3,
  position: THREE.Vector3,
): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(54, viewport.z / viewport.w, 0.01, 100);
  camera.position.copy(position);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateWorldMatrix(true, false);
  return camera;
}

function invoke(object: THREE.Object3D, camera: THREE.Camera): void {
  const renderable = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  object.onBeforeRender(
    rendererStub,
    new THREE.Scene(),
    camera,
    renderable.geometry,
    renderable.material,
    new THREE.Group(),
  );
  if ('modelViewMatrix' in object) {
    (object as THREE.Mesh).modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
  }
}

function ringClipPoints(
  positions: THREE.BufferAttribute,
  projectiveW: number,
  modelView: THREE.Matrix4,
  projection: THREE.Matrix4,
): THREE.Vector3[] {
  return Array.from({ length: positions.count }, (_, index) => {
    const clip = new THREE.Vector4(
      positions.getX(index),
      positions.getY(index),
      positions.getZ(index),
      Math.fround(projectiveW),
    ).applyMatrix4(modelView).applyMatrix4(projection);
    return new THREE.Vector3(clip.x, clip.y, clip.w);
  });
}

function projectedPoint(view: THREE.Vector3, projection: THREE.Matrix4): THREE.Vector3 {
  const clip = new THREE.Vector4(view.x, view.y, view.z, 1).applyMatrix4(projection);
  return new THREE.Vector3(clip.x, clip.y, clip.w);
}

function fittedChordCenter(points: readonly THREE.Vector3[]): THREE.Vector3 {
  const half = points.length / 2;
  const lines = Array.from({ length: half }, (_, index) => new THREE.Vector3()
    .crossVectors(points[index], points[index + half]))
    .map((line) => line.multiplyScalar(1 / Math.hypot(line.x, line.y)));
  const normal = lines.reduce((sum, line) => ({
    xx: sum.xx + line.x * line.x,
    xy: sum.xy + line.x * line.y,
    yy: sum.yy + line.y * line.y,
    xc: sum.xc - line.x * line.z,
    yc: sum.yc - line.y * line.z,
  }), { xx: 0, xy: 0, yy: 0, xc: 0, yc: 0 });
  const determinant = normal.xx * normal.yy - normal.xy * normal.xy;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
    throw new Error('Uploaded ring chords did not produce a projective centre.');
  }
  return new THREE.Vector3(
    (normal.yy * normal.xc - normal.xy * normal.yc) / determinant,
    (normal.xx * normal.yc - normal.xy * normal.xc) / determinant,
    1,
  );
}

function ndc(point: THREE.Vector3): THREE.Vector2 {
  return new THREE.Vector2(point.x / point.z, point.y / point.z);
}

function uploadedState(cameraPosition: THREE.Vector3) {
  const source = fixture();
  const axis = createEarthAxisGroup(() => new THREE.Texture());
  const equator = createCelestialEquatorGroup(source.equator.sampleCount);
  const geographic = new THREE.Group();
  geographic.add(createGeocentricCelestialStructureGroup(axis.group, equator.group));
  applyCalibrationToGeographicGroup(geographic, {
    kind: 'calibrated',
    calibration: {
      acceptedRevision: 1,
      yawRadians: 0.37,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: 1,
      simulated: true,
    },
  });
  axis.update(source.axis);
  equator.update(source.equator);
  geographic.updateWorldMatrix(true, true);
  const coreWorld = new THREE.Vector3(
    source.structure.earthCore.x,
    source.structure.earthCore.y,
    source.structure.earthCore.z,
  ).applyMatrix4(geographic.matrixWorld);
  const camera = cameraLookingAt(
    coreWorld.clone().add(new THREE.Vector3(500_000, 250_000, -400_000)),
    cameraPosition,
  );
  const ring = equator.group.children[0] as THREE.LineLoop;
  const core = axis.group.getObjectByName('modeled-earth-core-marker') as THREE.Mesh;
  invoke(ring, camera);
  invoke(core, camera);
  return { source, axis, equator, geographic, camera, ring, core };
}

describe('unified geocentric production rendering boundary', () => {
  it('uploads bounded Float32 ring points and a matching homogeneous uniform through the real callback', () => {
    const state = uploadedState(new THREE.Vector3(0.4, 1.65, 0.2));
    const positions = state.ring.geometry.getAttribute('position') as THREE.BufferAttribute;
    const material = state.ring.material as THREE.ShaderMaterial;
    const coreUniform = (state.core.material as THREE.ShaderMaterial).uniforms.uViewVector.value as THREE.Vector3;
    expect(positions.array).toBeInstanceOf(Float32Array);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    expect(Math.max(...Array.from(positions.array, Math.abs))).toBeLessThan(2);
    expect(material.uniforms.uRingProjectiveW.value).toBeCloseTo(
      1 / state.source.equator.displayRadiusMeters,
      13,
    );
    expect(coreUniform.toArray().every(Number.isFinite)).toBe(true);
    expect(material.uniforms.uDrawEnabled.value).toBe(1);
    expect(material.vertexShader).toContain('projectionMatrix * modelViewMatrix');
    const frame = state.equator.createFrameForCamera(state.camera);
    const firstSample = state.source.equator.samples[0].directionApplication;
    const inverseRadius = 1 / state.source.equator.displayRadiusMeters;
    expect(positions.getX(0)).toBe(Math.fround(state.source.equator.center.x * inverseRadius + firstSample.x));
    expect(positions.getY(0)).toBe(Math.fround(state.source.equator.center.y * inverseRadius + firstSample.y));
    expect(positions.getZ(0)).toBe(Math.fround(state.source.equator.center.z * inverseRadius + firstSample.z));
    expect(material.uniforms.uRingProjectiveW.value).toBe(Math.fround(frame.ringProjectiveW));
    const rotation = new THREE.Matrix3().setFromMatrix4(state.ring.modelViewMatrix);
    const scaledCore = new THREE.Vector3(
      state.source.equator.center.x * inverseRadius,
      state.source.equator.center.y * inverseRadius,
      state.source.equator.center.z * inverseRadius,
    );
    const first = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0)).sub(scaledCore)
      .applyMatrix3(rotation).normalize();
    const quarter = new THREE.Vector3(positions.getX(24), positions.getY(24), positions.getZ(24)).sub(scaledCore)
      .applyMatrix3(rotation).normalize();
    const normal = new THREE.Vector3(frame.normalView.x, frame.normalView.y, frame.normalView.z);
    expect(Math.abs(first.dot(quarter))).toBeLessThan(1e-6);
    expect(Math.abs(first.dot(normal))).toBeLessThan(1e-6);
    expect(Math.abs(quarter.dot(normal))).toBeLessThan(1e-6);
    expect(Math.abs(first.cross(quarter).dot(normal))).toBeGreaterThan(0.999999);
    const staticAttributeVersion = positions.version;
    const shiftedCamera = cameraLookingAt(
      state.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(6_000_000),
      new THREE.Vector3(0.8, 1.65, 0.2),
    );
    invoke(state.ring, shiftedCamera);
    expect(positions.version).toBe(staticAttributeVersion);
    expect(state.equator.group.userData.maximumUploadedComponentMagnitude).toBeLessThan(2);
    expect(state.equator.group.userData.maximumPlaneResidual).toBeLessThan(1e-9);
    state.axis.dispose();
    state.equator.dispose();
  });

  it('keeps the uploaded projective ring centred on the uploaded Earth core in Michigan, lateral, and vertical views', () => {
    const states = [
      uploadedState(new THREE.Vector3(0.4, 1.65, 0.2)),
      uploadedState(new THREE.Vector3(2.4, 1.65, 0.2)),
      uploadedState(new THREE.Vector3(0.4, 3.65, 0.2)),
    ];
    const centres = states.map((state) => {
      const positions = state.ring.geometry.getAttribute('position') as THREE.BufferAttribute;
      const material = state.ring.material as THREE.ShaderMaterial;
      const clips = ringClipPoints(
        positions,
        material.uniforms.uRingProjectiveW.value as number,
        state.ring.modelViewMatrix,
        state.camera.projectionMatrix,
      );
      const fitted = fittedChordCenter(clips);
      const coreView = (state.core.material as THREE.ShaderMaterial).uniforms.uViewVector.value as THREE.Vector3;
      const projectedCore = projectedPoint(coreView, state.camera.projectionMatrix);
      const fittedNdc = ndc(fitted);
      const coreNdc = ndc(projectedCore);
      expect(fittedNdc.distanceTo(coreNdc)).toBeLessThan(2e-5);
      expect(clips.every((point) => point.toArray().every(Number.isFinite))).toBe(true);
      const anyProjectedRingPointIsVisible = clips.some((point) => {
        if (point.z <= 0) return false;
        const pointNdc = ndc(point);
        return Math.abs(pointNdc.x) <= 1 && Math.abs(pointNdc.y) <= 1;
      });
      expect(anyProjectedRingPointIsVisible).toBe(true);
      return { state, fittedNdc };
    });
    expect(centres[0].fittedNdc.x).not.toBeCloseTo(centres[1].fittedNdc.x, 8);
    expect(centres[0].fittedNdc.y).not.toBeCloseTo(centres[2].fittedNdc.y, 8);
    centres.forEach(({ state }) => {
      state.axis.dispose();
      state.equator.dispose();
    });
  });

  it('routes distinct left and right eye uploads without mutating the shared model or retaining stale values', () => {
    const state = uploadedState(new THREE.Vector3(-0.032, 1.65, 0.2));
    const modelBefore = JSON.stringify(state.source.equator);
    const left = cameraLookingAt(
      new THREE.Vector3(state.source.structure.earthCore.x, state.source.structure.earthCore.y, state.source.structure.earthCore.z)
        .applyMatrix4(state.geographic.matrixWorld)
        .add(new THREE.Vector3(500_000, 250_000, -400_000)),
      new THREE.Vector3(-0.032, 1.65, 0.2),
    );
    const right = cameraLookingAt(
      new THREE.Vector3(state.source.structure.earthCore.x, state.source.structure.earthCore.y, state.source.structure.earthCore.z)
        .applyMatrix4(state.geographic.matrixWorld)
        .add(new THREE.Vector3(500_000, 250_000, -400_000)),
      new THREE.Vector3(0.032, 1.65, 0.2),
    );
    state.equator.setEyePresentationMode('left');
    state.equator.applyEyePresentationViews([{ eye: 'left' }, { eye: 'right' }], true);
    expect(state.equator.getEyePresentationDiagnostics()).toMatchObject({
      mode: 'left', renderedEyes: ['left'], layerMask: 2,
    });
    left.layers.set(1);
    right.layers.set(2);
    expect(state.ring.layers.test(left.layers)).toBe(true);
    expect(state.ring.layers.test(right.layers)).toBe(false);
    if (state.ring.layers.test(left.layers)) invoke(state.ring, left);
    const leftUpload = Array.from((state.ring.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    const leftModelView = state.ring.modelViewMatrix.clone();
    state.equator.setEyePresentationMode('right');
    state.equator.applyEyePresentationViews([{ eye: 'left' }, { eye: 'right' }], true);
    expect(state.equator.getEyePresentationDiagnostics()).toMatchObject({
      mode: 'right', renderedEyes: ['right'], layerMask: 4,
    });
    expect(state.ring.layers.test(left.layers)).toBe(false);
    expect(state.ring.layers.test(right.layers)).toBe(true);
    if (state.ring.layers.test(right.layers)) invoke(state.ring, right);
    const rightUpload = Array.from((state.ring.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    const rightModelView = state.ring.modelViewMatrix.clone();
    expect(rightUpload).toEqual(leftUpload);
    expect(rightModelView.equals(leftModelView)).toBe(false);
    expect(rightModelView.elements.every(Number.isFinite)).toBe(true);
    state.equator.setEyePresentationMode('both');
    state.equator.applyEyePresentationViews(undefined, false);
    expect(state.equator.getEyePresentationDiagnostics()).toMatchObject({
      mode: 'both', context: 'desktop-mono-fallback', renderedEyes: ['none'],
    });
    invoke(state.ring, state.camera);
    const monoModelView = state.ring.modelViewMatrix.clone();
    expect(monoModelView.equals(rightModelView)).toBe(false);
    expect(JSON.stringify(state.source.equator)).toBe(modelBefore);
    state.axis.dispose();
    state.equator.dispose();
  });

  it('prevents disposed equator callbacks from mutating uploaded resources and rejects later updates', () => {
    const state = uploadedState(new THREE.Vector3(0.4, 1.65, 0.2));
    const positions = state.ring.geometry.getAttribute('position') as THREE.BufferAttribute;
    const material = state.ring.material as THREE.ShaderMaterial;
    const before = Array.from(positions.array);
    const beforeW = material.uniforms.uRingProjectiveW.value;
    const beforeDrawEnabled = material.uniforms.uDrawEnabled.value;
    const beforeVersion = positions.version;
    state.equator.dispose();
    invoke(state.ring, state.camera);
    expect(Array.from(positions.array)).toEqual(before);
    expect(material.uniforms.uRingProjectiveW.value).toBe(beforeW);
    expect(material.uniforms.uDrawEnabled.value).toBe(beforeDrawEnabled);
    expect(positions.version).toBe(beforeVersion);
    expect(() => state.equator.update(state.source.equator)).toThrow('disposed');
    state.axis.dispose();
  });
});
