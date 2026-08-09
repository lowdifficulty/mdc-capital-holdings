import Link from "next/link";
import { companyLegal, formatBusinessAddress } from "@/data/site";

export default function BusinessContactCard() {
  const { name, legalEntityName, ein, contactEmail, businessPhoneDisplay, businessPhone } =
    companyLegal;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">{name}</p>
      <p className="mt-1 text-slate-600">{legalEntityName}</p>
      <p className="mt-3">{formatBusinessAddress()}</p>
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
      <p className="mt-3 text-xs text-slate-500">EIN {ein}</p>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
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
