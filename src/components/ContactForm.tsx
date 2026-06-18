"use client";

import { useState } from "react";
import { contactRoles } from "@/data/site";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-mdc-blue/20 bg-soft-blue p-10 text-center">
        <h3 className="font-serif text-2xl text-navy">Thank you for reaching out.</h3>
        <p className="mt-4 text-slate">
          We received your message and will follow up shortly. For immediate
          inquiries, you can also email us directly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-navy/8 bg-white p-8 shadow-sm md:p-10"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-navy">Name</span>
          <input
            required
            type="text"
            name="name"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-navy">Email</span>
          <input
            required
            type="email"
            name="email"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-navy">Phone</span>
          <input
            type="tel"
            name="phone"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-navy">Company</span>
          <input
            type="text"
            name="company"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-navy">Website</span>
          <input
            type="url"
            name="website"
            placeholder="https://"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-navy">I am a:</span>
          <select
            required
            name="role"
            defaultValue=""
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          >
            <option value="" disabled>
              Select one
            </option>
            {contactRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-navy">Message</span>
          <textarea
            required
            name="message"
            rows={5}
            className="w-full resize-y rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy"
      >
        Start the Conversation
      </button>
    </form>
  );
}
