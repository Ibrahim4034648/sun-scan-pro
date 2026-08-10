/**
 * Network state helper. Uses the Capacitor Network plugin when running on a
 * device and falls back to the browser online/offline events on the web.
 */

export type NetworkListener = (online: boolean) => void;

let current: boolean = typeof navigator !== "undefined" ? navigator.onLine !== false : true;
const listeners = new Set<NetworkListener>();
const reconnectListeners = new Set<() => void>();
let started = false;

function setOnline(next: boolean): void {
  const wasOnline = current;
  current = next;
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch (error) {
      console.error("[network] listener failed", error);
    }
  });
  if (!wasOnline && next) {
    reconnectListeners.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error("[network] reconnect listener failed", error);
      }
    });
  }
}

export function isOnline(): boolean {
  return current;
}

export function onNetworkChange(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fired only on the offline -> online transition. */
export function onReconnect(listener: () => void): () => void {
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
}

export async function startNetworkMonitor(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { Network } = await import("@capacitor/network");
    const status = await Network.getStatus();
    setOnline(status.connected);
    await Network.addListener("networkStatusChange", (s) => setOnline(s.connected));
  } catch (error) {
    console.warn("[network] native monitor unavailable", error);
  }
}
