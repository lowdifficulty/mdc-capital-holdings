export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type SprintStatus = "planned" | "active" | "completed";

export type PmProject = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  repoUrl?: string;
  color: string;
  tag?: string;
  createdAt: string;
  updatedAt: string;
};

export type PmTask = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
  sprintId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type PmSprint = {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
};

export type PmData = {
  version: 1;
  projects: PmProject[];
  tasks: PmTask[];
  sprints: PmSprint[];
  updatedAt: string;
};

export const PM_STORAGE_KEY = "mdc-pm-data";
export const PM_SYNC_EVENT = "mdc-pm-sync";

export const PROJECT_COLORS = [
  "#c9a227",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
] as const;

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

export const TASK_PRIORITIES: { id: TaskPriority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export function emptyPmData(): PmData {
  const now = new Date().toISOString();
  return { version: 1, projects: [], tasks: [], sprints: [], updatedAt: now };
}
