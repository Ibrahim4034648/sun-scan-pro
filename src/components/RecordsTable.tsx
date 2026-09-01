import { useMemo, useState } from "react";
import { Search, Trash2, Inbox, ChevronDown } from "lucide-react";
import type { WarrantyRecord } from "@/lib/storage";

interface Props {
  records: WarrantyRecord[];
  onDelete: (id: string) => void;
}

export function RecordsTable({ records, onDelete }: Props) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const dupCounts = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const key = r.serial.trim().toLowerCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [records]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return records;
    return records.filter((r) =>
      [r.serial, r.model, r.customer, r.project, r.location, r.notes].some((v) =>
        v?.toLowerCase().includes(term),
      ),
    );
  }, [records, q]);

  return (
    <div className="rounded-2xl bg-card shadow-card border overflow-hidden">
      <div className="p-3 border-b sticky top-0 bg-card/95 backdrop-blur z-10">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث في السجلات..."
            className="w-full h-10 pr-9 pl-3 rounded-lg bg-input/40 border focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            إجمالي: <span className="font-semibold text-foreground">{records.length}</span>
          </span>
          {q && (
            <span>
              نتائج: <span className="font-semibold text-foreground">{filtered.length}</span>
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Inbox className="h-12 w-12 opacity-40" />
          <p className="text-sm">
            {records.length === 0 ? "لا توجد سجلات بعد" : "لا توجد نتائج مطابقة"}
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {filtered.map((r) => {
            const isDup = (dupCounts.get(r.serial.trim().toLowerCase()) ?? 0) > 1;
            const isOpen = expanded === r.id;
            return (
              <li key={r.id} className={isDup ? "bg-destructive/5" : ""}>
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full p-3 text-right flex items-center gap-3 active:bg-muted/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold truncate">{r.serial}</span>
                      {isDup && (
                        <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                          مكرر
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {r.customer} • {r.model}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-1.5 text-xs">
                    <Row label="الموديل" value={r.model} />
                    <Row label="الضمان" value={`${r.warrantyYears} سنوات`} />
                    <Row label="تاريخ التركيب" value={r.installDate} />
                    <Row label="المشروع" value={r.project} />
                    <Row label="الموقع" value={r.location} />
                    {r.notes && <Row label="ملاحظات" value={r.notes} />}
                    <button
                      onClick={() => onDelete(r.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 px-2 py-1.5 rounded-md transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[90px]">{label}:</span>
      <span className="font-medium flex-1">{value || "—"}</span>
    </div>
  );
}
