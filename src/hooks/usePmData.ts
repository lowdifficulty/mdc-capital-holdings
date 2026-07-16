"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createProject,
  createSprint,
  createTask,
  deleteProject,
  deleteSprint,
  deleteTask,
  loadPmData,
  moveTaskStatus,
  savePmData,
  updateProject,
  updateSprint,
  updateTask,
  type ProjectInput,
  type SprintInput,
  type TaskInput,
} from "@/lib/pm/store";
import { PM_SYNC_EVENT, type PmData, type TaskStatus } from "@/lib/pm/types";

export function usePmData() {
  const [data, setData] = useState<PmData | null>(null);

  const persist = useCallback((next: PmData) => {
    savePmData(next);
    setData(next);
  }, []);

  useEffect(() => {
    setData(loadPmData());
    const onSync = () => setData(loadPmData());
    window.addEventListener(PM_SYNC_EVENT, onSync);
    return () => window.removeEventListener(PM_SYNC_EVENT, onSync);
  }, []);

  const mutate = useCallback((fn: (current: PmData) => PmData): PmData => {
    const base = data ?? loadPmData();
    const next = fn(base);
    savePmData(next);
    setData(next);
    return next;
  }, [data]);

  return {
    data,
    ready: data !== null,
    addProject: (input: ProjectInput) => mutate((d) => createProject(d, input)),
    editProject: (id: string, patch: Partial<ProjectInput>) =>
      mutate((d) => updateProject(d, id, patch)),
    removeProject: (id: string) => mutate((d) => deleteProject(d, id)),
    addTask: (input: TaskInput) => mutate((d) => createTask(d, input)),
    editTask: (id: string, patch: Parameters<typeof updateTask>[2]) =>
      mutate((d) => updateTask(d, id, patch)),
    removeTask: (id: string) => mutate((d) => deleteTask(d, id)),
    setTaskStatus: (id: string, status: TaskStatus) =>
      mutate((d) => moveTaskStatus(d, id, status)),
    addSprint: (input: SprintInput) => mutate((d) => createSprint(d, input)),
    editSprint: (id: string, patch: Parameters<typeof updateSprint>[2]) =>
      mutate((d) => updateSprint(d, id, patch)),
    removeSprint: (id: string) => mutate((d) => deleteSprint(d, id)),
    reload: () => persist(loadPmData()),
  };
}
