import { AppSeed } from '../../types';
import { demoSeed, emptySeed, cloneSeed } from './defaults';
import { normalizeSeed } from './normalize';

const STORAGE_KEY = "ourfund.appSeed.v1";

export function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function persistAppSeed(seed: AppSeed) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
}

export function getInitialSeed(): AppSeed {
  if (canUseStorage()) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return normalizeSeed(JSON.parse(stored) as Partial<AppSeed>);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  const forceEmpty = import.meta.env.VITE_EMPTY_DATA === "true";
  return cloneSeed(!forceEmpty && import.meta.env.DEV ? demoSeed : emptySeed);
}

export function clearPersistedAppSeed() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
