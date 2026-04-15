import { useCallback, useSyncExternalStore } from "react";

let isAuthenticated = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return isAuthenticated;
}

function setAuth(value: boolean) {
  isAuthenticated = value;
  listeners.forEach((l) => l());
}

export function useAuth() {
  const authenticated = useSyncExternalStore(subscribe, getSnapshot);

  const login = useCallback(() => setAuth(true), []);
  const logout = useCallback(() => setAuth(false), []);

  return { authenticated, login, logout };
}
