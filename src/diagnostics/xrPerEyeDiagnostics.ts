import * as THREE from 'three';
import {
  parseXrObjectIsolation,
  XR_OBJECT_ISOLATION_STATES,
  type XrObjectIsolationState,
} from './xrObjectIsolation';

export const XR_DIAGNOSTIC_BUFFER_CAPACITY = 128;
export const XR_DIAGNOSTIC_PANEL_INTERVAL_MS = 500;
const PRESET_STORAGE_KEY = 'cosmic-calibration-xr-diagnostic-preset';
const ISOLATION_STORAGE_KEY = 'cosmic-calibration-xr-object-isolation';

export type XrDiagnosticPresetId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface XrDiagnosticPreset {
  readonly id: XrDiagnosticPresetId;
  readonly name: string;
  readonly axis: boolean;
  readonly core: boolean;
  readonly equator: boolean;
  readonly markers: boolean;
  readonly labels: boolean;
  readonly horizon: boolean;
  readonly bodies: boolean;
  readonly sunPath: boolean;
  readonly simpleUnifiedRoot: boolean;
  readonly legacyAxisRoot: boolean;
  readonly basicTarget: 'none' | 'core' | 'axis' | 'equator' | 'all';
  readonly disableFrustumCulling: boolean;
  readonly disableApplicationClipping: boolean;
}

const full = {
  axis: true, core: true, equator: true, markers: true, labels: true,
  horizon: true, bodies: true, sunPath: true,
  simpleUnifiedRoot: false, legacyAxisRoot: false,
  basicTarget: 'none' as const, disableFrustumCulling: false,
  disableApplicationClipping: false,
};

export const XR_DIAGNOSTIC_PRESETS: readonly XrDiagnosticPreset[] = Object.freeze([
  { id: 0, name: 'Current full development behavior', ...full },
  { id: 1, name: 'Calibrated horizon and compass only', ...full, axis: false, core: false, equator: false, markers: false, labels: false, bodies: false, sunPath: false },
  { id: 2, name: 'Unified root transform with minimal geometry', ...full, axis: false, core: false, equator: false, markers: false, labels: false, horizon: false, bodies: false, sunPath: false, simpleUnifiedRoot: true },
  { id: 3, name: 'Legacy stable spatial root plus new pole', ...full, core: false, equator: false, markers: false, labels: false, horizon: false, bodies: false, sunPath: false, legacyAxisRoot: true },
  { id: 4, name: 'Unified root plus Earth core only', ...full, axis: false, equator: false, markers: false, labels: false, horizon: false, bodies: false, sunPath: false, basicTarget: 'core' },
  { id: 5, name: 'Unified root plus axis/pole only', ...full, core: false, equator: false, markers: false, labels: false, horizon: false, bodies: false, sunPath: false, basicTarget: 'axis' },
  { id: 6, name: 'Unified root plus celestial equator only', ...full, axis: false, core: false, markers: false, labels: false, horizon: false, bodies: false, sunPath: false, basicTarget: 'equator' },
  { id: 7, name: 'Full geometry with frustum culling disabled', ...full, disableFrustumCulling: true },
  { id: 8, name: 'Full geometry with custom clipping disabled', ...full, disableApplicationClipping: true },
  { id: 9, name: 'Full geometry with diagnostic basic materials', ...full, basicTarget: 'all' },
]);

export interface XrDiagnosticLaunch {
  readonly enabled: boolean;
  readonly preset: XrDiagnosticPreset;
  readonly isolation: XrObjectIsolationState;
}

export function parseXrDiagnosticLaunch(
  search: string,
  storedPreset?: string | null,
  storedIsolation?: string | null,
): XrDiagnosticLaunch {
  const params = new URLSearchParams(search);
  const enabled = params.get('diag') === '1';
  const raw = params.get('preset') ?? storedPreset ?? '0';
  const numeric = Number(raw);
  const preset = XR_DIAGNOSTIC_PRESETS.find((candidate) => candidate.id === numeric)
    ?? XR_DIAGNOSTIC_PRESETS[0];
  return Object.freeze({
    enabled,
    preset,
    isolation: parseXrObjectIsolation(search, storedIsolation),
  });
}

export class BoundedDiagnosticBuffer {
  private readonly entries: string[];
  private cursor = 0;
  private total = 0;

  constructor(readonly capacity = XR_DIAGNOSTIC_BUFFER_CAPACITY) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new Error('Diagnostic buffer capacity must be a positive integer.');
    }
    this.entries = new Array<string>(capacity);
  }

  push(value: string): void {
    this.entries[this.cursor] = value;
    this.cursor = (this.cursor + 1) % this.capacity;
    this.total += 1;
  }

  clear(): void {
    this.entries.fill(undefined as unknown as string);
    this.cursor = 0;
    this.total = 0;
  }

  values(): readonly string[] {
    const count = Math.min(this.total, this.capacity);
    const start = this.total > this.capacity ? this.cursor : 0;
    return Object.freeze(Array.from({ length: count }, (_, index) =>
      this.entries[(start + index) % this.capacity]));
  }
}

export function finiteNumbers(values: ArrayLike<number>): boolean {
  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) return false;
  }
  return true;
}

export function diagnosticEye(camera: THREE.Camera): 'left' | 'right' | 'mono' | 'unknown' {
  const mask = camera.layers.mask >>> 0;
  const left = (mask & (1 << 1)) !== 0;
  const right = (mask & (1 << 2)) !== 0;
  if (left && !right) return 'left';
  if (right && !left) return 'right';
  if (!left && !right && (mask & 1) !== 0) return 'mono';
  return 'unknown';
}

export class PerEyeDiagnosticCounters {
  left = 0;
  right = 0;

  increment(eye: ReturnType<typeof diagnosticEye>): void {
    if (eye === 'left') this.left += 1;
    if (eye === 'right') this.right += 1;
  }
}

export class PerEyeDiagnosticDrawNames {
  private readonly current = {
    left: new Set<string>(),
    right: new Set<string>(),
    mono: new Set<string>(),
    unknown: new Set<string>(),
  };
  private readonly latest = {
    left: Object.freeze([]) as readonly string[],
    right: Object.freeze([]) as readonly string[],
    mono: Object.freeze([]) as readonly string[],
    unknown: Object.freeze([]) as readonly string[],
  };

  beginFrame(): void {
    Object.values(this.current).forEach((names) => names.clear());
  }

  record(eye: ReturnType<typeof diagnosticEye>, objectName: string): void {
    this.current[eye].add(objectName);
  }

  completeFrame(): void {
    (Object.keys(this.current) as Array<keyof typeof this.current>).forEach((eye) => {
      this.latest[eye] = Object.freeze([...this.current[eye]].sort());
    });
  }

  names(eye: keyof typeof this.latest): readonly string[] {
    return this.latest[eye];
  }
}

export function shouldFlushDiagnosticPanel(dirty: boolean, lastFlush: number, now: number): boolean {
  return dirty && now - lastFlush >= XR_DIAGNOSTIC_PANEL_INTERVAL_MS;
}

interface DiagnosticPanelFields {
  readonly preset: HTMLElement;
  readonly isolation: HTMLElement;
  readonly calibration: HTMLElement;
  readonly leftCount: HTMLElement;
  readonly rightCount: HTMLElement;
  readonly leftObject: HTMLElement;
  readonly rightObject: HTMLElement;
  readonly leftDraws: HTMLElement;
  readonly rightDraws: HTMLElement;
  readonly monoDraws: HTMLElement;
  readonly error: HTMLElement;
  readonly log: HTMLElement;
}

export interface DiagnosticSnapshotTargets {
  readonly referenceSpaceType: string;
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly geographicRoot: THREE.Object3D;
  readonly geocentricRoot: THREE.Object3D;
  readonly horizon: THREE.Object3D;
  readonly earthAxis: THREE.Object3D;
  readonly equator: THREE.Object3D;
  readonly grid: THREE.Object3D;
}

export interface XrPerEyeDiagnostics {
  readonly enabled: boolean;
  readonly preset: XrDiagnosticPreset;
  readonly isolation: XrObjectIsolationState;
  readonly buffer: BoundedDiagnosticBuffer;
  readonly leftCount: number;
  readonly rightCount: number;
  readonly panelFlushCount: number;
  installGlobalCapture(renderer: THREE.WebGLRenderer): void;
  instrument(root: THREE.Object3D): void;
  record(event: string, detail?: string): void;
  frameEntry(): void;
  operation(name: string): void;
  frameCompletion(completed: boolean): void;
  setCalibrationState(state: string): void;
  snapshot(label: string, yawRadians: number | undefined, targets: DiagnosticSnapshotTargets): void;
  flushPanel(now?: number): void;
  dispose(): void;
}

function describeError(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? ` | ${value.stack}` : ''}`;
  return String(value);
}

function namedObject(object: THREE.Object3D): string {
  return object.name || `${object.type}#${object.id}`;
}

function finiteObjectState(object: THREE.Object3D, camera: THREE.Camera): string {
  const material = (object as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  const materials = material ? (Array.isArray(material) ? material : [material]) : [];
  let uniformsFinite = true;
  for (const candidate of materials) {
    if (!(candidate instanceof THREE.ShaderMaterial)) continue;
    for (const uniform of Object.values(candidate.uniforms)) {
      const value = uniform.value as unknown;
      if (typeof value === 'number' && !Number.isFinite(value)) uniformsFinite = false;
      if (value instanceof THREE.Vector2 || value instanceof THREE.Vector3 || value instanceof THREE.Vector4) {
        if (!finiteNumbers(value.toArray())) uniformsFinite = false;
      }
      if (value instanceof THREE.Matrix3 || value instanceof THREE.Matrix4) {
        if (!finiteNumbers(value.elements)) uniformsFinite = false;
      }
    }
  }
  return [
    `mw=${finiteNumbers(object.matrixWorld.elements)}`,
    `mv=${finiteNumbers(object.modelViewMatrix.elements)}`,
    `p=${finiteNumbers(camera.projectionMatrix.elements)}`,
    `u=${uniformsFinite}`,
    `vis=${object.visible}`,
    `layer=${object.layers.mask >>> 0}`,
    `cull=${object.frustumCulled}`,
    `order=${object.renderOrder}`,
  ].join(',');
}

function createPanel(
  preset: XrDiagnosticPreset,
  isolation: XrObjectIsolationState,
  onClear: () => void,
): {
  readonly root: HTMLElement;
  readonly fields: DiagnosticPanelFields;
} {
  const root = document.createElement('aside');
  root.id = 'xr-diagnostic-panel';
  root.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:10000;width:min(430px,94vw);max-height:45vh;overflow:auto;background:rgba(0,0,0,.88);color:#dff;font:11px/1.35 monospace;padding:8px;border:1px solid #6cc;pointer-events:auto';
  const details = document.createElement('details');
  details.open = true;
  const summary = document.createElement('summary');
  summary.textContent = 'XR per-eye diagnostics';
  const presetSelect = document.createElement('select');
  presetSelect.setAttribute('aria-label', 'Diagnostic preset');
  for (const candidate of XR_DIAGNOSTIC_PRESETS) {
    const option = document.createElement('option');
    option.value = String(candidate.id);
    option.textContent = `${candidate.id} — ${candidate.name}`;
    option.selected = candidate.id === preset.id;
    presetSelect.append(option);
  }
  presetSelect.addEventListener('change', () => {
    localStorage.setItem(PRESET_STORAGE_KEY, presetSelect.value);
    const url = new URL(window.location.href);
    url.searchParams.set('diag', '1');
    url.searchParams.set('preset', presetSelect.value);
    window.location.assign(url);
  });
  const isolationSelect = document.createElement('select');
  isolationSelect.setAttribute('aria-label', 'Object isolation');
  for (const candidate of XR_OBJECT_ISOLATION_STATES) {
    const option = document.createElement('option');
    option.value = candidate.id;
    option.textContent = `${candidate.id} — ${candidate.name}`;
    option.selected = candidate.id === isolation.id;
    isolationSelect.append(option);
  }
  isolationSelect.addEventListener('change', () => {
    localStorage.setItem(ISOLATION_STORAGE_KEY, isolationSelect.value);
    const url = new URL(window.location.href);
    url.searchParams.set('diag', '1');
    url.searchParams.set('isolate', isolationSelect.value);
    window.location.assign(url);
  });
  const controls = document.createElement('div');
  const copy = document.createElement('button');
  copy.textContent = 'Copy diagnostics';
  const clear = document.createElement('button');
  clear.textContent = 'Clear diagnostics';
  controls.append(copy, clear);
  const grid = document.createElement('div');
  const fields = {} as Record<keyof DiagnosticPanelFields, HTMLElement>;
  const add = (key: keyof DiagnosticPanelFields, label: string) => {
    const row = document.createElement('div');
    const value = document.createElement('span');
    row.append(`${label}: `, value);
    grid.append(row);
    fields[key] = value;
  };
  add('preset', 'Current preset');
  add('isolation', 'Object isolation');
  add('calibration', 'Calibration state');
  add('leftCount', 'Left callbacks');
  add('rightCount', 'Right callbacks');
  add('leftObject', 'Last left object');
  add('rightObject', 'Last right object');
  add('leftDraws', 'Left draw objects');
  add('rightDraws', 'Right draw objects');
  add('monoDraws', 'Mono draw objects');
  add('error', 'Latest error');
  const log = document.createElement('pre');
  log.style.cssText = 'white-space:pre-wrap;margin:6px 0 0';
  fields.log = log;
  details.append(summary, presetSelect, isolationSelect, controls, grid, log);
  root.append(details);
  document.body.append(root);
  clear.addEventListener('click', onClear);
  copy.addEventListener('click', () => void navigator.clipboard.writeText(root.innerText));
  return { root, fields: fields as unknown as DiagnosticPanelFields };
}

export function createXrPerEyeDiagnostics(
  launch = parseXrDiagnosticLaunch(
    window.location.search,
    localStorage.getItem(PRESET_STORAGE_KEY),
    localStorage.getItem(ISOLATION_STORAGE_KEY),
  ),
): XrPerEyeDiagnostics {
  const buffer = new BoundedDiagnosticBuffer();
  if (!launch.enabled) {
    const disabled: XrPerEyeDiagnostics = {
      enabled: false, preset: launch.preset, isolation: launch.isolation, buffer,
      get leftCount() { return 0; }, get rightCount() { return 0; }, get panelFlushCount() { return 0; },
      installGlobalCapture() {}, instrument() {}, record() {}, frameEntry() {}, frameCompletion() {},
      operation() {}, setCalibrationState() {}, snapshot() {}, flushPanel() {}, dispose() {},
    };
    return Object.freeze(disabled);
  }

  let calibrationState = 'unknown';
  const counters = new PerEyeDiagnosticCounters();
  const drawNames = new PerEyeDiagnosticDrawNames();
  let lastLeft = 'none';
  let lastRight = 'none';
  let latestError = 'none';
  let dirty = true;
  let lastFlush = -Infinity;
  let panelFlushCount = 0;
  let xrActive = false;
  let frameOpen = false;
  let lastFrameCompleted = true;
  let currentOperation = 'none';
  const signatures = new Map<string, string>();
  const instrumentedObjects = new WeakSet<THREE.Object3D>();
  const restorers: Array<() => void> = [];
  let panel: ReturnType<typeof createPanel>;

  const timestamp = () => performance.now().toFixed(1).padStart(8, ' ');
  const record = (event: string, detail = '') => {
    buffer.push(`${timestamp()} ${event}${detail ? ` | ${detail}` : ''}`);
    dirty = true;
  };
  const clear = () => {
    buffer.clear();
    latestError = 'none';
    dirty = true;
  };
  panel = createPanel(launch.preset, launch.isolation, clear);

  const api: XrPerEyeDiagnostics = {
    enabled: true,
    preset: launch.preset,
    isolation: launch.isolation,
    buffer,
    get leftCount() { return counters.left; },
    get rightCount() { return counters.right; },
    get panelFlushCount() { return panelFlushCount; },
    installGlobalCapture(renderer): void {
      const onError = (event: ErrorEvent) => {
        const next = `${event.message} @ ${event.filename}:${event.lineno}`;
        if (next !== latestError) { latestError = next; record('window.error', latestError); }
      };
      const onRejection = (event: PromiseRejectionEvent) => {
        const next = describeError(event.reason);
        if (next !== latestError) { latestError = next; record('unhandledrejection', latestError); }
      };
      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
      restorers.push(() => window.removeEventListener('error', onError));
      restorers.push(() => window.removeEventListener('unhandledrejection', onRejection));
      const originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        if (xrActive) {
          const next = args.map(describeError).join(' ');
          if (next !== latestError) { latestError = next; record('console.error', latestError); }
        }
        originalConsoleError(...args);
      };
      restorers.push(() => { console.error = originalConsoleError; });
      const start = () => { xrActive = true; record('xr.session.start'); };
      const end = () => { record('xr.session.end'); xrActive = false; };
      renderer.xr.addEventListener('sessionstart', start);
      renderer.xr.addEventListener('sessionend', end);
      restorers.push(() => renderer.xr.removeEventListener('sessionstart', start));
      restorers.push(() => renderer.xr.removeEventListener('sessionend', end));
      const lost = (event: Event) => record('webgl.context.lost', event.type);
      const restored = () => record('webgl.context.restored');
      renderer.domElement.addEventListener('webglcontextlost', lost);
      renderer.domElement.addEventListener('webglcontextrestored', restored);
      restorers.push(() => renderer.domElement.removeEventListener('webglcontextlost', lost));
      restorers.push(() => renderer.domElement.removeEventListener('webglcontextrestored', restored));
      record('capture.installed', `shaderChecks=${renderer.debug.checkShaderErrors}`);
    },
    instrument(root): void {
      let installed = 0;
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.Sprite)) return;
        if (instrumentedObjects.has(object)) return;
        instrumentedObjects.add(object);
        installed += 1;
        const originalBefore = object.onBeforeRender;
        const originalAfter = object.onAfterRender;
        const name = namedObject(object);
        object.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
          const eye = diagnosticEye(camera);
          counters.increment(eye);
          drawNames.record(eye, name);
          if (eye === 'left') lastLeft = `${name}:entry`;
          if (eye === 'right') lastRight = `${name}:entry`;
          const signature = finiteObjectState(object, camera);
          const key = `${eye}:${name}:entry`;
          if (signatures.get(key) !== signature) {
            signatures.set(key, signature);
            record('callback.entry', `${eye} ${name} ${signature}`);
          }
          try {
            originalBefore.call(object, renderer, scene, camera, geometry, material, group);
          } catch (error) {
            latestError = `${eye} ${name} before: ${describeError(error)}`;
            record('callback.throw', latestError);
            throw error;
          }
        };
        object.onAfterRender = (renderer, scene, camera, geometry, material, group) => {
          const eye = diagnosticEye(camera);
          try {
            originalAfter.call(object, renderer, scene, camera, geometry, material, group);
          } catch (error) {
            latestError = `${eye} ${name} after: ${describeError(error)}`;
            record('callback.throw', latestError);
            throw error;
          }
          if (eye === 'left') lastLeft = `${name}:exit`;
          if (eye === 'right') lastRight = `${name}:exit`;
          const signature = finiteObjectState(object, camera);
          const key = `${eye}:${name}:exit`;
          if (signatures.get(key) !== signature) {
            signatures.set(key, signature);
            record('callback.exit', `${eye} ${name} ${signature}`);
          }
        };
        restorers.push(() => { object.onBeforeRender = originalBefore; object.onAfterRender = originalAfter; });
      });
      if (installed > 0) record('render.trace.installed', `objects=${installed}`);
    },
    record,
    frameEntry(): void {
      frameOpen = true;
      drawNames.beginFrame();
      currentOperation = 'frame-entry';
    },
    operation(name): void {
      currentOperation = name;
    },
    frameCompletion(completed): void {
      if (frameOpen && !completed && lastFrameCompleted) record('frame.incomplete', `operation=${currentOperation}`);
      if (frameOpen && completed && !lastFrameCompleted) record('frame.recovered');
      lastFrameCompleted = completed;
      drawNames.completeFrame();
      frameOpen = false;
      dirty = true;
    },
    setCalibrationState(state): void {
      if (state === calibrationState) return;
      record('calibration.state', `${calibrationState}->${state}`);
      calibrationState = state;
    },
    snapshot(label, yawRadians, targets): void {
      targets.geographicRoot.updateWorldMatrix(true, true);
      const objectState = (name: string, object: THREE.Object3D) => {
        object.updateMatrix();
        return `${name}{p=${object.position.toArray().map((v) => v.toFixed(3))};q=${object.quaternion.toArray().map((v) => v.toFixed(4))};s=${object.scale.toArray().map((v) => v.toFixed(3))};m=${finiteNumbers(object.matrix.elements)};mw=${finiteNumbers(object.matrixWorld.elements)}}`;
      };
      const horizonLine = targets.horizon.getObjectByName('local-astronomical-horizon-circle') as THREE.Line | undefined;
      const horizonPosition = horizonLine?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      const horizonSamples = horizonPosition && horizonPosition.count >= 8
        ? [
            ['north', Math.floor(horizonPosition.count / 4)],
            ['west', Math.floor(horizonPosition.count / 2)],
            ['northwest', Math.floor(3 * horizonPosition.count / 8)],
            ['south', Math.floor(3 * horizonPosition.count / 4)],
            ['east', 0],
          ].map(([label, rawIndex]) => {
            const index = Number(rawIndex);
            return `${label}:${horizonPosition.getX(index).toFixed(2)},${horizonPosition.getY(index).toFixed(2)},${horizonPosition.getZ(index).toFixed(2)}`;
          }).join(';')
        : 'unavailable';
      let visible = 0;
      let boundsFinite = true;
      targets.geographicRoot.traverse((object) => {
        if (object.visible) visible += 1;
        const geometry = (object as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
        if (!geometry) return;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        if (geometry.boundingSphere && (!finiteNumbers(geometry.boundingSphere.center.toArray()) || !Number.isFinite(geometry.boundingSphere.radius))) boundsFinite = false;
        if (geometry.boundingBox && (!finiteNumbers(geometry.boundingBox.min.toArray()) || !finiteNumbers(geometry.boundingBox.max.toArray()))) boundsFinite = false;
      });
      record(`snapshot.${label}`, [
        `ref=${targets.referenceSpaceType}`,
        `yaw=${yawRadians?.toFixed(6) ?? 'none'}`,
        `camera=${targets.camera.near}/${targets.camera.far}`,
        `clip=${targets.renderer.clippingPlanes.length}`,
        `visible=${visible}`,
        `bounds=${boundsFinite}`,
        objectState('geo', targets.geographicRoot),
        objectState('geocentric', targets.geocentricRoot),
        objectState('horizon', targets.horizon),
        objectState('axis', targets.earthAxis),
        objectState('equator', targets.equator),
        objectState('grid', targets.grid),
        `horizonPoints=${horizonSamples}`,
      ].join(' | '));
    },
    flushPanel(now = performance.now()): void {
      if (!shouldFlushDiagnosticPanel(dirty, lastFlush, now)) return;
      panel.fields.preset.textContent = `${launch.preset.id} — ${launch.preset.name}`;
      panel.fields.isolation.textContent = `${launch.isolation.id} — ${launch.isolation.name}`;
      panel.fields.calibration.textContent = calibrationState;
      panel.fields.leftCount.textContent = String(counters.left);
      panel.fields.rightCount.textContent = String(counters.right);
      panel.fields.leftObject.textContent = lastLeft;
      panel.fields.rightObject.textContent = lastRight;
      panel.fields.leftDraws.textContent = drawNames.names('left').join(', ') || 'none';
      panel.fields.rightDraws.textContent = drawNames.names('right').join(', ') || 'none';
      panel.fields.monoDraws.textContent = drawNames.names('mono').join(', ') || 'none';
      panel.fields.error.textContent = latestError;
      panel.fields.log.textContent = buffer.values().join('\n');
      lastFlush = now;
      panelFlushCount += 1;
      dirty = false;
    },
    dispose(): void {
      restorers.splice(0).reverse().forEach((restore) => restore());
      panel.root.remove();
    },
  };
  return Object.freeze(api);
}

export function applyBasicDiagnosticMaterials(root: THREE.Object3D, target: XrDiagnosticPreset['basicTarget']): void {
  if (target === 'none') return;
  root.traverse((object) => {
    const name = namedObject(object);
    const selected = target === 'all'
      || (target === 'core' && name === 'modeled-earth-core-marker')
      || (target === 'axis' && name.startsWith('mean-earth-axis-rigid-spindle'))
      || (target === 'equator' && name === 'celestial-equator-ring');
    if (!selected) return;
    if (name.startsWith('mean-earth-axis-rigid-spindle-')) {
      // The open spindle quads are meaningful only through their per-eye
      // projection shader. Replacing that shader would expose the unit-quad
      // template as unrelated screen geometry and invalidate the preset.
      object.userData.diagnosticBasicMaterialSkipped =
        'projective-open-segment-requires-projection-shader';
      return;
    }
    const original = (object as THREE.Mesh).material as THREE.Material & { uniforms?: Record<string, THREE.IUniform> };
    let replacement: THREE.Material;
    if (object instanceof THREE.Line) replacement = new THREE.LineBasicMaterial({ color: 0xff4df0, depthTest: false });
    else if (object instanceof THREE.Points) replacement = new THREE.PointsMaterial({ color: 0xff4df0, size: 0.04, depthTest: false });
    else if (object instanceof THREE.Mesh) replacement = new THREE.MeshBasicMaterial({ color: 0xff4df0, wireframe: true, depthTest: false });
    else return;
    // Existing update methods may continue writing their bounded values; basic
    // materials ignore them while retaining the same non-scientific lifecycle.
    (replacement as THREE.Material & { uniforms?: Record<string, THREE.IUniform> }).uniforms = original.uniforms;
    (object as THREE.Mesh).material = replacement;
    object.onBeforeRender = () => undefined;
    object.onAfterRender = () => undefined;
    object.frustumCulled = false;
    object.userData.diagnosticBasicMaterial = true;
  });
}

export function createSimpleUnifiedRootDiagnostic(): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, 0, 0),
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -0.5),
  ]);
  const axes = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xff4df0, depthTest: false }));
  axes.name = 'diagnostic-unified-root-axes';
  axes.frustumCulled = false;
  axes.renderOrder = 40;
  return axes;
}
