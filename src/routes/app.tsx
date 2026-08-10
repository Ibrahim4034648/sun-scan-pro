import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NetworkStatus } from "@/components/NetworkStatus";
import { installLegacyBridge } from "@/lib/legacy-bridge";
import { bootstrapOfflineFirst } from "@/lib/sync";


export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "نظام إدارة ضمان الألواح الشمسية" },
      { name: "description", content: "SPWMS — Solar Panel Warranty Management System" },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const removeBridge = installLegacyBridge();
    void bootstrapOfflineFirst();
    return removeBridge;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      if (!session) navigate({ to: "/auth", search: { mode: "login" } });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthed(true);
        setChecking(false);
      } else {
        setChecking(false);
        navigate({ to: "/auth", search: { mode: "login" } });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0F141B", color: "#FF8A00", fontFamily: "'Space Grotesk', sans-serif" }}>
        جارٍ التحميل...
      </div>
    );
  }

  if (!authed) return null;

  return (
    <>
      <iframe
        src="/legacy.html"
        title="Solar Warranty System"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
      <button
        onClick={() => navigate({ to: "/" })}
        title="الرئيسية"
        style={{
          position: "fixed", top: 10, left: 10, zIndex: 9999,
          width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
          background: "rgba(15,20,27,0.85)", color: "#FF8A00",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>
      </button>
      <NetworkStatus />
    </>
  );
}
