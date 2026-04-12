import { AppState } from "@/state/app-types";

export const STORAGE_KEY = "fake-web-state";

export function loadStoredAppState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeAppState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Failed to persist app state to localStorage.", error);
    return false;
  }
}
