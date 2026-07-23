import { describe, expect, it } from 'vitest';
import { LunarPhaseTransitService } from '../../src/science/moon/lunarPhaseTransit';
import { lunarTransitFixture } from '../lunarTransitFixture';

describe('authoritative Lunar Phase Transit science', () => {
  it('brackets one lunation, finds all eight actual phase events, and samples apparent topocentric EQJ', () => {
    const { providers, snapshot } = lunarTransitFixture();
    const service = new LunarPhaseTransitService(providers);
    const transit = service.capture(snapshot);
    expect(transit.previousNewMoon.unixMilliseconds).toBeLessThan(snapshot.clock.instant.unixMilliseconds);
    expect(transit.nextNewMoon.unixMilliseconds).toBeGreaterThan(snapshot.clock.instant.unixMilliseconds);
    expect(transit.durationDays).toBeGreaterThan(28);
    expect(transit.durationDays).toBeLessThan(31);
    expect(transit.events.map((event) => event.phase.angleDeg)).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    expect(transit.events.map((event) => event.instant.unixMilliseconds)).toEqual(
      [...transit.events].map((event) => event.instant.unixMilliseconds).sort((a, b) => a - b),
    );
    expect(transit.events.every((event) =>
      event.instant.unixMilliseconds >= transit.previousNewMoon.unixMilliseconds
      && event.instant.unixMilliseconds < transit.nextNewMoon.unixMilliseconds)).toBe(true);
    expect(transit.provenance).toMatchObject({
      coordinateMode: 'APPARENT_TOPOCENTRIC_EQJ',
      sourceFrame: 'EQJ_J2000',
      topocentricParallax: 'included',
      phaseEvents: 'ASTRONOMY_ENGINE_SEARCH_MOON_PHASE',
    });
    expect(transit.samples.length).toBeGreaterThan(650);
    expect(transit.samples.length).toBeLessThanOrEqual(800);
    for (let index = 1; index < transit.samples.length; index += 1) {
      expect(transit.samples[index]!.instant.unixMilliseconds).toBeGreaterThan(
        transit.samples[index - 1]!.instant.unixMilliseconds,
      );
      expect(
        transit.samples[index]!.instant.unixMilliseconds
        - transit.samples[index - 1]!.instant.unixMilliseconds,
      ).toBeLessThanOrEqual(60 * 60_000);
    }
    expect(transit.samples.every((sample) =>
      Math.abs(Math.hypot(
        sample.directionEqj.x,
        sample.directionEqj.y,
        sample.directionEqj.z,
      ) - 1) < 1e-10)).toBe(true);
    expect(transit.current.progressFraction).toBeGreaterThanOrEqual(0);
    expect(transit.current.progressFraction).toBeLessThanOrEqual(1);
    expect(transit.current.nextPhase.name).not.toBe(transit.current.previousPhase.name);
    expect(service.capture(snapshot).events).toBe(transit.events);
  });

  it('provider arbitrary-angle searches agree with the established phase convention', () => {
    const { providers, snapshot } = lunarTransitFixture();
    const event = providers.astronomy.searchMoonPhaseEvent(45, snapshot.clock.instant, 35);
    expect(event?.targetPhaseLongitudeDeg).toBe(45);
    if (!event) throw new Error('Expected 45-degree phase event');
    const longitude = providers.astronomy.getMoonPhaseLongitudeDeg(event.eventInstant);
    expect(Math.abs(longitude - 45)).toBeLessThan(1e-5);
  });
});
