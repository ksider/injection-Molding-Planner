import type { Request } from "express";
import type { Db } from "../db.js";
import { getExperiment } from "../repos/experiments_repo.js";
import { getDoeStudy } from "../repos/doe_repo.js";
import { getReportConfig } from "../repos/reports_repo.js";
import { getMachine } from "../repos/machines_repo.js";
import { getRecipe } from "../repos/recipes_repo.js";
import { findUserById } from "../repos/users_repo.js";
import { getRun } from "../repos/runs_repo.js";

export type Breadcrumb = {
  label: string;
  href: string;
};

export function buildBreadcrumbs(db: Db, req: Request): Breadcrumb[] {
  const path = req.path;
  if (!path || path.startsWith("/auth")) return [];
  const segments = path.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [{ label: "Experiments", href: "/" }];
  if (segments.length === 0) return crumbs;

  const push = (label: string, href: string) => {
    crumbs.push({ label, href });
  };

  const first = segments[0];
  if (first === "recipes") {
    push("Recipes", "/recipes");
    return crumbs;
  }
  if (first === "machines") {
    push("Machines", "/machines");
    const machineId = Number(segments[1]);
    if (Number.isFinite(machineId)) {
      const machine = getMachine(db, machineId);
      push(machine?.name ?? `Machine ${machineId}`, `/machines/${machineId}`);
    }
    return crumbs;
  }
  if (first === "param-library") {
    push("Parameters", "/param-library");
    return crumbs;
  }
  if (first === "admin") {
    push("Admin", "/admin");
    return crumbs;
  }
  if (first === "audit") {
    push("Audit", "/audit");
    return crumbs;
  }
  if (first === "me") {
    push("Profile", "/me");
    return crumbs;
  }
  if (first === "users") {
    push("Users", "/admin");
    const userId = Number(segments[1]);
    if (Number.isFinite(userId)) {
      const user = findUserById(db, userId);
      const label = user?.name?.trim() || user?.email?.trim() || `User ${userId}`;
      push(label, `/users/${userId}`);
    }
    return crumbs;
  }
  if (first === "reports") {
    const reportId = Number(segments[1]);
    if (!Number.isFinite(reportId)) return crumbs;
    const report = getReportConfig(db, reportId);
    if (report) {
      const experiment = getExperiment(db, report.experiment_id);
      const expLabel = experiment?.name ?? `Experiment ${report.experiment_id}`;
      push(expLabel, `/experiments/${report.experiment_id}`);
      push(report.name, `/reports/${report.id}`);
      if (segments[2] === "editor") {
        push("Editor", `/reports/${report.id}/editor`);
      }
    } else {
      push(`Report ${reportId}`, `/reports/${reportId}`);
    }
    return crumbs;
  }
  if (first === "runs") {
    const runId = Number(segments[1]);
    if (!Number.isFinite(runId)) return crumbs;
    const run = getRun(db, runId);
    if (run) {
      const experiment = getExperiment(db, run.experiment_id);
      const expLabel = experiment?.name ?? `Experiment ${run.experiment_id}`;
      push(expLabel, `/experiments/${run.experiment_id}`);
      if (run.doe_id) {
        const doe = getDoeStudy(db, run.doe_id);
        const doeLabel = doe?.name ?? `DOE ${run.doe_id}`;
        push(doeLabel, `/experiments/${run.experiment_id}/doe/${run.doe_id}`);
      }
      push(run.run_code || `Run ${run.id}`, `/runs/${run.id}`);
    }
    return crumbs;
  }
  if (first === "experiments") {
    if (segments[1] === "new") {
      push("New Experiment", "/experiments/new");
      return crumbs;
    }
    const experimentId = Number(segments[1]);
    if (!Number.isFinite(experimentId)) return crumbs;
    const experiment = getExperiment(db, experimentId);
    const expLabel = experiment?.name ?? `Experiment ${experimentId}`;
    push(expLabel, `/experiments/${experimentId}`);

    const second = segments[2];
    if (second === "qualification") {
      push("Qualification", `/experiments/${experimentId}/qualification`);
      const step = Number(segments[3]);
      if (Number.isFinite(step)) {
        push(`Step ${step}`, `/experiments/${experimentId}/qualification/${step}`);
      }
      return crumbs;
    }
    if (second === "doe") {
      const doeId = Number(segments[3]);
      if (Number.isFinite(doeId)) {
        const doe = getDoeStudy(db, doeId);
        const doeLabel = doe?.name ?? `DOE ${doeId}`;
        push(doeLabel, `/experiments/${experimentId}/doe/${doeId}`);
        const tab = typeof req.query.tab === "string" ? req.query.tab : "";
        if (tab === "design") push("Design", req.originalUrl);
        if (tab === "runs") push("Runs", req.originalUrl);
        if (tab === "analysis") push("Analysis", req.originalUrl);
      }
      return crumbs;
    }
    return crumbs;
  }

  return crumbs;
}
