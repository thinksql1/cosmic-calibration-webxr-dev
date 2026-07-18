import * as THREE from 'three';
import {
  DEFAULT_EYE_PRESENTATION_MODE,
  eyeModeIncludesView,
  parseEyePresentationMode,
  parseXrEyeIdentity,
  type EyePresentationMode,
  type XrEyeIdentity,
} from '../presentation/eyePresentationMode';

const DESKTOP_LAYER_INDEX = 0;
const XR_VIEW_LAYER_OFFSET = 1;
const MAX_THREE_LAYER_INDEX = 31;

export interface XrViewIdentitySource {
  readonly eye: XrEyeIdentity;
}

export interface EyePresentationDiagnostics {
  readonly mode: EyePresentationMode;
  readonly context: 'desktop-mono-fallback' | 'xr-no-view' | 'xr-views';
  readonly viewEyes: readonly XrEyeIdentity[];
  readonly renderedEyes: readonly XrEyeIdentity[];
  readonly suppressedEyes: readonly XrEyeIdentity[];
  readonly layerMask: number;
}

export interface EyePresentationLayerFilter {
  readonly mode: EyePresentationMode;
  readonly diagnostics: EyePresentationDiagnostics;
  setMode(mode: EyePresentationMode): void;
  applyViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  dispose(): void;
}

function maskForLayer(layerIndex: number): number {
  if (!Number.isSafeInteger(layerIndex) || layerIndex < 0 || layerIndex > MAX_THREE_LAYER_INDEX) {
    throw new Error('XR view count exceeds the supported Three.js presentation layers.');
  }
  return (1 << layerIndex) >>> 0;
}

function immutableDiagnostics(
  mode: EyePresentationMode,
  views?: readonly XrViewIdentitySource[],
  xrPresenting = false,
): EyePresentationDiagnostics {
  if (!views || views.length === 0) {
    if (xrPresenting) {
      return Object.freeze({
        mode,
        context: 'xr-no-view',
        viewEyes: Object.freeze([]),
        renderedEyes: Object.freeze([]),
        suppressedEyes: Object.freeze([]),
        layerMask: 0,
      });
    }
    return Object.freeze({
      mode,
      context: 'desktop-mono-fallback',
      viewEyes: Object.freeze([]),
      renderedEyes: Object.freeze(['none'] as const),
      suppressedEyes: Object.freeze([]),
      layerMask: maskForLayer(DESKTOP_LAYER_INDEX),
    });
  }

  let layerMask = 0;
  const viewEyes: XrEyeIdentity[] = [];
  const renderedEyes: XrEyeIdentity[] = [];
  const suppressedEyes: XrEyeIdentity[] = [];
  views.forEach((view, viewIndex) => {
    const eye = parseXrEyeIdentity(view.eye);
    viewEyes.push(eye);
    if (eyeModeIncludesView(mode, eye)) {
      renderedEyes.push(eye);
      // Three.js assigns XR subcamera i to layer i + 1. XRView.eye decides
      // whether that renderer channel is selected; view order is never used
      // as a substitute for left/right identity.
      layerMask = (layerMask | maskForLayer(viewIndex + XR_VIEW_LAYER_OFFSET)) >>> 0;
    } else {
      suppressedEyes.push(eye);
    }
  });
  return Object.freeze({
    mode,
    context: 'xr-views',
    viewEyes: Object.freeze(viewEyes),
    renderedEyes: Object.freeze(renderedEyes),
    suppressedEyes: Object.freeze(suppressedEyes),
    layerMask,
  });
}

/**
 * Applies presentation visibility to persistent scene objects through the
 * view-index channels Three.js assigns to its XR subcameras. Scientific and
 * camera-relative data are untouched and no per-eye geometry is created.
 */
export function createEyePresentationLayerFilter(
  root: THREE.Object3D,
  initialMode: EyePresentationMode = DEFAULT_EYE_PRESENTATION_MODE,
): EyePresentationLayerFilter {
  const objects: THREE.Object3D[] = [];
  root.traverse((object) => objects.push(object));
  let mode = parseEyePresentationMode(initialMode);
  let views: readonly XrViewIdentitySource[] | undefined;
  let xrPresenting = false;
  let diagnostics = immutableDiagnostics(mode);
  let disposed = false;

  function apply(): void {
    if (disposed) throw new Error('Eye-presentation filter has been disposed.');
    diagnostics = immutableDiagnostics(mode, views, xrPresenting);
    for (const object of objects) object.layers.mask = diagnostics.layerMask;
    root.userData.eyePresentation = diagnostics;
  }

  apply();
  return {
    get mode() {
      return mode;
    },
    get diagnostics() {
      return diagnostics;
    },
    setMode(nextMode: EyePresentationMode): void {
      mode = parseEyePresentationMode(nextMode);
      apply();
    },
    applyViews(nextViews?: readonly XrViewIdentitySource[], nextXrPresenting = false): void {
      views = nextViews;
      xrPresenting = nextXrPresenting;
      apply();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      views = undefined;
      xrPresenting = false;
      root.userData.eyePresentation = undefined;
    },
  };
}
