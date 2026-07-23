import { describe, expect, it } from 'vitest';
import packageManifest from '../../package.json';
import {
  ASTRONOMY_HOR_TO_APPLICATION_ROWS,
  catalogEquatorialJ2000ToHorizontalEnu,
  createRealSkyEquatorialOrientation,
  createRealSkyGridDirectionRotation,
  equatorialOfDateToHorizontalEnu,
  matrix3Determinant,
} from '../../src/science/astronomy/realSkyEquatorialOrientation';
import { angularSeparationDeg } from '../../src/science/astronomy/frameTransforms';
import { getApparentTopocentricBody } from '../../src/science/astronomy/astronomyEngineAdapter';
import { createObserver } from '../../src/science/astronomy/observer';
import { createSimulationInstant } from '../../src/science/astronomy/time';

const observer = createObserver({
  latitudeDeg: 42.9572,
  longitudeDegEast: -83.8308,
  elevationMeters: 240,
  source: 'Swartz Creek bridge test',
});
const instant = createSimulationInstant('2026-07-22T12:00:00.000Z', 'frozen-test');

function ready(time = instant, site = observer) {
  const value = createRealSkyEquatorialOrientation(time, site);
  if (value.kind !== 'ready') throw new Error(value.reason);
  return value;
}

function enuTuple(value: ReturnType<typeof catalogEquatorialJ2000ToHorizontalEnu>): readonly [number, number, number] {
  if (value.kind !== 'ready') throw new Error(value.reason);
  return [value.direction.east, value.direction.north, value.direction.up];
}

describe('real-sky equatorial orientation provider contract', () => {
  it('records the installed provider and detects the required proper rotations', () => {
    const orientation = ready();
    expect(packageManifest.dependencies['astronomy-engine']).toBe('2.1.19');
    expect(orientation.providerVersion).toBe('2.1.19');
    expect(orientation.catalogFrame).toBe('EQJ_J2000');
    expect(orientation.gridFrame).toBe('EQD_TRUE');
    expect(orientation.refractionPolicy).toBe('GEOMETRIC_AIRLESS_RIGID_ROTATION');
    expect(orientation.determinant).toBeCloseTo(1, 12);
    expect(orientation.orthonormalityError).toBeLessThan(1e-12);
    expect(orientation.inverseRoundTripError).toBeLessThan(1e-12);
    expect(orientation.elevationAffectsRigidRotation).toBe(false);
  });

  it('maps Astronomy HOR north/west/up to application north/west/up without reflection', () => {
    expect(ASTRONOMY_HOR_TO_APPLICATION_ROWS).toEqual([
      [0, -1, 0],
      [0, 0, 1],
      [-1, 0, 0],
    ]);
    expect(matrix3Determinant(ASTRONOMY_HOR_TO_APPLICATION_ROWS)).toBe(1);
    // HOR north -> application -Z; HOR west -> application -X; HOR up -> +Y.
    expect(ASTRONOMY_HOR_TO_APPLICATION_ROWS.map((row) => row[0])).toEqual([0, 0, -1]);
    expect(ASTRONOMY_HOR_TO_APPLICATION_ROWS.map((row) => row[1])).toEqual([-1, 0, 0]);
    expect(ASTRONOMY_HOR_TO_APPLICATION_ROWS.map((row) => row[2])).toEqual([0, 1, 0]);
  });

  it('accepts sidereal hours, wraps RA, validates declination, and returns normalized ENU', () => {
    const orientation = ready();
    const zero = catalogEquatorialJ2000ToHorizontalEnu(0, 0, orientation);
    const wrapped = catalogEquatorialJ2000ToHorizontalEnu(24, 0, orientation);
    const negativeWrapped = catalogEquatorialJ2000ToHorizontalEnu(-24, 0, orientation);
    expect(enuTuple(wrapped)).toEqual(enuTuple(zero));
    expect(enuTuple(negativeWrapped)).toEqual(enuTuple(zero));
    expect(Math.hypot(...enuTuple(zero))).toBeCloseTo(1, 14);
    expect(catalogEquatorialJ2000ToHorizontalEnu(0, 90.1, orientation)).toMatchObject({ kind: 'not-ready', code: 'INVALID_DECLINATION' });
    expect(catalogEquatorialJ2000ToHorizontalEnu(Number.NaN, 0, orientation)).toMatchObject({ kind: 'not-ready', code: 'INVALID_RIGHT_ASCENSION' });
  });

  it('preserves the recognizable EQJ basis and angular separations', () => {
    const orientation = ready();
    const values = [0, 6, 12, 18].map((hours) =>
      catalogEquatorialJ2000ToHorizontalEnu(hours, 0, orientation));
    expect(angularSeparationDeg(enuTuple(values[0]!), enuTuple(values[1]!))).toBeCloseTo(90, 10);
    expect(Math.abs(angularSeparationDeg(enuTuple(values[0]!), enuTuple(values[2]!)) - 180)).toBeLessThan(2e-6);
    expect(Math.abs(angularSeparationDeg(enuTuple(values[1]!), enuTuple(values[3]!)) - 180)).toBeLessThan(2e-6);
    const north = catalogEquatorialJ2000ToHorizontalEnu(0, 90, orientation);
    const south = catalogEquatorialJ2000ToHorizontalEnu(0, -90, orientation);
    expect(Math.abs(angularSeparationDeg(enuTuple(north), enuTuple(south)) - 180)).toBeLessThan(2e-6);
  });

  it('keeps the mean-of-date grid pole fixed while sidereal time rotates RA zero', () => {
    const later = ready(createSimulationInstant('2026-07-22T18:00:00.000Z', 'frozen-test'));
    const first = ready();
    const poleA = first.gridBasisApplication.northPole;
    const poleB = later.gridBasisApplication.northPole;
    expect(angularSeparationDeg([poleA.x, poleA.y, poleA.z], [poleB.x, poleB.y, poleB.z])).toBeLessThan(1e-7);
    const zeroA = first.gridBasisApplication.zeroLongitude;
    const zeroB = later.gridBasisApplication.zeroLongitude;
    expect(angularSeparationDeg([zeroA.x, zeroA.y, zeroA.z], [zeroB.x, zeroB.y, zeroB.z])).toBeGreaterThan(80);
    // Application east/west are +/-X at altitude zero; both remain on the equator.
    expect(Math.abs(poleA.x)).toBeLessThan(1e-12);
  });

  it('responds once to longitude and latitude while MSL does not alter rigid orientation', () => {
    const base = ready();
    const eastSite = createObserver({ ...observer, longitudeDegEast: observer.longitudeDegEast + 15 });
    const east = ready(instant, eastSite);
    expect(angularSeparationDeg(
      [base.gridBasisApplication.zeroLongitude.x, base.gridBasisApplication.zeroLongitude.y, base.gridBasisApplication.zeroLongitude.z],
      [east.gridBasisApplication.zeroLongitude.x, east.gridBasisApplication.zeroLongitude.y, east.gridBasisApplication.zeroLongitude.z],
    )).toBeCloseTo(15, 8);
    const equatorSite = ready(instant, createObserver({ ...observer, latitudeDeg: 0 }));
    expect(equatorSite.gridBasisApplication.northPole.y).toBeCloseTo(0, 12);
    const highSite = ready(instant, createObserver({ ...observer, latitudeDeg: 60 }));
    expect(highSite.gridBasisApplication.northPole.y).toBeCloseTo(Math.sin(Math.PI / 3), 12);
    const elevated = ready(instant, createObserver({ ...observer, elevationMeters: 3000 }));
    expect(elevated.eqjToHorRows).toEqual(base.eqjToHorRows);
  });

  it('returns close to one rotation after one sidereal day', () => {
    const first = ready();
    const next = ready(createSimulationInstant('2026-07-23T11:56:04.091Z', 'frozen-test'));
    expect(angularSeparationDeg(
      [first.gridBasisApplication.zeroLongitude.x, first.gridBasisApplication.zeroLongitude.y, first.gridBasisApplication.zeroLongitude.z],
      [next.gridBasisApplication.zeroLongitude.x, next.gridBasisApplication.zeroLongitude.y, next.gridBasisApplication.zeroLongitude.z],
    )).toBeLessThan(0.01);
  });

  it.each(['Sun', 'Moon', 'Mercury', 'Jupiter', 'Uranus'] as const)(
    'cross-checks $body through the same topocentric airless EQD-to-HOR frame',
    (body) => {
      const providerBody = getApparentTopocentricBody(
        body,
        instant,
        observer,
        'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      );
      const transformed = equatorialOfDateToHorizontalEnu(
        providerBody.equatorial.rightAscensionHours,
        providerBody.equatorial.declinationDeg,
        ready(),
      );
      expect(transformed.kind).toBe('ready');
      if (transformed.kind !== 'ready') return;
      expect(angularSeparationDeg(
        [transformed.direction.east, transformed.direction.north, transformed.direction.up],
        [providerBody.horizontal.direction.east, providerBody.horizontal.direction.north, providerBody.horizontal.direction.up],
      )).toBeLessThan(1e-7);
    },
  );

  it('derives one proper grid phase rotation without moving its pole', () => {
    const sourcePole = ready().gridBasisApplication.northPole;
    const reference = Math.abs(sourcePole.y) < 0.9
      ? { x: 0, y: 1, z: 0 }
      : { x: 1, y: 0, z: 0 };
    const cross = (a: typeof reference, b: typeof reference) => ({
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    });
    const normalize = (a: typeof reference) => {
      const length = Math.hypot(a.x, a.y, a.z);
      return { x: a.x / length, y: a.y / length, z: a.z / length };
    };
    const first = normalize(cross(reference, sourcePole));
    const second = normalize(cross(sourcePole, first));
    const rotation = createRealSkyGridDirectionRotation({
      zeroLongitude: first,
      positiveNinetyLongitude: second,
      northPole: sourcePole,
    }, ready());
    expect(rotation.kind).toBe('ready');
    if (rotation.kind !== 'ready') return;
    expect(rotation.determinant).toBeCloseTo(1, 12);
    expect(rotation.orthonormalityError).toBeLessThan(1e-12);
    expect(rotation.poleAlignmentErrorDeg).toBeLessThan(1e-7);
  });
});
