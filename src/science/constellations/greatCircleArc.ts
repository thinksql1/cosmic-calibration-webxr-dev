export interface UnitVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const CONSTELLATION_MAX_ANGULAR_STEP_DEGREES = 1.5;
export const CONSTELLATION_MAX_ARC_INTERVALS = 120;

export interface GreatCircleArcReady {
  readonly kind: 'ready';
  readonly points: readonly UnitVector3[];
  readonly angularSeparationDegrees: number;
  readonly intervalCount: number;
  readonly maximumAdjacentAngularSeparationDegrees: number;
  readonly minorArc: true;
}

export interface GreatCircleArcFailure {
  readonly kind: 'not-ready';
  readonly code: 'NON_FINITE_ENDPOINT' | 'NON_UNIT_ENDPOINT' | 'DEGENERATE_ENDPOINTS' | 'NEARLY_ANTIPODAL_ENDPOINTS' | 'INVALID_SAMPLING_POLICY';
  readonly reason: string;
}

export type GreatCircleArcResult = GreatCircleArcReady | GreatCircleArcFailure;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));
const length = (value: UnitVector3) => Math.hypot(value.x, value.y, value.z);
const dot = (a: UnitVector3, b: UnitVector3) => a.x * b.x + a.y * b.y + a.z * b.z;
const angleDegrees = (a: UnitVector3, b: UnitVector3) => Math.acos(clamp(dot(a, b))) * 180 / Math.PI;

export function catalogJ2000Direction(rightAscensionHours: number, declinationDegrees: number): UnitVector3 | undefined {
  if (!Number.isFinite(rightAscensionHours) || !Number.isFinite(declinationDegrees) || declinationDegrees < -90 || declinationDegrees > 90) return undefined;
  const wrappedHours = ((rightAscensionHours % 24) + 24) % 24;
  const ra = wrappedHours * Math.PI / 12;
  const dec = declinationDegrees * Math.PI / 180;
  const radius = Math.cos(dec);
  const result = Object.freeze({ x: radius * Math.cos(ra), y: radius * Math.sin(ra), z: Math.sin(dec) });
  const magnitude = length(result);
  return Number.isFinite(magnitude) && magnitude > 0
    ? Object.freeze({ x: result.x / magnitude, y: result.y / magnitude, z: result.z / magnitude })
    : undefined;
}

export function sampleMinorGreatCircleArc(
  start: UnitVector3,
  end: UnitVector3,
  maximumAngularStepDegrees = CONSTELLATION_MAX_ANGULAR_STEP_DEGREES,
): GreatCircleArcResult {
  if (![start.x, start.y, start.z, end.x, end.y, end.z].every(Number.isFinite)) {
    return Object.freeze({ kind: 'not-ready', code: 'NON_FINITE_ENDPOINT', reason: 'Great-circle endpoints must be finite.' });
  }
  if (Math.abs(length(start) - 1) > 1e-10 || Math.abs(length(end) - 1) > 1e-10) {
    return Object.freeze({ kind: 'not-ready', code: 'NON_UNIT_ENDPOINT', reason: 'Great-circle endpoints must be normalized.' });
  }
  if (!Number.isFinite(maximumAngularStepDegrees) || maximumAngularStepDegrees <= 0 || maximumAngularStepDegrees > 10) {
    return Object.freeze({ kind: 'not-ready', code: 'INVALID_SAMPLING_POLICY', reason: 'Great-circle maximum angular step must be finite within (0, 10] degrees.' });
  }
  const cosine = clamp(dot(start, end));
  const angle = Math.acos(cosine);
  if (angle < 1e-8) return Object.freeze({ kind: 'not-ready', code: 'DEGENERATE_ENDPOINTS', reason: 'Great-circle endpoints are indistinguishable.' });
  if (Math.PI - angle < 1e-6) return Object.freeze({ kind: 'not-ready', code: 'NEARLY_ANTIPODAL_ENDPOINTS', reason: 'Nearly antipodal endpoints do not define one stable minor arc.' });
  const angularSeparationDegrees = angle * 180 / Math.PI;
  const intervalCount = Math.min(CONSTELLATION_MAX_ARC_INTERVALS, Math.max(1, Math.ceil(angularSeparationDegrees / maximumAngularStepDegrees)));
  const sine = Math.sin(angle);
  const points = Object.freeze(Array.from({ length: intervalCount + 1 }, (_, index) => {
    if (index === 0) return Object.freeze({ ...start });
    if (index === intervalCount) return Object.freeze({ ...end });
    const t = index / intervalCount;
    const startWeight = Math.sin((1 - t) * angle) / sine;
    const endWeight = Math.sin(t * angle) / sine;
    const x = startWeight * start.x + endWeight * end.x;
    const y = startWeight * start.y + endWeight * end.y;
    const z = startWeight * start.z + endWeight * end.z;
    const magnitude = Math.hypot(x, y, z);
    return Object.freeze({ x: x / magnitude, y: y / magnitude, z: z / magnitude });
  }));
  const maximumAdjacentAngularSeparationDegrees = Math.max(...points.slice(1).map((point, index) => angleDegrees(points[index]!, point)));
  return Object.freeze({ kind: 'ready', points, angularSeparationDegrees, intervalCount, maximumAdjacentAngularSeparationDegrees, minorArc: true });
}
