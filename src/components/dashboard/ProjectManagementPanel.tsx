"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePmData } from "@/hooks/usePmData";
import {
  PROJECT_COLORS,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type PmProject,
  type PmSprint,
  type PmTask,
  type ProjectStatus,
  type SprintStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/pm/types";

type PmView = "board" | "list" | "sprints";
type TaskFilter = "all" | TaskStatus;

const STATUS_COLUMN_CLASS: Record<TaskStatus, string> = {
  todo: "border-white/15 bg-white/[0.02]",
  in_progress: "border-blue-400/30 bg-blue-500/10",
  blocked: "border-red-400/30 bg-red-500/10",
  done: "border-emerald-400/30 bg-emerald-500/10",
};

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: "text-white/50",
  medium: "text-blue-200/80",
  high: "text-amber-300",
  urgent: "text-red-300",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyProjectForm(): {
  name: string;
  description: string;
  status: ProjectStatus;
  repoUrl: string;
  color: string;
  tag: string;
} {
  return {
    name: "",
    description: "",
    status: "active",
    repoUrl: "",
    color: PROJECT_COLORS[0],
    tag: "",
  };
}

function ProjectModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: PmProject;
  onClose: () => void;
  onSave: (values: ReturnType<typeof emptyProjectForm>) => void;
}) {
  const [form, setForm] = useState(emptyProjectForm());

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        description: initial.description,
        status: initial.status,
        repoUrl: initial.repoUrl ?? "",
        color: initial.color,
        tag: initial.tag ?? "",
      });
    } else {
      setForm(emptyProjectForm());
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-xl border border-[#c9a227]/25 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pm-project-modal-title"
      >
        <h2 id="pm-project-modal-title" className="font-serif text-lg text-[#f8f4ec]">
          {initial ? "Edit project" : "New AI project"}
        </h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            onSave(form);
          }}
        >
          <label className="block text-xs text-white/55">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              placeholder="Mobile Dog Salon AI"
            />
          </label>
          <label className="block text-xs text-white/55">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              placeholder="What this AI project does…"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/55">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/55">
              Tag
              <input
                value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
                placeholder="agent, web, ops"
              />
            </label>
          </div>
          <label className="block text-xs text-white/55">
            Repo / link
            <input
              value={form.repoUrl}
              onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
              className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              placeholder="https://github.com/…"
            />
          </label>
          <div>
            <p className="text-xs text-white/55">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    form.color === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-sm bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#050505] hover:bg-[#e0c56a]"
            >
              {initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SprintModal({
  open,
  projectId,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  projectId: string;
  initial?: PmSprint;
  onClose: () => void;
  onSave: (values: {
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
    status: SprintStatus;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    startDate: todayIso(),
    endDate: todayIso(),
    goal: "",
    status: "planned" as SprintStatus,
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        startDate: initial.startDate,
        endDate: initial.endDate,
        goal: initial.goal,
        status: initial.status,
      });
    } else {
      setForm({
        name: "",
        startDate: todayIso(),
        endDate: todayIso(),
        goal: "",
        status: "planned",
      });
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-xl border border-[#c9a227]/25 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6">
        <h2 className="font-serif text-lg text-[#f8f4ec]">{initial ? "Edit sprint" : "New sprint"}</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            onSave(form);
          }}
        >
          <input type="hidden" value={projectId} readOnly />
          <label className="block text-xs text-white/55">
            Sprint name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              placeholder="Sprint 1 — MVP"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/55">
              Start
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              />
            </label>
            <label className="block text-xs text-white/55">
              End
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              />
            </label>
          </div>
          <label className="block text-xs text-white/55">
            Goal
            <textarea
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
              placeholder="What we aim to ship this sprint"
            />
          </label>
          <label className="block text-xs text-white/55">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SprintStatus }))}
              className="mt-1 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#c9a227]"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-white/15 px-4 py-2 text-sm text-white/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-sm bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#050505]"
            >
              {initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  sprints,
  onStatusChange,
  onEdit,
  onDelete,
  draggable,
}: {
  task: PmTask;
  sprints: PmSprint[];
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  draggable?: boolean;
}) {
  const sprint = sprints.find((s) => s.id === task.sprintId);

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/pm-task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`rounded-lg border p-3 text-sm transition hover:border-[#c9a227]/30 ${STATUS_COLUMN_CLASS[task.status]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} className="text-left font-medium text-white hover:text-[#c9a227]">
          {task.title}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 text-xs text-white/35 hover:text-red-300"
          aria-label="Delete task"
        >
          ×
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
        <span className={PRIORITY_CLASS[task.priority]}>{task.priority}</span>
        {task.assignee && <span className="text-white/45">{task.assignee}</span>}
        {task.dueDate && (
          <span className="tabular-nums text-white/40">Due {formatDate(task.dueDate)}</span>
        )}
        {sprint && <span className="rounded bg-[#c9a227]/15 px-1.5 py-0.5 text-[#c9a227]">{sprint.name}</span>}
      </div>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
        className="mt-2 w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-xs outline-none"
        aria-label="Task status"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </article>
  );
}

function TaskEditPanel({
  task,
  sprints,
  onSave,
  onClose,
}: {
  task: PmTask;
  sprints: PmSprint[];
  onSave: (patch: Partial<PmTask>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState(task.priority);
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [sprintId, setSprintId] = useState(task.sprintId ?? "");
  const [status, setStatus] = useState(task.status);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-[#c9a227]/25 bg-[#0a0a0a] p-5">
        <h3 className="font-serif text-lg text-[#f8f4ec]">Edit task</h3>
        <div className="mt-3 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-sm border border-[#c9a227]/20 bg-black/40 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-sm"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-sm"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assignee"
            className="w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <select
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
            className="w-full rounded-sm border border-white/15 bg-black/40 px-2 py-2 text-sm"
          >
            <option value="">No sprint</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/60">
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                title,
                status,
                priority,
                assignee: assignee || undefined,
                dueDate: dueDate || undefined,
                sprintId: sprintId || undefined,
              })
            }
            className="rounded-sm bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#050505]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectManagementPanel() {
  const { data, ready, addProject, editProject, removeProject, addTask, editTask, removeTask, setTaskStatus, addSprint, editSprint, removeSprint } =
    usePmData();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [view, setView] = useState<PmView>("board");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [quickTask, setQuickTask] = useState("");
  const [projectModal, setProjectModal] = useState<"new" | PmProject | null>(null);
  const [sprintModal, setSprintModal] = useState<"new" | PmSprint | null>(null);
  const [editingTask, setEditingTask] = useState<PmTask | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const projects = useMemo(
    () => (data?.projects ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [data?.projects]
  );

  const activeProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null;

  useEffect(() => {
    if (!ready) return;
    if (!selectedProjectId && projects[0]) setSelectedProjectId(projects[0].id);
    if (selectedProjectId && !projects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id ?? null);
    }
  }, [ready, projects, selectedProjectId]);

  const projectTasks = useMemo(() => {
    if (!data || !activeProject) return [];
    return data.tasks
      .filter((t) => t.projectId === activeProject.id)
      .filter((t) => taskFilter === "all" || t.status === taskFilter)
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }, [data, activeProject, taskFilter]);

  const projectSprints = useMemo(() => {
    if (!data || !activeProject) return [];
    return data.sprints
      .filter((s) => s.projectId === activeProject.id)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [data, activeProject]);

  const onColumnDrop = useCallback(
    (status: TaskStatus) => (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/pm-task-id");
      if (id) setTaskStatus(id, status);
    },
    [setTaskStatus]
  );

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject || !quickTask.trim()) return;
    addTask({
      projectId: activeProject.id,
      title: quickTask.trim(),
      status: "todo",
      priority: "medium",
    });
    setQuickTask("");
  }

  if (!ready) {
    return <p className="text-center text-white/50 py-12">Loading projects…</p>;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Mobile project picker */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="rounded-sm border border-[#c9a227]/25 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-[#c9a227]"
        >
          Projects
        </button>
        {activeProject && (
          <span className="truncate text-sm text-white/70">{activeProject.name}</span>
        )}
      </div>

      {/* Sidebar */}
      <aside
        className={`lg:block lg:w-64 lg:shrink-0 ${sidebarOpen ? "block" : "hidden"}`}
      >
        <div className="rounded-xl border border-[#c9a227]/15 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#c9a227]/80">AI Projects</h2>
            <button
              type="button"
              onClick={() => setProjectModal("new")}
              className="rounded-sm bg-[#c9a227]/20 px-2 py-1 text-xs font-semibold text-[#c9a227] hover:bg-[#c9a227]/30"
            >
              + New
            </button>
          </div>
          <ul className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto lg:max-h-[calc(100vh-16rem)]">
            {projects.length === 0 && (
              <li className="py-4 text-center text-sm text-white/45">No projects yet</li>
            )}
            {projects.map((p) => {
              const taskCount = data?.tasks.filter((t) => t.projectId === p.id).length ?? 0;
              const active = activeProject?.id === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-[#c9a227]/15 ring-1 ring-[#c9a227]/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="tabular-nums text-xs text-white/40">{taskCount}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">
        {!activeProject ? (
          <div className="rounded-xl border border-dashed border-[#c9a227]/25 bg-black/20 py-16 text-center">
            <p className="text-white/55">Create your first AI project to start tracking tasks and sprints.</p>
            <button
              type="button"
              onClick={() => setProjectModal("new")}
              className="mt-4 rounded-sm bg-[#c9a227] px-5 py-2.5 text-sm font-semibold text-[#050505]"
            >
              + New project
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: activeProject.color }}
                      aria-hidden
                    />
                    <h1 className="font-serif text-xl text-[#f8f4ec] sm:text-2xl">{activeProject.name}</h1>
                    {activeProject.tag && (
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        {activeProject.tag}
                      </span>
                    )}
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/45">
                      {activeProject.status}
                    </span>
                  </div>
                  {activeProject.description && (
                    <p className="mt-2 max-w-2xl text-sm text-white/60">{activeProject.description}</p>
                  )}
                  {activeProject.repoUrl && (
                    <a
                      href={activeProject.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-[#c9a227] hover:underline"
                    >
                      {activeProject.repoUrl}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectModal(activeProject)}
                    className="rounded-sm border border-[#c9a227]/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#c9a227]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${activeProject.name}" and all its tasks?`)) {
                        removeProject(activeProject.id);
                      }
                    }}
                    className="rounded-sm border border-red-400/30 px-3 py-1.5 text-xs text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <form onSubmit={handleQuickAdd} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={quickTask}
                  onChange={(e) => setQuickTask(e.target.value)}
                  placeholder="Quick add task…"
                  className="min-w-0 flex-1 rounded-sm border border-[#c9a227]/20 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-[#c9a227]"
                />
                <button
                  type="submit"
                  disabled={!quickTask.trim()}
                  className="shrink-0 rounded-sm bg-[#c9a227] px-5 py-2.5 text-sm font-semibold text-[#050505] disabled:opacity-40"
                >
                  Add task
                </button>
              </form>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
              {(
                [
                  ["board", "Board"],
                  ["list", "List"],
                  ["sprints", "Sprints"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`shrink-0 rounded-sm px-4 py-2 text-sm font-semibold uppercase tracking-wide ${
                    view === id
                      ? "bg-[#c9a227]/15 text-[#f8f4ec] ring-1 ring-[#c9a227]/30"
                      : "border border-[#c9a227]/20 text-[#eae6dc]/65"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === "board" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {TASK_STATUSES.map((col) => {
                  const colTasks = projectTasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="min-h-[12rem] rounded-xl border border-white/10 bg-black/20 p-3"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onColumnDrop(col.id)}
                    >
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
                        {col.label}
                        <span className="ml-2 tabular-nums text-white/35">({colTasks.length})</span>
                      </h3>
                      <div className="space-y-2">
                        {colTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            sprints={projectSprints}
                            draggable
                            onStatusChange={(s) => setTaskStatus(task.id, s)}
                            onEdit={() => setEditingTask(task)}
                            onDelete={() => removeTask(task.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "list" && (
              <div className="mt-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {(["all", ...TASK_STATUSES.map((s) => s.id)] as TaskFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTaskFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        taskFilter === f
                          ? "bg-[#c9a227]/20 text-[#c9a227]"
                          : "border border-white/15 text-white/55"
                      }`}
                    >
                      {f === "all" ? "All" : TASK_STATUSES.find((s) => s.id === f)?.label}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-black/30 text-[10px] uppercase tracking-wide text-white/45">
                      <tr>
                        <th className="px-3 py-2">Task</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2">Assignee</th>
                        <th className="px-3 py-2">Due</th>
                        <th className="px-3 py-2">Sprint</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projectTasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-white/40">
                            No tasks match this filter
                          </td>
                        </tr>
                      )}
                      {projectTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 font-medium">{task.title}</td>
                          <td className="px-3 py-2">
                            <select
                              value={task.status}
                              onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
                              className="rounded border border-white/10 bg-black/30 px-2 py-1 text-xs"
                            >
                              {TASK_STATUSES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={`px-3 py-2 text-xs uppercase ${PRIORITY_CLASS[task.priority]}`}>
                            {task.priority}
                          </td>
                          <td className="px-3 py-2 text-white/55">{task.assignee ?? "—"}</td>
                          <td className="px-3 py-2 tabular-nums text-white/45">{formatDate(task.dueDate)}</td>
                          <td className="px-3 py-2 text-white/45">
                            {projectSprints.find((s) => s.id === task.sprintId)?.name ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setEditingTask(task)}
                              className="text-xs text-[#c9a227]"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "sprints" && (
              <div className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSprintModal("new")}
                    className="rounded-sm bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#050505]"
                  >
                    + New sprint
                  </button>
                </div>
                {projectSprints.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/15 py-12 text-center text-white/45">
                    No sprints yet — create one to group tasks by iteration.
                  </p>
                ) : (
                  projectSprints.map((sprint) => {
                    const sprintTasks = (data?.tasks ?? []).filter((t) => t.sprintId === sprint.id);
                    const done = sprintTasks.filter((t) => t.status === "done").length;
                    return (
                      <div
                        key={sprint.id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-lg text-[#f8f4ec]">{sprint.name}</h3>
                            <p className="mt-1 text-xs tabular-nums text-white/45">
                              {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                              <span className="mx-2">·</span>
                              <span className="uppercase">{sprint.status}</span>
                            </p>
                            {sprint.goal && <p className="mt-2 text-sm text-white/60">{sprint.goal}</p>}
                            <p className="mt-2 text-xs text-white/40">
                              {done}/{sprintTasks.length} tasks done
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSprintModal(sprint)}
                              className="text-xs text-[#c9a227]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete sprint "${sprint.name}"?`)) removeSprint(sprint.id);
                              }}
                              className="text-xs text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                          {sprintTasks.length === 0 ? (
                            <li className="text-sm text-white/40">No tasks assigned — edit a task to add it here.</li>
                          ) : (
                            sprintTasks.map((t) => (
                              <li
                                key={t.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                              >
                                <span>{t.title}</span>
                                <span className="text-xs uppercase text-white/45">{t.status}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </main>

      <ProjectModal
        open={projectModal !== null}
        initial={projectModal && projectModal !== "new" ? projectModal : undefined}
        onClose={() => setProjectModal(null)}
        onSave={(values) => {
          if (projectModal && projectModal !== "new") {
            editProject(projectModal.id, values);
          } else {
            const created = addProject(values);
            const id = created.projects[created.projects.length - 1]?.id;
            if (id) setSelectedProjectId(id);
          }
          setProjectModal(null);
        }}
      />

      {activeProject && (
        <SprintModal
          open={sprintModal !== null}
          projectId={activeProject.id}
          initial={sprintModal && sprintModal !== "new" ? sprintModal : undefined}
          onClose={() => setSprintModal(null)}
          onSave={(values) => {
            if (sprintModal && sprintModal !== "new") {
              editSprint(sprintModal.id, values);
            } else {
              addSprint({ ...values, projectId: activeProject.id });
            }
            setSprintModal(null);
          }}
        />
      )}

      {editingTask && (
        <TaskEditPanel
          task={editingTask}
          sprints={projectSprints}
          onSave={(patch) => {
            editTask(editingTask.id, patch);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
