import type { EnuUnitDirection } from '../science/astronomy/types';
import type { EnuPositionMeters } from '../science/frames/observerGeocentricEarthAxis';

export interface ApplicationBasisDirection {
  readonly frame: 'APPLICATION_BASIS';
  readonly units: 'unitless';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ApplicationBasisPosition {
  readonly frame: 'APPLICATION_BASIS';
  readonly units: 'meters';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Maps canonical ENU into the established scene basis without importing
 * Three.js: east -> +X, up -> +Y, north -> -Z.
 */
export function mapEnuToApplicationBasis(
  direction: EnuUnitDirection,
): ApplicationBasisDirection {
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: direction.east,
    y: direction.up,
    z: -direction.north,
  });
}

/** Maps a metric ENU position without changing scale or applying geographic yaw. */
export function mapEnuPositionToApplicationBasis(
  position: EnuPositionMeters,
): ApplicationBasisPosition {
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'meters',
    x: position.east,
    y: position.up,
    z: -position.north,
  });
}
