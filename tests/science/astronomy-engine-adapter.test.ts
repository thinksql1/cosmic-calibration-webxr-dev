import { describe, expect, it } from 'vitest';
import packageManifest from '../../package.json';
import {
  ASTRONOMY_ENGINE_PROVIDER,
  ASTRONOMY_ENGINE_VERSION,
  getApparentTopocentricBody,
  getApparentTopocentricEquatorial,
  getObserverRelativePosition,
} from '../../src/science/astronomy/astronomyEngineAdapter';
import { APPARENT_TOPOCENTRIC_ADAPTER_VERSION } from '../../src/science/providers/astronomyProviderIdentity';
import { angularSeparationDeg } from '../../src/science/astronomy/frameTransforms';
import { createObserver } from '../../src/science/astronomy/observer';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { HORIZONS_FIXTURES } from './fixtures';

function circularDifferenceDeg(left: number, right: number): number {
  return Math.abs(((left - right + 180) % 360 + 360) % 360 - 180);
}

function horizontalDirection(
  azimuthDeg: number,
  altitudeDeg: number,
): readonly [number, number, number] {
  const azimuth = (azimuthDeg * Math.PI) / 180;
  const altitude = (altitudeDeg * Math.PI) / 180;
  const horizontal = Math.cos(altitude);
  return [
    horizontal * Math.sin(azimuth),
    horizontal * Math.cos(azimuth),
    Math.sin(altitude),
  ];
}

function equatorialDirection(
  rightAscensionDeg: number,
  declinationDeg: number,
): readonly [number, number, number] {
  const rightAscension = (rightAscensionDeg * Math.PI) / 180;
  const declination = (declinationDeg * Math.PI) / 180;
  const equatorial = Math.cos(declination);
  return [
    equatorial * Math.cos(rightAscension),
    equatorial * Math.sin(rightAscension),
    Math.sin(declination),
  ];
}

describe('Astronomy Engine adapter against JPL Horizons', () => {
  it.each(HORIZONS_FIXTURES)(
    '$id observer-relative airless position stays within the declared tolerance',
    (fixture) => {
      const instant = createSimulationInstant(
        fixture.instantUtc,
        'frozen-test',
      );
      const observer = createObserver(fixture.observer);
      const result = getObserverRelativePosition(
        fixture.body,
        instant,
        observer,
        'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      );

      expect(
        circularDifferenceDeg(result.azimuthDeg, fixture.expected.azimuthDeg),
      ).toBeLessThanOrEqual(fixture.toleranceDeg);
      expect(
        Math.abs(result.altitudeDeg - fixture.expected.altitudeDeg),
      ).toBeLessThanOrEqual(fixture.toleranceDeg);
      expect(
        angularSeparationDeg(
          [result.direction.east, result.direction.north, result.direction.up],
          horizontalDirection(
            fixture.expected.azimuthDeg,
            fixture.expected.altitudeDeg,
          ),
        ),
      ).toBeLessThanOrEqual(fixture.toleranceDeg);
      expect(result.frame).toBe('HORIZONTAL_ENU');
      expect(result.direction.frame).toBe('HORIZONTAL_ENU');
      expect(
        Math.hypot(
          result.direction.east,
          result.direction.north,
          result.direction.up,
        ),
      ).toBeCloseTo(1, 14);
      expect(fixture.source).toMatchObject({
        printedResolutionDeg: {
          equatorial: 0.00001,
          horizontal: 0.000001,
        },
        horizonsHeightDatum: 'REFERENCE_ELLIPSOID',
        adapterHeightDatum: 'MEAN_SEA_LEVEL',
        heightComparisonPolicy: 'SAME_NUMERIC_HEIGHT_NO_GEOID_CONVERSION',
      });
    },
  );

  it.each(HORIZONS_FIXTURES)(
    '$id equatorial operation is explicit and agrees with JPL',
    (fixture) => {
      const instant = createSimulationInstant(
        fixture.instantUtc,
        'frozen-test',
      );
      const observer = createObserver(fixture.observer);
      const result = getApparentTopocentricEquatorial(
        fixture.body,
        instant,
        observer,
      );

      expect(
        circularDifferenceDeg(
          result.rightAscensionHours * 15,
          fixture.expected.rightAscensionDeg,
        ),
      ).toBeLessThanOrEqual(fixture.toleranceDeg);
      expect(
        Math.abs(result.declinationDeg - fixture.expected.declinationDeg),
      ).toBeLessThanOrEqual(fixture.toleranceDeg);
      expect(
        angularSeparationDeg(
          [result.direction.x, result.direction.y, result.direction.z],
          equatorialDirection(
            fixture.expected.rightAscensionDeg,
            fixture.expected.declinationDeg,
          ),
        ),
      ).toBeLessThanOrEqual(fixture.toleranceDeg);
      expect(result.center).toBe('TOPOCENTRIC');
      expect(result.frame).toBe('EQD_TRUE');
      expect(result.coordinateClass).toBe('PROVIDER_APPARENT_TOPOCENTRIC');
      expect(result.coordinateEpoch).toBe('OF_DATE');
      expect(result.units).toEqual({
        rightAscension: 'sidereal-hours',
        declination: 'degrees',
        distance: 'AU',
        direction: 'unitless',
      });
      expect(result.direction.frame).toBe('EQD_TRUE');
    },
  );

  it('preserves a below-horizon result instead of clamping it', () => {
    const fixture = HORIZONS_FIXTURES.find(({ id }) =>
      id.includes('MOON-SYDNEY'),
    )!;
    const result = getObserverRelativePosition(
      fixture.body,
      createSimulationInstant(fixture.instantUtc, 'frozen-test'),
      createObserver(fixture.observer),
      'AE_APPARENT_TOPOCENTRIC_AIRLESS',
    );

    expect(result.altitudeDeg).toBeLessThan(-70);
    expect(result.direction.up).toBeLessThan(0);
  });

  it('returns one typed actual-position result for every bounded body without exposing provider objects', () => {
    const instant = createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test');
    const observer = createObserver({ latitudeDeg: 42, longitudeDegEast: -83, elevationMeters: 250 });
    for (const body of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const) {
      const result = getApparentTopocentricBody(body, instant, observer, 'AE_APPARENT_TOPOCENTRIC_AIRLESS');
      expect(result).toMatchObject({
        kind: 'VALID_APPARENT_TOPOCENTRIC_BODY',
        body,
        validity: 'VALID',
        correctionProfile: { id: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' },
        equatorial: { frame: 'EQD_TRUE', center: 'TOPOCENTRIC' },
        horizontal: { frame: 'HORIZONTAL_ENU', center: 'TOPOCENTRIC' },
      });
      expect(Object.isFrozen(result)).toBe(true);
    }
  });

  it('tags provider, version, units, correction profile, observer, and instant', () => {
    const fixture = HORIZONS_FIXTURES[0]!;
    const instant = createSimulationInstant(
      fixture.instantUtc,
      'frozen-test',
    );
    const observer = createObserver(fixture.observer);
    const result = getObserverRelativePosition(
      fixture.body,
      instant,
      observer,
      'AE_APPARENT_TOPOCENTRIC_AIRLESS',
    );

    expect(result.provenance).toMatchObject({
      provider: ASTRONOMY_ENGINE_PROVIDER,
      providerVersion: ASTRONOMY_ENGINE_VERSION,
      adapterVersion: APPARENT_TOPOCENTRIC_ADAPTER_VERSION,
      simulationInstant: instant,
      observer,
      sourceFrame: 'EQD_TRUE',
      outputFrame: 'HORIZONTAL_ENU',
      correctionProfile: {
        id: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
        refraction: 'disabled',
        nutation: 'included',
        gravitationalDeflection: 'not-documented',
      },
    });
    expect(packageManifest.dependencies['astronomy-engine']).toBe(
      ASTRONOMY_ENGINE_VERSION,
    );
    expect(result.direction.units).toBe('unitless');
    expect(result.units).toEqual({
      azimuth: 'degrees',
      altitude: 'degrees',
      direction: 'unitless',
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('applies normal refraction only when the named profile requests it', () => {
    const fixture = HORIZONS_FIXTURES[0]!;
    const instant = createSimulationInstant(
      fixture.instantUtc,
      'frozen-test',
    );
    const observer = createObserver(fixture.observer);
    const airless = getObserverRelativePosition(
      fixture.body,
      instant,
      observer,
      'AE_APPARENT_TOPOCENTRIC_AIRLESS',
    );
    const refracted = getObserverRelativePosition(
      fixture.body,
      instant,
      observer,
      'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION',
    );

    expect(refracted.altitudeDeg).toBeGreaterThan(airless.altitudeDeg);
    expect(refracted.provenance.correctionProfile.refraction).toBe('normal');
    expect(airless.provenance.correctionProfile.refraction).toBe('disabled');
  });

  it('is deterministic for frozen inputs', () => {
    const fixture = HORIZONS_FIXTURES[1]!;
    const instant = createSimulationInstant(
      fixture.instantUtc,
      'frozen-test',
    );
    const observer = createObserver(fixture.observer);
    const operation = () =>
      getObserverRelativePosition(
        fixture.body,
        instant,
        observer,
        'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      );

    expect(operation()).toEqual(operation());
  });

  it('rejects an elevation datum it cannot convert safely', () => {
    const observer = createObserver({
      latitudeDeg: 0,
      longitudeDegEast: 0,
      elevationMeters: 0,
      verticalDatum: 'WGS84_ELLIPSOID',
    });
    expect(() =>
      getObserverRelativePosition(
        'Sun',
        createSimulationInstant('2025-01-01T00:00:00Z', 'frozen-test'),
        observer,
        'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'UNSUPPORTED_VERTICAL_DATUM' }),
    );
  });

  it.each(['__proto__', 'IAU_P03_MEAN_PRECESSION_ONLY'])(
    'rejects unsupported horizontal correction profile %s at runtime',
    (profile) => {
    const fixture = HORIZONS_FIXTURES[0]!;
    expect(() =>
      getObserverRelativePosition(
        fixture.body,
        createSimulationInstant(fixture.instantUtc, 'frozen-test'),
        createObserver(fixture.observer),
        profile as never,
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'UNSUPPORTED_CORRECTION_PROFILE' }),
    );
    },
  );
});
