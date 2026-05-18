import { useEffect, useState } from "react";
import { Sun, FileSpreadsheet, FileText, Download, Upload, Trash } from "lucide-react";
import { Scanner } from "@/components/Scanner";
import { RegistrationForm } from "@/components/RegistrationForm";
import { RecordsTable } from "@/components/RecordsTable";
import { loadRecords, saveRecords, type WarrantyRecord } from "@/lib/storage";
import { exportExcel, exportJSON, exportPDF } from "@/lib/export";
import { toast, Toaster } from "sonner";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solar Warranty System — نظام إدارة ضمان الألواح الشمسية" },
      { name: "description", content: "Mobile-first solar panel warranty management with barcode and QR scanning, customer/project tracking, and reporting." },
      { property: "og:title", content: "Solar Warranty System" },
      { property: "og:description", content: "Premium field management for solar panel warranty operations." },
    ],
  }),
  component: App,
});

function App() {
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [scannedSerial, setScannedSerial] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => { setRecords(loadRecords()); }, []);
  useEffect(() => { saveRecords(records); }, [records]);

  const handleScan = (text: string) => {
    setScannedSerial(text);
    toast.success("تم المسح بنجاح", { description: text });
  };

  const handleAdd = (rec: WarrantyRecord) => {
    setRecords((r) => [rec, ...r]);
    toast.success("تم حفظ السجل");
  };

  const handleDelete = (id: string) => {
    setRecords((r) => r.filter((x) => x.id !== id));
    toast.success("تم الحذف");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("invalid");
        setRecords(data);
        toast.success(`تم استيراد ${data.length} سجل`);
      } catch {
        toast.error("ملف غير صالح");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm("هل أنت متأكد من حذف جميع السجلات؟ لا يمكن التراجع.")) {
      setRecords([]);
      toast.success("تم مسح جميع السجلات");
    }
  };

  const doExport = (fn: (r: WarrantyRecord[]) => void, label: string) => {
    if (records.length === 0) { toast.error("لا توجد سجلات للتصدير"); return; }
    fn(records);
    setExportOpen(false);
    toast.success(`تم تصدير ${label}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-24">
      <Toaster position="top-center" richColors />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b">
        <div className="px-4 h-14 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-elegant">
            <Sun className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-sm leading-tight truncate">نظام ضمان الألواح الشمسية</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Solar Warranty System</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full bg-success/10 text-success font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> متصل
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <Scanner onScan={handleScan} />
        <RegistrationForm
          serialFromScan={scannedSerial}
          onClearScan={() => setScannedSerial("")}
          existing={records}
          onAdd={handleAdd}
        />

        <section>
          <h2 className="font-display font-bold text-base mb-2 px-1">السجلات</h2>
          <RecordsTable records={records} onDelete={handleDelete} />
        </section>

        <div className="grid grid-cols-2 gap-2">
          <label className="h-11 rounded-xl bg-card border shadow-card flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.98] transition">
            <Upload className="h-4 w-4" /> استيراد
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
            />
          </label>
          <button
            onClick={handleClearAll}
            className="h-11 rounded-xl bg-card border shadow-card flex items-center justify-center gap-2 text-sm font-medium text-destructive active:scale-[0.98] transition"
          >
            <Trash className="h-4 w-4" /> مسح الكل
          </button>
        </div>
      </main>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur border-t">
        <div className="px-4 py-2.5 max-w-2xl mx-auto flex items-center gap-2">
          <div className="flex-1 text-xs">
            <div className="font-semibold">{records.length} سجل</div>
            <div className="text-muted-foreground">جاهز للعمل الميداني</div>
          </div>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="h-11 px-4 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-elegant flex items-center gap-2 active:scale-[0.98] transition"
          >
            <Download className="h-4 w-4" /> تصدير
          </button>
        </div>
        {exportOpen && (
          <div className="border-t bg-card px-4 py-3 max-w-2xl mx-auto grid grid-cols-3 gap-2">
            <ExportBtn icon={<FileSpreadsheet className="h-5 w-5" />} label="Excel" onClick={() => doExport(exportExcel, "Excel")} />
            <ExportBtn icon={<FileText className="h-5 w-5" />} label="PDF" onClick={() => doExport(exportPDF, "PDF")} />
            <ExportBtn icon={<Download className="h-5 w-5" />} label="JSON" onClick={() => doExport(exportJSON, "JSON")} />
          </div>
        )}
      </div>
    </div>
  );
}

function ExportBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-16 rounded-xl bg-muted hover:bg-accent flex flex-col items-center justify-center gap-1 text-xs font-medium active:scale-[0.98] transition"
    >
      {icon} {label}
    </button>
  );
}
