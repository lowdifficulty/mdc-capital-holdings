import type { Metadata } from "next";
import LegalDocument, { LegalLink, LegalSection } from "@/components/LegalDocument";
import { companyLegal } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms & Conditions | MDC Capital Holdings",
  description:
    "Terms and conditions for using the MDC Capital Holdings website and SMS text messaging program.",
};

export default function TermsAndConditionsPage() {
  const { name, siteUrl, contactEmail, smsProgramName, lastUpdated } = companyLegal;

  return (
    <LegalDocument
      title="Terms & Conditions"
      description="Terms for using our website and optional SMS text messaging program."
      lastUpdated={lastUpdated}
    >
      <LegalSection title="Agreement">
        <p>
          These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of the {name}{" "}
          website at{" "}
          <LegalLink href={siteUrl}>{siteUrl.replace("https://", "")}</LegalLink> and,
          where applicable, your participation in our SMS text messaging program. By using
          our website or opting in to SMS messages, you agree to these Terms and our{" "}
          <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Website use">
        <p>
          Content on this website is provided for general informational purposes about{" "}
          {name} and is not investment, legal, or financial advice. We may update site
          content at any time without notice. You agree not to misuse the site, attempt
          unauthorized access, or submit false or unlawful information through our forms.
        </p>
      </LegalSection>

      <LegalSection title="Contact form">
        <p>
          When you submit our contact form, you represent that the information you provide
          is accurate and that you have authority to share it. Submitting the form does not
          create a partnership, acquisition agreement, or obligation on either party. We
          may use your contact details to respond to your inquiry by email or phone.
        </p>
      </LegalSection>

      <LegalSection title="SMS text messaging program">
        <p>
          {name} offers an optional {smsProgramName}. By checking the SMS consent box on
          our contact form and providing your mobile phone number, you expressly consent to
          receive recurring automated text messages from {name} at the number provided.
        </p>
        <p>
          <strong className="text-navy">Types of messages</strong> may include inquiry
          confirmations, follow-up about partnership or acquisition discussions, meeting
          reminders, and other business-related updates related to your relationship with{" "}
          {name}.
        </p>
        <p>
          <strong className="text-navy">Message frequency</strong> varies depending on your
          inquiry and interactions with us. You may receive multiple messages during an
          active conversation and fewer messages when there is no ongoing discussion.
        </p>
        <p>
          <strong className="text-navy">Message and data rates may apply.</strong> Check
          with your wireless carrier for details about your text and data plan.
        </p>
        <p>
          <strong className="text-navy">Consent is not a condition of purchase</strong> and
          is not required to submit a contact form or receive a response by email or phone.
          SMS opt-in is optional and requires a separate, unchecked consent box on our web
          form.
        </p>
      </LegalSection>

      <LegalSection title="Opt-in method">
        <p>
          We obtain SMS consent through our website contact form at{" "}
          <LegalLink href="/contact">{siteUrl.replace("https://", "")}/contact</LegalLink>.
          Consent requires:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Entering a valid mobile phone number</li>
          <li>
            Checking an unchecked box confirming you agree to receive SMS messages from{" "}
            {name}
          </li>
          <li>
            Disclosure that message frequency varies and message and data rates may apply
          </li>
          <li>Instructions to reply STOP to opt out and HELP for help</li>
          <li>
            Links to this Terms page and our{" "}
            <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Opt-out and help">
        <p>
          You can cancel SMS at any time by replying <strong className="text-navy">STOP</strong>{" "}
          to any message. After opting out, you will receive one confirmation message and
          no further marketing or program messages unless you opt in again.
        </p>
        <p>
          For assistance, reply <strong className="text-navy">HELP</strong> to any message or
          email{" "}
          <LegalLink href={`mailto:${contactEmail}`}>{contactEmail}</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Carrier disclaimer">
        <p>
          Wireless carriers are not liable for delayed or undelivered messages. SMS
          delivery depends on your carrier and device. Supported carriers include major
          U.S. wireless providers; carrier and device compatibility may vary.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          Our collection and use of personal information, including mobile phone numbers
          and SMS opt-in data, is described in our{" "}
          <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>.{" "}
          <strong className="text-navy">
            No mobile information will be shared with third parties or affiliates for
            marketing or promotional purposes.
          </strong>
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer of warranties">
        <p>
          The website and SMS program are provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis. To the fullest extent permitted by law, {name} disclaims
          all warranties, express or implied, regarding the site and messaging services.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {name} and its affiliates will not be
          liable for any indirect, incidental, special, consequential, or punitive damages
          arising from your use of the website or SMS program.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date
          at the top of this page reflects the current version. Material changes to the SMS
          program will be reflected here. Continued participation after changes constitutes
          acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of the State of California, without regard
          to conflict-of-law principles, except where federal telecommunications rules
          apply to SMS messaging.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms or our SMS program? Email{" "}
          <LegalLink href={`mailto:${contactEmail}`}>{contactEmail}</LegalLink>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
