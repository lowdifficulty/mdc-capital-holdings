import Link from "next/link";
import { companyLegal, formatBusinessAddress } from "@/data/site";

export default function BusinessContactCard() {
  const { name, legalEntityName, ein, contactEmail, businessPhoneDisplay, businessPhone } =
    companyLegal;

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-6 text-sm text-slate shadow-sm">
      <p className="font-semibold text-navy">{name}</p>
      <p className="mt-1 text-slate">{legalEntityName}</p>
      <p className="mt-3 text-navy">{formatBusinessAddress()}</p>
      <p className="mt-2">
        <a href={`tel:${businessPhone}`} className="text-mdc-blue hover:text-navy">
          {businessPhoneDisplay}
        </a>
      </p>
      <p className="mt-1">
        <a href={`mailto:${contactEmail}`} className="text-mdc-blue hover:text-navy">
          {contactEmail}
        </a>
      </p>
      <p className="mt-3 text-xs text-slate">EIN {ein}</p>
      <p className="mt-4 text-xs leading-relaxed text-slate">
        <Link href="/privacy-policy" className="text-mdc-blue hover:text-navy">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/terms-and-conditions" className="text-mdc-blue hover:text-navy">
          Terms &amp; Conditions
        </Link>
        {" · "}
        <Link href="/sms-opt-in" className="text-mdc-blue hover:text-navy">
          SMS Opt-In
        </Link>
      </p>
    </div>
  );
}
