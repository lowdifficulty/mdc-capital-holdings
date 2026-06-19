import Link from "next/link";
import { smsKeywordOptInNote, smsOptInCheckboxLabel } from "@/data/a2p";

interface SmsOptInCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function SmsOptInCheckbox({ checked, onChange }: SmsOptInCheckboxProps) {
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-navy/8 bg-light-gray/60 p-4">
        <input
          type="checkbox"
          name="sms_opt_in"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/20 text-mdc-blue focus:ring-mdc-blue/30"
        />
        <span className="text-sm leading-relaxed text-slate">
          {smsOptInCheckboxLabel} See our{" "}
          <Link href="/privacy-policy" className="font-medium text-mdc-blue hover:text-navy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms-and-conditions"
            className="font-medium text-mdc-blue hover:text-navy"
          >
            Terms &amp; Conditions
          </Link>
          .
        </span>
      </label>

      <p className="text-xs leading-relaxed text-slate">
        {smsKeywordOptInNote} Message and data rates may apply. Reply STOP to opt out or HELP
        for help.
      </p>
    </div>
  );
}
