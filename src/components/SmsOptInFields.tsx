import Link from "next/link";
import { companyLegal } from "@/data/site";

interface SmsOptInFieldsProps {
  phone: string;
  smsOptIn: boolean;
  onPhoneChange: (value: string) => void;
  onSmsOptInChange: (checked: boolean) => void;
  phoneRequired?: boolean;
}

export default function SmsOptInFields({
  phone,
  smsOptIn,
  onPhoneChange,
  onSmsOptInChange,
  phoneRequired = true,
}: SmsOptInFieldsProps) {
  return (
    <div className="space-y-4 md:col-span-2">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-navy">
          Phone Number{phoneRequired ? " *" : ""}
        </span>
        <input
          required={phoneRequired}
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="(714) 555-0123"
          className="w-full rounded-lg border border-navy/10 px-4 py-3 text-sm outline-none transition-colors focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/20"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-navy/8 bg-light-gray/60 p-4">
        <input
          type="checkbox"
          name="sms_opt_in"
          checked={smsOptIn}
          onChange={(event) => onSmsOptInChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/20 text-mdc-blue focus:ring-mdc-blue/30"
        />
        <span className="text-sm leading-relaxed text-slate">
          I agree to receive SMS messages from {companyLegal.name} at the phone number
          provided above. Message frequency varies. Message and data rates may apply. Reply{" "}
          <strong className="font-medium text-navy">STOP</strong> to opt out or{" "}
          <strong className="font-medium text-navy">HELP</strong> for help. Consent is not
          required to submit this form. See our{" "}
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
          . No mobile information will be shared with third parties or affiliates for
          marketing or promotional purposes.
        </span>
      </label>
    </div>
  );
}
