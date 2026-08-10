"use client";

import { useCallback, useEffect, useState } from "react";
import QuickContactActions from "@/components/platform/QuickContactActions";
import { portalBtnPrimary, portalCard, portalInput } from "@/components/platform/portal-ui";
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

  const byStage = (stage: PipelineStage) => contacts.filter((c) => c.stage === stage);
  const tabActive = "rounded-full bg-mdc-blue px-4 py-2 text-xs font-bold uppercase text-white";
  const tabIdle =
    "rounded-full border border-navy/15 px-4 py-2 text-xs font-bold uppercase text-navy hover:border-mdc-blue/40";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setView("pipeline")} className={view === "pipeline" ? tabActive : tabIdle}>
          Pipeline
        </button>
        <button type="button" onClick={() => setView("list")} className={view === "list" ? tabActive : tabIdle}>
          All contacts
        </button>
      </div>

      {view === "pipeline" && (
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6 overflow-x-auto">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.id} className={`min-w-[220px] ${portalCard} !p-3`}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-mdc-blue">
                {stage.label} ({byStage(stage.id).length})
              </p>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {byStage(stage.id).map((c) => (
                  <li key={c.id} className="rounded-xl border border-navy/10 bg-soft-blue/40 p-2">
                    <p className="text-sm font-medium text-navy">{c.name}</p>
                    <p className="text-xs text-slate">{c.phone || c.email}</p>
                    <QuickContactActions
                      size="sm"
                      contactId={c.id}
                      phone={c.phone}
                      name={c.name}
                      disabledCall={!c.phone}
                    />
                    <select
                      className={`${portalInput} mt-2 !py-1.5 text-xs`}
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
        <div className={`overflow-x-auto ${portalCard} !p-0`}>
          <table className="min-w-full text-sm">
            <thead className="bg-soft-blue text-left text-xs uppercase text-navy">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-navy/10">
                  <td className="px-3 py-2 font-medium text-navy">{c.name}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.email}</td>
                  <td className="px-3 py-2 capitalize">{c.stage}</td>
                  <td className="px-3 py-2">
                    <QuickContactActions contactId={c.id} phone={c.phone} name={c.name} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleCreate} className={`grid gap-3 md:grid-cols-2 ${portalCard}`}>
        <p className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-mdc-blue">
          New contact
        </p>
        <input className={portalInput} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={portalInput} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={portalInput} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className={portalInput} value={kind} onChange={(e) => setKind(e.target.value as ContactKind)}>
          <option value="lead">Lead</option>
          <option value="client">Client</option>
        </select>
        <textarea
          className={`${portalInput} md:col-span-2`}
          rows={2}
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
        <button type="submit" className={`md:col-span-2 ${portalBtnPrimary} w-full justify-center`}>
          Add to CRM
        </button>
      </form>
    </div>
  );
}
