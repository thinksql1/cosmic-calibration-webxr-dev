import {
  ASTRONOMY_ENGINE_PROVIDER,
  ASTRONOMY_ENGINE_VERSION,
  getApparentTopocentricBody,
  getObserverRelativePosition,
  toTerrestrialTime,
} from '../astronomy/astronomyEngineAdapter';
import {
  P03_MEAN_POLE_PROVIDER,
  P03_MEAN_POLE_PROVIDER_VERSION,
  P03MeanPoleProvider,
} from '../astronomy/meanPoleProvider';

export interface ScientificProviderRegistry {
  readonly astronomy: {
    readonly provider: typeof ASTRONOMY_ENGINE_PROVIDER;
    readonly version: typeof ASTRONOMY_ENGINE_VERSION;
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
      provider: ASTRONOMY_ENGINE_PROVIDER,
      version: ASTRONOMY_ENGINE_VERSION,
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
