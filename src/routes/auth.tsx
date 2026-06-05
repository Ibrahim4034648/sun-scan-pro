import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode === "signup" ? "signup" : "login") as "login" | "signup",
  }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — SPWMS" },
      { name: "description", content: "تسجيل الدخول إلى نظام إدارة ضمان الألواح الشمسية" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/welcome" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/welcome" });
    } catch (err: any) {
      const msg = err?.message || "حدث خطأ";
      if (msg.includes("Invalid login")) setError("بيانات الدخول غير صحيحة");
      else if (msg.includes("already registered") || msg.includes("already exists"))
        setError("هذا البريد مسجل مسبقاً — سجّل الدخول بدلاً من ذلك");
      else if (msg.toLowerCase().includes("password")) setError("كلمة المرور ضعيفة أو غير مقبولة (6 أحرف على الأقل)");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/welcome`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/welcome" });
    } catch (err: any) {
      setError(err?.message || "تعذّر تسجيل الدخول عبر Google");
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0F141B 0%, #1a212c 100%)", fontFamily: "'Space Grotesk', 'Cairo', sans-serif" }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: "#0F141B", boxShadow: "0 4px 14px rgba(255,138,0,0.35)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="14" rx="1.5" fill="#FF8A00" />
              <line x1="9" y1="4" x2="9" y2="18" stroke="#0F141B" strokeWidth="1" />
              <line x1="15" y1="4" x2="15" y2="18" stroke="#0F141B" strokeWidth="1" />
              <line x1="3" y1="11" x2="21" y2="11" stroke="#0F141B" strokeWidth="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F141B" }}>SPWMS</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {mode === "login" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب جديد"}
          </p>
        </div>

        <div className="flex rounded-lg p-1 mb-6" style={{ background: "#f1f5f9" }}>
          <button type="button" onClick={() => { setMode("login"); setError(null); }}
            className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
            style={{ background: mode === "login" ? "#FF8A00" : "transparent", color: mode === "login" ? "#fff" : "#64748b" }}>
            تسجيل الدخول
          </button>
          <button type="button" onClick={() => { setMode("signup"); setError(null); }}
            className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
            style={{ background: mode === "signup" ? "#FF8A00" : "transparent", color: mode === "signup" ? "#fff" : "#64748b" }}>
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F141B" }}>الاسم</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border outline-none transition-colors"
                style={{ borderColor: "#e2e8f0", fontSize: "15px" }}
                placeholder="اسمك الكامل" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F141B" }}>البريد الإلكتروني</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none"
              style={{ borderColor: "#e2e8f0", fontSize: "15px" }}
              placeholder="name@example.com" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F141B" }}>كلمة المرور</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none"
              style={{ borderColor: "#e2e8f0", fontSize: "15px" }}
              placeholder="••••••••" dir="ltr" />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "#FF8A00", boxShadow: "0 4px 14px rgba(255,138,0,0.35)", fontSize: "15px" }}>
            {loading ? "جارٍ المعالجة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
          SPWMS — Solar Panel Warranty Management System
        </p>
      </div>
    </div>
  );
}
