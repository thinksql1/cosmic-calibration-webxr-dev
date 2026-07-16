import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../../src/science/providers/scientificProviderRegistry';
import { GeographicCalibrationStateAdapter } from '../../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../../src/science/state/observerState';
import { SimulationClock } from '../../../src/science/state/simulationClock';
import { ScientificConfigurationStore } from '../../../src/science/state/scientificConfiguration';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../../src/science/snapshot/scientificSnapshotBuilder';
import { ScientificSnapshotService } from '../../../src/science/snapshot/scientificSnapshotService';
import type { ScientificSnapshot } from '../../../src/science/snapshot/scientificSnapshot';
import {
  P03_MEAN_POLE_PROVIDER,
  P03_MEAN_POLE_PROVIDER_VERSION,
} from '../../../src/science/astronomy/meanPoleProvider';

function input(): ScientificSnapshotInput {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 38.8977, longitudeDegEast: -77.0365, elevationMeters: 17, source: 'fixture' });
  const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test'));
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: -0.4, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  return { observer: observer.current, clock: clock.current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 7 };
}

describe('scientific snapshot builder', () => {
  it('builds a frozen, provenance-rich P03 axis snapshot with a right-handed equator basis', () => {
    const result = buildScientificSnapshot(input());
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    const { snapshot } = result;
    const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
    const cross = {
      x: snapshot.equatorBasis.first.y * snapshot.equatorBasis.second.z - snapshot.equatorBasis.first.z * snapshot.equatorBasis.second.y,
      y: snapshot.equatorBasis.first.z * snapshot.equatorBasis.second.x - snapshot.equatorBasis.first.x * snapshot.equatorBasis.second.z,
      z: snapshot.equatorBasis.first.x * snapshot.equatorBasis.second.y - snapshot.equatorBasis.first.y * snapshot.equatorBasis.second.x,
    };
    expect(snapshot.earthAxis.south).toMatchObject({ x: -snapshot.earthAxis.north.x, y: -snapshot.earthAxis.north.y, z: -snapshot.earthAxis.north.z });
    expect(dot(snapshot.equatorBasis.first, snapshot.earthAxis.north)).toBeCloseTo(0, 12);
    expect(dot(snapshot.equatorBasis.second, snapshot.earthAxis.north)).toBeCloseTo(0, 12);
    expect(dot(cross, snapshot.earthAxis.north)).toBeCloseTo(1, 12);
    expect(snapshot.frameContract.calibratedYawApplication).toBe('presentation-parent-only');
    expect(snapshot.providers).toEqual({ astronomyEngineVersion: '2.1.19', meanPoleProviderVersion: '1.0.0' });
    expect(snapshot.warnings).toHaveLength(6);
    expect(snapshot.warnings).toContainEqual(expect.objectContaining({
      code: 'HEIGHT_DATUM_REFERENCE_DIFFERENCE',
    }));
    expect(snapshot.earthAxis.provenance).toMatchObject({
      provider: P03_MEAN_POLE_PROVIDER,
      providerVersion: P03_MEAN_POLE_PROVIDER_VERSION,
    });
    expect(snapshot.providers.meanPoleProviderVersion).toBe(P03_MEAN_POLE_PROVIDER_VERSION);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.earthAxis)).toBe(true);
  });

  it.each([
    ['observer', (value: ScientificSnapshotInput) => ({ ...value, observer: { kind: 'not-ready' as const, revision: 4 } })],
    ['calibration', (value: ScientificSnapshotInput) => ({ ...value, calibration: { kind: 'not-ready' as const, revision: 4, reason: 'invalidated' as const } })],
    ['configuration', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, precisionTier: 'TIER_2' as never } })],
    ['correction profile', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, bodyCorrectionProfile: 'UNSUPPORTED' as never } })],
    ['refraction policy', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, refractionPolicy: 'normal' as never } })],
    ['non-canonical provider order', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, enabledProviders: ['P03 Mean Pole', 'Astronomy Engine'] as never } })],
  ])('returns structured not-ready errors for missing or unsupported %s', (_name, mutate) => {
    const result = buildScientificSnapshot(mutate(input()));
    expect(result.kind).toBe('not-ready');
    if (result.kind === 'not-ready') expect(result.errors.length).toBeGreaterThan(0);
  });

  it('maps P03 domain errors instead of leaking an untyped provider exception', () => {
    const value = input();
    const oldClock = new SimulationClock(createSimulationInstant('1800-01-01T00:00:00Z', 'frozen-test'));
    const result = buildScientificSnapshot({ ...value, clock: oldClock.current });
    expect(result).toMatchObject({ kind: 'not-ready', errors: [{ code: 'MODEL_DOMAIN' }] });
  });

  it('is deterministic for equal explicit inputs and keeps body diagnostics out of the snapshot', () => {
    const first = buildScientificSnapshot(input());
    const second = buildScientificSnapshot(input());
    expect(first).toEqual(second);
    if (first.kind === 'ready') expect(first.snapshot).not.toHaveProperty('sun');
  });

  it('offers one explicit state-to-snapshot orchestration entry point', () => {
    const value = input();
    const service = new ScientificSnapshotService(value.providers);
    const first = service.capture(value);
    const second = service.capture(value);
    expect(first.kind).toBe('ready');
    expect(second).toEqual(first);
    expect(service.cacheDiagnostics).toMatchObject({ hits: 1, misses: 1 });
  });

  it('deeply isolates nested provider values, warnings, and basis vectors', () => {
    const result = buildScientificSnapshot(input());
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    const { snapshot } = result;
    expect(() => { (snapshot.earthAxis.provenance as { provider: string }).provider = 'mutated'; }).toThrow();
    expect(() => { (snapshot.warnings as ScientificSnapshot['warnings'] as unknown as { code: string }[])[0]!.code = 'mutated'; }).toThrow();
    expect(() => { (snapshot.equatorBasis.first as { x: number }).x = 42; }).toThrow();
    expect(snapshot.earthAxis.provenance.provider).toBe(P03_MEAN_POLE_PROVIDER);
  });
});
