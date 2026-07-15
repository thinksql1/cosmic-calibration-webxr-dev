import * as THREE from 'three';

const HORIZON_RADIUS_METERS = 1.5;

function createHorizonRing(): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  const segments = 128;

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * HORIZON_RADIUS_METERS,
        0,
        Math.sin(angle) * HORIZON_RADIUS_METERS,
      ),
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x73d7e8,
    transparent: true,
    opacity: 0.72,
  });
  return new THREE.LineLoop(geometry, material);
}

function createZenithNadirLine(): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -1.25, 0),
    new THREE.Vector3(0, 2.25, 0),
  ]);
  const material = new THREE.LineBasicMaterial({
    color: 0xd8f4ff,
    transparent: true,
    opacity: 0.62,
  });
  return new THREE.Line(geometry, material);
}

export function createReferenceScene(): THREE.Scene {
  const scene = new THREE.Scene();
  const referenceFrame = new THREE.Group();
  referenceFrame.name = 'floor-relative-reference-frame';

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xf2fcff }),
  );
  origin.name = 'floor-origin';
  origin.position.y = 0.045;

  const axes = new THREE.AxesHelper(0.9);
  axes.name = 'room-relative-axes';

  const horizonRing = createHorizonRing();
  horizonRing.name = 'floor-horizon-ring';

  const vertical = createZenithNadirLine();
  vertical.name = 'zenith-nadir-line';

  referenceFrame.add(origin, axes, horizonRing, vertical);
  scene.add(referenceFrame);
  return scene;
}
