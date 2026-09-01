import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "مرحباً — SPWMS" },
      { name: "description", content: "صفحة الترحيب بنظام إدارة ضمان الألواح الشمسية" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0A0E14" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/" });
        return;
      }
      const meta = data.session.user.user_metadata as { display_name?: string } | null;
      setName(meta?.display_name || data.session.user.email?.split("@")[0] || "");
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
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
          fontFamily: "'Space Grotesk', 'Cairo', sans-serif",
        }}
      >
        جارٍ التحميل...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse at top, #15243a 0%, #0A0E14 60%)",
        color: "#fff",
        fontFamily: "'Space Grotesk', 'Cairo', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        paddingTop: "calc(env(safe-area-inset-top) + 32px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 360,
          height: 360,
          background: "radial-gradient(circle, rgba(255,138,0,0.25), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto 24px",
            borderRadius: 24,
            background: "linear-gradient(180deg, #FFA033, #FF8A00)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 50px rgba(255,138,0,0.45)",
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="14" rx="1.5" />
            <line x1="9" y1="4" x2="9" y2="18" />
            <line x1="15" y1="4" x2="15" y2="18" />
            <line x1="3" y1="11" x2="21" y2="11" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: 0.5 }}>
          أهلاً بك{name ? `، ${name}` : ""}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#94a3b8",
            marginTop: 10,
            marginBottom: 36,
            lineHeight: 1.6,
          }}
        >
          مرحباً بك في نظام إدارة ضمان الألواح الشمسية.
          <br />
          ابدأ بإدارة مشاريعك وضماناتك بسهولة.
        </p>

        <button
          onClick={() => navigate({ to: "/app" })}
          style={{
            width: "100%",
            minHeight: 58,
            padding: "16px 18px",
            background: "linear-gradient(180deg, #FFA033 0%, #FF8A00 100%)",
            border: "none",
            borderRadius: 16,
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 0.8,
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 21V10l9-7 9 7v11h-6v-7h-6v7z" />
          </svg>
          الذهاب إلى المشاريع
        </button>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          style={{
            width: "100%",
            marginTop: 14,
            minHeight: 46,
            padding: "12px 18px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
