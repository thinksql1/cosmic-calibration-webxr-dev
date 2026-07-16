import { AstronomyContractError } from '../astronomy/errors';
import type { CorrectionProfileId } from '../astronomy/types';
import { isValidScientificRevision } from './runtimeValidation';

export const SCIENTIFIC_CONFIGURATION_VERSION = 1 as const;
export const SCIENTIFIC_PROVIDER_IDS = Object.freeze([
  'Astronomy Engine',
  'P03 Mean Pole',
] as const);

export type ScientificProviderId = (typeof SCIENTIFIC_PROVIDER_IDS)[number];
export type SupportedBodyCorrectionProfile = Extract<
  CorrectionProfileId,
  | 'AE_APPARENT_TOPOCENTRIC_AIRLESS'
  | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
>;

export interface ScientificConfigurationInput {
  readonly precisionTier: 'TIER_1';
  readonly bodyCorrectionProfile: SupportedBodyCorrectionProfile;
  readonly meanPoleModel: 'IAU_P03_PRECESSION_ONLY';
  readonly refractionPolicy: 'disabled' | 'normal';
  readonly enabledProviders: readonly ScientificProviderId[];
}

export interface ScientificConfiguration extends ScientificConfigurationInput {
  readonly version: typeof SCIENTIFIC_CONFIGURATION_VERSION;
  readonly enabledProviders: readonly ['Astronomy Engine', 'P03 Mean Pole'];
  readonly revision: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function reject(message: string): never {
  throw new AstronomyContractError('UNSUPPORTED_CORRECTION_PROFILE', message);
}

function rejectRevision(message: string): never {
  throw new AstronomyContractError('INVALID_REVISION', message);
}

export function normalizeEnabledProviders(
  value: unknown,
): readonly ['Astronomy Engine', 'P03 Mean Pole'] {
  if (!Array.isArray(value) || value.length !== SCIENTIFIC_PROVIDER_IDS.length) {
    return reject('Enabled providers must contain exactly the validated Astronomy Engine and P03 Mean Pole providers.');
  }
  const values = value as readonly unknown[];
  if (
    !values.every((provider) =>
      SCIENTIFIC_PROVIDER_IDS.includes(provider as ScientificProviderId),
    ) ||
    new Set(values).size !== SCIENTIFIC_PROVIDER_IDS.length
  ) {
    return reject('Enabled providers must contain each validated provider exactly once.');
  }
  return Object.freeze([...SCIENTIFIC_PROVIDER_IDS]) as readonly [
    'Astronomy Engine',
    'P03 Mean Pole',
  ];
}

export function normalizeScientificConfiguration(
  value: unknown,
): ScientificConfigurationInput {
  if (!isRecord(value)) return reject('Scientific configuration must be an object.');
  if (value.precisionTier !== 'TIER_1') {
    return reject('Only the validated Tier 1 precision configuration is available.');
  }
  if (value.meanPoleModel !== 'IAU_P03_PRECESSION_ONLY') {
    return reject('Only the validated IAU P03 precession-only mean-pole model is available.');
  }
  if (
    value.bodyCorrectionProfile !== 'AE_APPARENT_TOPOCENTRIC_AIRLESS' &&
    value.bodyCorrectionProfile !== 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
  ) {
    return reject('Unsupported body correction profile.');
  }
  const expectedRefraction =
    value.bodyCorrectionProfile === 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
      ? 'normal'
      : 'disabled';
  if (value.refractionPolicy !== expectedRefraction) {
    return reject('Refraction policy must match the selected body correction profile.');
  }
  return Object.freeze({
    precisionTier: 'TIER_1',
    bodyCorrectionProfile: value.bodyCorrectionProfile,
    meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
    refractionPolicy: expectedRefraction,
    enabledProviders: normalizeEnabledProviders(value.enabledProviders),
  });
}

export function isSupportedScientificConfiguration(
  value: unknown,
): value is ScientificConfiguration {
  try {
    if (!isRecord(value) || value.version !== SCIENTIFIC_CONFIGURATION_VERSION) return false;
    if (!isValidScientificRevision(value.revision)) return false;
    const normalized = normalizeScientificConfiguration(value);
    return (
      value.precisionTier === normalized.precisionTier &&
      value.bodyCorrectionProfile === normalized.bodyCorrectionProfile &&
      value.meanPoleModel === normalized.meanPoleModel &&
      value.refractionPolicy === normalized.refractionPolicy &&
      Array.isArray(value.enabledProviders) &&
      value.enabledProviders.length === normalized.enabledProviders.length &&
      value.enabledProviders.every(
        (provider, index) => provider === normalized.enabledProviders[index],
      )
    );
  } catch {
    return false;
  }
}

function freezeConfiguration(
  input: ScientificConfigurationInput,
  revision: number,
): ScientificConfiguration {
  return Object.freeze({
    ...input,
    enabledProviders: Object.freeze([...input.enabledProviders]) as unknown as readonly [
      'Astronomy Engine',
      'P03 Mean Pole',
    ],
    version: SCIENTIFIC_CONFIGURATION_VERSION,
    revision,
  });
}

function configurationsEqual(
  left: ScientificConfiguration,
  right: ScientificConfigurationInput,
): boolean {
  return (
    left.precisionTier === right.precisionTier &&
    left.bodyCorrectionProfile === right.bodyCorrectionProfile &&
    left.meanPoleModel === right.meanPoleModel &&
    left.refractionPolicy === right.refractionPolicy &&
    left.enabledProviders.length === right.enabledProviders.length &&
    left.enabledProviders.every((provider, index) => provider === right.enabledProviders[index])
  );
}

export const DEFAULT_SCIENTIFIC_CONFIGURATION: ScientificConfiguration =
  freezeConfiguration(
    normalizeScientificConfiguration({
      precisionTier: 'TIER_1',
      bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
      refractionPolicy: 'disabled',
      enabledProviders: SCIENTIFIC_PROVIDER_IDS,
    }),
    0,
  );

export class ScientificConfigurationStore {
  private state = DEFAULT_SCIENTIFIC_CONFIGURATION;

  get current(): ScientificConfiguration {
    return this.state;
  }

  replace(next: ScientificConfigurationInput): ScientificConfiguration {
    const normalized = normalizeScientificConfiguration(next);
    if (configurationsEqual(this.state, normalized)) return this.state;
    this.state = freezeConfiguration(normalized, this.state.revision + 1);
    return this.state;
  }

  serialize(): ScientificConfiguration {
    return this.state;
  }

  restore(serialized: unknown): ScientificConfiguration {
    if (!isRecord(serialized) || serialized.version !== SCIENTIFIC_CONFIGURATION_VERSION) {
      return reject('Unsupported scientific-configuration serialization version.');
    }
    if (!isValidScientificRevision(serialized.revision)) {
      return rejectRevision('Serialized scientific configuration requires a finite, safe, non-negative integer revision.');
    }
    return this.replace(normalizeScientificConfiguration(serialized));
  }
}
