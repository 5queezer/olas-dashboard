import { useCallback, useSyncExternalStore } from "react";

const AUTH_KEY = "olas_authenticated";

let isAuthenticated = sessionStorage.getItem(AUTH_KEY) === "1";
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
  if (value) {
    sessionStorage.setItem(AUTH_KEY, "1");
  } else {
    sessionStorage.removeItem(AUTH_KEY);
  }
  listeners.forEach((l) => l());
}

export function useAuth() {
  const authenticated = useSyncExternalStore(subscribe, getSnapshot);

  const login = useCallback(() => setAuth(true), []);
  const logout = useCallback(() => setAuth(false), []);

  return { authenticated, login, logout };
}
