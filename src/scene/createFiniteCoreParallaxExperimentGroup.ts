import * as THREE from 'three';
import type {
  FiniteCoreParallaxModel,
  FiniteCoreParallaxModelResult,
} from '../presentation/finiteCoreParallaxExperiment';

export const FINITE_CORE_PARALLAX_ROOT_NAME = 'finite-core-parallax-experiment';
export const FINITE_CORE_PARALLAX_PROXY_NAME = 'finite-core-holographic-proxy';

export interface FiniteCoreProjectionSample {
  readonly eye: 'left' | 'right' | 'mono' | 'unknown';
  readonly cameraWorldPosition: readonly [number, number, number];
  readonly proxyNdc: readonly [number, number, number];
}

export interface FiniteCoreParallaxDiagnostics {
  readonly enabled: boolean;
  readonly submittedDrawObjectNames: readonly string[];
  readonly suppressedComponentNames: readonly string[];
  readonly suppressionReason?: string;
  readonly proxyParentHierarchy: readonly string[];
  readonly proxyLocalPosition: readonly [number, number, number];
  readonly proxyLocalRotation: readonly [number, number, number];
  readonly proxyLocalScale: readonly [number, number, number];
  readonly proxyWorldPosition: readonly [number, number, number];
  readonly proxyWorldMatrix: readonly number[];
  readonly projectionSamples: readonly FiniteCoreProjectionSample[];
  readonly stereoDisparityNdcX?: number;
  readonly cameraTranslation: readonly [number, number, number];
  readonly projectedProxyChange: readonly [number, number];
  readonly finiteState: boolean;
}

export interface FiniteCoreParallaxExperimentGroupHandle {
  readonly group: THREE.Group;
  update(model: FiniteCoreParallaxModelResult, enabled: boolean): void;
  clear(reason?: string): void;
  sampleProjection(cameras: readonly THREE.Camera[]): FiniteCoreParallaxDiagnostics;
  getDiagnostics(): FiniteCoreParallaxDiagnostics;
  dispose(): void;
}

function finite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function tuple3(x: number, y: number, z: number): readonly [number, number, number] {
  return Object.freeze([x, y, z]);
}

function tuple2(x: number, y: number): readonly [number, number] {
  return Object.freeze([x, y]);
}

function eyeFor(camera: THREE.Camera): FiniteCoreProjectionSample['eye'] {
  const mask = camera.layers.mask >>> 0;
  const left = (mask & (1 << 1)) !== 0;
  const right = (mask & (1 << 2)) !== 0;
  if (left && !right) return 'left';
  if (right && !left) return 'right';
  return camera.name === 'left' || camera.name === 'right' ? camera.name : 'mono';
}

export function projectFiniteWorldPosition(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera,
): THREE.Vector3 | undefined {
  camera.updateMatrixWorld(true);
  const projected = worldPosition.clone().project(camera);
  return finite(projected.toArray()) ? projected : undefined;
}

function parentHierarchy(object: THREE.Object3D): readonly string[] {
  const names: string[] = [];
  let current: THREE.Object3D | null = object;
  while (current) {
    names.unshift(current.name || current.type);
    current = current.parent;
  }
  return Object.freeze(names);
}

/**
 * One ordinary, finite local-meter mesh. Three.js applies each XR eye's native
 * model-view and projection matrices; this object never has an onBeforeRender
 * callback and never mutates in response to a camera.
 */
export function createFiniteCoreParallaxExperimentGroup(
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
): FiniteCoreParallaxExperimentGroupHandle {
  const group = new THREE.Group();
  group.name = FINITE_CORE_PARALLAX_ROOT_NAME;
  group.visible = false;

  const geometry = new THREE.IcosahedronGeometry(0.06, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0x9cecff,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const proxy = new THREE.Mesh(geometry, material);
  proxy.name = FINITE_CORE_PARALLAX_PROXY_NAME;
  proxy.visible = false;
  proxy.frustumCulled = true;
  proxy.userData.presentationKind = 'finite-local-meter-core-proxy';
  proxy.userData.cameraAttached = false;
  proxy.userData.perEyeMutation = false;
  group.add(proxy);

  let disposed = false;
  let model: FiniteCoreParallaxModel | undefined;
  let previousCameraPosition: THREE.Vector3 | undefined;
  let previousProjectedPosition: THREE.Vector2 | undefined;
  let diagnostics: FiniteCoreParallaxDiagnostics = Object.freeze({
    enabled: false,
    submittedDrawObjectNames: Object.freeze([]),
    suppressedComponentNames: Object.freeze([]),
    proxyParentHierarchy: Object.freeze([FINITE_CORE_PARALLAX_ROOT_NAME, FINITE_CORE_PARALLAX_PROXY_NAME]),
    proxyLocalPosition: tuple3(0, 0, 0),
    proxyLocalRotation: tuple3(0, 0, 0),
    proxyLocalScale: tuple3(1, 1, 1),
    proxyWorldPosition: tuple3(0, 0, 0),
    proxyWorldMatrix: Object.freeze(new THREE.Matrix4().toArray()),
    projectionSamples: Object.freeze([]),
    cameraTranslation: tuple3(0, 0, 0),
    projectedProxyChange: tuple2(0, 0),
    finiteState: true,
  });

  const report = (event: string, detail: string): void => {
    try { reportDiagnostic(event, detail); } catch { /* diagnostics must never affect rendering */ }
  };

  const suppress = (reason: string): void => {
    model = undefined;
    proxy.visible = false;
    group.visible = false;
    diagnostics = Object.freeze({
      ...diagnostics,
      enabled: false,
      submittedDrawObjectNames: Object.freeze([]),
      suppressedComponentNames: Object.freeze([FINITE_CORE_PARALLAX_PROXY_NAME]),
      suppressionReason: reason,
      projectionSamples: Object.freeze([]),
      stereoDisparityNdcX: undefined,
      finiteState: false,
    });
    report('finite-core.component-suppressed', `${FINITE_CORE_PARALLAX_PROXY_NAME}|${reason}`);
  };

  return Object.freeze({
    group,
    update(next: FiniteCoreParallaxModelResult, enabled: boolean) {
      if (disposed) return;
      if (!enabled) {
        model = undefined;
        proxy.visible = false;
        group.visible = false;
        diagnostics = Object.freeze({
          ...diagnostics,
          enabled: false,
          submittedDrawObjectNames: Object.freeze([]),
          suppressedComponentNames: Object.freeze([]),
          suppressionReason: undefined,
          finiteState: true,
        });
        return;
      }
      if (next.kind === 'not-ready') {
        suppress(`${next.reason}: ${next.detail}`);
        return;
      }
      const position = next.proxyPositionMeters;
      if (!finite([position.x, position.y, position.z, next.proxyRadiusMeters])) {
        suppress('non-finite proxy transform');
        return;
      }
      model = next;
      proxy.position.set(position.x, position.y, position.z);
      proxy.scale.setScalar(next.proxyRadiusMeters / 0.06);
      proxy.visible = true;
      group.visible = true;
      group.updateMatrixWorld(true);
      const world = proxy.getWorldPosition(new THREE.Vector3());
      diagnostics = Object.freeze({
        ...diagnostics,
        enabled: true,
        submittedDrawObjectNames: Object.freeze([FINITE_CORE_PARALLAX_PROXY_NAME]),
        suppressedComponentNames: Object.freeze([]),
        suppressionReason: undefined,
        proxyParentHierarchy: parentHierarchy(proxy),
        proxyLocalPosition: tuple3(position.x, position.y, position.z),
        proxyLocalRotation: tuple3(proxy.rotation.x, proxy.rotation.y, proxy.rotation.z),
        proxyLocalScale: tuple3(proxy.scale.x, proxy.scale.y, proxy.scale.z),
        proxyWorldPosition: tuple3(world.x, world.y, world.z),
        proxyWorldMatrix: Object.freeze(proxy.matrixWorld.toArray()),
        finiteState: finite([...world.toArray(), ...proxy.scale.toArray()]),
      });
    },
    clear(reason = 'experiment disabled') {
      if (disposed) return;
      if (reason === 'experiment disabled') {
        model = undefined;
        proxy.visible = false;
        group.visible = false;
        diagnostics = Object.freeze({
          ...diagnostics,
          enabled: false,
          submittedDrawObjectNames: Object.freeze([]),
          suppressedComponentNames: Object.freeze([]),
          suppressionReason: undefined,
          finiteState: true,
        });
      } else suppress(reason);
    },
    sampleProjection(cameras: readonly THREE.Camera[]) {
      if (disposed || !model || !group.visible || !proxy.visible) return diagnostics;
      group.updateMatrixWorld(true);
      const world = proxy.getWorldPosition(new THREE.Vector3());
      const samples: FiniteCoreProjectionSample[] = [];
      for (const camera of cameras) {
        const projected = projectFiniteWorldPosition(world, camera);
        const cameraWorld = camera.getWorldPosition(new THREE.Vector3());
        if (!projected || !finite(cameraWorld.toArray())) continue;
        samples.push(Object.freeze({
          eye: eyeFor(camera),
          cameraWorldPosition: tuple3(cameraWorld.x, cameraWorld.y, cameraWorld.z),
          proxyNdc: tuple3(projected.x, projected.y, projected.z),
        }));
      }
      const left = samples.find((sample) => sample.eye === 'left');
      const right = samples.find((sample) => sample.eye === 'right');
      const representative = samples[0];
      const cameraPosition = representative
        ? new THREE.Vector3(...representative.cameraWorldPosition)
        : undefined;
      const projectedPosition = representative
        ? new THREE.Vector2(representative.proxyNdc[0], representative.proxyNdc[1])
        : undefined;
      const cameraTranslation = cameraPosition && previousCameraPosition
        ? cameraPosition.clone().sub(previousCameraPosition)
        : new THREE.Vector3();
      const projectedChange = projectedPosition && previousProjectedPosition
        ? projectedPosition.clone().sub(previousProjectedPosition)
        : new THREE.Vector2();
      if (cameraPosition) previousCameraPosition = cameraPosition;
      if (projectedPosition) previousProjectedPosition = projectedPosition;
      diagnostics = Object.freeze({
        ...diagnostics,
        proxyParentHierarchy: parentHierarchy(proxy),
        proxyWorldPosition: tuple3(world.x, world.y, world.z),
        proxyWorldMatrix: Object.freeze(proxy.matrixWorld.toArray()),
        projectionSamples: Object.freeze(samples),
        stereoDisparityNdcX: left && right ? right.proxyNdc[0] - left.proxyNdc[0] : undefined,
        cameraTranslation: tuple3(cameraTranslation.x, cameraTranslation.y, cameraTranslation.z),
        projectedProxyChange: tuple2(projectedChange.x, projectedChange.y),
        finiteState: finite([
          ...world.toArray(),
          ...samples.flatMap((sample) => [...sample.cameraWorldPosition, ...sample.proxyNdc]),
        ]),
      });
      return diagnostics;
    },
    getDiagnostics() { return diagnostics; },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      material.dispose();
      group.removeFromParent();
      group.clear();
      diagnostics = Object.freeze({ ...diagnostics, enabled: false, submittedDrawObjectNames: Object.freeze([]) });
    },
  });
}
