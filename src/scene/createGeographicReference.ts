import * as THREE from 'three';
import { type NorthCalibrationState } from '../calibration/state';

const CARDINAL_RADIUS_METERS = 1.5;
const LINE_HEIGHT_METERS = 0.008;

function createLine(points: THREE.Vector3[], color: number, opacity: number): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

function createLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is required for cardinal labels.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 78px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.shadowColor = 'rgba(0, 0, 0, 0.55)';
  context.shadowBlur = 8;
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.setScalar(0.28);
  sprite.name = `cardinal-${text.toLowerCase()}`;
  return sprite;
}

export function createGeographicReferenceGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'geographic-reference-frame';
  group.visible = false;

  const northSouth = createLine(
    [
      new THREE.Vector3(0, LINE_HEIGHT_METERS, -CARDINAL_RADIUS_METERS),
      new THREE.Vector3(0, LINE_HEIGHT_METERS, CARDINAL_RADIUS_METERS),
    ],
    0xf4d47a,
    0.82,
  );
  northSouth.name = 'geographic-north-south-line';

  const eastWest = createLine(
    [
      new THREE.Vector3(-CARDINAL_RADIUS_METERS, LINE_HEIGHT_METERS, 0),
      new THREE.Vector3(CARDINAL_RADIUS_METERS, LINE_HEIGHT_METERS, 0),
    ],
    0x8adce8,
    0.64,
  );
  eastWest.name = 'geographic-east-west-line';

  const north = createLabel('N', '#ffe39a');
  north.position.set(0, 0.18, -CARDINAL_RADIUS_METERS);
  const south = createLabel('S', '#b7e7ed');
  south.position.set(0, 0.18, CARDINAL_RADIUS_METERS);
  const east = createLabel('E', '#b7e7ed');
  east.position.set(CARDINAL_RADIUS_METERS, 0.18, 0);
  const west = createLabel('W', '#b7e7ed');
  west.position.set(-CARDINAL_RADIUS_METERS, 0.18, 0);

  group.add(northSouth, eastWest, north, south, east, west);
  return group;
}

export interface GeographicGroupTarget {
  readonly rotation: { y: number };
  visible: boolean;
}

export function applyCalibrationToGeographicGroup(
  group: GeographicGroupTarget,
  state: NorthCalibrationState,
): void {
  if (state.kind !== 'calibrated') {
    group.visible = false;
    return;
  }

  group.rotation.y = state.calibration.yawRadians;
  group.visible = true;
}
