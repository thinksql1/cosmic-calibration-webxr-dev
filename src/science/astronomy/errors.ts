export type AstronomyContractErrorCode =
  | 'INVALID_INSTANT'
  | 'INVALID_REVISION'
  | 'INVALID_OBSERVER'
  | 'UNSUPPORTED_VERTICAL_DATUM'
  | 'INVALID_ANGLE'
  | 'UNSUPPORTED_FRAME_CONTRACT'
  | 'UNSUPPORTED_CORRECTION_PROFILE'
  | 'MEAN_POLE_OUTSIDE_VALIDATED_DOMAIN';

export class AstronomyContractError extends Error {
  constructor(
    readonly code: AstronomyContractErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AstronomyContractError';
  }
}
