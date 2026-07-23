import type { CelestialAppearancePreferences } from './celestialColorModes';

export const CELESTIAL_APPEARANCE_STORAGE_KEY = 'cosmic-calibration:appearance:v1';
export const CELESTIAL_APPEARANCE_SCHEMA_VERSION = 1 as const;
export interface AppearanceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
export type AppearanceStorageReadStatus = 'unavailable' | 'empty' | 'valid' | 'invalid';

export function readAppearancePreferences(storage: AppearanceStorage | undefined, validate: (value: unknown) => CelestialAppearancePreferences | undefined): Readonly<{ status: AppearanceStorageReadStatus; preferences?: CelestialAppearancePreferences }> {
  if (!storage) return Object.freeze({ status: 'unavailable' });
  try {
    const raw = storage.getItem(CELESTIAL_APPEARANCE_STORAGE_KEY);
    if (!raw) return Object.freeze({ status: 'empty' });
    const parsed = validate(JSON.parse(raw));
    return parsed ? Object.freeze({ status: 'valid', preferences: parsed }) : Object.freeze({ status: 'invalid' });
  } catch { return Object.freeze({ status: 'invalid' }); }
}
export function writeAppearancePreferences(storage: AppearanceStorage | undefined, preferences: CelestialAppearancePreferences): boolean {
  if (!storage) return false;
  try { storage.setItem(CELESTIAL_APPEARANCE_STORAGE_KEY, JSON.stringify(preferences)); return true; } catch { return false; }
}
export function clearAppearancePreferences(storage: AppearanceStorage | undefined): boolean {
  if (!storage) return false;
  try { storage.removeItem(CELESTIAL_APPEARANCE_STORAGE_KEY); return true; } catch { return false; }
}
