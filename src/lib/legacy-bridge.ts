/**
 * Bridge between the legacy field UI (public/legacy.html, rendered in an
 * iframe) and the offline-first TypeScript stack (SQLite + sync engine).
 *
 * The legacy page posts a request, this module executes it against the local
 * database and posts the answer back. When the bridge is unavailable the
 * legacy page keeps its own storage path, so nothing breaks.
 */

import { db, DuplicateSerialError, type PanelRecord, type ProjectRecord } from "./database";
import { groupToNumber, getSyncState, syncNow } from "./sync";
import { isOnline } from "./network";

const CHANNEL = "spwms-bridge";

export interface LegacyPanel {
  lid: string;
  id: number;
  serial: string;
  model: string;
  date: string;
  time: string;
  timestamp: number;
  customer: string;
  project: string;
  location: string;
  warranty: string;
  notes: string;
  status: string;
  pending: boolean;
}

export interface LegacyProject {
  lid: string;
  id: string;
  name: string;
  customer: string;
  date: string;
  createdAt: number;
}

interface BridgeRequest {
  channel: typeof CHANNEL;
  direction: "request";
  requestId: string;
  action: string;
  payload?: Record<string, unknown>;
}

function toLegacyPanel(panel: PanelRecord, index: number): LegacyPanel {
  return {
    lid: panel.id,
    id: index + 1,
    serial: panel.serial,
    model: panel.model || "غير محدد",
    date: panel.installDate,
    time: panel.installTime,
    timestamp: new Date(panel.createdAt).getTime(),
    customer: panel.customer || "غير محدد",
    project: panel.project || "غير محدد",
    location: panel.location || "حقل الألواح",
    warranty: panel.stringGroup,
    notes: panel.notes,
    status: panel.status || "نشط",
    pending: panel.syncStatus !== "synced",
  };
}

function toLegacyProject(project: ProjectRecord): LegacyProject {
  return {
    lid: project.id,
    id: project.id,
    name: project.name,
    customer: project.customer,
    date: project.projectDate,
    createdAt: new Date(project.createdAt).getTime(),
  };
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

async function handle(action: string, payload: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case "ready":
      await db.init();
      return { ok: true, native: db.isNativeSqlite };

    case "listPanels": {
      const panels = await db.getPanels();
      return panels.map(toLegacyPanel);
    }

    case "searchPanels": {
      const panels = await db.searchPanels(str(payload.term));
      return panels.map(toLegacyPanel);
    }

    case "listProjects": {
      const projects = await db.getProjects();
      return projects.map(toLegacyProject);
    }

    case "createPanel": {
      const serial = str(payload.serial);
      if (!serial) throw new Error("serial is required");
      const group = str(payload.warranty);
      const created = await db.createPanel({
        serial,
        model: str(payload.model, "غير محدد"),
        warrantyYears: groupToNumber(group),
        stringGroup: group,
        installDate: str(payload.date),
        installTime: str(payload.time),
        customer: str(payload.customer, "غير محدد"),
        project: str(payload.project, "غير محدد"),
        location: str(payload.location, "حقل الألواح"),
        notes: str(payload.notes),
        status: str(payload.status, "نشط"),
      });
      void syncNow();
      return toLegacyPanel(created, 0);
    }

    case "updatePanel": {
      const lid = str(payload.lid);
      if (!lid) throw new Error("lid is required");
      const patch: Partial<PanelRecord> = {};
      if (typeof payload.serial === "string") patch.serial = payload.serial;
      if (typeof payload.model === "string") patch.model = payload.model;
      if (typeof payload.warranty === "string") {
        patch.stringGroup = payload.warranty;
        patch.warrantyYears = groupToNumber(payload.warranty);
      }
      if (typeof payload.location === "string") patch.location = payload.location;
      if (typeof payload.notes === "string") patch.notes = payload.notes;
      if (typeof payload.status === "string") patch.status = payload.status;
      const updated = await db.updatePanel(lid, patch);
      void syncNow();
      return toLegacyPanel(updated, 0);
    }

    case "deletePanel": {
      await db.deletePanel(str(payload.lid));
      void syncNow();
      return { ok: true };
    }

    case "createProject": {
      const created = await db.createProject({
        name: str(payload.name),
        customer: str(payload.customer),
        projectDate: str(payload.date),
      });
      void syncNow();
      return toLegacyProject(created);
    }

    case "deleteProject": {
      await db.deleteProject(str(payload.lid));
      void syncNow();
      return { ok: true };
    }

    case "importLegacy": {
      // One-time migration of the old localStorage cache into the local DB.
      const rawPanels = Array.isArray(payload.panels) ? (payload.panels as Record<string, unknown>[]) : [];
      const rawProjects = Array.isArray(payload.projects)
        ? (payload.projects as Record<string, unknown>[])
        : [];
      let imported = 0;
      for (const row of rawProjects) {
        const name = str(row.name);
        if (!name) continue;
        const remoteId = str(row.remoteId) || null;
        try {
          await db.createProject({
            name,
            customer: str(row.customer),
            projectDate: str(row.date),
            remoteId,
            syncStatus: remoteId ? "synced" : "pending",
          });
        } catch {
          /* already present locally */
        }
      }
      for (const row of rawPanels) {
        const serial = str(row.serial);
        if (!serial) continue;
        const remoteId = str(row.dbId) || null;
        const group = str(row.warranty);
        try {
          await db.createPanel({
            serial,
            model: str(row.model, "غير محدد"),
            warrantyYears: groupToNumber(group),
            stringGroup: group,
            installDate: str(row.date),
            installTime: str(row.time),
            customer: str(row.customer, "غير محدد"),
            project: str(row.project, "غير محدد"),
            location: str(row.location, "حقل الألواح"),
            notes: str(row.notes),
            status: str(row.status, "نشط"),
            remoteId,
            syncStatus: remoteId ? "synced" : "pending",
          });
          imported += 1;
        } catch {
          /* duplicate serial: keep the existing local row */
        }
      }
      void syncNow();
      return { imported };
    }

    case "sync": {
      await syncNow();
      return getSyncState();
    }

    case "status":
      return { ...getSyncState(), online: isOnline(), pending: await db.pendingCount() };

    default:
      throw new Error(`Unknown bridge action: ${action}`);
  }
}

let installed = false;

/** Installs the postMessage listener used by the legacy iframe. */
export function installLegacyBridge(): () => void {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;

  const onMessage = async (event: MessageEvent) => {
    const data = event.data as BridgeRequest | undefined;
    if (!data || data.channel !== CHANNEL || data.direction !== "request") return;
    if (event.origin !== window.location.origin) return;
    const target = event.source as Window | null;
    if (!target) return;

    let response: Record<string, unknown>;
    try {
      response = { result: await handle(data.action, data.payload ?? {}) };
    } catch (error) {
      response = {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof DuplicateSerialError ? "duplicate_serial" : "error",
      };
    }
    target.postMessage(
      { channel: CHANNEL, direction: "response", requestId: data.requestId, ...response },
      window.location.origin,
    );
  };

  const listener = (event: MessageEvent) => {
    void onMessage(event);
  };
  window.addEventListener("message", listener);
  return () => {
    window.removeEventListener("message", listener);
    installed = false;
  };
}
