import express from "express";
import bcrypt from "bcryptjs";
import type { Db } from "../db.js";
import { getUserPasswordHash, updateUserName, updateUserPassword } from "../repos/users_repo.js";
import { listExperimentsForOwnerWithMeta, type ExperimentListRow } from "../repos/experiments_repo.js";
import { listTasksForUser } from "../repos/tasks_read_repo.js";
import { listTaskEntities } from "../repos/tasks_repo.js";
import { computeTaskProgress } from "../services/tasks_service.js";
import { listQualSummarySteps } from "../repos/qual_repo.js";

export function createProfileRouter(db: Db) {
  const router = express.Router();

  const enrich = (experiments: ExperimentListRow[]) =>
    experiments.map((exp) => {
      const summaryCount = Number(exp.qual_summary_count || 0);
      const valueCount = Number(exp.qual_run_value_count || 0);
      let status = "not_started";
      let statusLabel = "Not started";
      if (exp.status_done_manual === 1) {
        status = "done";
        statusLabel = "Done";
      } else if (summaryCount >= 6) {
        status = "done";
        statusLabel = "Done";
      } else if (summaryCount > 0 || valueCount > 0) {
        status = "in_progress";
        statusLabel = "In progress";
      }
      return { ...exp, status, statusLabel };
    });

  router.get("/me", (req, res) => {
    const experiments = req.user?.id
      ? listExperimentsForOwnerWithMeta(db, req.user.id, false)
      : [];
    const tasks = req.user?.id ? listTasksForUser(db, req.user.id) : [];
    const summaryByExperiment = new Map<number, Set<number>>();
    const tasksWithProgress = tasks.map((task) => {
      if (!summaryByExperiment.has(task.experiment_id)) {
        summaryByExperiment.set(
          task.experiment_id,
          new Set(listQualSummarySteps(db, task.experiment_id))
        );
      }
      const summarySteps = summaryByExperiment.get(task.experiment_id) ?? new Set<number>();
      const entities = listTaskEntities(db, task.task_id).map((entity) => {
        if (entity.entity_type === "qualification_step") {
          if (summarySteps.has(entity.entity_id)) {
            return { ...entity, status: "done" };
          }
        }
        return entity;
      });
      const progress = computeTaskProgress(entities);
      return { ...task, progress_percent: Math.round((progress.percent || 0) * 100) };
    });
    res.render("profile", {
      title: "Profile",
      experiments: enrich(experiments),
      tasks: tasksWithProgress,
      error: null,
      notice: null
    });
  });

  router.post("/me/name", (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    if (!req.user?.id) return res.redirect("/auth/login");
    updateUserName(db, req.user.id, name || null);
    return res.redirect("/me");
  });

  router.post("/me/password", (req, res) => {
    if (!req.user?.id) return res.redirect("/auth/login");
    const current = String(req.body?.current_password ?? "");
    const next = String(req.body?.new_password ?? "");
    const confirm = String(req.body?.confirm_password ?? "");

    const storedHash = getUserPasswordHash(db, req.user.id);
    if (!storedHash || !bcrypt.compareSync(current, storedHash)) {
      const experiments = listExperimentsForOwnerWithMeta(db, req.user.id, false);
      const summaryByExperiment = new Map<number, Set<number>>();
      const tasks = listTasksForUser(db, req.user.id).map((task) => {
        if (!summaryByExperiment.has(task.experiment_id)) {
          summaryByExperiment.set(
            task.experiment_id,
            new Set(listQualSummarySteps(db, task.experiment_id))
          );
        }
        const summarySteps = summaryByExperiment.get(task.experiment_id) ?? new Set<number>();
        const entities = listTaskEntities(db, task.task_id).map((entity) => {
          if (entity.entity_type === "qualification_step") {
            if (summarySteps.has(entity.entity_id)) {
              return { ...entity, status: "done" };
            }
          }
          return entity;
        });
        const progress = computeTaskProgress(entities);
        return { ...task, progress_percent: Math.round((progress.percent || 0) * 100) };
      });
      return res.render("profile", {
        title: "Profile",
        experiments: enrich(experiments),
        tasks,
        error: "Current password is incorrect.",
        notice: null
      });
    }
    if (next.length < 8 || next !== confirm) {
      const experiments = listExperimentsForOwnerWithMeta(db, req.user.id, false);
      const summaryByExperiment = new Map<number, Set<number>>();
      const tasks = listTasksForUser(db, req.user.id).map((task) => {
        if (!summaryByExperiment.has(task.experiment_id)) {
          summaryByExperiment.set(
            task.experiment_id,
            new Set(listQualSummarySteps(db, task.experiment_id))
          );
        }
        const summarySteps = summaryByExperiment.get(task.experiment_id) ?? new Set<number>();
        const entities = listTaskEntities(db, task.task_id).map((entity) => {
          if (entity.entity_type === "qualification_step") {
            if (summarySteps.has(entity.entity_id)) {
              return { ...entity, status: "done" };
            }
          }
          return entity;
        });
        const progress = computeTaskProgress(entities);
        return { ...task, progress_percent: Math.round((progress.percent || 0) * 100) };
      });
      return res.render("profile", {
        title: "Profile",
        experiments: enrich(experiments),
        tasks,
        error: "New password must be at least 8 characters and match confirmation.",
        notice: null
      });
    }
    const hash = bcrypt.hashSync(next, 12);
    updateUserPassword(db, req.user.id, hash);
    const experiments = listExperimentsForOwnerWithMeta(db, req.user.id, false);
    const summaryByExperiment = new Map<number, Set<number>>();
    const tasks = listTasksForUser(db, req.user.id).map((task) => {
      if (!summaryByExperiment.has(task.experiment_id)) {
        summaryByExperiment.set(
          task.experiment_id,
          new Set(listQualSummarySteps(db, task.experiment_id))
        );
      }
      const summarySteps = summaryByExperiment.get(task.experiment_id) ?? new Set<number>();
      const entities = listTaskEntities(db, task.task_id).map((entity) => {
        if (entity.entity_type === "qualification_step") {
          if (summarySteps.has(entity.entity_id)) {
            return { ...entity, status: "done" };
          }
        }
        return entity;
      });
      const progress = computeTaskProgress(entities);
      return { ...task, progress_percent: Math.round((progress.percent || 0) * 100) };
    });
    return res.render("profile", {
      title: "Profile",
      experiments: enrich(experiments),
      tasks,
      error: null,
      notice: "Password updated."
    });
  });

  return router;
}
