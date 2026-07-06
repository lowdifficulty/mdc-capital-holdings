"use client";

import { useState } from "react";
import Link from "next/link";
import SmsOptInCheckbox from "@/components/SmsOptInCheckbox";

export default function ContactForm({ luxury = false }: { luxury?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);

  const inputClass = luxury
    ? "w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-4 py-3 text-sm text-[#eae6dc] outline-none transition-colors focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
    : "w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20";
  const labelClass = luxury
    ? "mb-2 block text-sm font-medium text-[#eae6dc]/80"
    : "mb-2 block text-sm font-medium text-navy";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className={
          luxury
            ? "rounded-sm border border-[#c9a227]/20 bg-[#c9a227]/10 p-10 text-center"
            : "rounded-2xl border border-mdc-blue/20 bg-soft-blue p-10 text-center"
        }
      >
        <h3 className={`font-serif text-2xl ${luxury ? "text-[#f8f4ec]" : "text-navy"}`}>
          Thank you for reaching out.
        </h3>
        <p className={`mt-4 ${luxury ? "text-[#eae6dc]/65" : "text-slate"}`}>
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
      className={
        luxury
          ? "rounded-sm border border-[#c9a227]/15 bg-[#111] p-8 shadow-xl shadow-black/40 md:p-10"
          : "rounded-2xl border border-navy/8 bg-white p-8 shadow-sm md:p-10"
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name *</span>
          <input required type="text" name="name" autoComplete="name" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Email *</span>
          <input required type="email" name="email" autoComplete="email" className={inputClass} />
        </label>

        <label className="block md:col-span-2">
          <span className={labelClass}>Phone *</span>
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="(714) 555-0123"
            className={inputClass}
          />
        </label>

        <label className="block md:col-span-2">
          <span className={labelClass}>Message *</span>
          <textarea required name="message" rows={5} className={`${inputClass} resize-y`} />
        </label>

        <div className="md:col-span-2">
          <SmsOptInCheckbox checked={smsOptIn} onChange={setSmsOptIn} luxury={luxury} />
        </div>
      </div>

      <p className={`mt-6 text-xs leading-relaxed ${luxury ? "text-[#eae6dc]/50" : "text-slate"}`}>
        By submitting this form, you agree to our{" "}
        <Link
          href="/privacy-policy"
          className={`font-medium ${luxury ? "text-[#c9a227] hover:text-[#e0c56a]" : "text-mdc-blue hover:text-navy"}`}
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms-and-conditions"
          className={`font-medium ${luxury ? "text-[#c9a227] hover:text-[#e0c56a]" : "text-mdc-blue hover:text-navy"}`}
        >
          Terms &amp; Conditions
        </Link>
        .
      </p>

      <button
        type="submit"
        className={
          luxury
            ? "mt-6 inline-flex rounded-sm bg-[#c9a227] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-[#050505] transition-all hover:-translate-y-0.5 hover:bg-[#e0c56a]"
            : "mt-6 inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy"
        }
      >
        Send
      </button>
    </form>
  );
}
