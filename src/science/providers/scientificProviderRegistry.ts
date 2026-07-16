import {
  ASTRONOMY_ENGINE_PROVIDER,
  ASTRONOMY_ENGINE_VERSION,
  getObserverRelativePosition,
  toTerrestrialTime,
} from '../astronomy/astronomyEngineAdapter';
import { P03MeanPoleProvider } from '../astronomy/meanPoleProvider';

export interface ScientificProviderRegistry {
  readonly astronomy: {
    readonly provider: typeof ASTRONOMY_ENGINE_PROVIDER;
    readonly version: typeof ASTRONOMY_ENGINE_VERSION;
    readonly validationStatus: 'validated-2A0';
    readonly getObserverRelativePosition: typeof getObserverRelativePosition;
  };
  readonly meanPole: {
    readonly provider: 'P03 Mean Pole';
    readonly version: '1.0.0';
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
    }),
    meanPole: Object.freeze({
      provider: 'P03 Mean Pole' as const,
      version: '1.0.0' as const,
      validationStatus: 'validated-2A0' as const,
      getMeanPole: meanPole.getMeanPole.bind(meanPole),
    }),
  });
}
