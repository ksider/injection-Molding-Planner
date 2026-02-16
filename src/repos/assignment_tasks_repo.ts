import type { Db } from "../db.js";

export type AssignmentTaskRow = {
  id: number;
  assignment_id: number;
  task_id: number;
  created_at: string;
};

export function getAssignmentTaskByAssignmentId(db: Db, assignmentId: number): AssignmentTaskRow | null {
  const row = db
    .prepare("SELECT * FROM assignment_tasks WHERE assignment_id = ?")
    .get(assignmentId) as AssignmentTaskRow | undefined;
  return row ?? null;
}

export function upsertAssignmentTask(db: Db, assignmentId: number, taskId: number): number {
  const now = new Date().toISOString();
  const existing = getAssignmentTaskByAssignmentId(db, assignmentId);
  if (existing) {
    db.prepare("UPDATE assignment_tasks SET task_id = ? WHERE id = ?").run(taskId, existing.id);
    return existing.id;
  }
  const result = db
    .prepare(
      `INSERT INTO assignment_tasks (assignment_id, task_id, created_at)
       VALUES (?, ?, ?)`
    )
    .run(assignmentId, taskId, now);
  return Number(result.lastInsertRowid);
}
