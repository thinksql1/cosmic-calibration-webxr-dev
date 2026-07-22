import { describe, expect, it } from 'vitest';
import {
  createFiniteCoreParallaxModel,
  FINITE_CORE_PARALLAX_DISTANCE_PRESETS,
  FINITE_CORE_PARALLAX_NORMAL_DISTANCE_METERS,
  FINITE_CORE_PARALLAX_PROXY_RADIUS_METERS,
  parseFiniteCoreParallaxLaunch,
  selectEarthCorePresentation,
} from '../../src/presentation/finiteCoreParallaxExperiment';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createObserverOffsetGeocentricPresentation } from '../../src/presentation/observerOffsetGeocentricPresentation';
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

describe('finite core parallax presentation model', () => {
  it('is query gated and accepts only the three bounded deterministic presets', () => {
    expect(parseFiniteCoreParallaxLaunch('')).toMatchObject({ enabled: false, explicitlyRequested: false, mode: 'baseline', distanceMeters: 2.5 });
    expect(parseFiniteCoreParallaxLaunch('?coreStudy=finite-parallax')).toMatchObject({ enabled: true, distancePreset: 'medium', distanceMeters: 2.5 });
    expect(parseFiniteCoreParallaxLaunch('?coreStudy=finite-parallax&coreDistance=near')).toMatchObject({ distancePreset: 'near', distanceMeters: 1.5 });
    expect(parseFiniteCoreParallaxLaunch('?coreStudy=finite-parallax&coreDistance=4')).toMatchObject({ distancePreset: 'far', distanceMeters: 4 });
    expect(parseFiniteCoreParallaxLaunch('?coreStudy=other&coreDistance=-1')).toMatchObject({ enabled: false, distancePreset: 'medium' });
  });

  it('makes the Quest-selected far proxy normal while retaining explicit study comparison choices', () => {
    expect(FINITE_CORE_PARALLAX_NORMAL_DISTANCE_METERS).toBe(FINITE_CORE_PARALLAX_DISTANCE_PRESETS.far);
    expect(selectEarthCorePresentation(true, 'finite-parallax')).toBe('finite-proxy');
    expect(selectEarthCorePresentation(true, 'baseline')).toBe('scientific-marker');
    expect(selectEarthCorePresentation(false, 'finite-parallax')).toBe('none');
    expect(selectEarthCorePresentation(false, 'baseline')).toBe('none');
  });

  it('derives its normalized direction exclusively from the scientific observer-to-core vector', () => {
    const source = contract();
    const result = createFiniteCoreParallaxModel(source, FINITE_CORE_PARALLAX_DISTANCE_PRESETS.medium);
    if (result.kind === 'not-ready') throw new Error(result.detail);
    const scientific = source.scientificObserverToCore;
    const magnitude = Math.hypot(scientific.x, scientific.y, scientific.z);
    expect(result.scientificObserverToCoreDirection).toMatchObject({
      x: scientific.x / magnitude,
      y: scientific.y / magnitude,
      z: scientific.z / magnitude,
    });
    expect(Math.hypot(
      result.scientificObserverToCoreDirection.x,
      result.scientificObserverToCoreDirection.y,
      result.scientificObserverToCoreDirection.z,
    )).toBeCloseTo(1, 12);
    expect(result.scientificEarthCore).toBe(source.scientificEarthCore);
  });

  it('places a finite local proxy at exactly the selected distance without changing scientific anchors', () => {
    const source = contract();
    const coreBefore = { ...source.scientificEarthCore };
    for (const distance of Object.values(FINITE_CORE_PARALLAX_DISTANCE_PRESETS)) {
      const result = createFiniteCoreParallaxModel(source, distance);
      if (result.kind === 'not-ready') throw new Error(result.detail);
      const offset = {
        x: result.proxyPositionMeters.x - source.scientificObserver.x,
        y: result.proxyPositionMeters.y - source.scientificObserver.y,
        z: result.proxyPositionMeters.z - source.scientificObserver.z,
      };
      expect(Math.hypot(offset.x, offset.y, offset.z)).toBeCloseTo(distance, 12);
      expect([result.proxyPositionMeters.x, result.proxyPositionMeters.y, result.proxyPositionMeters.z].every(Number.isFinite)).toBe(true);
      expect(result.proxyRadiusMeters).toBe(FINITE_CORE_PARALLAX_PROXY_RADIUS_METERS);
    }
    expect(source.scientificEarthCore).toEqual(coreBefore);
  });

  it('returns a structured local failure for an unsupported distance', () => {
    expect(createFiniteCoreParallaxModel(contract(), 0)).toMatchObject({
      kind: 'not-ready',
      reason: 'INVALID_DISTANCE',
    });
  });
});
