import type { GeographicCalibrationState } from '../state/geographicCalibrationState';
import type { ObserverState } from '../state/observerState';
import type { SimulationClockState } from '../state/simulationClock';
import type { ScientificConfiguration } from '../state/scientificConfiguration';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import { validateSimulationClockState } from '../state/simulationClock';

export interface ScientificSnapshotKeyInput {
  readonly observer: ObserverState;
  readonly clock: SimulationClockState;
  readonly calibration: GeographicCalibrationState;
  readonly configuration: ScientificConfiguration;
  readonly providers: ScientificProviderRegistry;
}

/** Exact UTC instants are cached only when time is frozen or paused. */
export function createScientificSnapshotKey(input: ScientificSnapshotKeyInput): string {
  const clock = validateSimulationClockState(input.clock);
  return JSON.stringify({
    observerRevision: input.observer.revision,
    observer: input.observer.kind === 'ready' ? input.observer.observer : undefined,
    clockVersion: clock.version,
    timeRevision: clock.revision,
    instantUtc: clock.instant.utcIso,
    instantSource: clock.instant.source,
    clockMode: clock.mode,
    timeRate: clock.timeRate,
    paused: clock.paused,
    calibrationRevision: input.calibration.revision,
    calibrationReadiness: input.calibration.kind,
    acceptedCalibrationRevision: input.calibration.kind === 'ready'
      ? input.calibration.acceptedCalibrationRevision ?? null
      : null,
    calibration: input.calibration.kind === 'ready'
      ? { yawRadians: input.calibration.yawRadians, originIdentity: input.calibration.originIdentity }
      : input.calibration.kind,
    configurationRevision: input.configuration.revision,
    precisionTier: input.configuration.precisionTier,
    correctionProfile: input.configuration.bodyCorrectionProfile,
    refractionPolicy: input.configuration.refractionPolicy,
    meanPoleModel: input.configuration.meanPoleModel,
    enabledProviders: input.configuration.enabledProviders,
    astronomyProvider: input.providers.astronomy.provider,
    astronomyProviderVersion: input.providers.astronomy.version,
    meanPoleProvider: input.providers.meanPole.provider,
    meanPoleProviderVersion: input.providers.meanPole.version,
  });
}

export function isCacheableTime(clock: SimulationClockState): boolean {
  const validated = validateSimulationClockState(clock);
  return validated.mode === 'frozen' || validated.paused;
}
