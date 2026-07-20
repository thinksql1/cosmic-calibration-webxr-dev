import * as THREE from 'three';

/**
 * Provides one inspectable transform path for the Earth-core-centred axis and
 * equator. Scientific children retain resource ownership; this node adds no
 * transform and geographic yaw remains on its parent exactly once.
 */
export function createGeocentricCelestialStructureGroup(
  earthAxisGroup: THREE.Group,
  celestialEquatorGroup: THREE.Group,
): THREE.Group {
  if (earthAxisGroup === celestialEquatorGroup) {
    throw new Error('Geocentric celestial structure requires distinct axis and equator groups.');
  }
  const group = new THREE.Group();
  group.name = 'geocentric-celestial-structure-frame';
  group.userData.geometryContract =
    'ONE_EARTH_CORE_ONE_AXIS_ONE_PERPENDICULAR_EQUATORIAL_PLANE';
  group.userData.coordinateFrameIdentity =
    'APPLICATION_BASIS_UNCALIBRATED_BELOW_ONE_GEOGRAPHIC_PARENT';
  group.userData.yawApplication = 'GEOGRAPHIC_PARENT_EXACTLY_ONCE';
  group.add(earthAxisGroup, celestialEquatorGroup);
  return group;
}
