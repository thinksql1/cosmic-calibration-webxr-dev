import type { GeographicCalibrationState } from '../state/geographicCalibrationState';
import type { ObserverState } from '../state/observerState';
import type { SimulationClockState } from '../state/simulationClock';
import type { ScientificConfiguration } from '../state/scientificConfiguration';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';

export interface ScientificSnapshotKeyInput {
  readonly observer: ObserverState;
  readonly clock: SimulationClockState;
  readonly calibration: GeographicCalibrationState;
  readonly configuration: ScientificConfiguration;
  readonly providers: ScientificProviderRegistry;
}

/** Exact UTC instants are cached only when time is frozen or paused. */
export function createScientificSnapshotKey(input: ScientificSnapshotKeyInput): string {
  return JSON.stringify({
    observerRevision: input.observer.revision,
    observer: input.observer.kind === 'ready' ? input.observer.observer : undefined,
    timeRevision: input.clock.revision,
    instantUtc: input.clock.instant.utcIso,
    clockMode: input.clock.mode,
    paused: input.clock.paused,
    calibrationRevision: input.calibration.revision,
    calibration: input.calibration.kind === 'ready' ? { yawRadians: input.calibration.yawRadians, originIdentity: input.calibration.originIdentity } : input.calibration.kind,
    configurationRevision: input.configuration.revision,
    precisionTier: input.configuration.precisionTier,
    correctionProfile: input.configuration.bodyCorrectionProfile,
    refractionPolicy: input.configuration.refractionPolicy,
    meanPoleModel: input.configuration.meanPoleModel,
    astronomyProviderVersion: input.providers.astronomy.version,
    meanPoleProviderVersion: input.providers.meanPole.version,
  });
}

export function isCacheableTime(clock: SimulationClockState): boolean {
  return clock.mode === 'frozen' || clock.paused;
}
