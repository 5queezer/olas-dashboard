import { useCallback, useEffect, useSyncExternalStore } from "react";
import { api } from "@/api/client";

type AuthState = { authenticated: boolean; loading: boolean };

let state: AuthState = { authenticated: false, loading: true };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

// Check API reachability once on startup
let checked = false;
function checkApi() {
  if (checked) return;
  checked = true;
  api
    .get("/api/account")
    .then(() => setState({ authenticated: true, loading: false }))
    .catch(() => setState({ authenticated: false, loading: false }));
}

export function useAuth() {
  const { authenticated, loading } = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => { checkApi(); }, []);

  const login = useCallback(() => setState({ authenticated: true, loading: false }), []);
  const logout = useCallback(() => setState({ authenticated: false, loading: false }), []);

  return { authenticated, loading, login, logout };
}
