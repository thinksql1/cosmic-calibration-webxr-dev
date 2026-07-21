import * as THREE from 'three';
import type { EarthAxisCameraRelativeFrame } from './earthAxisCameraRelativeFrame';

export const EARTH_AXIS_RIBBON_HALF_WIDTH_PIXELS = 1.5;
export const EARTH_AXIS_RIBBON_CLIP_DEPTH = 0.999;

export type EarthAxisHalf = 'north' | 'south';

export interface EarthAxisRibbonVertex {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface EarthAxisProjectedSegment {
  readonly half: EarthAxisHalf;
  readonly visible: boolean;
  readonly reason: string;
  readonly projectiveDirectionClip: Readonly<{ x: number; y: number; z: number; w: number }>;
  readonly startNdc: Readonly<{ x: number; y: number }>;
  readonly boundaryNdc: Readonly<{ x: number; y: number }>;
  readonly directionNdc: Readonly<{ x: number; y: number }>;
  readonly perpendicularOffsetNdc: Readonly<{ x: number; y: number }>;
  readonly lengthNdc: number;
  readonly ribbonVerticesClip: readonly EarthAxisRibbonVertex[];
  readonly indices: readonly number[];
  readonly primitive: 'NON_INDEXED_GL_TRIANGLES_OPEN_QUAD';
}

export interface EarthAxisProjectedSegments {
  readonly coreClip: EarthAxisRibbonVertex;
  readonly coreNdc: Readonly<{ x: number; y: number }>;
  readonly north: EarthAxisProjectedSegment;
  readonly south: EarthAxisProjectedSegment;
  readonly oppositeDirectionDot: number;
  readonly anyTriangleSpansBothHalves: false;
}

const hiddenPoint = Object.freeze({ x: 0, y: 0 });
const hiddenClip = Object.freeze({ x: 0, y: 0, z: 0, w: 0 });

function finite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function hiddenSegment(
  half: EarthAxisHalf,
  reason: string,
  directionClip: EarthAxisRibbonVertex = hiddenClip,
): EarthAxisProjectedSegment {
  return Object.freeze({
    half,
    visible: false,
    reason,
    projectiveDirectionClip: directionClip,
    startNdc: hiddenPoint,
    boundaryNdc: hiddenPoint,
    directionNdc: hiddenPoint,
    perpendicularOffsetNdc: hiddenPoint,
    lengthNdc: 0,
    ribbonVerticesClip: Object.freeze([]),
    indices: Object.freeze([]),
    primitive: 'NON_INDEXED_GL_TRIANGLES_OPEN_QUAD',
  });
}

function clipRayToViewport(
  core: THREE.Vector2,
  direction: THREE.Vector2,
): Readonly<{ start: THREE.Vector2; end: THREE.Vector2 }> | undefined {
  let enter = 0;
  let exit = Number.POSITIVE_INFINITY;
  for (const [origin, delta] of [[core.x, direction.x], [core.y, direction.y]] as const) {
    if (Math.abs(delta) < 1e-12) {
      if (origin < -1 || origin > 1) return undefined;
      continue;
    }
    const first = (-1 - origin) / delta;
    const second = (1 - origin) / delta;
    const minimum = Math.min(first, second);
    const maximum = Math.max(first, second);
    enter = Math.max(enter, minimum);
    exit = Math.min(exit, maximum);
  }
  const startParameter = Math.max(0, enter);
  if (!Number.isFinite(exit) || exit <= startParameter + 1e-9) return undefined;
  return Object.freeze({
    start: core.clone().addScaledVector(direction, startParameter),
    end: core.clone().addScaledVector(direction, exit),
  });
}

function ribbonVertices(
  start: THREE.Vector2,
  end: THREE.Vector2,
  offset: THREE.Vector2,
): readonly EarthAxisRibbonVertex[] {
  const vertex = (point: THREE.Vector2, side: number): EarthAxisRibbonVertex => Object.freeze({
    x: point.x + side * offset.x,
    y: point.y + side * offset.y,
    z: EARTH_AXIS_RIBBON_CLIP_DEPTH,
    w: 1,
  });
  const startMinus = vertex(start, -1);
  const endMinus = vertex(end, -1);
  const startPlus = vertex(start, 1);
  const endPlus = vertex(end, 1);
  return Object.freeze([
    startMinus, endMinus, startPlus,
    endMinus, endPlus, startPlus,
  ]);
}

function segment(
  half: EarthAxisHalf,
  coreClip: THREE.Vector4,
  directionView: Readonly<{ x: number; y: number; z: number }>,
  projectionMatrix: THREE.Matrix4,
  viewportPixels: THREE.Vector2,
): EarthAxisProjectedSegment {
  const directionClipVector = new THREE.Vector4(
    directionView.x,
    directionView.y,
    directionView.z,
    0,
  ).applyMatrix4(projectionMatrix);
  const directionClip = Object.freeze({
    x: directionClipVector.x,
    y: directionClipVector.y,
    z: directionClipVector.z,
    w: directionClipVector.w,
  });
  if (!finite([...directionClipVector.toArray(), ...coreClip.toArray()])) {
    return hiddenSegment(half, 'non-finite-clip-state', directionClip);
  }
  if (coreClip.w === 0) {
    return hiddenSegment(half, 'finite-core-has-zero-clip-w', directionClip);
  }
  const coreNdc = new THREE.Vector2(coreClip.x / coreClip.w, coreClip.y / coreClip.w);
  // Exact derivative of (C.xy + tD.xy) / (C.w + tD.w) at t=0.
  // This preserves the orientation of the projective direction instead of
  // treating a w=0 pole as an ordinary finite endpoint.
  const directionNdc = new THREE.Vector2(
    directionClip.x * coreClip.w - coreClip.x * directionClip.w,
    directionClip.y * coreClip.w - coreClip.y * directionClip.w,
  );
  const derivativeLength = directionNdc.length();
  if (!finite([...coreNdc.toArray(), ...directionNdc.toArray()]) || derivativeLength === 0) {
    return hiddenSegment(half, 'degenerate-projective-direction', directionClip);
  }
  directionNdc.multiplyScalar(1 / derivativeLength);
  const clipped = clipRayToViewport(coreNdc, directionNdc);
  if (!clipped) return hiddenSegment(half, 'half-line-misses-viewport', directionClip);

  const pixelDirection = new THREE.Vector2(
    directionNdc.x * viewportPixels.x,
    directionNdc.y * viewportPixels.y,
  ).normalize();
  const pixelPerpendicular = new THREE.Vector2(-pixelDirection.y, pixelDirection.x);
  const offset = new THREE.Vector2(
    pixelPerpendicular.x * 2 * EARTH_AXIS_RIBBON_HALF_WIDTH_PIXELS / viewportPixels.x,
    pixelPerpendicular.y * 2 * EARTH_AXIS_RIBBON_HALF_WIDTH_PIXELS / viewportPixels.y,
  );
  const vertices = ribbonVertices(clipped.start, clipped.end, offset);
  if (!finite(vertices.flatMap(({ x, y, z, w }) => [x, y, z, w]))) {
    return hiddenSegment(half, 'non-finite-ribbon-vertices', directionClip);
  }
  return Object.freeze({
    half,
    visible: true,
    reason: 'valid',
    projectiveDirectionClip: directionClip,
    startNdc: Object.freeze({ x: clipped.start.x, y: clipped.start.y }),
    boundaryNdc: Object.freeze({ x: clipped.end.x, y: clipped.end.y }),
    directionNdc: Object.freeze({ x: directionNdc.x, y: directionNdc.y }),
    perpendicularOffsetNdc: Object.freeze({ x: offset.x, y: offset.y }),
    lengthNdc: clipped.start.distanceTo(clipped.end),
    ribbonVerticesClip: vertices,
    indices: Object.freeze([]),
    primitive: 'NON_INDEXED_GL_TRIANGLES_OPEN_QUAD',
  });
}

/** Projects two independent, open core-to-boundary half-axis segments. */
export function createEarthAxisProjectedSegments(
  frame: EarthAxisCameraRelativeFrame,
  projectionMatrix: THREE.Matrix4,
  viewportPixels: Readonly<{ x: number; y: number }>,
): EarthAxisProjectedSegments {
  const viewport = new THREE.Vector2(viewportPixels.x, viewportPixels.y);
  const coreClipVector = new THREE.Vector4(
    frame.coreView.x,
    frame.coreView.y,
    frame.coreView.z,
    1,
  ).applyMatrix4(projectionMatrix);
  const coreClip = Object.freeze({
    x: coreClipVector.x,
    y: coreClipVector.y,
    z: coreClipVector.z,
    w: coreClipVector.w,
  });
  const coreNdc = coreClip.w !== 0 && finite([...coreClipVector.toArray()])
    ? Object.freeze({ x: coreClip.x / coreClip.w, y: coreClip.y / coreClip.w })
    : hiddenPoint;
  if (!finite([viewport.x, viewport.y]) || viewport.x <= 0 || viewport.y <= 0) {
    return Object.freeze({
      coreClip,
      coreNdc,
      north: hiddenSegment('north', 'invalid-viewport'),
      south: hiddenSegment('south', 'invalid-viewport'),
      oppositeDirectionDot: Number.NaN,
      anyTriangleSpansBothHalves: false,
    });
  }
  const north = segment('north', coreClipVector, frame.northDirectionView, projectionMatrix, viewport);
  const south = segment('south', coreClipVector, frame.southDirectionView, projectionMatrix, viewport);
  const oppositeDirectionDot = north.visible && south.visible
    ? north.directionNdc.x * south.directionNdc.x + north.directionNdc.y * south.directionNdc.y
    : Number.NaN;
  return Object.freeze({
    coreClip,
    coreNdc,
    north,
    south,
    oppositeDirectionDot,
    anyTriangleSpansBothHalves: false,
  });
}
