import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, Zap, ZapOff, RefreshCw, Loader2 } from "lucide-react";

type Status = "idle" | "starting" | "scanning" | "error";

interface Props {
  onScan: (text: string) => void;
  continuous?: boolean;
}

export function Scanner({ onScan, continuous = true }: Props) {
  const containerId = "scanner-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devs) => {
        setCameras(devs);
        const rear = devs.find((d) => /back|rear|environment/i.test(d.label));
        setCameraId((rear ?? devs[0])?.id ?? null);
      })
      .catch(() => setError("لا يمكن الوصول إلى الكاميرا"));
    return () => { void stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beep = () => {
    if (!sound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    } catch {}
    if ("vibrate" in navigator) navigator.vibrate(60);
  };

  const start = async () => {
    if (!cameraId) { setError("لا توجد كاميرا متاحة"); return; }
    setError(null);
    setStatus("starting");
    try {
      const html5 = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });
      scannerRef.current = html5;
      await html5.start(
        cameraId,
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        (decoded) => {
          const now = Date.now();
          if (decoded === lastScanRef.current.text && now - lastScanRef.current.at < 2000) return;
          lastScanRef.current = { text: decoded, at: now };
          beep();
          onScan(decoded);
          if (!continuous) void stop();
        },
        () => {}
      );
      setStatus("scanning");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "فشل تشغيل الكاميرا");
    }
  };

  const stop = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try { await s.stop(); await s.clear(); } catch {}
    }
    setStatus("idle");
    setTorch(false);
  };

  const toggleTorch = async () => {
    const s = scannerRef.current as any;
    if (!s) return;
    try {
      await s.applyVideoConstraints({ advanced: [{ torch: !torch }] });
      setTorch(!torch);
    } catch {
      setError("الفلاش غير مدعوم على هذا الجهاز");
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2 || !cameraId) return;
    const idx = cameras.findIndex((c) => c.id === cameraId);
    const next = cameras[(idx + 1) % cameras.length];
    setCameraId(next.id);
    if (status === "scanning") { await stop(); setTimeout(() => start(), 100); }
  };

  return (
    <div className="rounded-2xl bg-card shadow-card overflow-hidden border">
      <div className="relative aspect-square bg-secondary/95">
        <div id={containerId} className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
        {status !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-foreground gap-3 p-6 text-center">
            {status === "starting" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <Camera className="h-12 w-12 text-primary" />
            )}
            <p className="text-sm opacity-80">
              {status === "starting" ? "جارٍ تشغيل الكاميرا..." : "اضغط لبدء المسح الضوئي"}
            </p>
            {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">{error}</p>}
          </div>
        )}
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-[72%] aspect-square border-2 border-primary/80 rounded-2xl overflow-hidden">
              <div className="scan-line" />
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-2xl" />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 p-3 bg-card">
        {status !== "scanning" ? (
          <button
            onClick={start}
            disabled={status === "starting"}
            className="flex-1 h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-elegant disabled:opacity-60 active:scale-[0.98] transition"
          >
            بدء المسح
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex-1 h-12 rounded-xl bg-secondary text-secondary-foreground font-semibold active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <CameraOff className="h-4 w-4" /> إيقاف
          </button>
        )}
        <button
          onClick={toggleTorch}
          disabled={status !== "scanning"}
          className="h-12 w-12 rounded-xl bg-muted hover:bg-accent disabled:opacity-40 flex items-center justify-center"
          aria-label="Flash"
        >
          {torch ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </button>
        <button
          onClick={switchCamera}
          disabled={cameras.length < 2}
          className="h-12 w-12 rounded-xl bg-muted hover:bg-accent disabled:opacity-40 flex items-center justify-center"
          aria-label="Switch camera"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <button
          onClick={() => setSound((s) => !s)}
          className="h-12 px-3 rounded-xl bg-muted hover:bg-accent text-xs font-medium"
        >
          {sound ? "🔊" : "🔇"}
        </button>
      </div>
    </div>
  );
}
