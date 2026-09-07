/**
 * Offline-tolerant session reader.
 *
 * `supabase.auth.getSession()` can hang or reject when the device has no
 * connection (token refresh attempt), which would leave the app stuck on a
 * loading screen or sign the user out while offline. This helper always
 * resolves: it races the SDK call against a timeout and falls back to the
 * session persisted in local storage.
 */

import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 4000;

function readCachedSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !/^sb-.*-auth-token$/.test(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<Session> & { currentSession?: Session };
      const session = parsed.currentSession ?? (parsed as Session);
      if (session && session.user) return session;
    }
  } catch {
    // corrupted / unavailable storage — treat as signed out
  }
  return null;
}

/** Never throws, never hangs. Returns the active or last-known session. */
export async function getSessionSafe(): Promise<Session | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), TIMEOUT_MS);
      }),
    ]);
    if (timer) clearTimeout(timer);
    const session = result && "data" in result ? result.data.session : null;
    if (session) return session;
  } catch (error) {
    if (timer) clearTimeout(timer);
    console.warn("[auth] getSession failed, using cached session", error);
  }
  return readCachedSession();
}

/** True when we should not sign the user out (no connection to verify). */
export function isDeviceOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
