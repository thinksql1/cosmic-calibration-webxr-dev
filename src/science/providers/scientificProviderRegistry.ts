import {
  getApparentTopocentricBody,
  getObserverRelativePosition,
  toTerrestrialTime,
} from '../astronomy/astronomyEngineAdapter';
import {
  P03_MEAN_POLE_PROVIDER,
  P03_MEAN_POLE_PROVIDER_VERSION,
  P03MeanPoleProvider,
} from '../astronomy/meanPoleProvider';
import {
  ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY,
  type AstronomyProviderIdentity,
} from './astronomyProviderIdentity';

export interface ScientificProviderRegistry {
  readonly astronomy: {
    readonly identity: AstronomyProviderIdentity;
    readonly validationStatus: 'validated-2A0';
    readonly getObserverRelativePosition: typeof getObserverRelativePosition;
    readonly getApparentTopocentricBody: typeof getApparentTopocentricBody;
  };
  readonly meanPole: {
    readonly provider: typeof P03_MEAN_POLE_PROVIDER;
    readonly version: typeof P03_MEAN_POLE_PROVIDER_VERSION;
    readonly validationStatus: 'validated-2A0';
    readonly getMeanPole: P03MeanPoleProvider['getMeanPole'];
  };
}

export function createScientificProviderRegistry(): ScientificProviderRegistry {
  const meanPole = new P03MeanPoleProvider({ toTerrestrialTime });
  return Object.freeze({
    astronomy: Object.freeze({
      identity: ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY,
      validationStatus: 'validated-2A0',
      getObserverRelativePosition,
      getApparentTopocentricBody,
    }),
    meanPole: Object.freeze({
      provider: P03_MEAN_POLE_PROVIDER,
      version: P03_MEAN_POLE_PROVIDER_VERSION,
      validationStatus: 'validated-2A0' as const,
      getMeanPole: meanPole.getMeanPole.bind(meanPole),
    }),
  });
}
