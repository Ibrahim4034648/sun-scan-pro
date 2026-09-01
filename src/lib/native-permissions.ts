// Native permissions helper — safely no-ops on the web.
// Requests camera + storage permissions at startup when running inside the Capacitor APK.

let requested = false;

export async function requestNativePermissions(): Promise<void> {
  if (requested) return;
  requested = true;
  if (typeof window === "undefined") return;

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    // Camera permission
    try {
      const { Camera } = await import("@capacitor/camera");
      const status = await Camera.checkPermissions();
      if (status.camera !== "granted" || status.photos !== "granted") {
        await Camera.requestPermissions({ permissions: ["camera", "photos"] });
      }
    } catch (e) {
      console.warn("[native] camera permission request failed", e);
    }

    // Filesystem — touching it triggers the storage permission prompt on Android.
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      await Filesystem.readdir({ path: "", directory: Directory.Data }).catch(() => null);
    } catch (e) {
      console.warn("[native] filesystem init failed", e);
    }
  } catch {
    // Capacitor not installed / not in native runtime — ignore.
  }
}

export async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
