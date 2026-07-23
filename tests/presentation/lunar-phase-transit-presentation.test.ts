import { describe, expect, it } from 'vitest';
import { createRealSkyEquatorialOrientation } from '../../src/science/astronomy/realSkyEquatorialOrientation';
import { LunarPhaseTransitService } from '../../src/science/moon/lunarPhaseTransit';
import { createLunarPhaseTransitPresentation } from '../../src/presentation/lunarPhaseTransitPresentation';
import { lunarTransitFixture } from '../lunarTransitFixture';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';

describe('Lunar Phase Transit presentation', () => {
  it('builds a complete bounded path, exact event notches, and a continuous current point', () => {
    const { providers, snapshot } = lunarTransitFixture();
    const transit = new LunarPhaseTransitService(providers).capture(snapshot);
    const orientation = createRealSkyEquatorialOrientation(
      snapshot.clock.instant,
      snapshot.observer.observer,
    );
    if (orientation.kind !== 'ready') throw new Error(orientation.reason);
    const model = createLunarPhaseTransitPresentation(
      transit,
      orientation,
      createGeocentricCelestialStructurePresentation(snapshot),
      {
      showPath: true,
      showEarthHiddenPath: true,
      showNotches: true,
      showImages: false,
      showLabels: false,
      showCurrentTransit: true,
      labelPreset: 'medium',
      },
    );
    expect(model.events).toHaveLength(8);
    expect(model.diagnostics.renderedVertexCount).toBeGreaterThanOrEqual(
      model.diagnostics.providerSampleCount,
    );
    expect(model.diagnostics.maximumRenderedAngularSpacingDeg).toBeLessThanOrEqual(1.000001);
    expect(model.diagnostics.aboveHorizonCount).toBeGreaterThan(0);
    expect(model.diagnostics.earthHiddenCount).toBeGreaterThan(0);
    expect(model.events.every((event) => event.pathAlignmentErrorDeg < 1e-5)).toBe(true);
    expect(model.events.every((event) => event.notchDirectionsEqj.length === 2)).toBe(true);
    expect(model.current.pathErrorDeg).toBeLessThan(0.1);
    expect(model.renderedEqjDirections.every((direction) =>
      [direction.x, direction.y, direction.z].every(Number.isFinite))).toBe(true);
    expect(model.diagnostics.closureErrorDeg).toBeGreaterThan(0);
  });
});
