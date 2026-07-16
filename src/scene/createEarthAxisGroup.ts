import * as THREE from 'three';
import type { EarthAxisPresentationModel, PresentationPoint } from '../presentation/earthAxisPresentationModel';

type PoleLabelFactory = (text: 'NCP' | 'SCP', color: string) => THREE.Sprite;

function createLine(color: number): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
  );
}

function createPoleLabel(text: 'NCP' | 'SCP', color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is required for celestial-pole labels.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 52px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.shadowColor = 'rgba(0, 0, 0, 0.7)';
  context.shadowBlur = 8;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  sprite.scale.set(0.34, 0.17, 1);
  return sprite;
}

function setLine(
  line: THREE.Line,
  endpoint: PresentationPoint,
  visible: boolean,
  opacity: number,
): void {
  const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
  positions.setXYZ(0, 0, 0, 0);
  positions.setXYZ(1, endpoint.x, endpoint.y, endpoint.z);
  positions.needsUpdate = true;
  line.geometry.computeBoundingSphere();
  line.visible = visible;
  (line.material as THREE.LineBasicMaterial).opacity = opacity;
}

function setPosition(target: THREE.Object3D, position: PresentationPoint): void {
  target.position.set(position.x, position.y, position.z);
}

export interface EarthAxisGroupHandle {
  readonly group: THREE.Group;
  update(model: EarthAxisPresentationModel): void;
  clear(): void;
}

/** One persistent group owns both axis halves, the observer proxy, and both antipodal endpoints. */
export function createEarthAxisGroup(
  labelFactory: PoleLabelFactory = createPoleLabel,
): EarthAxisGroupHandle {
  const group = new THREE.Group();
  group.name = 'celestial-earth-axis-frame';
  group.visible = false;

  const northSegment = createLine(0xffd67a);
  northSegment.name = 'mean-earth-axis-north-segment';
  const southSegment = createLine(0x78d7e8);
  southSegment.name = 'mean-earth-axis-south-segment';

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0xeafcff, transparent: true, opacity: 0.78 }),
  );
  origin.name = 'celestial-axis-observer-origin';

  const markerGeometry = new THREE.SphereGeometry(0.055, 20, 12);
  const northMarker = new THREE.Mesh(
    markerGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffdc84, transparent: true, opacity: 0.92 }),
  );
  northMarker.name = 'north-celestial-pole-marker';
  const southMarker = new THREE.Mesh(
    markerGeometry,
    new THREE.MeshBasicMaterial({ color: 0x83dceb, transparent: true, opacity: 0.86 }),
  );
  southMarker.name = 'south-celestial-pole-marker';

  const northLabel = labelFactory('NCP', '#ffe39a');
  northLabel.name = 'north-celestial-pole-label';
  const southLabel = labelFactory('SCP', '#9be8f2');
  southLabel.name = 'south-celestial-pole-label';

  group.add(
    northSegment,
    southSegment,
    origin,
    northMarker,
    southMarker,
    northLabel,
    southLabel,
  );

  return Object.freeze({
    group,
    update(model: EarthAxisPresentationModel): void {
      setLine(northSegment, model.north.position, model.north.segmentVisible, model.north.segmentOpacity);
      setLine(southSegment, model.south.position, model.south.segmentVisible, model.south.segmentOpacity);
      setPosition(northMarker, model.north.position);
      setPosition(southMarker, model.south.position);
      setPosition(northLabel, model.north.position);
      setPosition(southLabel, model.south.position);
      const northLength = northLabel.position.length();
      const southLength = southLabel.position.length();
      if (northLength > 0) northLabel.position.addScaledVector(northLabel.position, 0.1 / northLength);
      if (southLength > 0) southLabel.position.addScaledVector(southLabel.position, 0.1 / southLength);
      northLabel.position.y += 0.24;
      southLabel.position.y += 0.24;
      northMarker.visible = model.north.markerVisible;
      southMarker.visible = model.south.markerVisible;
      northLabel.visible = model.north.labelVisible;
      southLabel.visible = model.south.labelVisible;
      origin.visible = model.showOrigin;
      (northMarker.material as THREE.MeshBasicMaterial).opacity = Math.max(0.28, model.north.segmentOpacity);
      (southMarker.material as THREE.MeshBasicMaterial).opacity = Math.max(0.28, model.south.segmentOpacity);
      (northLabel.material as THREE.SpriteMaterial).opacity = Math.max(0.35, model.north.segmentOpacity);
      (southLabel.material as THREE.SpriteMaterial).opacity = Math.max(0.35, model.south.segmentOpacity);
      group.userData.snapshotCacheKey = model.snapshotIdentity.cacheKey;
      group.userData.acceptedCalibrationRevision = model.snapshotIdentity.acceptedCalibrationRevision;
      group.userData.presentationRadiusMeters = model.presentationRadiusMeters;
      group.visible =
        model.north.segmentVisible ||
        model.south.segmentVisible ||
        model.north.markerVisible ||
        model.south.markerVisible ||
        model.north.labelVisible ||
        model.south.labelVisible;
    },
    clear(): void {
      group.visible = false;
      group.userData.snapshotCacheKey = undefined;
      group.userData.acceptedCalibrationRevision = undefined;
    },
  });
}
