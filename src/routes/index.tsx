import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroAsset from "@/assets/spwms-hero.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPWMS — Solar Panel Warranty Management System" },
      { name: "description", content: "Scan, Track, Protect, Manage — نظام إدارة ضمان الألواح الشمسية" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const goSignup = () => navigate({ to: "/auth", search: { mode: "signup" } });
  const goLogin = () => navigate({ to: "/auth", search: { mode: "login" } });

  return (
    <div
      dir="ltr"
      style={{
        minHeight: "100vh",
        background: "#0A0E14",
        color: "#fff",
        fontFamily: "'Space Grotesk', 'Cairo', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hero image as background top section */}
      <div
        style={{
          width: "100%",
          height: "60vh",
          minHeight: 460,
          backgroundImage: `linear-gradient(180deg, #0A0E14 0%, rgba(10,14,20,0.0) 8%, rgba(10,14,20,0.15) 30%, rgba(10,14,20,0.55) 70%, #0A0E14 100%), url(${heroAsset.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center -50px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "8vh",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Mask phone status bar from hero image */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, background: "#0A0E14" }} />

      </div>

      {/* Bottom panel */}
      <div style={{ width: "100%", maxWidth: 520, padding: "0 20px 24px", marginTop: -20, position: "relative", zIndex: 2 }}>
        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            background: "rgba(20,28,40,0.7)",
            border: "1px solid rgba(96,165,250,0.15)",
            borderRadius: 16,
            padding: "16px 8px",
            backdropFilter: "blur(8px)",
          }}
        >
          {[
            { icon: <BarcodeIcon />, title: "SCAN", sub: "Serial Numbers" },
            { icon: <ShieldIcon />, title: "MANAGE", sub: "Warranty Records" },
            { icon: <ChartIcon />, title: "TRACK", sub: "Installations" },
            { icon: <ReportIcon />, title: "REPORT", sub: "Export Reports" },
          ].map((f) => (
            <div key={f.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "4px 2px" }}>
              {f.icon}
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>{f.title}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", lineHeight: 1.2 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <button
          onClick={goSignup}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "16px",
            background: "linear-gradient(180deg, #FFA033 0%, #FF8A00 100%)",
            border: "none",
            borderRadius: 14,
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 1.5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(255,138,0,0.4)",
          }}
        >
          <ScanFrameIcon /> CREATE ACCOUNT
        </button>

        <button
          onClick={goLogin}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "16px",
            background: "rgba(20,28,40,0.5)",
            border: "1.5px solid rgba(96,165,250,0.45)",
            borderRadius: 14,
            color: "#60A5FA",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 1.5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <LoginIcon /> LOGIN TO ACCOUNT
        </button>


        {/* Trust strip */}
        <div
          style={{
            marginTop: 14,
            background: "rgba(20,28,40,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckShieldIcon />
          <div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>
              Secure <span style={{ color: "#22c55e" }}>•</span> Reliable <span style={{ color: "#22c55e" }}>•</span> Professional
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Your data is protected and encrypted</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Icons */
const stroke = "#60A5FA";
function BarcodeIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2" />
      <path d="M8 8v8M11 8v8M14 8v8M17 8v8" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
function ScanFrameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}
function LoginIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}
function CheckShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
