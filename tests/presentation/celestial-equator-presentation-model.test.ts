import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import {
  CELESTIAL_EQUATOR_SAMPLE_COUNT,
  createCelestialEquatorPresentationModel,
} from '../../src/presentation/celestialEquatorPresentationModel';

function snapshotInput(latitudeDeg: number): ScientificSnapshotInput {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: 0, elevationMeters: 0, source: 'equator fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: {
      yawRadians: 0,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: 1,
      simulated: true,
    },
  });
  return {
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  };
}

function readySnapshot(latitudeDeg: number) {
  const result = buildScientificSnapshot(snapshotInput(latitudeDeg));
  if (result.kind !== 'ready') throw new Error('Fixture snapshot must be ready.');
  return result.snapshot;
}

function dot(
  left: { east: number; north: number; up: number },
  right: { east: number; north: number; up: number },
): number {
  return left.east * right.east + left.north * right.north + left.up * right.up;
}

describe('geocentric projective celestial-equator presentation model', () => {
  it('consumes the immutable snapshot-owned P03 basis and makes a deterministic closed great circle', () => {
    const snapshot = readySnapshot(43);
    const model = createCelestialEquatorPresentationModel(snapshot, { showEquator: true });
    expect(model.sampleCount).toBe(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    expect(model.samples).toHaveLength(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    expect(model.visible).toBe(true);
    expect(model.earthCore).not.toEqual({ x: 0, y: 0, z: 0 });
    expect(model.normalEnu).toEqual(snapshot.observerHorizontalEarthAxis.north.direction);
    expect(model.provenance).toMatchObject({
      frame: 'HORIZONTAL_ENU',
      sourceBasisFrame: 'GCRS',
      model: 'IAU_P03_PRECESSION_ONLY',
      samplingPhase: 'LOCAL_CANONICAL_UNLABELED',
    });
    for (const sample of model.samples) {
      expect(Math.hypot(sample.directionEnu.east, sample.directionEnu.north, sample.directionEnu.up)).toBeCloseTo(1, 12);
      expect(dot(sample.directionEnu, model.normalEnu)).toBeCloseTo(0, 12);
    }
    const opposite = model.samples[CELESTIAL_EQUATOR_SAMPLE_COUNT / 2];
    expect(opposite.directionEnu.east).toBeCloseTo(-model.samples[0].directionEnu.east, 12);
    expect(opposite.directionEnu.north).toBeCloseTo(-model.samples[0].directionEnu.north, 12);
    expect(opposite.directionEnu.up).toBeCloseTo(-model.samples[0].directionEnu.up, 12);
    const wrapAngle = (2 * Math.PI) / CELESTIAL_EQUATOR_SAMPLE_COUNT;
    expect(dot(model.samples[0].directionEnu, model.samples.at(-1)!.directionEnu)).toBeCloseTo(Math.cos(wrapAngle), 12);
  });

  it('has the expected observer relationships without substituting a local horizon hoop', () => {
    const equator = createCelestialEquatorPresentationModel(readySnapshot(0));
    const northPole = createCelestialEquatorPresentationModel(readySnapshot(90));
    const southPole = createCelestialEquatorPresentationModel(readySnapshot(-90));
    const midNorth = createCelestialEquatorPresentationModel(readySnapshot(43));
    const midSouth = createCelestialEquatorPresentationModel(readySnapshot(-43));

    // At latitude 0 the plane contains local up/down; at geographic poles it is the horizon plane.
    expect(Math.abs(equator.normalEnu.up)).toBeCloseTo(0, 12);
    expect(Math.abs(equator.samples.map((sample) => sample.directionEnu.up).reduce((a, b) => Math.max(a, Math.abs(b)), 0))).toBeCloseTo(1, 12);
    expect(Math.abs(northPole.normalEnu.up)).toBeCloseTo(1, 12);
    expect(Math.abs(southPole.normalEnu.up)).toBeCloseTo(1, 12);
    expect(northPole.samples.every((sample) => Math.abs(sample.directionEnu.up) < 1e-12)).toBe(true);
    expect(southPole.samples.every((sample) => Math.abs(sample.directionEnu.up) < 1e-12)).toBe(true);
    expect(Math.abs(midNorth.normalEnu.up)).toBeCloseTo(Math.sin((43 * Math.PI) / 180), 12);
    expect(Math.abs(midSouth.normalEnu.up)).toBeCloseTo(Math.sin((43 * Math.PI) / 180), 12);
  });

  it('rejects a snapshot whose local basis no longer shares the P03/provider contract', () => {
    const snapshot = readySnapshot(43);
    const invalid = Object.freeze({
      ...snapshot,
      observerHorizontalEquator: Object.freeze({
        ...snapshot.observerHorizontalEquator,
        provenance: Object.freeze({ ...snapshot.observerHorizontalEquator.provenance, providerVersion: 'mismatch' }),
      }),
    });
    expect(() => createCelestialEquatorPresentationModel(invalid)).toThrow('validated WGS84 core and P03 equatorial plane');
  });
});
