import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroAsset from "@/assets/spwms-hero-v2.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPWMS — Solar Panel Warranty Management System" },
      {
        name: "description",
        content: "Scan, Track, Protect, Manage — نظام إدارة ضمان الألواح الشمسية",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0A0E14" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/welcome" });
      } else {
        setReady(true);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/welcome" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const goSignup = () => navigate({ to: "/auth", search: { mode: "signup" } });
  const goLogin = () => navigate({ to: "/auth", search: { mode: "login" } });

  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0E14",
          color: "#FF8A00",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        ...
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      style={{
        minHeight: "100dvh",
        background: "#0A0E14",
        color: "#fff",
        fontFamily: "'Space Grotesk', 'Cairo', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
        overflowX: "hidden",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Hero */}
      <div
        style={{
          width: "100%",
          aspectRatio: "863 / 970",
          maxHeight: "62dvh",
          minHeight: 360,
          backgroundImage: `linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0) 18%, rgba(10,14,20,0) 55%, rgba(10,14,20,0.85) 88%, #0A0E14 100%), url(${heroAsset.url})`,
          backgroundSize: "100% 100%, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundColor: "#0A0E14",
          position: "relative",
        }}
      >
        {/* Mask phone status bar baked into the hero image */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            background: "linear-gradient(180deg, #0A0E14 60%, rgba(10,14,20,0))",
          }}
        />
        {/* Soft glow under hero to blend into content */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -80,
            transform: "translateX(-50%)",
            width: 380,
            height: 160,
            background: "radial-gradient(ellipse at center, rgba(255,138,0,0.25), transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Content */}
      <main
        style={{
          width: "100%",
          maxWidth: 460,
          margin: "0 auto",
          padding: "0 20px 28px",
          marginTop: -28,
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Feature grid */}
        <section
          aria-label="Features"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6,
            background: "linear-gradient(180deg, rgba(24,32,46,0.85) 0%, rgba(18,24,36,0.85) 100%)",
            border: "1px solid rgba(96,165,250,0.18)",
            borderRadius: 18,
            padding: "14px 6px",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          {[
            { icon: <BarcodeIcon />, title: "SCAN", sub: "Serial" },
            { icon: <ShieldIcon />, title: "MANAGE", sub: "Warranty" },
            { icon: <ChartIcon />, title: "TRACK", sub: "Installs" },
            { icon: <ReportIcon />, title: "REPORT", sub: "Export" },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "6px 2px",
              }}
            >
              {f.icon}
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6 }}>{f.title}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", lineHeight: 1.2 }}>
                {f.sub}
              </div>
            </div>
          ))}
        </section>

        {/* Primary CTA */}
        <button
          onClick={goSignup}
          style={{
            width: "100%",
            minHeight: 56,
            padding: "16px 18px",
            background: "linear-gradient(180deg, #FFA033 0%, #FF8A00 100%)",
            border: "none",
            borderRadius: 16,
            color: "#fff",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 1.4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 10px 28px rgba(255,138,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <ScanFrameIcon /> CREATE ACCOUNT
        </button>

        {/* Secondary CTA */}
        <button
          onClick={goLogin}
          style={{
            width: "100%",
            minHeight: 54,
            padding: "15px 18px",
            background: "rgba(20,28,40,0.6)",
            border: "1.5px solid rgba(96,165,250,0.5)",
            borderRadius: 16,
            color: "#9CC2F5",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <LoginIcon /> LOGIN TO ACCOUNT
        </button>

        {/* Trust strip */}
        <div
          style={{
            marginTop: 4,
            background: "rgba(20,28,40,0.55)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckShieldIcon />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "#e2e8f0", fontWeight: 600 }}>
              Secure <span style={{ color: "#22c55e" }}>•</span> Reliable{" "}
              <span style={{ color: "#22c55e" }}>•</span> Professional
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              Your data is protected and encrypted
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Icons */
const stroke = "#60A5FA";
function BarcodeIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2" />
      <path d="M8 8v8M11 8v8M14 8v8M17 8v8" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF8A00"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
function ScanFrameIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}
function LoginIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9CC2F5"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}
function CheckShieldIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
