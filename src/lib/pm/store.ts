"use client";

import {
  emptyPmData,
  PM_STORAGE_KEY,
  PM_SYNC_EVENT,
  type PmData,
  type PmProject,
  type PmSprint,
  type PmTask,
  type ProjectStatus,
  type SprintStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/pm/types";

function readJson<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PM_STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: PmData): void {
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(value));
}

function emitPmSync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PM_SYNC_EVENT));
}

function touch(data: PmData): PmData {
  return { ...data, updatedAt: new Date().toISOString() };
}

export function loadPmData(): PmData {
  const data = readJson<PmData>(emptyPmData());
  if (!data.version) return emptyPmData();
  return {
    version: 1,
    projects: data.projects ?? [],
    tasks: data.tasks ?? [],
    sprints: data.sprints ?? [],
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export function savePmData(data: PmData): void {
  writeJson(touch(data));
  emitPmSync();
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createProject(
  data: PmData,
  input: Pick<PmProject, "name" | "description" | "status" | "repoUrl" | "color" | "tag">
): PmData {
  const now = new Date().toISOString();
  const project: PmProject = {
    id: newId(),
    name: input.name.trim(),
    description: input.description.trim(),
    status: input.status,
    repoUrl: input.repoUrl?.trim() || undefined,
    color: input.color,
    tag: input.tag?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  return { ...data, projects: [...data.projects, project] };
}

export function updateProject(
  data: PmData,
  id: string,
  patch: Partial<Pick<PmProject, "name" | "description" | "status" | "repoUrl" | "color" | "tag">>
): PmData {
  const now = new Date().toISOString();
  return {
    ...data,
    projects: data.projects.map((p) =>
      p.id === id
        ? {
            ...p,
            ...patch,
            name: patch.name !== undefined ? patch.name.trim() : p.name,
            description: patch.description !== undefined ? patch.description.trim() : p.description,
            repoUrl: patch.repoUrl !== undefined ? patch.repoUrl.trim() || undefined : p.repoUrl,
            tag: patch.tag !== undefined ? patch.tag.trim() || undefined : p.tag,
            updatedAt: now,
          }
        : p
    ),
  };
}

export function deleteProject(data: PmData, id: string): PmData {
  return {
    ...data,
    projects: data.projects.filter((p) => p.id !== id),
    tasks: data.tasks.filter((t) => t.projectId !== id),
    sprints: data.sprints.filter((s) => s.projectId !== id),
  };
}

export function createTask(
  data: PmData,
  input: Pick<PmTask, "projectId" | "title" | "status" | "priority" | "assignee" | "dueDate" | "sprintId">
): PmData {
  const now = new Date().toISOString();
  const projectTasks = data.tasks.filter((t) => t.projectId === input.projectId);
  const maxOrder = projectTasks.reduce((m, t) => Math.max(m, t.order), -1);
  const task: PmTask = {
    id: newId(),
    projectId: input.projectId,
    title: input.title.trim(),
    status: input.status,
    priority: input.priority,
    assignee: input.assignee?.trim() || undefined,
    dueDate: input.dueDate || undefined,
    sprintId: input.sprintId || undefined,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  return { ...data, tasks: [...data.tasks, task] };
}

export function updateTask(
  data: PmData,
  id: string,
  patch: Partial<
    Pick<PmTask, "title" | "status" | "priority" | "assignee" | "dueDate" | "sprintId" | "order">
  >
): PmData {
  const now = new Date().toISOString();
  return {
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            ...patch,
            title: patch.title !== undefined ? patch.title.trim() : t.title,
            assignee: patch.assignee !== undefined ? patch.assignee.trim() || undefined : t.assignee,
            dueDate: patch.dueDate !== undefined ? patch.dueDate || undefined : t.dueDate,
            sprintId: patch.sprintId !== undefined ? patch.sprintId || undefined : t.sprintId,
            updatedAt: now,
          }
        : t
    ),
  };
}

export function deleteTask(data: PmData, id: string): PmData {
  return { ...data, tasks: data.tasks.filter((t) => t.id !== id) };
}

export function moveTaskStatus(data: PmData, id: string, status: TaskStatus): PmData {
  return updateTask(data, id, { status });
}

export function createSprint(
  data: PmData,
  input: Pick<PmSprint, "projectId" | "name" | "startDate" | "endDate" | "goal" | "status">
): PmData {
  const now = new Date().toISOString();
  const sprint: PmSprint = {
    id: newId(),
    projectId: input.projectId,
    name: input.name.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    goal: input.goal.trim(),
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
  return { ...data, sprints: [...data.sprints, sprint] };
}

export function updateSprint(
  data: PmData,
  id: string,
  patch: Partial<Pick<PmSprint, "name" | "startDate" | "endDate" | "goal" | "status">>
): PmData {
  const now = new Date().toISOString();
  return {
    ...data,
    sprints: data.sprints.map((s) =>
      s.id === id
        ? {
            ...s,
            ...patch,
            name: patch.name !== undefined ? patch.name.trim() : s.name,
            goal: patch.goal !== undefined ? patch.goal.trim() : s.goal,
            updatedAt: now,
          }
        : s
    ),
  };
}

export function deleteSprint(data: PmData, id: string): PmData {
  return {
    ...data,
    sprints: data.sprints.filter((s) => s.id !== id),
    tasks: data.tasks.map((t) => (t.sprintId === id ? { ...t, sprintId: undefined } : t)),
  };
}

export type ProjectInput = Parameters<typeof createProject>[1];
export type TaskInput = Parameters<typeof createTask>[1];
export type SprintInput = Parameters<typeof createSprint>[1];

export type { ProjectStatus, SprintStatus, TaskPriority, TaskStatus };
