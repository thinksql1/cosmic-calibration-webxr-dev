import * as THREE from 'three';
import type { EarthAxisPresentationModel, PresentationPoint } from '../presentation/earthAxisPresentationModel';

type PoleLabelFactory = (text: 'NCP' | 'SCP', color: string) => THREE.Sprite;

function createLine(color: number): THREE.Line {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      depthWrite: false,
    }),
  );
  line.frustumCulled = false;
  line.renderOrder = 20;
  return line;
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
  sprite.frustumCulled = false;
  sprite.renderOrder = 30;
  return sprite;
}

function setLine(
  line: THREE.Line,
  origin: PresentationPoint,
  endpoint: PresentationPoint,
  visible: boolean,
  opacity: number,
): void {
  const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
  positions.setXYZ(0, origin.x, origin.y, origin.z);
  positions.setXYZ(1, endpoint.x, endpoint.y, endpoint.z);
  positions.needsUpdate = true;
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

/** One persistent group owns the modeled Earth core, geocentric line, and projective pole proxies. */
export function createEarthAxisGroup(
  labelFactory: PoleLabelFactory = createPoleLabel,
): EarthAxisGroupHandle {
  const group = new THREE.Group();
  group.name = 'celestial-geocentric-earth-axis-frame';
  group.visible = false;

  const northSegment = createLine(0xffd67a);
  northSegment.name = 'mean-earth-axis-north-segment';
  const southSegment = createLine(0x78d7e8);
  southSegment.name = 'mean-earth-axis-south-segment';

  const earthCore = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 12),
    new THREE.MeshBasicMaterial({
      color: 0xeafcff,
      transparent: true,
      opacity: 0.82,
      depthTest: false,
      depthWrite: false,
    }),
  );
  earthCore.name = 'modeled-earth-core-marker';
  earthCore.frustumCulled = false;
  earthCore.renderOrder = 25;

  const markerGeometry = new THREE.SphereGeometry(1, 20, 12);
  const northMarker = new THREE.Mesh(
    markerGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffdc84,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
      depthWrite: false,
    }),
  );
  northMarker.name = 'north-celestial-pole-marker';
  northMarker.frustumCulled = false;
  northMarker.renderOrder = 26;
  const southMarker = new THREE.Mesh(
    markerGeometry,
    new THREE.MeshBasicMaterial({
      color: 0x83dceb,
      transparent: true,
      opacity: 0.86,
      depthTest: false,
      depthWrite: false,
    }),
  );
  southMarker.name = 'south-celestial-pole-marker';
  southMarker.frustumCulled = false;
  southMarker.renderOrder = 26;

  const northLabel = labelFactory('NCP', '#ffe39a');
  northLabel.name = 'north-celestial-pole-label';
  const southLabel = labelFactory('SCP', '#9be8f2');
  southLabel.name = 'south-celestial-pole-label';

  group.add(
    northSegment,
    southSegment,
    earthCore,
    northMarker,
    southMarker,
    northLabel,
    southLabel,
  );

  return Object.freeze({
    group,
    update(model: EarthAxisPresentationModel): void {
      setLine(
        northSegment,
        model.earthCore,
        model.north.renderPosition,
        model.north.segmentVisible,
        model.north.segmentOpacity,
      );
      setLine(
        southSegment,
        model.earthCore,
        model.south.renderPosition,
        model.south.segmentVisible,
        model.south.segmentOpacity,
      );
      setPosition(earthCore, model.earthCore);
      setPosition(northMarker, model.north.renderPosition);
      setPosition(southMarker, model.south.renderPosition);
      setPosition(northLabel, model.north.renderPosition);
      setPosition(southLabel, model.south.renderPosition);
      northLabel.position.y += model.poleLabelHeightMeters * 0.65;
      southLabel.position.y += model.poleLabelHeightMeters * 0.65;
      earthCore.scale.setScalar(model.earthCoreVisualRadiusMeters);
      northMarker.scale.setScalar(model.poleMarkerVisualRadiusMeters);
      southMarker.scale.setScalar(model.poleMarkerVisualRadiusMeters);
      northLabel.scale.set(
        model.poleLabelWidthMeters,
        model.poleLabelHeightMeters,
        1,
      );
      southLabel.scale.copy(northLabel.scale);
      earthCore.visible = model.earthCoreVisible;
      northMarker.visible = model.north.markerVisible;
      southMarker.visible = model.south.markerVisible;
      northLabel.visible = model.north.labelVisible;
      southLabel.visible = model.south.labelVisible;
      (northMarker.material as THREE.MeshBasicMaterial).opacity = Math.max(0.28, model.north.segmentOpacity);
      (southMarker.material as THREE.MeshBasicMaterial).opacity = Math.max(0.28, model.south.segmentOpacity);
      (northLabel.material as THREE.SpriteMaterial).opacity = Math.max(0.35, model.north.segmentOpacity);
      (southLabel.material as THREE.SpriteMaterial).opacity = Math.max(0.35, model.south.segmentOpacity);
      group.userData.snapshotCacheKey = model.snapshotIdentity.cacheKey;
      group.userData.acceptedCalibrationRevision = model.snapshotIdentity.acceptedCalibrationRevision;
      group.userData.presentationKind = model.presentationKind;
      group.userData.observerToCoreDistanceMeters = model.observerToCoreDistanceMeters;
      group.visible =
        model.north.segmentVisible ||
        model.south.segmentVisible ||
        model.earthCoreVisible ||
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
