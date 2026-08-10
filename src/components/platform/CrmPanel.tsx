"use client";

import { useCallback, useEffect, useState } from "react";
import { PIPELINE_STAGES, type ContactKind, type PipelineStage } from "@/lib/platform/types";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  kind: ContactKind;
  stage: PipelineStage;
  notes: string;
  lastActivityAt: string;
}

export default function CrmPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<ContactKind>("lead");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/crm/contacts");
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, kind, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    await load();
  }

  async function moveStage(id: string, stage: PipelineStage) {
    await fetch("/api/crm/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    await load();
  }

  const inputClass =
    "w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-3 py-2 text-sm text-[#eae6dc] outline-none focus:border-[#c9a227]";

  const byStage = (stage: PipelineStage) => contacts.filter((c) => c.stage === stage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("pipeline")}
          className={`rounded-sm px-4 py-2 text-xs font-bold uppercase ${
            view === "pipeline" ? "bg-[#c9a227] text-[#050505]" : "border border-[#c9a227]/25"
          }`}
        >
          Pipeline
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-sm px-4 py-2 text-xs font-bold uppercase ${
            view === "list" ? "bg-[#c9a227] text-[#050505]" : "border border-[#c9a227]/25"
          }`}
        >
          All contacts
        </button>
      </div>

      {view === "pipeline" && (
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6 overflow-x-auto">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.id}
              className="min-w-[200px] rounded-sm border border-[#c9a227]/15 bg-[#111]/60 p-2"
            >
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">
                {stage.label} ({byStage(stage.id).length})
              </p>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {byStage(stage.id).map((c) => (
                  <li key={c.id} className="rounded-sm border border-[#c9a227]/10 bg-black/30 p-2">
                    <p className="text-sm font-medium text-[#f8f4ec]">{c.name}</p>
                    <p className="text-xs text-[#eae6dc]/50">{c.phone || c.email}</p>
                    <select
                      className="mt-2 w-full rounded-sm border border-[#c9a227]/20 bg-black/40 text-xs"
                      value={c.stage}
                      onChange={(e) => void moveStage(c.id, e.target.value as PipelineStage)}
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-x-auto rounded-sm border border-[#c9a227]/15">
          <table className="min-w-full text-sm">
            <thead className="bg-black/40 text-left text-xs uppercase text-[#c9a227]/70">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Stage</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-[#c9a227]/10">
                  <td className="px-3 py-2 text-[#f8f4ec]">{c.name}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.email}</td>
                  <td className="px-3 py-2 capitalize">{c.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="grid gap-3 rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">
          New contact
        </p>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={inputClass} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as ContactKind)}>
          <option value="lead">Lead</option>
          <option value="client">Client</option>
        </select>
        <textarea
          className={`${inputClass} md:col-span-2`}
          rows={2}
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error && <p className="md:col-span-2 text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          className="md:col-span-2 rounded-sm bg-[#c9a227] py-2.5 text-sm font-semibold uppercase text-[#050505]"
        >
          Add to CRM
        </button>
      </form>
    </div>
  );
}
