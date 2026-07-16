import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import {
  createEarthAxisPresentationModel,
  createEarthAxisStatusViewModel,
  DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
} from '../../src/presentation/earthAxisPresentationModel';

function ready(
  latitudeDeg = 42,
  acceptedRevision = 1,
  utcIso = '2025-06-21T16:00:00Z',
) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: -84, elevationMeters: 250, source: 'manual validation preset' });
  const clock = new SimulationClock(createSimulationInstant(utcIso, 'user-selected'));
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: {
    acceptedRevision,
    yawRadians: 0.35,
    capturedDirection: { x: 0, y: 0, z: -1 },
    timestamp: 1,
    simulated: true,
  } }, 'desktop-simulation');
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: clock.current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: acceptedRevision,
  });
  if (result.kind !== 'ready') throw new Error('Fixture must be ready.');
  return result;
}

describe('Earth-axis presentation model', () => {
  it('maps ENU once into the application basis and never accepts geographic yaw', () => {
    const result = ready(0);
    const model = createEarthAxisPresentationModel(result.snapshot);
    expect(model.north.directionApplication).toMatchObject({ x: 0, y: 0, z: -1 });
    expect(model.north.position).toEqual({ x: 0, y: 0, z: -1.8 });
    expect(model.south.position).toEqual({ x: -0, y: -0, z: 1.8 });
    expect(model).not.toHaveProperty('yawRadians');
    expect(result.snapshot.frameContract.calibratedYawApplication).toBe('presentation-parent-only');
  });

  it('keeps symbolic endpoints exact position antipodes around one origin', () => {
    const model = createEarthAxisPresentationModel(ready(42).snapshot);
    expect(model.origin).toEqual({ x: 0, y: 0, z: 0 });
    expect(model.south.position.x).toBe(-model.north.position.x);
    expect(model.south.position.y).toBe(-model.north.position.y);
    expect(model.south.position.z).toBe(-model.north.position.z);
    expect(Math.hypot(model.north.position.x, model.north.position.y, model.north.position.z)).toBeCloseTo(1.8, 14);
    expect(model.presentationKind).toBe('OBSERVER_CENTERED_DIRECTIONAL_PROXY');
  });

  it('supports full-axis and above-horizon emphasis without removing the scientific endpoint', () => {
    const snapshot = ready(42).snapshot;
    const full = createEarthAxisPresentationModel(snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      belowHorizonMode: 'full-axis',
    });
    const emphasized = createEarthAxisPresentationModel(snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      belowHorizonMode: 'above-horizon-emphasis',
    });
    expect(full.south.segmentVisible).toBe(true);
    expect(emphasized.south.segmentVisible).toBe(true);
    expect(emphasized.south.segmentOpacity).toBeLessThan(emphasized.north.segmentOpacity);
    expect(emphasized.south.position).toEqual(full.south.position);
  });

  it('lets the user explicitly hide only the below-horizon segment while retaining its pole data', () => {
    const model = createEarthAxisPresentationModel(ready(42).snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      showBelowHorizonSegment: false,
    });
    expect(model.north.segmentVisible).toBe(true);
    expect(model.south.segmentVisible).toBe(false);
    expect(model.south.markerVisible).toBe(true);
    expect(model.south.directionEnu).toBeDefined();
  });

  it('supports independent axis, marker, and label visibility', () => {
    const model = createEarthAxisPresentationModel(ready().snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      showAxis: false,
      showMarkers: false,
      showLabels: true,
    });
    expect(model.north.segmentVisible).toBe(false);
    expect(model.south.segmentVisible).toBe(false);
    expect(model.north.markerVisible).toBe(false);
    expect(model.south.markerVisible).toBe(false);
    expect(model.north.labelVisible).toBe(true);
    expect(model.south.labelVisible).toBe(true);
  });

  it('records observer, time, and same-yaw accepted-calibration identities for rebuilds', () => {
    const first = createEarthAxisPresentationModel(ready(42, 1).snapshot);
    const second = createEarthAxisPresentationModel(ready(42, 2).snapshot);
    expect(first.snapshotIdentity.acceptedCalibrationRevision).toBe(1);
    expect(second.snapshotIdentity.acceptedCalibrationRevision).toBe(2);
    expect(second.snapshotIdentity.cacheKey).not.toBe(first.snapshotIdentity.cacheKey);
  });

  it('changes position after observer latitude changes while retaining the same transform path', () => {
    const equator = createEarthAxisPresentationModel(ready(0).snapshot);
    const north = createEarthAxisPresentationModel(ready(70).snapshot);
    expect(equator.north.position).toEqual({ x: 0, y: 0, z: -1.8 });
    expect(north.north.position.y).toBeGreaterThan(1.6);
    expect(north.north.position.z).toBeLessThan(0);
    expect(north.snapshotIdentity.cacheKey).not.toBe(equator.snapshotIdentity.cacheKey);
  });

  it('rebuilds time provenance without inventing local motion for the Earth-fixed mean axis', () => {
    const present = createEarthAxisPresentationModel(
      ready(42, 1, '2025-06-21T16:00:00Z').snapshot,
    );
    const future = createEarthAxisPresentationModel(
      ready(42, 1, '2050-01-01T00:00:00Z').snapshot,
    );
    expect(future.snapshotIdentity.cacheKey).not.toBe(present.snapshotIdentity.cacheKey);
    expect(future.north.position).toEqual(present.north.position);
    expect(future.south.position).toEqual(present.south.position);
  });

  it('rejects unusable symbolic presentation radii', () => {
    expect(() => createEarthAxisPresentationModel(ready().snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      presentationRadiusMeters: 100,
    })).toThrow('presentation radius');
  });
});

describe('Earth-axis status view model', () => {
  it('provides restrained readiness, model limitations, and diagnostics', () => {
    const view = createEarthAxisStatusViewModel(ready());
    expect(view.kind).toBe('ready');
    expect(view.status).toBe('Mean Earth axis ready.');
    expect(view.limitations).toContain('P03 precession only');
    expect(view.limitations).toContain('excludes nutation');
    expect(view.diagnostics).toEqual(expect.arrayContaining([
      expect.stringContaining('NCP altitude'),
      expect.stringContaining('UTC'),
      expect.stringContaining('Accepted calibration'),
    ]));
  });

  it.each([
    ['OBSERVER_MISSING', 'observer location'],
    ['CALIBRATION_MISSING', 'north calibration'],
    ['MODEL_DOMAIN', 'validated P03 domain'],
  ] as const)('maps %s into precise not-ready guidance', (code, expected) => {
    const view = createEarthAxisStatusViewModel(Object.freeze({
      kind: 'not-ready',
      errors: Object.freeze([{ code, message: 'fixture error' }]),
      warnings: Object.freeze([]),
    }));
    expect(view.kind).toBe('not-ready');
    expect(view.status).toContain(expected);
    expect(view.detail).toBe('fixture error');
  });
});
