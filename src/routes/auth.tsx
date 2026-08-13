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

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
          <span className="text-xs" style={{ color: "#94a3b8" }}>أو</span>
          <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
        </div>

        <button type="button" onClick={handleGoogle} disabled={loading}
          className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-3 border transition-all disabled:opacity-60 hover:bg-gray-50"
          style={{ borderColor: "#e2e8f0", color: "#0F141B", fontSize: "15px", background: "#fff" }}>
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.1 5.2c-.4.4 6.7-4.9 6.7-14.8 0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          المتابعة باستخدام Google
        </button>


        <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
          SPWMS — Solar Panel Warranty Management System
        </p>
      </div>
    </div>
  );
}
