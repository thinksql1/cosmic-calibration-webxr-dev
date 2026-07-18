import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createLocalHorizonGroup } from '../../src/scene/createLocalHorizonGroup';
import { LOCAL_HORIZON_SAMPLE_COUNT } from '../../src/presentation/localHorizonPresentationModel';

const sources = import.meta.glob(
  [
    '../../src/presentation/eyePresentationMode.ts',
    '../../src/presentation/localHorizonPresentationModel.ts',
    '../../src/scene/eyePresentationLayerFilter.ts',
    '../../src/scene/createLocalHorizonGroup.ts',
    '../../src/main.ts',
  ],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

describe('eye-mode and local-horizon boundaries', () => {
  it('uses actual XRView.eye identity and never infers an eye from position alone', () => {
    const main = sources['../../src/main.ts'];
    const filter = sources['../../src/scene/eyePresentationLayerFilter.ts'];
    expect(main).toContain('frame.getViewerPose(referenceSpace)');
    expect(main).toContain('pose?.views');
    expect(filter).toContain('parseXrEyeIdentity(view.eye)');
    expect(filter).not.toMatch(/camera(?:Position)?\.x\s*[<>]/);
  });

  it('keeps the local horizon free of P03, Earth-core, and celestial-equator recomputation', () => {
    const horizonSources = [
      sources['../../src/presentation/localHorizonPresentationModel.ts'],
      sources['../../src/scene/createLocalHorizonGroup.ts'],
    ].join('\n');
    expect(horizonSources).not.toContain('computeP03BiasPrecessionMatrix');
    expect(horizonSources).not.toMatch(/import .*earthAxis/);
    expect(horizonSources).not.toMatch(/import .*celestialEquator/);
    expect(horizonSources).not.toContain('astronomy-engine');
    expect(horizonSources).not.toContain('camera.forward');
  });

  it('keeps the bounded local horizon on linear non-writing depth', () => {
    const handle = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
    const line = handle.group.children[0] as THREE.LineLoop;
    const material = line.material as THREE.LineBasicMaterial;
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(material.transparent).toBe(true);
    expect(sources['../../src/main.ts']).not.toContain('logarithmicDepthBuffer');
    handle.dispose();
  });

  it('contains no deferred celestial or temporal implementation in the new modules', () => {
    const combined = Object.entries(sources)
      .filter(([path]) => path.includes('eyePresentation') || path.includes('LocalHorizon'))
      .map(([, source]) => source)
      .join('\n');
    expect(combined).not.toMatch(/precessionTrajectory|ecliptic|sunProvider|moonProvider|planetProvider|animationRate/);
  });
});
