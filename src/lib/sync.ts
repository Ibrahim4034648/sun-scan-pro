/**
 * Sync engine: pushes the local SQLite sync_queue to Supabase and pulls the
 * cloud rows back into the local database. The app never depends on this to
 * read or write locally — it only mirrors data to the cloud when possible.
 */

import { supabase } from "@/integrations/supabase/client";
import { db, normalizeSerial, type PanelRecord, type SyncQueueItem } from "./database";
import { isOnline, onReconnect, startNetworkMonitor } from "./network";

export type SyncPhase = "idle" | "syncing" | "synced" | "offline" | "error";

export interface SyncState {
  phase: SyncPhase;
  online: boolean;
  pending: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

const MAX_RETRIES = 6;
const RETRY_INTERVAL_MS = 30_000;

let state: SyncState = {
  phase: "idle",
  online: isOnline(),
  pending: 0,
  lastSyncedAt: null,
  lastError: null,
};

const listeners = new Set<(s: SyncState) => void>();
let running = false;
let timer: ReturnType<typeof setInterval> | null = null;
let bootstrapped = false;

function emit(patch: Partial<SyncState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (error) {
      console.error("[sync] listener failed", error);
    }
  });
}

export function getSyncState(): SyncState {
  return state;
}

export function onSyncStateChange(listener: (s: SyncState) => void): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

async function refreshPending(): Promise<number> {
  const pending = await db.pendingCount();
  emit({ pending });
  return pending;
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch (error) {
    console.warn("[sync] no session available", error);
    return null;
  }
}

export function groupToNumber(group: string): number | null {
  const digits = (group || "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

export function numberToGroup(value: number | null | undefined): string {
  return value == null ? "" : `St${value}`;
}

function panelToRemote(panel: PanelRecord, userId: string, projectId: string | null) {
  return {
    user_id: userId,
    project_id: projectId,
    project_name: panel.project || null,
    customer: panel.customer || null,
    serial: panel.serial,
    model: panel.model || null,
    warranty_years: panel.warrantyYears ?? groupToNumber(panel.stringGroup),
    install_date: panel.installDate || null,
    install_time: panel.installTime || null,
    location: panel.location || null,
    notes: panel.notes || null,
    status: panel.status || "نشط",
  };
}

async function resolveProjectRemoteId(projectName: string): Promise<string | null> {
  if (!projectName) return null;
  const project = (await db.getProjects(true)).find(
    (p) => p.name.trim().toLowerCase() === projectName.trim().toLowerCase(),
  );
  return project?.remoteId ?? null;
}

async function pushItem(item: SyncQueueItem, userId: string): Promise<void> {
  if (item.tableName === "projects") {
    const project = await db.getProject(item.recordId);
    if (!project) {
      await db.removeQueueItem(item.id);
      return;
    }
    if (item.operation === "delete") {
      if (project.remoteId) {
        const { error } = await supabase.from("projects").delete().eq("id", project.remoteId);
        if (error) throw error;
      }
      await db.purgeProject(project.id);
      await db.removeQueueItem(item.id);
      return;
    }
    if (project.remoteId) {
      const { error } = await supabase
        .from("projects")
        .update({ name: project.name, customer: project.customer, project_date: project.projectDate })
        .eq("id", project.remoteId);
      if (error) throw error;
      await db.markProjectSynced(project.id, project.remoteId);
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          name: project.name,
          customer: project.customer,
          project_date: project.projectDate,
        })
        .select("id")
        .single();
      if (error) throw error;
      await db.markProjectSynced(project.id, data.id);
    }
    await db.removeQueueItem(item.id);
    return;
  }

  const panel = await db.getPanel(item.recordId);
  if (!panel) {
    await db.removeQueueItem(item.id);
    return;
  }

  if (item.operation === "delete") {
    if (panel.remoteId) {
      const { error } = await supabase.from("panels").delete().eq("id", panel.remoteId);
      if (error) throw error;
    }
    await db.purgePanel(panel.id);
    await db.removeQueueItem(item.id);
    return;
  }

  const projectId = await resolveProjectRemoteId(panel.project);
  const payload = panelToRemote(panel, userId, projectId);

  if (panel.remoteId) {
    const { error } = await supabase.from("panels").update(payload).eq("id", panel.remoteId);
    if (error) throw error;
    await db.markPanelSynced(panel.id, panel.remoteId);
    await db.removeQueueItem(item.id);
    return;
  }

  const { data, error } = await supabase.from("panels").insert(payload).select("id").single();
  if (error) {
    // Unique (user_id, serial) violation: the row already exists in the cloud.
    if (error.code === "23505" || /duplicate key|unique/i.test(error.message)) {
      const { data: existing } = await supabase
        .from("panels")
        .select("id")
        .eq("user_id", userId)
        .ilike("serial", panel.serial.trim())
        .maybeSingle();
      if (existing?.id) {
        await db.markPanelSynced(panel.id, existing.id);
        await db.removeQueueItem(item.id);
        return;
      }
    }
    throw error;
  }
  await db.markPanelSynced(panel.id, data.id);
  await db.removeQueueItem(item.id);
}

/** Push every queued local mutation to Supabase. */
export async function pushQueue(): Promise<void> {
  if (running) return;
  if (!isOnline()) {
    emit({ phase: "offline", online: false });
    return;
  }
  const userId = await currentUserId();
  if (!userId) return;
  const queue = await db.getQueue();
  if (queue.length === 0) {
    await refreshPending();
    return;
  }

  running = true;
  emit({ phase: "syncing", lastError: null });
  let failed = 0;
  try {
    for (const item of queue) {
      try {
        await pushItem(item, userId);
      } catch (error) {
        failed += 1;
        const updated = await db.registerQueueFailure(item, error);
        console.error("[sync] operation failed", item.operation, item.tableName, error);
        if (updated.retryCount >= MAX_RETRIES) {
          // Keep the data locally but stop hammering the API this cycle.
          emit({ lastError: updated.lastError });
        }
      }
      await refreshPending();
    }
  } finally {
    running = false;
    const pending = await refreshPending();
    emit({
      phase: failed > 0 ? "error" : "synced",
      pending,
      lastSyncedAt: failed > 0 ? state.lastSyncedAt : new Date().toISOString(),
    });
  }
}

/** Pull cloud rows into the local database (cloud backup / multi-device). */
export async function pullRemote(): Promise<void> {
  if (!isOnline()) return;
  const userId = await currentUserId();
  if (!userId) return;
  try {
    const [projectsRes, panelsRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("panels").select("*").order("created_at", { ascending: false }),
    ]);
    if (projectsRes.error) throw projectsRes.error;
    if (panelsRes.error) throw panelsRes.error;

    for (const row of projectsRes.data ?? []) {
      await db.upsertProjectFromRemote({
        id: `prj_${row.id}`,
        remoteId: row.id,
        name: row.name,
        customer: row.customer ?? "",
        projectDate: row.project_date ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
      });
    }

    const seen = new Set<string>();
    for (const row of panelsRes.data ?? []) {
      const key = normalizeSerial(row.serial);
      if (seen.has(key)) continue;
      seen.add(key);
      await db.upsertPanelFromRemote({
        id: `pnl_${row.id}`,
        remoteId: row.id,
        serial: row.serial,
        model: row.model ?? "",
        warrantyYears: row.warranty_years ?? null,
        stringGroup: numberToGroup(row.warranty_years),
        installDate: row.install_date ?? "",
        installTime: row.install_time ?? "",
        customer: row.customer ?? "",
        project: row.project_name ?? "",
        location: row.location ?? "",
        notes: row.notes ?? "",
        status: row.status ?? "نشط",
        createdAt: row.created_at,
        updatedAt: row.created_at,
      });
    }
    emit({ lastSyncedAt: new Date().toISOString(), lastError: null });
  } catch (error) {
    console.error("[sync] pull failed", error);
    emit({ phase: "error", lastError: error instanceof Error ? error.message : String(error) });
  }
}

/** Full sync cycle: push local changes first, then refresh from the cloud. */
export async function syncNow(): Promise<void> {
  if (!isOnline()) {
    emit({ phase: "offline", online: false, pending: await db.pendingCount() });
    return;
  }
  await pushQueue();
  await pullRemote();
}

/**
 * Boot the offline-first stack: local DB first, then (only if online) sync.
 * Safe to call multiple times.
 */
export async function bootstrapOfflineFirst(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  await db.init();
  await startNetworkMonitor();
  emit({ online: isOnline(), pending: await db.pendingCount() });

  if (isOnline()) {
    void syncNow();
  } else {
    emit({ phase: "offline" });
  }

  onReconnect(() => {
    emit({ online: true });
    void syncNow();
  });

  if (!timer) {
    timer = setInterval(() => {
      void (async () => {
        if (isOnline() && (await db.pendingCount()) > 0) await pushQueue();
      })();
    }, RETRY_INTERVAL_MS);
  }
}
