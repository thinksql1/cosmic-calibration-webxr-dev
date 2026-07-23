import * as THREE from 'three';
import type { CelestialCoordinateGridPresentationModel, CelestialGridLine } from '../presentation/celestialCoordinateGridPresentationModel';
import type { Matrix3Rows } from '../science/astronomy/realSkyEquatorialOrientation';
import { createEyePresentationLayerFilter, type EyePresentationDiagnostics, type XrViewIdentitySource } from './eyePresentationLayerFilter';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.998;
function matrixIsFinite(matrix: THREE.Matrix4): boolean { return matrix.elements.every(Number.isFinite); }
const vertexShader = /* glsl */ `
  uniform float uProjectiveW;
  uniform float uDrawEnabled;
  uniform vec3 uEncodedCore;
  uniform mat3 uDirectionRotation;
  uniform float uApplyDirectionRotation;
  void main() {
    if (uDrawEnabled < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec3 orientedPosition = position;
    if (uApplyDirectionRotation > 0.5) {
      orientedPosition = uEncodedCore + uDirectionRotation * (position - uEncodedCore);
    }
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(orientedPosition, uProjectiveW);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(uColor, uOpacity); }
`;
const IDENTITY_ROTATION_ROWS: Matrix3Rows = Object.freeze([
  Object.freeze([1, 0, 0] as const),
  Object.freeze([0, 1, 0] as const),
  Object.freeze([0, 0, 1] as const),
]);
export interface CelestialGridDirectionOrientation {
  readonly id: 'canonical' | 'real-sky';
  readonly rows: Matrix3Rows;
}
export const CANONICAL_CELESTIAL_GRID_ORIENTATION: CelestialGridDirectionOrientation = Object.freeze({
  id: 'canonical',
  rows: IDENTITY_ROTATION_ROWS,
});
export interface CelestialCoordinateGridGroupOptions {
  readonly groupName?: string;
  readonly lineNamePrefix?: string;
  readonly color?: number;
  readonly opacityMultiplier?: number;
  readonly renderOrder?: number;
}
function material(opacity: number, color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uProjectiveW: { value: 1 }, uDrawEnabled: { value: 1 }, uEncodedCore: { value: new THREE.Vector3() }, uDirectionRotation: { value: new THREE.Matrix3() }, uApplyDirectionRotation: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
}
function enabledFor(line: CelestialGridLine, model: CelestialCoordinateGridPresentationModel, showDeclination: boolean, showRightAscension: boolean): boolean {
  return model.visible && (line.family === 'declination' ? showDeclination : showRightAscension);
}
export interface CelestialCoordinateGridGroupHandle {
  readonly group: THREE.Group;
  update(model: CelestialCoordinateGridPresentationModel, settings: { readonly showDeclinationLines: boolean; readonly showRightAscensionLines: boolean }, orientation?: CelestialGridDirectionOrientation): void;
  clear(): void;
  applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  getEyePresentationDiagnostics(): EyePresentationDiagnostics;
  dispose(): void;
}

/** Owns fixed closed latitude circles and intentionally open pole-to-pole longitude arcs. */
export function createCelestialCoordinateGridGroup(
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
  options: CelestialCoordinateGridGroupOptions = {},
): CelestialCoordinateGridGroupHandle {
  const color = options.color ?? 0x77c8ff;
  const opacityMultiplier = options.opacityMultiplier ?? 1;
  const namePrefix = options.lineNamePrefix ?? '';
  const group = new THREE.Group();
  group.name = options.groupName ?? 'celestial-coordinate-grid';
  group.visible = false;
  const declinations = new THREE.Group(); declinations.name = 'celestial-declination-grid';
  const meridians = new THREE.Group(); meridians.name = 'celestial-right-ascension-grid';
  group.add(declinations, meridians);
  const entries = new Map<string, { line: THREE.Line | THREE.LineLoop; geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial; source: CelestialGridLine }>();
  const eyeFilter = createEyePresentationLayerFilter(group);
  const modelViewScratch = new THREE.Matrix4();
  let disposed = false;
  const report = (event: string, detail: string) => { try { reportDiagnostic(event, detail); } catch { /* diagnostics must not abort render */ } };

  function entryFor(source: CelestialGridLine) {
    let entry = entries.get(source.name);
    if (entry) return entry;
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.Float32BufferAttribute(source.directions.length * 3, 3);
    geometry.setAttribute('position', position);
    const lineMaterial = material(source.opacity * opacityMultiplier, color);
    const line = source.closed ? new THREE.LineLoop(geometry, lineMaterial) : new THREE.Line(geometry, lineMaterial);
    line.name = `${namePrefix}${source.name}`; line.frustumCulled = false; line.renderOrder = options.renderOrder ?? 20;
    let lastState = 'valid';
    line.onBeforeRender = (_renderer, _scene, camera) => {
      modelViewScratch.multiplyMatrices(camera.matrixWorldInverse, line.matrixWorld);
      const finite = matrixIsFinite(camera.projectionMatrix) && matrixIsFinite(modelViewScratch)
        && Number.isFinite((line.material as THREE.ShaderMaterial).uniforms.uProjectiveW.value);
      (line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value = finite ? 1 : 0;
      const state = finite ? 'valid' : 'suppressed-non-finite-eye-state';
      if (state !== lastState) { report('celestial-grid.draw-state', `${line.name}|${state}`); lastState = state; }
      line.userData.lastDrawState = state;
    };
    (source.family === 'declination' ? declinations : meridians).add(line);
    entry = { line, geometry, material: line.material as THREE.ShaderMaterial, source };
    entries.set(source.name, entry);
    return entry;
  }

  return Object.freeze({
    group,
    update(model: CelestialCoordinateGridPresentationModel, settings: { readonly showDeclinationLines: boolean; readonly showRightAscensionLines: boolean }, orientation: CelestialGridDirectionOrientation = CANONICAL_CELESTIAL_GRID_ORIENTATION): void {
      if (disposed) throw new Error('Cannot update a disposed celestial-coordinate-grid renderer.');
      const expected = new Set(model.lines.map((line: CelestialGridLine) => line.name));
      const unique = expected.size === model.lines.length;
      if (!unique) report('celestial-grid.duplicate-object-name', 'presentation model contains duplicate line names');
      let active = 0;
      const orientationMatrix = new THREE.Matrix3().set(
        orientation.rows[0][0], orientation.rows[0][1], orientation.rows[0][2],
        orientation.rows[1][0], orientation.rows[1][1], orientation.rows[1][2],
        orientation.rows[2][0], orientation.rows[2][1], orientation.rows[2][2],
      );
      const orientationFinite = orientation.rows.flat().every(Number.isFinite);
      for (const source of model.lines) {
        const entry = entryFor(source);
        const inverseRadius = 1 / model.displayRadiusMeters;
        const values = (entry.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
        let finite = Number.isFinite(inverseRadius) && inverseRadius > 0;
        let geometryChanged = false;
        source.directions.forEach((direction: { readonly x: number; readonly y: number; readonly z: number }, index: number) => {
          const x = model.earthCore.x * inverseRadius + direction.x;
          const y = model.earthCore.y * inverseRadius + direction.y;
          const z = model.earthCore.z * inverseRadius + direction.z;
          finite = finite && [x, y, z].every(Number.isFinite);
          const nextX = finite ? Math.fround(x) : 0;
          const nextY = finite ? Math.fround(y) : 0;
          const nextZ = finite ? Math.fround(z) : 0;
          geometryChanged = geometryChanged || values[index * 3] !== nextX || values[index * 3 + 1] !== nextY || values[index * 3 + 2] !== nextZ;
          values[index * 3] = nextX;
          values[index * 3 + 1] = nextY;
          values[index * 3 + 2] = nextZ;
        });
        const position = entry.geometry.getAttribute('position') as THREE.BufferAttribute;
        if (geometryChanged) position.needsUpdate = true;
        finite = finite && orientationFinite;
        entry.material.uniforms.uProjectiveW.value = finite ? Math.fround(inverseRadius) : 0;
        entry.material.uniforms.uEncodedCore.value.set(
          Math.fround(model.earthCore.x * inverseRadius),
          Math.fround(model.earthCore.y * inverseRadius),
          Math.fround(model.earthCore.z * inverseRadius),
        );
        entry.material.uniforms.uDirectionRotation.value.copy(orientationMatrix);
        entry.material.uniforms.uApplyDirectionRotation.value = orientation.id === 'real-sky' ? 1 : 0;
        entry.material.uniforms.uOpacity.value = finite ? source.opacity * opacityMultiplier : 0;
        entry.material.uniforms.uDrawEnabled.value = finite ? 1 : 0;
        entry.line.visible = finite && enabledFor(source, model, settings.showDeclinationLines, settings.showRightAscensionLines);
        if (!finite) report('celestial-grid.update-suppressed', source.name);
        if (entry.line.visible) active += 1;
      }
      group.visible = model.visible;
      declinations.visible = model.visible && settings.showDeclinationLines;
      meridians.visible = model.visible && settings.showRightAscensionLines;
      group.userData.activeLineCount = active;
      group.userData.gridEnabled = model.visible;
      group.userData.declinationEnabled = settings.showDeclinationLines;
      group.userData.rightAscensionEnabled = settings.showRightAscensionLines;
      group.userData.longitudeReference = orientation.id === 'real-sky'
        ? 'ASTRONOMY_ENGINE_EQD_TRUE_OF_DATE'
        : model.coordinateBasis.longitudeReference;
      group.userData.orientation = orientation.id;
      group.userData.geometryRebuiltForOrientation = false;
      group.userData.lineCount = model.lines.length;
      group.userData.duplicateGeometryCreation = false;
    },
    clear(): void { group.visible = false; entries.forEach(({ line }) => { line.visible = false; }); },
    applyEyePresentationViews(views: readonly XrViewIdentitySource[] | undefined, xrPresenting = false): void { eyeFilter.applyViews(views, xrPresenting); },
    getEyePresentationDiagnostics(): EyePresentationDiagnostics { return eyeFilter.diagnostics; },
    dispose(): void {
      if (disposed) return; disposed = true; eyeFilter.dispose();
      entries.forEach(({ line, geometry, material }) => { line.onBeforeRender = () => undefined; geometry.dispose(); material.dispose(); });
      entries.clear(); group.removeFromParent(); group.clear(); group.userData.disposed = true;
    },
  });
}
