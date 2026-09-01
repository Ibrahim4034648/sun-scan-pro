import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { WarrantyRecord } from "./storage";

const headers = [
  "الرقم التسلسلي",
  "الموديل",
  "الضمان (سنوات)",
  "تاريخ التركيب",
  "العميل",
  "المشروع",
  "الموقع",
  "ملاحظات",
];

function toRows(records: WarrantyRecord[]) {
  return records.map((r) => [
    r.serial,
    r.model,
    String(r.warrantyYears),
    r.installDate,
    r.customer,
    r.project,
    r.location,
    r.notes,
  ]);
}

export function exportExcel(records: WarrantyRecord[]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...toRows(records)]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Warranties");
  XLSX.writeFile(wb, `solar-warranty-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportJSON(records: WarrantyRecord[]) {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solar-warranty-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(records: WarrantyRecord[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text("Solar Warranty Report", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);
  doc.text(`Total records: ${records.length}`, 14, 28);
  autoTable(doc, {
    head: [
      ["Serial", "Model", "Warranty", "Install Date", "Customer", "Project", "Location", "Notes"],
    ],
    body: records.map((r) => [
      r.serial,
      r.model,
      `${r.warrantyYears}y`,
      r.installDate,
      r.customer,
      r.project,
      r.location,
      r.notes,
    ]),
    startY: 34,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [255, 122, 0] },
  });
  doc.save(`solar-warranty-${new Date().toISOString().slice(0, 10)}.pdf`);
}
