import type { ApplicationBasisDirection } from './mapEnuToApplicationBasis';
import type { MoonPhaseState } from '../science/moon/moonPhase';
import { CANONICAL_MOON_PHASES } from '../science/moon/moonPhase';

export const MOON_PHASE_TEXTURE_SIZE = 128;
export const MOON_PHASE_PRESENTATION_DISTANCE_METERS = 24;
export const MOON_PHASE_DIAL_RADIUS_METERS = 3.2;
export const MOON_PHASE_IMAGE_DIAMETER_METERS = 0.72;
export const CURRENT_MOON_IMAGE_DIAMETER_METERS = 1.05;
export const MOON_PHASE_LABEL_SIZE_METERS = Object.freeze([1.8, 0.45] as const);

export interface MoonPhasePixelData {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
  readonly visibleAlphaPixelCount: number;
  readonly illuminatedPixelCount: number;
  readonly borderPixelCount: number;
}

export interface MoonTangentBasis {
  readonly normal: ApplicationBasisDirection;
  readonly right: ApplicationBasisDirection;
  readonly up: ApplicationBasisDirection;
  readonly orthonormalityError: number;
  readonly handedness: 'RIGHT_HANDED';
}

export interface MoonPhaseDialPosition {
  readonly phaseId: string;
  readonly phaseName: string;
  readonly phaseAngleDeg: number;
  readonly waxing: boolean;
  readonly dialX: number;
  readonly dialY: number;
  readonly imagePosition: readonly [number, number, number];
  readonly labelPosition: readonly [number, number, number];
}

export interface MoonPhasePresentationModel {
  readonly kind: 'READY_MOON_PHASE_PRESENTATION';
  readonly phase: MoonPhaseState;
  readonly moonDirection: ApplicationBasisDirection;
  readonly sunDirection: ApplicationBasisDirection;
  readonly basis: MoonTangentBasis;
  readonly dialCenter: readonly [number, number, number];
  readonly currentAppearanceAnchor: readonly [number, number, number];
  readonly positions: readonly MoonPhaseDialPosition[];
  readonly currentIndicatorPosition: readonly [number, number, number];
  readonly projectedSunTangent: readonly [number, number];
  readonly brightLimbOrientationDeg: number;
  readonly presentationDistanceMeters: number;
  readonly dialRadiusMeters: number;
  readonly currentTextureKey: string;
  readonly orientationPolicy: 'STANDARDIZED_WAXING_RIGHT_WANING_LEFT';
}

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

export function createMoonPhasePixels(
  phaseLongitudeDeg: number,
  borderStrength = 0.65,
  size = MOON_PHASE_TEXTURE_SIZE,
): MoonPhasePixelData {
  if (
    !Number.isFinite(phaseLongitudeDeg) ||
    !Number.isFinite(borderStrength) ||
    borderStrength < 0 ||
    borderStrength > 1 ||
    !Number.isSafeInteger(size) ||
    size < 32 ||
    size > 512
  ) {
    throw new Error('Moon phase texture inputs are invalid.');
  }
  const phase = ((phaseLongitudeDeg % 360) + 360) % 360 * Math.PI / 180;
  const lightX = Math.sin(phase);
  const lightZ = -Math.cos(phase);
  const pixels = new Uint8Array(size * size * 4);
  let visibleAlphaPixelCount = 0;
  let illuminatedPixelCount = 0;
  let borderPixelCount = 0;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const x = ((column + 0.5) / size) * 2 - 1;
      const y = 1 - ((row + 0.5) / size) * 2;
      const radiusSquared = x * x + y * y;
      const offset = (row * size + column) * 4;
      if (radiusSquared > 1) continue;
      visibleAlphaPixelCount += 1;
      const radius = Math.sqrt(radiusSquared);
      const border = radius >= 0.91;
      let luminance: number;
      if (border) {
        borderPixelCount += 1;
        luminance = 150 + Math.round(82 * borderStrength);
      } else {
        const z = Math.sqrt(Math.max(0, 1 - radiusSquared));
        const illumination = x * lightX + z * lightZ;
        const lit = illumination > 0;
        if (lit) illuminatedPixelCount += 1;
        const subtleSurface = 0.96 + 0.04 * Math.sin(column * 0.37 + row * 0.21);
        luminance = lit
          ? Math.round((54 + 188 * Math.sqrt(clamp(illumination))) * subtleSurface)
          : Math.round(8 + 8 * (1 - radius));
      }
      const value = Math.max(0, Math.min(255, luminance));
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = Math.min(255, value + (border ? 8 : 3));
      pixels[offset + 3] = 255;
    }
  }
  return Object.freeze({
    width: size,
    height: size,
    pixels,
    visibleAlphaPixelCount,
    illuminatedPixelCount,
    borderPixelCount,
  });
}

function vector(
  x: number,
  y: number,
  z: number,
): ApplicationBasisDirection {
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length < 1e-12) throw new Error('Moon tangent basis is degenerate.');
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: x / length,
    y: y / length,
    z: z / length,
  });
}

function cross(
  a: ApplicationBasisDirection,
  b: ApplicationBasisDirection,
): ApplicationBasisDirection {
  return vector(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function dot(a: ApplicationBasisDirection, b: ApplicationBasisDirection): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function createMoonTangentBasis(
  moonDirection: ApplicationBasisDirection,
): MoonTangentBasis {
  const normal = vector(moonDirection.x, moonDirection.y, moonDirection.z);
  const reference = Math.abs(normal.y) < 0.9
    ? vector(0, 1, 0)
    : vector(1, 0, 0);
  const right = cross(reference, normal);
  const up = cross(normal, right);
  const orthonormalityError = Math.max(
    Math.abs(dot(normal, right)),
    Math.abs(dot(normal, up)),
    Math.abs(dot(right, up)),
    Math.abs(Math.hypot(normal.x, normal.y, normal.z) - 1),
    Math.abs(Math.hypot(right.x, right.y, right.z) - 1),
    Math.abs(Math.hypot(up.x, up.y, up.z) - 1),
  );
  return Object.freeze({
    normal,
    right,
    up,
    orthonormalityError,
    handedness: 'RIGHT_HANDED',
  });
}

function offset(
  center: readonly [number, number, number],
  right: ApplicationBasisDirection,
  up: ApplicationBasisDirection,
  x: number,
  y: number,
): readonly [number, number, number] {
  return Object.freeze([
    center[0] + right.x * x + up.x * y,
    center[1] + right.y * x + up.y * y,
    center[2] + right.z * x + up.z * y,
  ]);
}

export function createMoonPhasePresentationModel(
  phase: MoonPhaseState,
  moonDirection: ApplicationBasisDirection,
  sunDirection: ApplicationBasisDirection,
): MoonPhasePresentationModel {
  const basis = createMoonTangentBasis(moonDirection);
  const center = Object.freeze([
    basis.normal.x * MOON_PHASE_PRESENTATION_DISTANCE_METERS,
    basis.normal.y * MOON_PHASE_PRESENTATION_DISTANCE_METERS,
    basis.normal.z * MOON_PHASE_PRESENTATION_DISTANCE_METERS,
  ] as const);
  const positions = Object.freeze(CANONICAL_MOON_PHASES.map((canonical) => {
    const radians = canonical.angleDeg * Math.PI / 180;
    const dialX = Math.sin(radians) * MOON_PHASE_DIAL_RADIUS_METERS;
    const dialY = Math.cos(radians) * MOON_PHASE_DIAL_RADIUS_METERS;
    const labelRadius = MOON_PHASE_DIAL_RADIUS_METERS + 0.68;
    return Object.freeze({
      phaseId: canonical.id,
      phaseName: canonical.name,
      phaseAngleDeg: canonical.angleDeg,
      waxing: canonical.waxing,
      dialX,
      dialY,
      imagePosition: offset(center, basis.right, basis.up, dialX, dialY),
      labelPosition: offset(
        center,
        basis.right,
        basis.up,
        Math.sin(radians) * labelRadius,
        Math.cos(radians) * labelRadius,
      ),
    });
  }));
  const indicatorRadians = phase.phaseLongitudeDeg * Math.PI / 180;
  const indicatorPosition = offset(
    center,
    basis.right,
    basis.up,
    Math.sin(indicatorRadians) * (MOON_PHASE_DIAL_RADIUS_METERS - 0.25),
    Math.cos(indicatorRadians) * (MOON_PHASE_DIAL_RADIUS_METERS - 0.25),
  );
  const sunDotMoon = dot(sunDirection, basis.normal);
  const tangentSun = {
    x: sunDirection.x - basis.normal.x * sunDotMoon,
    y: sunDirection.y - basis.normal.y * sunDotMoon,
    z: sunDirection.z - basis.normal.z * sunDotMoon,
  };
  const tangentLength = Math.hypot(tangentSun.x, tangentSun.y, tangentSun.z);
  const projectedSunTangent = tangentLength > 1e-10
    ? Object.freeze([
        (tangentSun.x * basis.right.x + tangentSun.y * basis.right.y + tangentSun.z * basis.right.z) / tangentLength,
        (tangentSun.x * basis.up.x + tangentSun.y * basis.up.y + tangentSun.z * basis.up.z) / tangentLength,
      ] as const)
    : Object.freeze([0, 1] as const);
  const brightLimbOrientationDeg =
    Math.atan2(projectedSunTangent[1], projectedSunTangent[0]) * 180 / Math.PI;
  return Object.freeze({
    kind: 'READY_MOON_PHASE_PRESENTATION',
    phase,
    moonDirection,
    sunDirection,
    basis,
    dialCenter: center,
    currentAppearanceAnchor: offset(center, basis.right, basis.up, 0.58, 0.32),
    positions,
    currentIndicatorPosition: indicatorPosition,
    projectedSunTangent,
    brightLimbOrientationDeg,
    presentationDistanceMeters: MOON_PHASE_PRESENTATION_DISTANCE_METERS,
    dialRadiusMeters: MOON_PHASE_DIAL_RADIUS_METERS,
    currentTextureKey: `${Math.round(phase.phaseLongitudeDeg * 2) / 2}|subtle`,
    orientationPolicy: 'STANDARDIZED_WAXING_RIGHT_WANING_LEFT',
  });
}
