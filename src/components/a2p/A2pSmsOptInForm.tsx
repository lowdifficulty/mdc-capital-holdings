"use client";

import { useState } from "react";
import Link from "next/link";
import SmsOptInCheckbox from "@/components/SmsOptInCheckbox";

export default function A2pSmsOptInForm() {
  const [submitted, setSubmitted] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-dark-text outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20";
  const labelClass = "mb-2 block text-sm font-medium text-navy";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!smsOptIn) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-mdc-blue/20 bg-soft-blue p-10 text-center">
        <h3 className="font-serif text-2xl text-navy">SMS opt-in received.</h3>
        <p className="mt-4 text-slate">
          Thank you. You may receive text messages from MDC Capital Holdings at the number you
          provided. Reply STOP to opt out or HELP for help.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-navy/10 bg-white p-8 shadow-sm md:p-10"
    >
      <div className="grid gap-6">
        <label className="block">
          <span className={labelClass}>Name *</span>
          <input required type="text" name="name" autoComplete="name" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Email *</span>
          <input required type="email" name="email" autoComplete="email" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Mobile phone *</span>
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="(949) 755-8994"
            className={inputClass}
          />
        </label>

        <SmsOptInCheckbox checked={smsOptIn} onChange={setSmsOptIn} />

        <p className="text-xs leading-relaxed text-slate">
          See our{" "}
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
          disabled={!smsOptIn}
          className="inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit SMS opt-in
        </button>
      </div>
    </form>
  );
}
