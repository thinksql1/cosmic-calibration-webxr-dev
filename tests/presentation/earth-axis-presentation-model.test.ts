import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import {
  CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS,
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

function relativeToCore(
  endpoint: { x: number; y: number; z: number },
  core: { x: number; y: number; z: number },
) {
  return {
    x: endpoint.x - core.x,
    y: endpoint.y - core.y,
    z: endpoint.z - core.z,
  };
}

describe('geocentric Earth-axis presentation model', () => {
  it('maps metric ENU once and leaves geographic yaw to the parent', () => {
    const result = ready(0);
    const model = createEarthAxisPresentationModel(result.snapshot);
    expect(model.observerSurfaceOrigin).toEqual({ frame: 'APPLICATION_BASIS', units: 'meters', x: 0, y: 0, z: -0 });
    expect(model.earthCore.x).toBeCloseTo(0, 8);
    expect(model.earthCore.y).toBeCloseTo(-6_378_387, 4);
    expect(model.north.directionApplication).toMatchObject({ x: 0, y: 0, z: -1 });
    expect(model).not.toHaveProperty('yawRadians');
    expect(result.snapshot.frameContract.calibratedYawApplication).toBe('presentation-parent-only');
  });

  it('places one world-scale line through the modeled core with projective antipodal poles', () => {
    const model = createEarthAxisPresentationModel(ready(42).snapshot);
    const north = relativeToCore(model.north.renderPosition, model.earthCore);
    const south = relativeToCore(model.south.renderPosition, model.earthCore);
    expect(model.presentationKind).toBe('GEOCENTRIC_WORLD_SCALE_EARTH_CORE_AXIS');
    expect(model.poleTopology).toBe('ANTIPODAL_PROJECTIVE_DIRECTIONS_AT_INFINITY');
    expect(model.north.pointKind).toBe('PROJECTIVE_DIRECTION_AT_INFINITY');
    expect(model.south.pointKind).toBe('PROJECTIVE_DIRECTION_AT_INFINITY');
    expect(model.earthCore).not.toEqual(model.observerSurfaceOrigin);
    expect(south.x).toBeCloseTo(-north.x, 1);
    expect(south.y).toBeCloseTo(-north.y, 1);
    expect(south.z).toBeCloseTo(-north.z, 1);
    expect(Math.hypot(north.x, north.y, north.z)).toBeCloseTo(
      CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS,
      -1,
    );
    expect(model.poleRenderConvergenceUpperBoundArcseconds).toBeLessThan(0.14);
  });

  it('supports full-axis and above-horizon emphasis without moving the centerline', () => {
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
    expect(emphasized.south.renderPosition).toEqual(full.south.renderPosition);
    expect(emphasized.earthCore).toEqual(full.earthCore);
  });

  it('lets the user hide below-horizon rendering while retaining scientific pole data', () => {
    const model = createEarthAxisPresentationModel(ready(42).snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      showBelowHorizonSegment: false,
    });
    expect(model.north.segmentVisible).toBe(true);
    expect(model.south.segmentVisible).toBe(false);
    expect(model.south.markerVisible).toBe(true);
    expect(model.south.directionEnu).toBeDefined();
  });

  it('supports independent axis, core, marker, and label visibility', () => {
    const model = createEarthAxisPresentationModel(ready().snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      showAxis: false,
      showEarthCore: false,
      showMarkers: false,
      showLabels: true,
    });
    expect(model.north.segmentVisible).toBe(false);
    expect(model.south.segmentVisible).toBe(false);
    expect(model.earthCoreVisible).toBe(false);
    expect(model.north.markerVisible).toBe(false);
    expect(model.south.markerVisible).toBe(false);
    expect(model.north.labelVisible).toBe(true);
    expect(model.south.labelVisible).toBe(true);
  });

  it('records observer, time, and same-yaw accepted-calibration identities', () => {
    const first = createEarthAxisPresentationModel(ready(42, 1).snapshot);
    const second = createEarthAxisPresentationModel(ready(42, 2).snapshot);
    expect(first.snapshotIdentity.acceptedCalibrationRevision).toBe(1);
    expect(second.snapshotIdentity.acceptedCalibrationRevision).toBe(2);
    expect(second.snapshotIdentity.cacheKey).not.toBe(first.snapshotIdentity.cacheKey);
  });

  it('changes core placement and pole orientation with latitude', () => {
    const equator = createEarthAxisPresentationModel(ready(0).snapshot);
    const north = createEarthAxisPresentationModel(ready(70).snapshot);
    expect(equator.north.directionApplication).toMatchObject({ x: 0, y: 0, z: -1 });
    expect(north.north.directionApplication.y).toBeGreaterThan(0.93);
    expect(north.north.directionApplication.z).toBeLessThan(0);
    expect(north.earthCore).not.toEqual(equator.earthCore);
    expect(north.snapshotIdentity.cacheKey).not.toBe(equator.snapshotIdentity.cacheKey);
  });

  it('rebuilds time provenance without inventing local Earth-fixed axis motion', () => {
    const present = createEarthAxisPresentationModel(ready(42, 1, '2025-06-21T16:00:00Z').snapshot);
    const future = createEarthAxisPresentationModel(ready(42, 1, '2050-01-01T00:00:00Z').snapshot);
    expect(future.snapshotIdentity.cacheKey).not.toBe(present.snapshotIdentity.cacheKey);
    expect(future.earthCore).toEqual(present.earthCore);
    expect(future.north.renderPosition).toEqual(present.north.renderPosition);
    expect(future.south.renderPosition).toEqual(present.south.renderPosition);
  });

  it('rejects unsupported display modes without exposing a scale control', () => {
    expect(() => createEarthAxisPresentationModel(ready().snapshot, {
      ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
      belowHorizonMode: 'decorative-ring' as never,
    })).toThrow('below-horizon');
    expect(DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS).not.toHaveProperty('presentationRadiusMeters');
  });
});

describe('Earth-axis status view model', () => {
  it('discloses the world-scale core, projective poles, and Tier 1 limits', () => {
    const view = createEarthAxisStatusViewModel(ready());
    expect(view.kind).toBe('ready');
    expect(view.status).toBe('Geocentric mean Earth axis ready.');
    expect(view.detail).toContain('world scale');
    expect(view.limitations).toContain('directions at infinity');
    expect(view.limitations).toContain('not Polaris');
    expect(view.diagnostics).toEqual(expect.arrayContaining([
      expect.stringContaining('Earth core distance'),
      expect.stringContaining('Finite render convergence bound'),
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
