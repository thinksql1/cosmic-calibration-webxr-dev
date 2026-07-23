import * as THREE from 'three';
import {
  createMoonPhasePixels,
  type MoonPhasePixelData,
} from '../presentation/moonPhasePresentation';

export interface CachedMoonPhaseTexture {
  readonly texture: THREE.DataTexture;
  readonly pixels: MoonPhasePixelData;
}

export interface MoonPhaseTextureCache {
  get(key: string, phaseDeg: number, borderStrength?: number): CachedMoonPhaseTexture;
  readonly keys: readonly string[];
  readonly size: number;
  dispose(): void;
}

function createTexture(phaseDeg: number, borderStrength: number): CachedMoonPhaseTexture {
  const pixels = createMoonPhasePixels(phaseDeg, borderStrength);
  const texture = new THREE.DataTexture(
    pixels.pixels,
    pixels.width,
    pixels.height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return Object.freeze({ texture, pixels });
}

export function createMoonPhaseTextureCache(): MoonPhaseTextureCache {
  const textures = new Map<string, CachedMoonPhaseTexture>();
  let disposed = false;
  return Object.freeze({
    get(key: string, phaseDeg: number, borderStrength = 0.65): CachedMoonPhaseTexture {
      if (disposed) throw new Error('Moon phase texture cache is disposed.');
      const existing = textures.get(key);
      if (existing) return existing;
      const value = createTexture(phaseDeg, borderStrength);
      textures.set(key, value);
      return value;
    },
    get keys(): readonly string[] {
      return Object.freeze([...textures.keys()]);
    },
    get size(): number {
      return textures.size;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (const entry of textures.values()) entry.texture.dispose();
      textures.clear();
    },
  });
}
