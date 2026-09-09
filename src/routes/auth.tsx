import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("تعذر تسجيل الدخول بواسطة Google — حاول مرة أخرى");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/welcome" });
    } catch {
      setError("تعذر تسجيل الدخول بواسطة Google — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      if (msg.includes("Invalid login")) setError("بيانات الدخول غير صحيحة");
      else if (msg.includes("already registered") || msg.includes("already exists"))
        setError("هذا البريد مسجل مسبقاً — سجّل الدخول بدلاً من ذلك");
      else if (msg.toLowerCase().includes("password"))
        setError("كلمة المرور ضعيفة أو غير مقبولة (6 أحرف على الأقل)");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0F141B 0%, #1a212c 100%)",
        fontFamily: "'Space Grotesk', 'Cairo', sans-serif",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      >
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "#0F141B", boxShadow: "0 4px 14px rgba(255,138,0,0.35)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="4" width="18" height="14" rx="1.5" fill="#FF8A00" />
              <line x1="9" y1="4" x2="9" y2="18" stroke="#0F141B" strokeWidth="1" />
              <line x1="15" y1="4" x2="15" y2="18" stroke="#0F141B" strokeWidth="1" />
              <line x1="3" y1="11" x2="21" y2="11" stroke="#0F141B" strokeWidth="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F141B" }}>
            SPWMS
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {mode === "login" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب جديد"}
          </p>
        </div>

        <div className="flex rounded-lg p-1 mb-6" style={{ background: "#f1f5f9" }}>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
            style={{
              background: mode === "login" ? "#FF8A00" : "transparent",
              color: mode === "login" ? "#fff" : "#64748b",
            }}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
            style={{
              background: mode === "signup" ? "#FF8A00" : "transparent",
              color: mode === "signup" ? "#fff" : "#64748b",
            }}
          >
            حساب جديد
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-3 mb-4 transition-all disabled:opacity-60"
          style={{ background: "#fff", border: "1.5px solid #e2e8f0", color: "#0F141B", fontSize: "15px" }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.5 17.6 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9C43.8 37.4 46.5 31.2 46.5 24z"/>
            <path fill="#FBBC05" d="M10.4 28.1c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C1 16.1 0 19.9 0 23.5s1 7.4 2.6 10.7l7.8-6.1z"/>
            <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-4-13.6-9.6l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"/>
          </svg>
          المتابعة بواسطة Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
          <span className="text-xs" style={{ color: "#94a3b8" }}>أو</span>
          <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F141B" }}>
                الاسم
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border outline-none transition-colors"
                style={{ borderColor: "#e2e8f0", fontSize: "15px" }}
                placeholder="اسمك الكامل"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F141B" }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none"
              style={{ borderColor: "#e2e8f0", fontSize: "15px" }}
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F141B" }}>
              كلمة المرور
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none"
              style={{ borderColor: "#e2e8f0", fontSize: "15px" }}
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-60"
            style={{
              background: "#FF8A00",
              boxShadow: "0 4px 14px rgba(255,138,0,0.35)",
              fontSize: "15px",
            }}
          >
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
