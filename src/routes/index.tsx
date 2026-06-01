import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام إدارة ضمان الألواح الشمسية" },
      { name: "description", content: "SPWMS — Solar Panel Warranty Management System" },
    ],
  }),
  component: App,
});

function App() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      if (!session) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthed(true);
        setChecking(false);
      } else {
        setChecking(false);
        navigate({ to: "/auth" });
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
    <iframe
      src="/legacy.html"
      title="Solar Warranty System"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}
