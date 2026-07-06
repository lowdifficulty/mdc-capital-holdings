import Link from "next/link";
import { smsKeywordOptInNote, smsOptInCheckboxLabel } from "@/data/a2p";

interface SmsOptInCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  luxury?: boolean;
}

export default function SmsOptInCheckbox({
  checked,
  onChange,
  luxury = false,
}: SmsOptInCheckboxProps) {
  return (
    <div className="space-y-4">
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 ${
          luxury
            ? "border-[#c9a227]/15 bg-black/20"
            : "rounded-lg border-navy/8 bg-light-gray/60"
        }`}
      >
        <input
          type="checkbox"
          name="sms_opt_in"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className={`mt-0.5 h-4 w-4 shrink-0 rounded ${
            luxury
              ? "border-[#c9a227]/30 text-[#c9a227] focus:ring-[#c9a227]/25"
              : "border-navy/20 text-mdc-blue focus:ring-mdc-blue/30"
          }`}
        />
        <span className={`text-sm leading-relaxed ${luxury ? "text-[#eae6dc]/65" : "text-slate"}`}>
          {smsOptInCheckboxLabel} See our{" "}
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
        </span>
      </label>

      <p className={`text-xs leading-relaxed ${luxury ? "text-[#eae6dc]/45" : "text-slate"}`}>
        {smsKeywordOptInNote} Message and data rates may apply. Reply STOP to opt out or HELP
        for help.
      </p>
    </div>
  );
}
