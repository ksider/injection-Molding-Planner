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

export function listMachines(db: Db): Machine[] {
  return db.prepare("SELECT * FROM machines ORDER BY id DESC").all() as Machine[];
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
