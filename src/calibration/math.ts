export interface Vector3Value {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface HorizontalDirection {
  readonly x: number;
  readonly y: 0;
  readonly z: number;
}

export type ProjectionFailureReason =
  | 'non-finite'
  | 'horizontal-magnitude-too-small';

export type HorizontalProjectionResult =
  | {
      readonly valid: true;
      readonly direction: HorizontalDirection;
      readonly horizontalMagnitude: number;
    }
  | {
      readonly valid: false;
      readonly reason: ProjectionFailureReason;
      readonly horizontalMagnitude?: number;
    };

/**
 * Target-ray directions are unit vectors. A horizontal magnitude below 0.25
 * means the ray is within about 14.5 degrees of vertical and is too unstable
 * to use as a horizontal bearing.
 */
export const MIN_HORIZONTAL_MAGNITUDE = 0.25;

export const APPLICATION_NORTH: HorizontalDirection = Object.freeze({
  x: 0,
  y: 0,
  z: -1,
});

export const APPLICATION_EAST: HorizontalDirection = Object.freeze({
  x: 1,
  y: 0,
  z: 0,
});

function componentsAreFinite(vector: Vector3Value): boolean {
  return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z);
}

export function projectToHorizontal(
  vector: Vector3Value,
  minimumMagnitude = MIN_HORIZONTAL_MAGNITUDE,
): HorizontalProjectionResult {
  if (!componentsAreFinite(vector) || !Number.isFinite(minimumMagnitude) || minimumMagnitude < 0) {
    return { valid: false, reason: 'non-finite' };
  }

  const x = vector.x;
  const z = vector.z;
  const horizontalMagnitude = Math.hypot(x, z);

  if (horizontalMagnitude < minimumMagnitude) {
    return {
      valid: false,
      reason: 'horizontal-magnitude-too-small',
      horizontalMagnitude,
    };
  }

  return {
    valid: true,
    horizontalMagnitude,
    direction: {
      x: x / horizontalMagnitude,
      y: 0,
      z: z / horizontalMagnitude,
    },
  };
}

export function normalizeYaw(yaw: number): number {
  if (!Number.isFinite(yaw)) return Number.NaN;
  const fullTurn = Math.PI * 2;
  return ((yaw + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
}

/**
 * Returns the Three.js +Y rotation that maps application north onto the
 * captured direction. Positive yaw turns -Z toward -X; negative yaw turns
 * -Z toward +X.
 */
export function calculateSignedYaw(
  capturedNorth: HorizontalDirection,
  applicationNorth: HorizontalDirection = APPLICATION_NORTH,
): number {
  if (!componentsAreFinite(capturedNorth) || !componentsAreFinite(applicationNorth)) {
    return Number.NaN;
  }

  const dot = applicationNorth.x * capturedNorth.x + applicationNorth.z * capturedNorth.z;
  const crossY =
    applicationNorth.z * capturedNorth.x - applicationNorth.x * capturedNorth.z;
  return normalizeYaw(Math.atan2(crossY, dot));
}

export function rotateHorizontal(
  vector: HorizontalDirection,
  yaw: number,
): HorizontalDirection {
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  return {
    x: cosine * vector.x + sine * vector.z,
    y: 0,
    z: -sine * vector.x + cosine * vector.z,
  };
}

export interface CardinalDirections {
  readonly north: HorizontalDirection;
  readonly south: HorizontalDirection;
  readonly east: HorizontalDirection;
  readonly west: HorizontalDirection;
}

export function cardinalDirectionsForYaw(yaw: number): CardinalDirections {
  const north = rotateHorizontal(APPLICATION_NORTH, yaw);
  const east = rotateHorizontal(APPLICATION_EAST, yaw);
  return {
    north,
    south: { x: -north.x, y: 0, z: -north.z },
    east,
    west: { x: -east.x, y: 0, z: -east.z },
  };
}

export function bearingDegreesToDirection(degrees: number): HorizontalDirection {
  const radians = (normalizeDegrees(degrees) * Math.PI) / 180;
  return {
    x: Math.sin(radians),
    y: 0,
    z: -Math.cos(radians),
  };
}

export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return Number.NaN;
  return ((degrees % 360) + 360) % 360;
}
