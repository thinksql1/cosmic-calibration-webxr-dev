import type { SolarSystemBodyState } from '../science/bodies/solarSystemBodyState';
import type { ScientificSnapshot } from '../science/snapshot/scientificSnapshot';
import type { MoonDailyPath } from '../science/temporal/moonDailyPath';
import { mapEnuToApplicationBasis } from './mapEnuToApplicationBasis';
import {
  sampleOrderedDirectionalPath,
  type DirectionalPathRenderSample,
} from './directionalPathSampling';

export interface MoonDailyPathPresentationModel {
  readonly kind: 'READY_MOON_DAILY_PATH_PRESENTATION';
  readonly samples: readonly DirectionalPathRenderSample[];
  readonly pathVisible: boolean;
  readonly timeZone: string;
  readonly selectedCivilDate: string;
  readonly belowHorizonSampleCount: number;
  readonly samplingDiagnostics: {
    readonly providerSampleCount: number;
    readonly renderedSampleCount: number;
    readonly timestampsMonotonic: boolean;
    readonly duplicateSourceSamplesSuppressed: number;
    readonly maximumTimeStepMinutes: number;
    readonly maximumSourceAngularSpacingDeg: number;
    readonly maximumRenderedAngularSpacingDeg: number;
    readonly maximumAngularStepDeg: number;
  };
  readonly provenance: {
    readonly provider: string;
    readonly providerVersion: string;
    readonly correctionProfile: string;
    readonly sourceFrame: 'EQD_TRUE';
    readonly outputFrame: 'HORIZONTAL_ENU';
    readonly topocentricParallax: 'included';
    readonly samplingPolicy: string;
  };
  readonly cacheKey: string;
}

export function createMoonDailyPathPresentationModel(
  snapshot: ScientificSnapshot,
  bodyState: SolarSystemBodyState,
  path: MoonDailyPath,
  pathVisible: boolean,
): MoonDailyPathPresentationModel {
  const moon = bodyState.bodies.find((body) => body.body === 'Moon');
  if (
    snapshot.kind !== 'ready' ||
    bodyState.kind !== 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE' ||
    !moon ||
    path.kind !== 'READY_MOON_DAILY_APPARENT_PATH' ||
    path.samples.length < 2 ||
    path.snapshotIdentity.observerRevision !== snapshot.revisions.observer ||
    path.snapshotIdentity.configurationRevision !== snapshot.revisions.configuration ||
    path.provenance.identity.provider !== snapshot.providers.astronomy.provider ||
    path.correctionProfile !== snapshot.configuration.bodyCorrectionProfile
  ) {
    throw new Error('Moon daily-path presentation requires matching active scientific state.');
  }
  const sampled = sampleOrderedDirectionalPath(
    path.samples.map((sample) => ({
      directionApplication: mapEnuToApplicationBasis(sample.direction),
      opacity: sample.aboveHorizon ? 0.5 : 0.16,
      aboveHorizon: sample.aboveHorizon,
      timestampMilliseconds: sample.instant.unixMilliseconds,
    })),
    1,
    1024,
  );
  let maximumTimeStepMinutes = 0;
  for (let index = 1; index < path.samples.length; index += 1) {
    maximumTimeStepMinutes = Math.max(
      maximumTimeStepMinutes,
      (path.samples[index]!.instant.unixMilliseconds -
        path.samples[index - 1]!.instant.unixMilliseconds) / 60_000,
    );
  }
  return Object.freeze({
    kind: 'READY_MOON_DAILY_PATH_PRESENTATION',
    samples: sampled.samples,
    pathVisible,
    timeZone: path.schedule.timeZone.ianaName,
    selectedCivilDate: `${String(path.schedule.date.year).padStart(4, '0')}-${String(path.schedule.date.month).padStart(2, '0')}-${String(path.schedule.date.day).padStart(2, '0')}`,
    belowHorizonSampleCount: path.samples.filter((sample) => !sample.aboveHorizon).length,
    samplingDiagnostics: Object.freeze({
      providerSampleCount: path.samples.length,
      renderedSampleCount: sampled.renderedSampleCount,
      timestampsMonotonic: sampled.timestampsMonotonic,
      duplicateSourceSamplesSuppressed: sampled.duplicateSourceSamplesSuppressed,
      maximumTimeStepMinutes,
      maximumSourceAngularSpacingDeg: sampled.maximumSourceAngularSpacingDeg,
      maximumRenderedAngularSpacingDeg: sampled.maximumRenderedAngularSpacingDeg,
      maximumAngularStepDeg: sampled.maximumAngularStepDeg,
    }),
    provenance: Object.freeze({
      provider: path.provenance.identity.provider,
      providerVersion: path.provenance.identity.providerVersion,
      correctionProfile: path.correctionProfile,
      sourceFrame: path.provenance.sourceFrame,
      outputFrame: path.provenance.outputFrame,
      topocentricParallax: path.provenance.topocentricParallax,
      samplingPolicy: path.provenance.samplingPolicy.id,
    }),
    cacheKey: path.cacheKey,
  });
}
