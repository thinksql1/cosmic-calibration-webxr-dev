import * as THREE from 'three';
import type { CelestialCoordinateGridPresentationModel, CelestialGridLine } from '../presentation/celestialCoordinateGridPresentationModel';
import { createEyePresentationLayerFilter, type EyePresentationDiagnostics, type XrViewIdentitySource } from './eyePresentationLayerFilter';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.998;
function matrixIsFinite(matrix: THREE.Matrix4): boolean { return matrix.elements.every(Number.isFinite); }
const vertexShader = /* glsl */ `
  uniform float uProjectiveW;
  uniform float uDrawEnabled;
  void main() {
    if (uDrawEnabled < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, uProjectiveW);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(uColor, uOpacity); }
`;
function material(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uColor: { value: new THREE.Color(0x77c8ff) }, uOpacity: { value: opacity }, uProjectiveW: { value: 1 }, uDrawEnabled: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
}
function enabledFor(line: CelestialGridLine, model: CelestialCoordinateGridPresentationModel, showDeclination: boolean, showRightAscension: boolean): boolean {
  return model.visible && (line.family === 'declination' ? showDeclination : showRightAscension);
}
export interface CelestialCoordinateGridGroupHandle {
  readonly group: THREE.Group;
  update(model: CelestialCoordinateGridPresentationModel, settings: { readonly showDeclinationLines: boolean; readonly showRightAscensionLines: boolean }): void;
  clear(): void;
  applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  getEyePresentationDiagnostics(): EyePresentationDiagnostics;
  dispose(): void;
}

/** Owns fixed closed latitude circles and intentionally open pole-to-pole longitude arcs. */
export function createCelestialCoordinateGridGroup(reportDiagnostic: (event: string, detail: string) => void = () => undefined): CelestialCoordinateGridGroupHandle {
  const group = new THREE.Group();
  group.name = 'celestial-coordinate-grid';
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
    const line = source.closed ? new THREE.LineLoop(geometry, material(source.opacity)) : new THREE.Line(geometry, material(source.opacity));
    line.name = source.name; line.frustumCulled = false; line.renderOrder = 20;
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
    update(model: CelestialCoordinateGridPresentationModel, settings: { readonly showDeclinationLines: boolean; readonly showRightAscensionLines: boolean }): void {
      if (disposed) throw new Error('Cannot update a disposed celestial-coordinate-grid renderer.');
      const expected = new Set(model.lines.map((line: CelestialGridLine) => line.name));
      const unique = expected.size === model.lines.length;
      if (!unique) report('celestial-grid.duplicate-object-name', 'presentation model contains duplicate line names');
      let active = 0;
      for (const source of model.lines) {
        const entry = entryFor(source);
        const inverseRadius = 1 / model.displayRadiusMeters;
        const values = (entry.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
        let finite = Number.isFinite(inverseRadius) && inverseRadius > 0;
        source.directions.forEach((direction: { readonly x: number; readonly y: number; readonly z: number }, index: number) => {
          const x = model.earthCore.x * inverseRadius + direction.x;
          const y = model.earthCore.y * inverseRadius + direction.y;
          const z = model.earthCore.z * inverseRadius + direction.z;
          finite = finite && [x, y, z].every(Number.isFinite);
          values[index * 3] = finite ? Math.fround(x) : 0;
          values[index * 3 + 1] = finite ? Math.fround(y) : 0;
          values[index * 3 + 2] = finite ? Math.fround(z) : 0;
        });
        const position = entry.geometry.getAttribute('position') as THREE.BufferAttribute;
        position.needsUpdate = true;
        entry.material.uniforms.uProjectiveW.value = finite ? Math.fround(inverseRadius) : 0;
        entry.material.uniforms.uOpacity.value = finite ? source.opacity : 0;
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
      group.userData.longitudeReference = model.coordinateBasis.longitudeReference;
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
