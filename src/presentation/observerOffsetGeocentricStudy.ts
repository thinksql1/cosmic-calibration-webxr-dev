export const OBSERVER_OFFSET_GEO_STUDY_MODES = Object.freeze([
  'baseline', 'core-radius', 'surface-point', 'wireframe-earth', 'tangent-plane', 'combined',
] as const);

export type ObserverOffsetGeoStudyMode = typeof OBSERVER_OFFSET_GEO_STUDY_MODES[number];

export interface ObserverOffsetGeoStudySettings {
  readonly mode: ObserverOffsetGeoStudyMode;
  readonly showRadius: boolean;
  readonly showSurfacePoint: boolean;
  readonly showEarthWireframe: boolean;
  readonly showTangentPlane: boolean;
  readonly showLocalAxes: boolean;
  readonly showLabels: boolean;
  readonly opacity: number;
}

export function parseObserverOffsetGeoStudyMode(search: string): ObserverOffsetGeoStudyMode {
  const mode = new URLSearchParams(search).get('geoStudy') ?? 'baseline';
  return (OBSERVER_OFFSET_GEO_STUDY_MODES as readonly string[]).includes(mode)
    ? mode as ObserverOffsetGeoStudyMode
    : 'baseline';
}

export function defaultObserverOffsetGeoStudySettings(
  mode: ObserverOffsetGeoStudyMode,
): ObserverOffsetGeoStudySettings {
  const combined = mode === 'combined';
  return Object.freeze({
    mode,
    showRadius: combined || mode === 'core-radius',
    showSurfacePoint: combined || mode === 'surface-point',
    showEarthWireframe: combined || mode === 'wireframe-earth',
    showTangentPlane: combined || mode === 'tangent-plane',
    showLocalAxes: combined || mode === 'tangent-plane',
    showLabels: false,
    opacity: 0.42,
  });
}

export function selectedObserverOffsetGeoStudyComponents(
  settings: ObserverOffsetGeoStudySettings,
): readonly string[] {
  if (settings.mode === 'baseline') return Object.freeze([]);
  return Object.freeze([
    settings.showRadius ? 'observer-to-earth-core-radius' : '',
    settings.showSurfacePoint ? 'observer-reference-surface-marker' : '',
    settings.showEarthWireframe ? 'reference-earth-wireframe' : '',
    settings.showTangentPlane ? 'observer-local-tangent-plane' : '',
    settings.showTangentPlane && settings.showLocalAxes ? 'observer-local-north-axis' : '',
    settings.showTangentPlane && settings.showLocalAxes ? 'observer-local-east-axis' : '',
  ].filter(Boolean));
}
