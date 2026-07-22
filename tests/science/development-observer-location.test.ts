import { describe, expect, it } from 'vitest';
import {
  DEVELOPMENT_DEFAULT_OBSERVER_LOCATION,
  developmentObserverLocationInput,
} from '../../src/science/astronomy/developmentObserverLocation';
import { createObserver } from '../../src/science/astronomy/observer';

describe('development observer location defaults', () => {
  it('uses Swartz Creek, Michigan in decimal degrees, east-positive longitude, and MSL meters', () => {
    expect(DEVELOPMENT_DEFAULT_OBSERVER_LOCATION).toMatchObject({
      latitudeDeg: 42.9572,
      longitudeDegEast: -83.8308,
      elevationMeters: 240,
      horizontalDatum: 'WGS84',
      verticalDatum: 'MEAN_SEA_LEVEL',
    });
    const observer = createObserver(developmentObserverLocationInput('development default'));
    expect(observer.latitudeDeg).toBeCloseTo(42.9572, 10);
    expect(observer.longitudeDegEast).toBeCloseTo(-83.8308, 10);
    expect(observer.elevationMeters).toBe(240);
  });
});
