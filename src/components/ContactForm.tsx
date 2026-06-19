"use client";

import { useState } from "react";
import Link from "next/link";
import { contactRoles } from "@/data/site";
import SmsOptInFields from "@/components/SmsOptInFields";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-mdc-blue/20 bg-soft-blue p-10 text-center">
        <h3 className="font-serif text-2xl text-navy">Thank you for reaching out.</h3>
        <p className="mt-4 text-slate">
          We received your message and will follow up shortly.
          {smsOptIn
            ? " You will also receive SMS updates at the number you provided."
            : " For immediate inquiries, you can also email us directly."}
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
          <span className="mb-2 block text-sm font-medium text-navy">Name *</span>
          <input
            required
            type="text"
            name="name"
            autoComplete="name"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-navy">Email *</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>

        <SmsOptInFields
          phone={phone}
          smsOptIn={smsOptIn}
          onPhoneChange={setPhone}
          onSmsOptInChange={setSmsOptIn}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-navy">Company</span>
          <input
            type="text"
            name="company"
            autoComplete="organization"
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
          <span className="mb-2 block text-sm font-medium text-navy">I am a: *</span>
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
          <span className="mb-2 block text-sm font-medium text-navy">Message *</span>
          <textarea
            required
            name="message"
            rows={5}
            className="w-full resize-y rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
          />
        </label>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate">
        By submitting this form, you agree to our{" "}
        <Link href="/privacy-policy" className="font-medium text-mdc-blue hover:text-navy">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms-and-conditions" className="font-medium text-mdc-blue hover:text-navy">
          Terms &amp; Conditions
        </Link>
        .
      </p>

      <button
        type="submit"
        className="mt-6 inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy"
      >
        Start the Conversation
      </button>
    </form>
  );
}
