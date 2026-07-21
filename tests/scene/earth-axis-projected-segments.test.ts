import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { EarthAxisCameraRelativeFrame } from '../../src/scene/earthAxisCameraRelativeFrame';
import {
  createEarthAxisProjectedSegments,
  EARTH_AXIS_RIBBON_HALF_WIDTH_PIXELS,
  type EarthAxisProjectedSegment,
} from '../../src/scene/earthAxisProjectedSegments';

const extent = 1e13;
const inverseExtent = 1 / extent;

function frame(coreX = 0, northX = 0.6, northY = 0.8): EarthAxisCameraRelativeFrame {
  const direction = new THREE.Vector3(northX, northY, 0).normalize();
  const core = { x: coreX, y: 0, z: -5 };
  const cameraVector = (units: 'meters' | 'unitless', value: THREE.Vector3) => Object.freeze({
    frame: 'CAMERA_VIEW' as const,
    units,
    x: value.x,
    y: value.y,
    z: value.z,
  });
  const spindlePoint = (coefficient: -1 | 0 | 1) => Object.freeze({
    frame: 'CAMERA_VIEW_HOMOGENEOUS' as const,
    units: 'DISPLAY_EXTENT_SCALED' as const,
    x: core.x * inverseExtent + direction.x * coefficient,
    y: core.y * inverseExtent + direction.y * coefficient,
    z: core.z * inverseExtent + direction.z * coefficient,
    w: inverseExtent,
  });
  const north = cameraVector('unitless', direction);
  const south = cameraVector('unitless', direction.clone().negate());
  return Object.freeze({
    kind: 'CAMERA_RELATIVE_HOMOGENEOUS_EARTH_AXIS',
    renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES',
    coreView: cameraVector('meters', new THREE.Vector3(core.x, core.y, core.z)),
    northDirectionView: north,
    southDirectionView: south,
    spindleCore: spindlePoint(0),
    spindleNorthEndpoint: spindlePoint(1),
    spindleSouthEndpoint: spindlePoint(-1),
    spindleDisplayExtentMeters: extent,
    cameraRelativeCoreMagnitudeMeters: 5,
    maximumUploadedComponentMagnitude: 5,
    float32CoreQuantizationErrorMeters: 0,
    float32DirectionAngularErrorArcseconds: 0,
  });
}

function projection(): THREE.Matrix4 {
  const camera = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
  camera.updateProjectionMatrix();
  return camera.projectionMatrix;
}

function centerAt(segment: EarthAxisProjectedSegment, end: 'start' | 'boundary'): THREE.Vector2 {
  const vertices = segment.ribbonVerticesClip;
  const indexes = end === 'start' ? [0, 2] : [1, 4];
  return new THREE.Vector2(
    (vertices[indexes[0]].x + vertices[indexes[1]].x) / 2,
    (vertices[indexes[0]].y + vertices[indexes[1]].y) / 2,
  );
}

describe('open projected Earth-axis segments', () => {
  it('creates two separate non-indexed open triangle primitives with no cyclic edge', () => {
    const result = createEarthAxisProjectedSegments(frame(), projection(), { x: 1024, y: 1024 });
    expect(result.north.visible).toBe(true);
    expect(result.south.visible).toBe(true);
    for (const segment of [result.north, result.south]) {
      expect(segment.primitive).toBe('NON_INDEXED_GL_TRIANGLES_OPEN_QUAD');
      expect(segment.indices).toEqual([]);
      expect(segment.ribbonVerticesClip).toHaveLength(6);
    }
    expect(result.north.ribbonVerticesClip).not.toBe(result.south.ribbonVerticesClip);
    expect(result.anyTriangleSpansBothHalves).toBe(false);

    // A screenshot-independent topology proof: each triangle belongs to one
    // half-array, neither array has an index that can wrap to the other, and
    // the three center anchors have zero enclosed area rather than a loop.
    const n = result.north.boundaryNdc;
    const c = result.coreNdc;
    const s = result.south.boundaryNdc;
    const twiceAnchorArea = (n.x - c.x) * (s.y - c.y) - (n.y - c.y) * (s.x - c.x);
    expect(twiceAnchorArea).toBeCloseTo(0, 12);
  });

  it('keeps both endpoints collinear, opposite, and every center edge straight in NDC', () => {
    const result = createEarthAxisProjectedSegments(frame(), projection(), { x: 1440, y: 900 });
    const core = new THREE.Vector2(result.coreNdc.x, result.coreNdc.y);
    const north = new THREE.Vector2(result.north.boundaryNdc.x, result.north.boundaryNdc.y).sub(core);
    const south = new THREE.Vector2(result.south.boundaryNdc.x, result.south.boundaryNdc.y).sub(core);
    expect(north.x * south.y - north.y * south.x).toBeCloseTo(0, 12);
    expect(north.dot(south)).toBeLessThan(0);
    expect(result.oppositeDirectionDot).toBeCloseTo(-1, 12);
    for (const segment of [result.north, result.south]) {
      expect(centerAt(segment, 'start').distanceTo(new THREE.Vector2(
        segment.startNdc.x,
        segment.startNdc.y,
      ))).toBeLessThan(1e-12);
      expect(centerAt(segment, 'boundary').distanceTo(new THREE.Vector2(
        segment.boundaryNdc.x,
        segment.boundaryNdc.y,
      ))).toBeLessThan(1e-12);
    }
  });

  it('holds an approximately three-pixel ribbon width', () => {
    const viewport = { x: 1440, y: 900 };
    const result = createEarthAxisProjectedSegments(frame(), projection(), viewport);
    for (const segment of [result.north, result.south]) {
      const [minus, , plus] = segment.ribbonVerticesClip;
      const widthPixels = Math.hypot(
        (plus.x - minus.x) * viewport.x / 2,
        (plus.y - minus.y) * viewport.y / 2,
      );
      expect(widthPixels).toBeCloseTo(2 * EARTH_AXIS_RIBBON_HALF_WIDTH_PIXELS, 10);
    }
  });

  it('evaluates slightly separated XR eyes independently without shared mutation', () => {
    const leftFrame = frame(0.032);
    const rightFrame = frame(-0.032);
    const leftSnapshot = JSON.stringify(leftFrame);
    const rightSnapshot = JSON.stringify(rightFrame);
    const left = createEarthAxisProjectedSegments(leftFrame, projection(), { x: 1024, y: 1024 });
    const right = createEarthAxisProjectedSegments(rightFrame, projection(), { x: 1024, y: 1024 });
    expect(left.coreNdc.x).not.toBe(right.coreNdc.x);
    expect(left.north.ribbonVerticesClip).not.toBe(right.north.ribbonVerticesClip);
    expect(JSON.stringify(leftFrame)).toBe(leftSnapshot);
    expect(JSON.stringify(rightFrame)).toBe(rightSnapshot);
  });

  it('suppresses only an invalid half while preserving the valid opposite segment', () => {
    const valid = frame();
    const invalidNorth = Object.freeze({
      ...valid,
      northDirectionView: Object.freeze({ ...valid.northDirectionView, x: Number.NaN }),
    });
    const result = createEarthAxisProjectedSegments(invalidNorth, projection(), { x: 1024, y: 1024 });
    expect(result.north).toMatchObject({ visible: false, reason: 'non-finite-clip-state' });
    expect(result.south).toMatchObject({ visible: true, reason: 'valid' });
    expect(result.south.ribbonVerticesClip).toHaveLength(6);
  });
});
