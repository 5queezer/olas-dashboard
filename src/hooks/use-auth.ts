import { useCallback, useEffect, useSyncExternalStore } from "react";

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

const API_URL = import.meta.env.VITE_API_URL ?? "https://olas.vasudev.xyz";

async function checkServerAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/account`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.is_setup === true && data.is_logged_in === true;
  } catch {
    return false;
  }
}

let checked = false;
function checkApi() {
  if (checked) return;
  checked = true;
  checkServerAuth().then((ok) =>
    setState({ authenticated: ok, loading: false }),
  );
}

// Periodically check if the middleware still has the password set
// (lost on restart). If not, force re-login.
let watchInterval: ReturnType<typeof setInterval> | null = null;

function startAuthWatch() {
  if (watchInterval) return;
  watchInterval = setInterval(async () => {
    if (!state.authenticated) return;
    const ok = await checkServerAuth();
    if (!ok) {
      setState({ authenticated: false, loading: false });
    }
  }, 60_000);
}

function stopAuthWatch() {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;
  }
}

export function useAuth() {
  const { authenticated, loading } = useSyncExternalStore(
    subscribe,
    getSnapshot,
  );

  useEffect(() => {
    checkApi();
    startAuthWatch();
    return () => stopAuthWatch();
  }, []);

  const login = useCallback(() => {
    setState({ authenticated: true, loading: false });
    startAuthWatch();
  }, []);

  const logout = useCallback(() => {
    setState({ authenticated: false, loading: false });
    stopAuthWatch();
  }, []);

  return { authenticated, loading, login, logout };
}
