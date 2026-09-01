import { useEffect, useState } from "react";
import { getSyncState, onSyncStateChange, syncNow, type SyncState } from "@/lib/sync";

const LABELS: Record<string, string> = {
  offline: "بدون إنترنت",
  syncing: "جارٍ المزامنة",
  synced: "تمت المزامنة",
  idle: "متصل",
  error: "تعذّرت المزامنة",
};

export function NetworkStatus() {
  const [state, setState] = useState<SyncState>(getSyncState());

  useEffect(() => onSyncStateChange(setState), []);

  const phase = !state.online ? "offline" : state.phase === "idle" ? "idle" : state.phase;
  const color =
    phase === "offline"
      ? "#EF4444"
      : phase === "syncing"
        ? "#3B82F6"
        : phase === "error"
          ? "#F59E0B"
          : "#16A34A";

  return (
    <button
      type="button"
      onClick={() => void syncNow()}
      title="حالة الاتصال والمزامنة"
      style={{
        position: "fixed",
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "none",
        cursor: "pointer",
        background: "rgba(15,20,27,0.92)",
        color: "#fff",
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontFamily: "'Space Grotesk', 'Cairo', sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,.3)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span>{LABELS[phase] ?? LABELS.idle}</span>
      {state.pending > 0 && (
        <span
          style={{
            background: "#FF8A00",
            color: "#0F141B",
            borderRadius: 999,
            padding: "1px 7px",
            fontWeight: 700,
          }}
        >
          {state.pending} بانتظار المزامنة
        </span>
      )}
    </button>
  );
}
