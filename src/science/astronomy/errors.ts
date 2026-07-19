export type AstronomyContractErrorCode =
  | 'INVALID_INSTANT'
  | 'INVALID_REVISION'
  | 'INVALID_OBSERVER'
  | 'UNSUPPORTED_VERTICAL_DATUM'
  | 'INVALID_ANGLE'
  | 'UNSUPPORTED_FRAME_CONTRACT'
  | 'UNSUPPORTED_CORRECTION_PROFILE'
  | 'PROVIDER_IDENTITY_MISMATCH'
  | 'MALFORMED_PROVIDER_RESULT'
  | 'UNSUPPORTED_PROVIDER_CAPABILITY'
  | 'INVALID_TIME_ZONE'
  | 'CIVIL_TIME_RESOLUTION_FAILURE'
  | 'TEMPORAL_PATH_FAILURE'
  | 'MEAN_POLE_OUTSIDE_VALIDATED_DOMAIN';

export interface AstronomyContractErrorContext {
  readonly operation?: string;
  readonly expected?: Readonly<Record<string, unknown>>;
  readonly actual?: Readonly<Record<string, unknown>>;
  readonly mismatchedFields?: readonly string[];
}

export class AstronomyContractError extends Error {
  constructor(
    readonly code: AstronomyContractErrorCode,
    message: string,
    readonly context?: AstronomyContractErrorContext,
  ) {
    super(message);
    this.name = 'AstronomyContractError';
  }
}
