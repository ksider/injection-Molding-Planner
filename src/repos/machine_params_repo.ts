import type { Db } from "../db.js";

export type MachineParam = {
  id: number;
  machine_id: number;
  code: string | null;
  label: string;
  unit: string | null;
  value_text: string | null;
  created_at: string;
};

export function listMachineParams(db: Db, machineId: number): MachineParam[] {
  return db
    .prepare("SELECT * FROM machine_params WHERE machine_id = ? ORDER BY id ASC")
    .all(machineId) as MachineParam[];
}

export function createMachineParam(
  db: Db,
  data: Omit<MachineParam, "id" | "created_at">
): number {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO machine_params (machine_id, code, label, unit, value_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.machine_id,
      data.code ?? null,
      data.label,
      data.unit ?? null,
      data.value_text ?? null,
      createdAt
    );
  return Number(result.lastInsertRowid);
}

export function updateMachineParam(
  db: Db,
  id: number,
  updates: Partial<Omit<MachineParam, "id" | "created_at" | "machine_id">>
) {
  const current = db
    .prepare("SELECT * FROM machine_params WHERE id = ?")
    .get(id) as MachineParam | undefined;
  if (!current) return;
  const next = { ...current, ...updates };
  db.prepare(
    `UPDATE machine_params SET code = ?, label = ?, unit = ?, value_text = ? WHERE id = ?`
  ).run(
    next.code ?? null,
    next.label,
    next.unit ?? null,
    next.value_text ?? null,
    id
  );
}

export function deleteMachineParamsByIds(db: Db, ids: number[]) {
  if (!ids.length) return;
  const placeholders = ids.map(() => "?").join(", ");
  db.prepare(`DELETE FROM machine_params WHERE id IN (${placeholders})`).run(...ids);
}
