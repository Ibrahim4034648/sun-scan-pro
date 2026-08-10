/**
 * Local-first database layer for SPWMS (Sun Scan Pro).
 *
 * - On Android/iOS (Capacitor) the data lives in a real SQLite database
 *   through @capacitor-community/sqlite.
 * - In the browser the exact same API is backed by persistent localStorage
 *   collections, so the app keeps working offline on the web too.
 *
 * Supabase is NEVER required to read or write locally. It is only used by
 * src/lib/sync.ts to push/pull the local data to the cloud.
 */

export type SyncStatus = "pending" | "synced" | "error";
export type SyncOperation = "insert" | "update" | "delete";
export type SyncTable = "panels" | "projects";

export interface PanelRecord {
  id: string;
  remoteId: string | null;
  serial: string;
  model: string;
  warrantyYears: number | null;
  installDate: string;
  installTime: string;
  customer: string;
  project: string;
  location: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted: boolean;
}

export interface ProjectRecord {
  id: string;
  remoteId: string | null;
  name: string;
  customer: string;
  projectDate: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  deleted: boolean;
}

export interface SyncQueueItem {
  id: string;
  recordId: string;
  tableName: SyncTable;
  operation: SyncOperation;
  createdAt: string;
  retryCount: number;
  lastError: string | null;
}

export type NewPanelInput = Omit<
  PanelRecord,
  "id" | "remoteId" | "createdAt" | "updatedAt" | "syncStatus" | "deleted"
> &
  Partial<Pick<PanelRecord, "id" | "remoteId" | "createdAt" | "syncStatus">>;

export type NewProjectInput = Omit<
  ProjectRecord,
  "id" | "remoteId" | "createdAt" | "updatedAt" | "syncStatus" | "deleted"
> &
  Partial<Pick<ProjectRecord, "id" | "remoteId" | "createdAt" | "syncStatus">>;

export class DuplicateSerialError extends Error {
  constructor(public serial: string) {
    super(`Serial already exists locally: ${serial}`);
    this.name = "DuplicateSerialError";
  }
}

const DB_NAME = "spwms_local";

export function newId(prefix = "loc"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

export function normalizeSerial(serial: string): string {
  return serial.trim().toLowerCase();
}

/** Low level storage contract shared by the SQLite and web adapters. */
interface Store {
  init(): Promise<void>;
  allPanels(): Promise<PanelRecord[]>;
  putPanel(panel: PanelRecord): Promise<void>;
  removePanel(id: string): Promise<void>;
  allProjects(): Promise<ProjectRecord[]>;
  putProject(project: ProjectRecord): Promise<void>;
  removeProject(id: string): Promise<void>;
  allQueue(): Promise<SyncQueueItem[]>;
  putQueueItem(item: SyncQueueItem): Promise<void>;
  removeQueueItem(id: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Web adapter (localStorage backed, persistent)                       */
/* ------------------------------------------------------------------ */

const LS_PANELS = "spwms_db_panels_v1";
const LS_PROJECTS = "spwms_db_projects_v1";
const LS_QUEUE = "spwms_db_sync_queue_v1";

class WebStore implements Store {
  private read<T>(key: string): T[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private write<T>(key: string, rows: T[]): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch (error) {
      console.error("[db] local write failed", error);
    }
  }

  async init(): Promise<void> {
    /* nothing to migrate for the web store */
  }

  async allPanels(): Promise<PanelRecord[]> {
    return this.read<PanelRecord>(LS_PANELS);
  }

  async putPanel(panel: PanelRecord): Promise<void> {
    const rows = await this.allPanels();
    const idx = rows.findIndex((r) => r.id === panel.id);
    if (idx >= 0) rows[idx] = panel;
    else rows.unshift(panel);
    this.write(LS_PANELS, rows);
  }

  async removePanel(id: string): Promise<void> {
    this.write(
      LS_PANELS,
      (await this.allPanels()).filter((r) => r.id !== id),
    );
  }

  async allProjects(): Promise<ProjectRecord[]> {
    return this.read<ProjectRecord>(LS_PROJECTS);
  }

  async putProject(project: ProjectRecord): Promise<void> {
    const rows = await this.allProjects();
    const idx = rows.findIndex((r) => r.id === project.id);
    if (idx >= 0) rows[idx] = project;
    else rows.unshift(project);
    this.write(LS_PROJECTS, rows);
  }

  async removeProject(id: string): Promise<void> {
    this.write(
      LS_PROJECTS,
      (await this.allProjects()).filter((r) => r.id !== id),
    );
  }

  async allQueue(): Promise<SyncQueueItem[]> {
    return this.read<SyncQueueItem>(LS_QUEUE);
  }

  async putQueueItem(item: SyncQueueItem): Promise<void> {
    const rows = await this.allQueue();
    const idx = rows.findIndex((r) => r.id === item.id);
    if (idx >= 0) rows[idx] = item;
    else rows.push(item);
    this.write(LS_QUEUE, rows);
  }

  async removeQueueItem(id: string): Promise<void> {
    this.write(
      LS_QUEUE,
      (await this.allQueue()).filter((r) => r.id !== id),
    );
  }
}

/* ------------------------------------------------------------------ */
/* Native adapter (Capacitor SQLite)                                   */
/* ------------------------------------------------------------------ */

interface SqliteConnection {
  open(): Promise<void>;
  execute(statements: string): Promise<unknown>;
  run(statement: string, values?: unknown[]): Promise<unknown>;
  query(statement: string, values?: unknown[]): Promise<{ values?: unknown[] }>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS panels (
  id TEXT PRIMARY KEY NOT NULL,
  remoteId TEXT,
  serial TEXT NOT NULL,
  serialKey TEXT NOT NULL,
  model TEXT,
  warrantyYears INTEGER,
  installDate TEXT,
  installTime TEXT,
  customer TEXT,
  project TEXT,
  location TEXT,
  notes TEXT,
  status TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncStatus TEXT NOT NULL DEFAULT 'pending',
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS panels_serial_unique ON panels (serialKey);
CREATE INDEX IF NOT EXISTS panels_sync_idx ON panels (syncStatus);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  remoteId TEXT,
  name TEXT NOT NULL,
  customer TEXT,
  projectDate TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncStatus TEXT NOT NULL DEFAULT 'pending',
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS projects_name_unique ON projects (name);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  recordId TEXT NOT NULL,
  tableName TEXT NOT NULL,
  operation TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  retryCount INTEGER NOT NULL DEFAULT 0,
  lastError TEXT
);
`;

class SqliteStore implements Store {
  private db: SqliteConnection | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite");
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result === true;
    const db = isConn
      ? await sqlite.retrieveConnection(DB_NAME, false)
      : await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
    await db.open();
    await db.execute(SCHEMA);
    this.db = db as unknown as SqliteConnection;
  }

  private conn(): SqliteConnection {
    if (!this.db) throw new Error("SQLite database is not initialized");
    return this.db;
  }

  private async select<T>(sql: string, values: unknown[] = []): Promise<T[]> {
    const res = await this.conn().query(sql, values);
    return (res.values ?? []) as T[];
  }

  async allPanels(): Promise<PanelRecord[]> {
    const rows = await this.select<Record<string, unknown>>(
      "SELECT * FROM panels ORDER BY createdAt DESC",
    );
    return rows.map(rowToPanel);
  }

  async putPanel(panel: PanelRecord): Promise<void> {
    await this.conn().run(
      `INSERT OR REPLACE INTO panels
        (id, remoteId, serial, serialKey, model, warrantyYears, installDate, installTime,
         customer, project, location, notes, status, createdAt, updatedAt, syncStatus, deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        panel.id,
        panel.remoteId,
        panel.serial,
        normalizeSerial(panel.serial),
        panel.model,
        panel.warrantyYears,
        panel.installDate,
        panel.installTime,
        panel.customer,
        panel.project,
        panel.location,
        panel.notes,
        panel.status,
        panel.createdAt,
        panel.updatedAt,
        panel.syncStatus,
        panel.deleted ? 1 : 0,
      ],
    );
  }

  async removePanel(id: string): Promise<void> {
    await this.conn().run("DELETE FROM panels WHERE id = ?", [id]);
  }

  async allProjects(): Promise<ProjectRecord[]> {
    const rows = await this.select<Record<string, unknown>>(
      "SELECT * FROM projects ORDER BY createdAt DESC",
    );
    return rows.map(rowToProject);
  }

  async putProject(project: ProjectRecord): Promise<void> {
    await this.conn().run(
      `INSERT OR REPLACE INTO projects
        (id, remoteId, name, customer, projectDate, createdAt, updatedAt, syncStatus, deleted)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        project.id,
        project.remoteId,
        project.name,
        project.customer,
        project.projectDate,
        project.createdAt,
        project.updatedAt,
        project.syncStatus,
        project.deleted ? 1 : 0,
      ],
    );
  }

  async removeProject(id: string): Promise<void> {
    await this.conn().run("DELETE FROM projects WHERE id = ?", [id]);
  }

  async allQueue(): Promise<SyncQueueItem[]> {
    const rows = await this.select<Record<string, unknown>>(
      "SELECT * FROM sync_queue ORDER BY createdAt ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      recordId: String(r.recordId),
      tableName: String(r.tableName) as SyncTable,
      operation: String(r.operation) as SyncOperation,
      createdAt: String(r.createdAt),
      retryCount: Number(r.retryCount ?? 0),
      lastError: r.lastError == null ? null : String(r.lastError),
    }));
  }

  async putQueueItem(item: SyncQueueItem): Promise<void> {
    await this.conn().run(
      `INSERT OR REPLACE INTO sync_queue
        (id, recordId, tableName, operation, createdAt, retryCount, lastError)
       VALUES (?,?,?,?,?,?,?)`,
      [
        item.id,
        item.recordId,
        item.tableName,
        item.operation,
        item.createdAt,
        item.retryCount,
        item.lastError,
      ],
    );
  }

  async removeQueueItem(id: string): Promise<void> {
    await this.conn().run("DELETE FROM sync_queue WHERE id = ?", [id]);
  }
}

function rowToPanel(row: Record<string, unknown>): PanelRecord {
  return {
    id: String(row.id),
    remoteId: row.remoteId == null ? null : String(row.remoteId),
    serial: String(row.serial ?? ""),
    model: String(row.model ?? ""),
    warrantyYears: row.warrantyYears == null ? null : Number(row.warrantyYears),
    installDate: String(row.installDate ?? ""),
    installTime: String(row.installTime ?? ""),
    customer: String(row.customer ?? ""),
    project: String(row.project ?? ""),
    location: String(row.location ?? ""),
    notes: String(row.notes ?? ""),
    status: String(row.status ?? "نشط"),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    syncStatus: String(row.syncStatus ?? "pending") as SyncStatus,
    deleted: Number(row.deleted ?? 0) === 1,
  };
}

function rowToProject(row: Record<string, unknown>): ProjectRecord {
  return {
    id: String(row.id),
    remoteId: row.remoteId == null ? null : String(row.remoteId),
    name: String(row.name ?? ""),
    customer: String(row.customer ?? ""),
    projectDate: String(row.projectDate ?? ""),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    syncStatus: String(row.syncStatus ?? "pending") as SyncStatus,
    deleted: Number(row.deleted ?? 0) === 1,
  };
}

/* ------------------------------------------------------------------ */
/* Public database service                                             */
/* ------------------------------------------------------------------ */

async function pickStore(): Promise<Store> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const store = new SqliteStore();
      await store.init();
      return store;
    }
  } catch (error) {
    console.warn("[db] SQLite unavailable, falling back to web storage", error);
  }
  const web = new WebStore();
  await web.init();
  return web;
}

class DatabaseService {
  private store: Store | null = null;
  private initPromise: Promise<Store> | null = null;

  async init(): Promise<void> {
    await this.ready();
  }

  private ready(): Promise<Store> {
    if (this.store) return Promise.resolve(this.store);
    if (!this.initPromise) {
      this.initPromise = pickStore().then((store) => {
        this.store = store;
        return store;
      });
    }
    return this.initPromise;
  }

  get isNativeSqlite(): boolean {
    return this.store instanceof SqliteStore;
  }

  /* ---------------- panels ---------------- */

  async getPanels(includeDeleted = false): Promise<PanelRecord[]> {
    const rows = await (await this.ready()).allPanels();
    const list = includeDeleted ? rows : rows.filter((r) => !r.deleted);
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getPanel(id: string): Promise<PanelRecord | null> {
    const rows = await (await this.ready()).allPanels();
    return rows.find((r) => r.id === id) ?? null;
  }

  async findPanelBySerial(serial: string, includeDeleted = false): Promise<PanelRecord | null> {
    const key = normalizeSerial(serial);
    const rows = await (await this.ready()).allPanels();
    return (
      rows.find((r) => normalizeSerial(r.serial) === key && (includeDeleted || !r.deleted)) ?? null
    );
  }

  async searchPanels(term: string): Promise<PanelRecord[]> {
    const q = term.trim().toLowerCase();
    const rows = await this.getPanels();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.serial, r.model, r.customer, r.project, r.location, r.notes, r.installDate].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q),
      ),
    );
  }

  async createPanel(input: NewPanelInput): Promise<PanelRecord> {
    const store = await this.ready();
    const existing = await this.findPanelBySerial(input.serial, true);
    if (existing && !existing.deleted) throw new DuplicateSerialError(input.serial);
    const now = new Date().toISOString();
    const panel: PanelRecord = {
      id: input.id ?? newId("pnl"),
      remoteId: input.remoteId ?? null,
      serial: input.serial.trim(),
      model: input.model,
      warrantyYears: input.warrantyYears,
      installDate: input.installDate,
      installTime: input.installTime,
      customer: input.customer,
      project: input.project,
      location: input.location,
      notes: input.notes,
      status: input.status,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      syncStatus: input.syncStatus ?? "pending",
      deleted: false,
    };
    if (existing?.deleted) await store.removePanel(existing.id);
    await store.putPanel(panel);
    if (panel.syncStatus === "pending") {
      await this.enqueue(panel.id, "panels", "insert");
    }
    return panel;
  }

  async updatePanel(id: string, patch: Partial<PanelRecord>): Promise<PanelRecord> {
    const store = await this.ready();
    const current = await this.getPanel(id);
    if (!current) throw new Error(`Panel not found: ${id}`);
    if (patch.serial && normalizeSerial(patch.serial) !== normalizeSerial(current.serial)) {
      const clash = await this.findPanelBySerial(patch.serial);
      if (clash && clash.id !== id) throw new DuplicateSerialError(patch.serial);
    }
    const next: PanelRecord = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      syncStatus: patch.syncStatus ?? "pending",
    };
    await store.putPanel(next);
    if (next.syncStatus === "pending") {
      await this.enqueue(next.id, "panels", next.remoteId ? "update" : "insert");
    }
    return next;
  }

  /** Soft delete: the row stays in SQLite until the cloud confirms the delete. */
  async deletePanel(id: string): Promise<void> {
    const store = await this.ready();
    const current = await this.getPanel(id);
    if (!current) return;
    if (!current.remoteId) {
      // Never synced: drop it locally and cancel any pending insert.
      await this.removeQueueFor(id);
      await store.removePanel(id);
      return;
    }
    await store.putPanel({
      ...current,
      deleted: true,
      syncStatus: "pending",
      updatedAt: new Date().toISOString(),
    });
    await this.enqueue(id, "panels", "delete");
  }

  /** Called by the sync engine once the cloud row is gone. */
  async purgePanel(id: string): Promise<void> {
    await (await this.ready()).removePanel(id);
  }

  async markPanelSynced(id: string, remoteId: string | null): Promise<void> {
    const store = await this.ready();
    const current = await this.getPanel(id);
    if (!current) return;
    await store.putPanel({ ...current, remoteId, syncStatus: "synced" });
  }

  /** Insert/refresh a row coming from Supabase without queueing it again. */
  async upsertPanelFromRemote(panel: Omit<PanelRecord, "syncStatus" | "deleted">): Promise<void> {
    const store = await this.ready();
    const rows = await store.allPanels();
    const key = normalizeSerial(panel.serial);
    const existing =
      rows.find((r) => r.remoteId === panel.remoteId) ??
      rows.find((r) => normalizeSerial(r.serial) === key);
    if (existing) {
      if (existing.syncStatus === "pending") return; // local change wins until synced
      await store.putPanel({ ...existing, ...panel, syncStatus: "synced", deleted: false });
      return;
    }
    await store.putPanel({ ...panel, syncStatus: "synced", deleted: false });
  }

  /* ---------------- projects ---------------- */

  async getProjects(includeDeleted = false): Promise<ProjectRecord[]> {
    const rows = await (await this.ready()).allProjects();
    const list = includeDeleted ? rows : rows.filter((r) => !r.deleted);
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getProject(id: string): Promise<ProjectRecord | null> {
    const rows = await (await this.ready()).allProjects();
    return rows.find((r) => r.id === id) ?? null;
  }

  async createProject(input: NewProjectInput): Promise<ProjectRecord> {
    const store = await this.ready();
    const existing = (await this.getProjects()).find(
      (p) => p.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    );
    if (existing) throw new Error(`Project already exists: ${input.name}`);
    const now = new Date().toISOString();
    const project: ProjectRecord = {
      id: input.id ?? newId("prj"),
      remoteId: input.remoteId ?? null,
      name: input.name.trim(),
      customer: input.customer,
      projectDate: input.projectDate,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      syncStatus: input.syncStatus ?? "pending",
      deleted: false,
    };
    await store.putProject(project);
    if (project.syncStatus === "pending") {
      await this.enqueue(project.id, "projects", "insert");
    }
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    const store = await this.ready();
    const current = await this.getProject(id);
    if (!current) return;
    if (!current.remoteId) {
      await this.removeQueueFor(id);
      await store.removeProject(id);
      return;
    }
    await store.putProject({
      ...current,
      deleted: true,
      syncStatus: "pending",
      updatedAt: new Date().toISOString(),
    });
    await this.enqueue(id, "projects", "delete");
  }

  async purgeProject(id: string): Promise<void> {
    await (await this.ready()).removeProject(id);
  }

  async markProjectSynced(id: string, remoteId: string | null): Promise<void> {
    const store = await this.ready();
    const current = await this.getProject(id);
    if (!current) return;
    await store.putProject({ ...current, remoteId, syncStatus: "synced" });
  }

  async upsertProjectFromRemote(
    project: Omit<ProjectRecord, "syncStatus" | "deleted">,
  ): Promise<void> {
    const store = await this.ready();
    const rows = await store.allProjects();
    const existing =
      rows.find((r) => r.remoteId === project.remoteId) ??
      rows.find((r) => r.name.trim().toLowerCase() === project.name.trim().toLowerCase());
    if (existing) {
      if (existing.syncStatus === "pending") return;
      await store.putProject({ ...existing, ...project, syncStatus: "synced", deleted: false });
      return;
    }
    await store.putProject({ ...project, syncStatus: "synced", deleted: false });
  }

  /* ---------------- sync queue ---------------- */

  async enqueue(recordId: string, tableName: SyncTable, operation: SyncOperation): Promise<void> {
    const store = await this.ready();
    const queue = await store.allQueue();
    const duplicate = queue.find(
      (q) => q.recordId === recordId && q.operation === operation && q.tableName === tableName,
    );
    if (duplicate) return;
    if (operation === "delete") {
      // A delete supersedes queued inserts/updates for the same record.
      for (const item of queue.filter((q) => q.recordId === recordId)) {
        await store.removeQueueItem(item.id);
      }
    }
    await store.putQueueItem({
      id: newId("sq"),
      recordId,
      tableName,
      operation,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastError: null,
    });
  }

  async getQueue(): Promise<SyncQueueItem[]> {
    return (await (await this.ready()).allQueue()).sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1,
    );
  }

  async pendingCount(): Promise<number> {
    return (await this.getQueue()).length;
  }

  async removeQueueItem(id: string): Promise<void> {
    await (await this.ready()).removeQueueItem(id);
  }

  async removeQueueFor(recordId: string): Promise<void> {
    const store = await this.ready();
    for (const item of (await store.allQueue()).filter((q) => q.recordId === recordId)) {
      await store.removeQueueItem(item.id);
    }
  }

  async registerQueueFailure(item: SyncQueueItem, error: unknown): Promise<SyncQueueItem> {
    const store = await this.ready();
    const next: SyncQueueItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastError: error instanceof Error ? error.message : String(error),
    };
    await store.putQueueItem(next);
    return next;
  }
}

export const db = new DatabaseService();
export type { DatabaseService };
