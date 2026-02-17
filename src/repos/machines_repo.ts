import type { Db } from "../db.js";

export type Machine = {
  id: number;
  name: string;
  image_url: string | null;
  vendor: string | null;
  model: string | null;
  settings_json: string | null;
  notes: string | null;
  created_at: string;
};

export type MachineLibraryRow = {
  id: number;
  name: string;
  image_url: string | null;
  vendor: string | null;
  model: string | null;
  tie_bar_distance_mm: number | null;
  platen_size_mm: number | null;
  clamp_force_kN: number | null;
  injection_pressure_bar: number | null;
  intensification_ratio: number | null;
};

export function listMachines(db: Db): Machine[] {
  return db.prepare("SELECT * FROM machines ORDER BY id DESC").all() as Machine[];
}

export function listMachinesForLibrary(db: Db): MachineLibraryRow[] {
  return db
    .prepare(
      `SELECT
         id,
         name,
         image_url,
         vendor,
         model,
         CAST(json_extract(settings_json, '$.tie_bar_distance_mm') AS REAL) as tie_bar_distance_mm,
         CAST(json_extract(settings_json, '$.platen_size_mm') AS REAL) as platen_size_mm,
         CAST(json_extract(settings_json, '$.clamp_force_kN') AS REAL) as clamp_force_kN,
         CAST(json_extract(settings_json, '$.injection_pressure_bar') AS REAL) as injection_pressure_bar,
         CAST(json_extract(settings_json, '$.intensification_ratio') AS REAL) as intensification_ratio
       FROM machines
       ORDER BY id DESC`
    )
    .all() as MachineLibraryRow[];
}

export function getMachine(db: Db, id: number): Machine | undefined {
  return db.prepare("SELECT * FROM machines WHERE id = ?").get(id) as Machine | undefined;
}

export function createMachine(
  db: Db,
  data: Omit<Machine, "id" | "created_at">
): number {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO machines
        (name, image_url, vendor, model, settings_json, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.name,
      data.image_url ?? null,
      data.vendor ?? null,
      data.model ?? null,
      data.settings_json ?? null,
      data.notes ?? null,
      createdAt
    );
  return Number(result.lastInsertRowid);
}

export function updateMachine(
  db: Db,
  id: number,
  updates: Partial<Omit<Machine, "id" | "created_at">>
) {
  const current = getMachine(db, id);
  if (!current) return;
  const next = { ...current, ...updates };
  db.prepare(
    `UPDATE machines
     SET name = ?, image_url = ?, vendor = ?, model = ?, settings_json = ?, notes = ?
     WHERE id = ?`
  ).run(
    next.name,
    next.image_url ?? null,
    next.vendor ?? null,
    next.model ?? null,
    next.settings_json ?? null,
    next.notes ?? null,
    id
  );
}

export function deleteMachine(db: Db, id: number) {
  db.prepare("DELETE FROM machines WHERE id = ?").run(id);
}
