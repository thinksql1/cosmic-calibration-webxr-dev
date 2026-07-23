import type { RealSkyEquatorialOrientationReady, Matrix3Rows } from '../science/astronomy/realSkyEquatorialOrientation';
import type { CartesianUnitDirection } from '../science/astronomy/types';
import type { LunarPhaseTransit } from '../science/moon/lunarPhaseTransit';
import {
  LUNAR_PHASE_TRANSIT_SAMPLING_POLICY,
} from '../science/moon/lunarPhaseTransit';
import type { ApplicationBasisDirection } from './mapEnuToApplicationBasis';
import type { GeocentricCelestialStructurePresentation } from './geocentricCelestialStructurePresentation';
import type { MoonPhaseLabelPreset } from './moonPhaseLabels';
import { sampleOrderedDirectionalPath } from './directionalPathSampling';

export const LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS = 24;
export const LUNAR_TRANSIT_IMAGE_DIAMETER_METERS = 0.86;
export const LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS = 0.008;

export interface LunarTransitPresentationSettings {
  readonly showPath: boolean;
  readonly showEarthHiddenPath: boolean;
  readonly showNotches: boolean;
  readonly showImages: boolean;
  readonly showLabels: boolean;
  readonly showCurrentTransit: boolean;
  readonly labelPreset: MoonPhaseLabelPreset;
}

export interface LunarPhaseTransitPresentation {
  readonly kind: 'READY_LUNAR_PHASE_TRANSIT_PRESENTATION';
  readonly transit: LunarPhaseTransit;
  readonly settings: LunarTransitPresentationSettings;
  readonly orientationRows: Matrix3Rows;
  readonly renderedEqjDirections: readonly CartesianUnitDirection<'EQJ_J2000'>[];
  readonly renderedTimestampsMilliseconds: readonly number[];
  readonly aboveHorizon: readonly boolean[];
  readonly events: readonly {
    readonly phaseId: string;
    readonly phaseName: string;
    readonly phaseAngleDeg: number;
    readonly eventUtc: string;
    readonly directionEqj: CartesianUnitDirection<'EQJ_J2000'>;
    readonly directionApplication: ApplicationBasisDirection;
    readonly notchDirectionsEqj: readonly [
      CartesianUnitDirection<'EQJ_J2000'>,
      CartesianUnitDirection<'EQJ_J2000'>,
    ];
    readonly imageAnchor: readonly [number, number, number];
    readonly labelAnchor: readonly [number, number, number];
    readonly pathParameter: number;
    readonly pathAlignmentErrorDeg: number;
  }[];
  readonly current: {
    readonly directionEqj: CartesianUnitDirection<'EQJ_J2000'>;
    readonly directionApplication: ApplicationBasisDirection;
    readonly actualDirectionApplication: ApplicationBasisDirection;
    readonly anchor: readonly [number, number, number];
    readonly pathErrorDeg: number;
  };
  readonly diagnostics: {
    readonly providerSampleCount: number;
    readonly renderedVertexCount: number;
    readonly maximumRenderedAngularSpacingDeg: number;
    readonly closureErrorDeg: number;
    readonly aboveHorizonCount: number;
    readonly earthHiddenCount: number;
    readonly timestampsMonotonic: boolean;
  };
}

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;
const angleDeg = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number =>
  Math.acos(clamp(dot(a, b))) * 180 / Math.PI;

function normalizeEqj(x: number, y: number, z: number): CartesianUnitDirection<'EQJ_J2000'> {
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length < 1e-12) throw new Error('Transit direction is degenerate.');
  return Object.freeze({ frame: 'EQJ_J2000', units: 'unitless', x: x / length, y: y / length, z: z / length });
}

function apply(
  rows: Matrix3Rows,
  direction: { x: number; y: number; z: number },
): ApplicationBasisDirection {
  const x = rows[0][0] * direction.x + rows[0][1] * direction.y + rows[0][2] * direction.z;
  const y = rows[1][0] * direction.x + rows[1][1] * direction.y + rows[1][2] * direction.z;
  const z = rows[2][0] * direction.x + rows[2][1] * direction.y + rows[2][2] * direction.z;
  const length = Math.hypot(x, y, z);
  return Object.freeze({ frame: 'APPLICATION_BASIS', units: 'unitless', x: x / length, y: y / length, z: z / length });
}

function cross(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function nearestIndex(timestamps: readonly number[], target: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  timestamps.forEach((value, index) => {
    const distance = Math.abs(value - target);
    if (distance < bestDistance) { best = index; bestDistance = distance; }
  });
  return best;
}

function directionAtTimestamp(
  directions: readonly CartesianUnitDirection<'EQJ_J2000'>[],
  timestamps: readonly number[],
  target: number,
): CartesianUnitDirection<'EQJ_J2000'> {
  if (target <= timestamps[0]!) return directions[0]!;
  if (target >= timestamps.at(-1)!) return directions.at(-1)!;
  let upper = 1;
  while (upper < timestamps.length && timestamps[upper]! < target) upper += 1;
  const lower = upper - 1;
  const start = directions[lower]!;
  const end = directions[upper]!;
  const t = (target - timestamps[lower]!) / (timestamps[upper]! - timestamps[lower]!);
  const omega = Math.acos(clamp(dot(start, end)));
  if (omega < 1e-12) return start;
  const sinOmega = Math.sin(omega);
  const left = Math.sin((1 - t) * omega) / sinOmega;
  const right = Math.sin(t * omega) / sinOmega;
  return normalizeEqj(
    start.x * left + end.x * right,
    start.y * left + end.y * right,
    start.z * left + end.z * right,
  );
}

function finiteAnchor(
  direction: ApplicationBasisDirection,
  outward: ApplicationBasisDirection,
  outwardMeters: number,
): readonly [number, number, number] {
  return Object.freeze([
    direction.x * LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS + outward.x * outwardMeters,
    direction.y * LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS + outward.y * outwardMeters,
    direction.z * LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS + outward.z * outwardMeters,
  ]);
}

function observerViewDirectionToPresentedPathPoint(
  direction: ApplicationBasisDirection,
  structure: GeocentricCelestialStructurePresentation,
): ApplicationBasisDirection {
  const radius = structure.celestialEquatorDisplayRadiusMeters;
  const x = structure.earthCore.x + direction.x * radius;
  const y = structure.earthCore.y + direction.y * radius;
  const z = structure.earthCore.z + direction.z * radius;
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length < 1e-12) {
    throw new Error('Presented lunar transit point does not define an observer view direction.');
  }
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: x / length,
    y: y / length,
    z: z / length,
  });
}

function tangentUp(direction: ApplicationBasisDirection): ApplicationBasisDirection {
  const reference = Math.abs(direction.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const rightRaw = cross(reference, direction);
  const rightLength = Math.hypot(rightRaw.x, rightRaw.y, rightRaw.z);
  const right = { x: rightRaw.x / rightLength, y: rightRaw.y / rightLength, z: rightRaw.z / rightLength };
  const upRaw = cross(direction, right);
  const upLength = Math.hypot(upRaw.x, upRaw.y, upRaw.z);
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: upRaw.x / upLength,
    y: upRaw.y / upLength,
    z: upRaw.z / upLength,
  });
}

export function createLunarPhaseTransitPresentation(
  transit: LunarPhaseTransit,
  orientation: RealSkyEquatorialOrientationReady,
  structure: GeocentricCelestialStructurePresentation,
  settings: LunarTransitPresentationSettings,
): LunarPhaseTransitPresentation {
  if (
    transit.kind !== 'READY_LUNAR_PHASE_TRANSIT'
    || orientation.kind !== 'ready'
    || transit.samples.length < 2
  ) throw new Error('Lunar phase-transit presentation requires ready science and orientation.');
  const sampled = sampleOrderedDirectionalPath(
    transit.samples.map((sample) => ({
      directionApplication: Object.freeze({
        frame: 'APPLICATION_BASIS' as const,
        units: 'unitless' as const,
        x: sample.directionEqj.x,
        y: sample.directionEqj.y,
        z: sample.directionEqj.z,
      }),
      opacity: 1,
      aboveHorizon: true,
      timestampMilliseconds: sample.instant.unixMilliseconds,
    })),
    LUNAR_PHASE_TRANSIT_SAMPLING_POLICY.maximumRenderedAngularStepDeg,
    LUNAR_PHASE_TRANSIT_SAMPLING_POLICY.maximumRenderedSamples,
  );
  const renderedEqjDirections = Object.freeze(sampled.samples.map((sample) =>
    normalizeEqj(sample.directionApplication.x, sample.directionApplication.y, sample.directionApplication.z)));
  const renderedTimestampsMilliseconds = Object.freeze(sampled.samples.map(
    (sample, index) => sample.timestampMilliseconds
      ?? transit.previousNewMoon.unixMilliseconds
        + (transit.nextNewMoon.unixMilliseconds - transit.previousNewMoon.unixMilliseconds)
          * index / (sampled.samples.length - 1),
  ));
  const transformed = renderedEqjDirections.map((direction) => apply(orientation.eqjToApplicationRows, direction));
  const aboveHorizon = Object.freeze(transformed.map((direction) => direction.y >= 0));
  const events = Object.freeze(transit.events.map((event) => {
    const index = nearestIndex(renderedTimestampsMilliseconds, event.instant.unixMilliseconds);
    const before = renderedEqjDirections[Math.max(0, index - 1)]!;
    const after = renderedEqjDirections[Math.min(renderedEqjDirections.length - 1, index + 1)]!;
    const tangent = {
      x: after.x - before.x,
      y: after.y - before.y,
      z: after.z - before.z,
    };
    const perpendicularRaw = cross(event.directionEqj, tangent);
    const perpendicularLength = Math.hypot(perpendicularRaw.x, perpendicularRaw.y, perpendicularRaw.z);
    if (!Number.isFinite(perpendicularLength) || perpendicularLength < 1e-10) {
      throw new Error(`Transit notch tangent is degenerate for ${event.phase.name}.`);
    }
    const perpendicular = {
      x: perpendicularRaw.x / perpendicularLength,
      y: perpendicularRaw.y / perpendicularLength,
      z: perpendicularRaw.z / perpendicularLength,
    };
    const notchDirectionsEqj = Object.freeze([
      normalizeEqj(
        event.directionEqj.x - perpendicular.x * LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS,
        event.directionEqj.y - perpendicular.y * LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS,
        event.directionEqj.z - perpendicular.z * LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS,
      ),
      normalizeEqj(
        event.directionEqj.x + perpendicular.x * LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS,
        event.directionEqj.y + perpendicular.y * LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS,
        event.directionEqj.z + perpendicular.z * LUNAR_TRANSIT_NOTCH_HALF_ANGLE_RADIANS,
      ),
    ] as const);
    const directionApplication = apply(orientation.eqjToApplicationRows, event.directionEqj);
    const presentedViewDirection = observerViewDirectionToPresentedPathPoint(
      directionApplication,
      structure,
    );
    const outward = tangentUp(presentedViewDirection);
    return Object.freeze({
      phaseId: event.phase.id,
      phaseName: event.phase.name,
      phaseAngleDeg: event.phase.angleDeg,
      eventUtc: event.instant.utcIso,
      directionEqj: event.directionEqj,
      directionApplication,
      notchDirectionsEqj,
      imageAnchor: finiteAnchor(presentedViewDirection, outward, 0.72),
      labelAnchor: finiteAnchor(presentedViewDirection, outward, 1.6),
      pathParameter: event.pathParameter,
      pathAlignmentErrorDeg: angleDeg(event.directionEqj, renderedEqjDirections[index]!),
    });
  }));
  const currentDirectionEqj = directionAtTimestamp(
    renderedEqjDirections,
    renderedTimestampsMilliseconds,
    transit.current.instant.unixMilliseconds,
  );
  const directionApplication = apply(orientation.eqjToApplicationRows, currentDirectionEqj);
  const actualDirectionApplication = apply(orientation.eqjToApplicationRows, transit.current.directionEqj);
  const currentPresentedViewDirection = observerViewDirectionToPresentedPathPoint(
    directionApplication,
    structure,
  );
  return Object.freeze({
    kind: 'READY_LUNAR_PHASE_TRANSIT_PRESENTATION',
    transit,
    settings: Object.freeze({ ...settings }),
    orientationRows: orientation.eqjToApplicationRows,
    renderedEqjDirections,
    renderedTimestampsMilliseconds,
    aboveHorizon,
    events,
    current: Object.freeze({
      directionEqj: currentDirectionEqj,
      directionApplication,
      actualDirectionApplication,
      anchor: Object.freeze([
        currentPresentedViewDirection.x * LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS,
        currentPresentedViewDirection.y * LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS,
        currentPresentedViewDirection.z * LUNAR_PHASE_TRANSIT_PRESENTATION_DISTANCE_METERS,
      ] as const),
      pathErrorDeg: angleDeg(directionApplication, actualDirectionApplication),
    }),
    diagnostics: Object.freeze({
      providerSampleCount: transit.samples.length,
      renderedVertexCount: renderedEqjDirections.length,
      maximumRenderedAngularSpacingDeg: sampled.maximumRenderedAngularSpacingDeg,
      closureErrorDeg: angleDeg(renderedEqjDirections[0]!, renderedEqjDirections.at(-1)!),
      aboveHorizonCount: aboveHorizon.filter(Boolean).length,
      earthHiddenCount: aboveHorizon.filter((value) => !value).length,
      timestampsMonotonic: sampled.timestampsMonotonic,
    }),
  });
}
