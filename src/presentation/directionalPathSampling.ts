import type { ApplicationBasisDirection } from './mapEnuToApplicationBasis';

export interface DirectionalPathSourceSample {
  readonly directionApplication: ApplicationBasisDirection;
  readonly opacity: number;
  readonly timestampMilliseconds: number;
  readonly aboveHorizon: boolean;
}

export interface DirectionalPathRenderSample {
  readonly directionApplication: ApplicationBasisDirection;
  readonly opacity: number;
  readonly aboveHorizon: boolean;
  readonly sourceSample: boolean;
  readonly timestampMilliseconds?: number;
}

export interface DirectionalPathSamplingResult {
  readonly kind: 'READY_DIRECTIONAL_PATH_SAMPLING';
  readonly samples: readonly DirectionalPathRenderSample[];
  readonly sourceSampleCount: number;
  readonly renderedSampleCount: number;
  readonly duplicateSourceSamplesSuppressed: number;
  readonly timestampsMonotonic: boolean;
  readonly maximumSourceAngularSpacingDeg: number;
  readonly maximumRenderedAngularSpacingDeg: number;
  readonly maximumAngularStepDeg: number;
}

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));
const dot = (a: ApplicationBasisDirection, b: ApplicationBasisDirection): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;
const angleDeg = (a: ApplicationBasisDirection, b: ApplicationBasisDirection): number =>
  Math.acos(clamp(dot(a, b))) * 180 / Math.PI;

function interpolate(
  a: ApplicationBasisDirection,
  b: ApplicationBasisDirection,
  t: number,
): ApplicationBasisDirection {
  const omega = Math.acos(clamp(dot(a, b)));
  if (omega < 1e-10) return a;
  const sinOmega = Math.sin(omega);
  const aWeight = Math.sin((1 - t) * omega) / sinOmega;
  const bWeight = Math.sin(t * omega) / sinOmega;
  const x = a.x * aWeight + b.x * bWeight;
  const y = a.y * aWeight + b.y * bWeight;
  const z = a.z * aWeight + b.z * bWeight;
  const length = Math.hypot(x, y, z);
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: x / length,
    y: y / length,
    z: z / length,
  });
}

export function sampleOrderedDirectionalPath(
  source: readonly DirectionalPathSourceSample[],
  maximumAngularStepDeg = 1,
  maximumRenderedSamples = 1024,
): DirectionalPathSamplingResult {
  if (
    source.length < 2 ||
    !Number.isFinite(maximumAngularStepDeg) ||
    maximumAngularStepDeg <= 0 ||
    !Number.isSafeInteger(maximumRenderedSamples) ||
    maximumRenderedSamples < source.length
  ) {
    throw new Error('Directional path sampling policy is invalid.');
  }
  let timestampsMonotonic = true;
  let duplicateSourceSamplesSuppressed = 0;
  let maximumSourceAngularSpacingDeg = 0;
  const samples: DirectionalPathRenderSample[] = [
    Object.freeze({ ...source[0]!, sourceSample: true }),
  ];
  for (let index = 1; index < source.length; index += 1) {
    const previous = source[index - 1]!;
    const current = source[index]!;
    timestampsMonotonic &&= current.timestampMilliseconds > previous.timestampMilliseconds;
    const angularSpacing = angleDeg(previous.directionApplication, current.directionApplication);
    if (!Number.isFinite(angularSpacing)) throw new Error('Directional path contains non-finite geometry.');
    maximumSourceAngularSpacingDeg = Math.max(maximumSourceAngularSpacingDeg, angularSpacing);
    if (angularSpacing < 1e-8) {
      duplicateSourceSamplesSuppressed += 1;
      continue;
    }
    if (angularSpacing > 179.999) throw new Error('Directional path contains an ambiguous antipodal interval.');
    const intervals = Math.max(1, Math.ceil(angularSpacing / maximumAngularStepDeg));
    for (let step = 1; step <= intervals; step += 1) {
      const t = step / intervals;
      const directionApplication = interpolate(
        previous.directionApplication,
        current.directionApplication,
        t,
      );
      samples.push(Object.freeze({
        directionApplication,
        opacity: previous.opacity + (current.opacity - previous.opacity) * t,
        aboveHorizon: step === intervals ? current.aboveHorizon : previous.aboveHorizon,
        sourceSample: step === intervals,
        timestampMilliseconds: previous.timestampMilliseconds
          + (current.timestampMilliseconds - previous.timestampMilliseconds) * t,
      }));
      if (samples.length > maximumRenderedSamples) {
        throw new Error('Directional path exceeds bounded rendered sample capacity.');
      }
    }
  }
  let maximumRenderedAngularSpacingDeg = 0;
  for (let index = 1; index < samples.length; index += 1) {
    maximumRenderedAngularSpacingDeg = Math.max(
      maximumRenderedAngularSpacingDeg,
      angleDeg(
        samples[index - 1]!.directionApplication,
        samples[index]!.directionApplication,
      ),
    );
  }
  return Object.freeze({
    kind: 'READY_DIRECTIONAL_PATH_SAMPLING',
    samples: Object.freeze(samples),
    sourceSampleCount: source.length,
    renderedSampleCount: samples.length,
    duplicateSourceSamplesSuppressed,
    timestampsMonotonic,
    maximumSourceAngularSpacingDeg,
    maximumRenderedAngularSpacingDeg,
    maximumAngularStepDeg,
  });
}
