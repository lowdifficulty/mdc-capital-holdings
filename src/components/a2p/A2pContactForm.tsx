"use client";

import { useState } from "react";
import Link from "next/link";
import SmsOptInCheckbox from "@/components/SmsOptInCheckbox";

export default function A2pContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20";
  const labelClass = "mb-2 block text-sm font-medium text-slate-800";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-mdc-blue/20 bg-soft-blue p-10 text-center">
        <h3 className="font-serif text-2xl text-navy">Thank you for reaching out.</h3>
        <p className="mt-4 text-slate">
          We received your message and will follow up shortly.
          {smsOptIn
            ? " You will also receive SMS updates at the number you provided."
            : " For immediate inquiries, email us at hello@mdccapitalholdings.com."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm md:p-10"
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
          <span className={labelClass}>Phone (optional)</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="(949) 755-8994"
            className={inputClass}
          />
        </label>

        <label className="block md:col-span-2">
          <span className={labelClass}>Message *</span>
          <textarea required name="message" rows={5} className={`${inputClass} resize-y`} />
        </label>

        <div className="md:col-span-2">
          <SmsOptInCheckbox checked={smsOptIn} onChange={setSmsOptIn} />
        </div>
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
        . SMS consent is not required to submit this form.
      </p>

      <button
        type="submit"
        className="mt-6 inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy"
      >
        Send message
      </button>
    </form>
  );
}
