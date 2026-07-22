import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createObserverOffsetGeocentricPresentation } from '../../src/presentation/observerOffsetGeocentricPresentation';
import {
  defaultObserverOffsetGeoStudySettings,
  parseObserverOffsetGeoStudyMode,
  selectedObserverOffsetGeoStudyComponents,
} from '../../src/presentation/observerOffsetGeocentricStudy';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createObserverOffsetGeocentricStudyGroup } from '../../src/scene/createObserverOffsetGeocentricStudyGroup';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function contract() {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 42.7325, longitudeDegEast: -84.5555, elevationMeters: 250, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { acceptedRevision: 1, yawRadians: 0.4, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const source = buildScientificSnapshot({ observer: observer.current, clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 1 });
  if (source.kind !== 'ready') throw new Error('Ready fixture required.');
  const value = createObserverOffsetGeocentricPresentation(createGeocentricCelestialStructurePresentation(source.snapshot));
  if (value.kind === 'not-ready') throw new Error(value.detail);
  return value;
}

function geometryPoints(object: THREE.Object3D): THREE.Vector3[] {
  const geometry = (object as THREE.Mesh).geometry as THREE.BufferGeometry;
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  return Array.from({ length: position.count }, (_, index) => new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index)));
}

describe('observer-offset geocentric study modes', () => {
  it('parses deterministic query modes and safely falls back to the baseline', () => {
    expect(parseObserverOffsetGeoStudyMode('')).toBe('baseline');
    expect(parseObserverOffsetGeoStudyMode('?geoStudy=combined')).toBe('combined');
    expect(parseObserverOffsetGeoStudyMode('?geoStudy=not-real')).toBe('baseline');
  });

  it('keeps baseline invisible and gives each mode only its intended component family', () => {
    const source = contract();
    const study = createObserverOffsetGeocentricStudyGroup();
    study.update(source, defaultObserverOffsetGeoStudySettings('baseline'));
    expect(study.group.visible).toBe(false);
    for (const mode of ['core-radius', 'surface-point', 'wireframe-earth', 'tangent-plane', 'combined'] as const) {
      const settings = defaultObserverOffsetGeoStudySettings(mode);
      study.update(source, settings);
      expect(study.group.userData.enabledComponents).toEqual(selectedObserverOffsetGeoStudyComponents(settings));
      expect(study.group.visible).toBe(true);
    }
    study.dispose();
  });

  it('uses only bounded homogeneous geometry with exact radius endpoints and a common core', () => {
    const source = contract();
    const study = createObserverOffsetGeocentricStudyGroup();
    study.update(source, defaultObserverOffsetGeoStudySettings('combined'));
    const radius = study.group.getObjectByName('observer-to-earth-core-radius') as THREE.Mesh;
    const radiusPoints = geometryPoints(radius);
    const w = (radius.material as THREE.ShaderMaterial).uniforms.uProjectiveW.value as number;
    const reconstructed = radiusPoints.map((point) => point.multiplyScalar(1 / w));
    expect(reconstructed.some((point) => point.distanceTo(new THREE.Vector3(source.scientificEarthCore.x, source.scientificEarthCore.y, source.scientificEarthCore.z)) < 1)).toBe(true);
    expect(reconstructed.some((point) => point.distanceTo(new THREE.Vector3(source.referenceEarthSphereSurfacePoint.x, source.referenceEarthSphereSurfacePoint.y, source.referenceEarthSphereSurfacePoint.z)) < 1)).toBe(true);
    study.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
      const values = geometryPoints(object);
      expect(values.flatMap((point) => point.toArray()).every(Number.isFinite), object.name).toBe(true);
      expect(Math.max(...values.flatMap((point) => point.toArray().map(Math.abs))), object.name).toBeLessThanOrEqual(2);
    });
    study.dispose();
  });

  it('keeps every wireframe vertex on the reference sphere and tangent geometry in the geodetic plane', () => {
    const source = contract();
    const study = createObserverOffsetGeocentricStudyGroup();
    study.update(source, defaultObserverOffsetGeoStudySettings('combined'));
    const core = new THREE.Vector3(source.scientificEarthCore.x, source.scientificEarthCore.y, source.scientificEarthCore.z);
    const wire = study.group.getObjectByName('reference-earth-terrestrial-equator') as THREE.LineLoop;
    const w = (wire.material as THREE.ShaderMaterial).uniforms.uProjectiveW.value as number;
    geometryPoints(wire).forEach((point) => expect(point.multiplyScalar(1 / w).distanceTo(core)).toBeCloseTo(source.referenceEarthSphereRadiusMeters, 0));
    const patch = study.group.getObjectByName('observer-local-tangent-plane') as THREE.Mesh;
    const patchW = (patch.material as THREE.ShaderMaterial).uniforms.uProjectiveW.value as number;
    const center = new THREE.Vector3(source.referenceEarthSphereSurfacePoint.x, source.referenceEarthSphereSurfacePoint.y, source.referenceEarthSphereSurfacePoint.z);
    const up = new THREE.Vector3(source.localUp.x, source.localUp.y, source.localUp.z);
    geometryPoints(patch).forEach((point) => expect(point.multiplyScalar(1 / patchW).sub(center).dot(up)).toBeCloseTo(0, 1));
    study.dispose();
  });

  it('does not duplicate objects or mutate static geometry across repeated toggles', () => {
    const source = contract();
    const study = createObserverOffsetGeocentricStudyGroup();
    study.update(source, defaultObserverOffsetGeoStudySettings('combined'));
    const count = study.group.children.length;
    const before = geometryPoints(study.group.getObjectByName('reference-earth-terrestrial-equator')!).map((point) => point.toArray());
    for (let index = 0; index < 4; index += 1) {
      study.update(source, defaultObserverOffsetGeoStudySettings(index % 2 ? 'baseline' : 'combined'));
    }
    study.update(source, defaultObserverOffsetGeoStudySettings('combined'));
    expect(study.group.children.length).toBe(count);
    expect(geometryPoints(study.group.getObjectByName('reference-earth-terrestrial-equator')!).map((point) => point.toArray())).toEqual(before);
    expect(study.getDiagnostics().duplicateGeometryCreation).toBe(false);
    study.dispose();
  });
});
