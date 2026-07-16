import { AstronomyContractError } from '../astronomy/errors';
import type { CorrectionProfileId } from '../astronomy/types';

export interface ScientificConfiguration {
  readonly version: 1;
  readonly precisionTier: 'TIER_1';
  readonly bodyCorrectionProfile: Extract<CorrectionProfileId, 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'>;
  readonly meanPoleModel: 'IAU_P03_PRECESSION_ONLY';
  readonly refractionPolicy: 'disabled' | 'normal';
  readonly enabledProviders: readonly ['Astronomy Engine', 'P03 Mean Pole'];
  readonly revision: number;
}

export const DEFAULT_SCIENTIFIC_CONFIGURATION: ScientificConfiguration = Object.freeze({
  version: 1,
  precisionTier: 'TIER_1',
  bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
  meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
  refractionPolicy: 'disabled',
  enabledProviders: Object.freeze(['Astronomy Engine', 'P03 Mean Pole']) as unknown as readonly ['Astronomy Engine', 'P03 Mean Pole'],
  revision: 0,
});

export class ScientificConfigurationStore {
  private state = DEFAULT_SCIENTIFIC_CONFIGURATION;

  get current(): ScientificConfiguration {
    return this.state;
  }

  replace(next: Omit<ScientificConfiguration, 'version' | 'revision'>): ScientificConfiguration {
    if (next.precisionTier !== 'TIER_1' || next.meanPoleModel !== 'IAU_P03_PRECESSION_ONLY') {
      throw new AstronomyContractError('UNSUPPORTED_CORRECTION_PROFILE', 'Only the validated Tier 1 P03 configuration is available.');
    }
    const expectedRefraction = next.bodyCorrectionProfile === 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION' ? 'normal' : 'disabled';
    if (next.refractionPolicy !== expectedRefraction) {
      throw new AstronomyContractError('UNSUPPORTED_CORRECTION_PROFILE', 'Refraction policy must match the selected body correction profile.');
    }
    const candidate = { ...next, version: 1 as const, revision: this.state.revision };
    if (JSON.stringify(candidate) === JSON.stringify(this.state)) return this.state;
    this.state = Object.freeze({ ...candidate, revision: this.state.revision + 1 });
    return this.state;
  }

  serialize(): ScientificConfiguration {
    return this.state;
  }

  restore(serialized: ScientificConfiguration): ScientificConfiguration {
    if (serialized.version !== 1) throw new AstronomyContractError('UNSUPPORTED_CORRECTION_PROFILE', 'Unsupported scientific-configuration serialization version.');
    return this.replace(serialized);
  }
}
