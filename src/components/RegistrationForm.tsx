import { useEffect, useMemo, useState } from "react";
import { Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { type WarrantyRecord, loadDraft, saveDraft, clearDraft } from "@/lib/storage";

interface Props {
  serialFromScan: string;
  onClearScan: () => void;
  existing: WarrantyRecord[];
  onAdd: (rec: WarrantyRecord) => void;
}

type Draft = Omit<WarrantyRecord, "id" | "createdAt">;

const empty: Draft = {
  serial: "",
  model: "",
  warrantyYears: 25,
  installDate: new Date().toISOString().slice(0, 10),
  customer: "",
  project: "",
  location: "",
  notes: "",
};

export function RegistrationForm({ serialFromScan, onClearScan, existing, onAdd }: Props) {
  const [form, setForm] = useState<Draft>(() => loadDraft<Draft>() ?? empty);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (serialFromScan) {
      setForm((f) => ({ ...f, serial: serialFromScan }));
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
  }, [serialFromScan]);

  useEffect(() => {
    saveDraft(form);
  }, [form]);

  const duplicate = useMemo(
    () =>
      form.serial.trim() &&
      existing.some((r) => r.serial.trim().toLowerCase() === form.serial.trim().toLowerCase()),
    [form.serial, existing],
  );

  const customerSuggestions = useMemo(
    () => Array.from(new Set(existing.map((r) => r.customer).filter(Boolean))),
    [existing],
  );
  const projectSuggestions = useMemo(
    () => Array.from(new Set(existing.map((r) => r.project).filter(Boolean))),
    [existing],
  );

  const errors = {
    serial: !form.serial.trim() ? "مطلوب" : duplicate ? "هذا الرقم مسجّل مسبقاً" : "",
    model: !form.model.trim() ? "مطلوب" : "",
    customer: !form.customer.trim() ? "مطلوب" : "",
  };
  const isValid = !errors.serial && !errors.model && !errors.customer;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ serial: true, model: true, customer: true });
    if (!isValid) return;
    const rec: WarrantyRecord = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    onAdd(rec);
    setForm(empty);
    clearDraft();
    onClearScan();
    setTouched({});
  };

  const field = (k: keyof Draft, label: string, type = "text", extra?: React.ReactNode) => {
    const err = (errors as Partial<Record<keyof Draft, string>>)[k];
    const show = touched[k] && err;
    return (
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
        <input
          type={type}
          value={form[k] as string | number}
          onChange={(e) =>
            setForm({ ...form, [k]: type === "number" ? Number(e.target.value) : e.target.value })
          }
          onBlur={() => setTouched({ ...touched, [k]: true })}
          className={`w-full h-11 px-3 rounded-lg bg-input/40 border ${show ? "border-destructive" : "border-border"} focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition`}
        />
        {extra}
        {show && <span className="text-xs text-destructive mt-1 block">{err}</span>}
      </label>
    );
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-card shadow-card border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-base">تسجيل لوح جديد</h2>
        {duplicate && (
          <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-md">
            <AlertTriangle className="h-3 w-3" /> مكرر
          </span>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
          الرقم التسلسلي
        </span>
        <div className={`relative transition ${flash ? "ring-2 ring-success rounded-lg" : ""}`}>
          <input
            value={form.serial}
            onChange={(e) => setForm({ ...form, serial: e.target.value })}
            onBlur={() => setTouched({ ...touched, serial: true })}
            placeholder="امسح أو أدخل يدوياً"
            className={`w-full h-12 px-3 pr-9 rounded-lg bg-input/40 border font-mono ${duplicate ? "border-destructive" : "border-border"} focus:outline-none focus:ring-2 focus:ring-ring transition`}
          />
          {form.serial && !duplicate && (
            <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
          )}
        </div>
        {touched.serial && errors.serial && (
          <span className="text-xs text-destructive mt-1 block">{errors.serial}</span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        {field("model", "الموديل")}
        {field("warrantyYears", "الضمان (سنوات)", "number")}
      </div>

      {field("installDate", "تاريخ التركيب", "date")}

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">العميل</span>
        <input
          list="customers"
          value={form.customer}
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
          onBlur={() => setTouched({ ...touched, customer: true })}
          className={`w-full h-11 px-3 rounded-lg bg-input/40 border ${touched.customer && errors.customer ? "border-destructive" : "border-border"} focus:outline-none focus:ring-2 focus:ring-ring transition`}
        />
        <datalist id="customers">
          {customerSuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {touched.customer && errors.customer && (
          <span className="text-xs text-destructive mt-1 block">{errors.customer}</span>
        )}
      </label>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">المشروع</span>
        <input
          list="projects"
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
          className="w-full h-11 px-3 rounded-lg bg-input/40 border border-border focus:outline-none focus:ring-2 focus:ring-ring transition"
        />
        <datalist id="projects">
          {projectSuggestions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </label>

      {field("location", "موقع التركيب")}

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">ملاحظات</span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-input/40 border border-border focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
        />
      </label>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-elegant disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition flex items-center justify-center gap-2"
      >
        <Plus className="h-5 w-5" /> إضافة السجل
      </button>
    </form>
  );
}
