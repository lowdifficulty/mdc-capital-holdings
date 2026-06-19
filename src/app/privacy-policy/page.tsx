import type { Metadata } from "next";
import LegalDocument, { LegalLink, LegalSection } from "@/components/LegalDocument";
import { companyLegal } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy | MDC Capital Holdings",
  description:
    "How MDC Capital Holdings collects, uses, and protects your information, including SMS text messaging opt-in data.",
};

export default function PrivacyPolicyPage() {
  const { name, siteUrl, contactEmail, smsProgramName, lastUpdated } = companyLegal;

  return (
    <LegalDocument
      title="Privacy Policy"
      description="How we collect, use, and protect your information when you contact us or opt in to SMS updates."
      lastUpdated={lastUpdated}
    >
      <LegalSection title="Who we are">
        <p>
          {name} is an operating holdings company focused on building, acquiring, and
          scaling small businesses and digital platforms. This privacy policy describes how
          we collect, use, and share information when you visit{" "}
          <LegalLink href={siteUrl}>{siteUrl.replace("https://", "")}</LegalLink>, submit
          our contact form, or opt in to receive text messages from us.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>We may collect the following information:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-navy">Contact details</strong> — name, email address,
            phone number, company name, website, role, and messages you send through our
            contact form.
          </li>
          <li>
            <strong className="text-navy">SMS opt-in data</strong> — your mobile phone
            number and the date, time, and method of your consent when you check the SMS
            opt-in box on our website forms.
          </li>
          <li>
            <strong className="text-navy">Technical data</strong> — basic server logs (such
            as IP address, browser type, and pages visited) collected by our hosting
            provider to operate and secure the site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use your information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Respond to partnership, acquisition, and business inquiries</li>
          <li>Follow up about opportunities, meetings, and operating discussions</li>
          <li>
            Send SMS text messages you have opted in to receive, including inquiry
            confirmations, scheduling updates, and related business communications
          </li>
          <li>Improve our website, security, and communications</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do not sell your personal information.{" "}
          <strong className="text-navy">
            No mobile information will be shared with third parties or affiliates for
            marketing or promotional purposes.
          </strong>{" "}
          Information shared with service providers is limited to what is necessary to
          deliver our services (for example, sending SMS messages through our messaging
          provider).
        </p>
      </LegalSection>

      <LegalSection title="SMS text messaging">
        <p>
          If you opt in to our {smsProgramName} by checking the consent box on our contact
          form and providing your mobile phone number, we may send you text messages related
          to your inquiry and our business relationship. Message frequency varies. Message
          and data rates may apply.
        </p>
        <p>
          <strong className="text-navy">Consent is not a condition of purchase</strong> and
          is not required to submit a contact inquiry. You may opt in to SMS separately by
          checking the consent box when you provide your phone number.
        </p>
        <p>
          You can opt out at any time by replying <strong className="text-navy">STOP</strong>{" "}
          to any message. For help, reply <strong className="text-navy">HELP</strong> or
          email{" "}
          <LegalLink href={`mailto:${contactEmail}`}>{contactEmail}</LegalLink>. After you
          opt out, we may send one final message confirming your request.
        </p>
        <p>
          Carriers are not liable for delayed or undelivered messages. Supported carriers
          include major U.S. wireless carriers; availability may vary.
        </p>
        <p>
          For full program terms, see our{" "}
          <LegalLink href="/terms-and-conditions">Terms &amp; Conditions</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          We use trusted third parties to operate parts of our business. They process
          information only as needed to provide services to us:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-navy">Twilio</strong> — SMS message delivery when you
            opt in to text messages
          </li>
          <li>
            <strong className="text-navy">Resend</strong> — transactional email, when
            configured
          </li>
          <li>
            <strong className="text-navy">Vercel</strong> — website hosting
          </li>
        </ul>
        <p>
          Each provider maintains its own privacy practices. We encourage you to review
          Twilio&apos;s privacy policy at{" "}
          <LegalLink href="https://www.twilio.com/legal/privacy" external>
            twilio.com/legal/privacy
          </LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="How long we keep information">
        <p>
          We retain contact and SMS opt-in records for as long as needed to respond to
          inquiries, maintain business relationships, honor opt-out requests, and meet legal
          requirements. You may request deletion of your information where we are not
          required to retain it by law.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use industry-standard measures such as HTTPS encryption and secure hosting.
          No method of transmission over the internet is completely secure, but we work to
          protect your information appropriately.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>Depending on your relationship with us, you may:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Request access to or correction of information we hold about you</li>
          <li>Ask us to delete your information where permitted by law</li>
          <li>Opt out of SMS messages at any time by replying STOP</li>
          <li>Opt out of non-essential marketing emails by contacting us</li>
        </ul>
      </LegalSection>

      <LegalSection title="California residents">
        <p>
          If you are a California resident, you may have additional rights under the
          California Consumer Privacy Act (CCPA), including the right to know what personal
          information we collect and to request deletion. We do not sell personal
          information. To exercise your rights, contact us using the information below.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Our website is intended for adults conducting business inquiries. We do not
          knowingly collect personal information from children under 13. If you believe a
          child has provided us information, please contact us so we can remove it.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this privacy policy from time to time. The &ldquo;Last
          updated&rdquo; date at the top of this page reflects the most recent version.
          Continued use of our site or SMS program after changes means you accept the
          updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact us">
        <p>
          For privacy questions, SMS opt-out assistance, or data requests, email{" "}
          <LegalLink href={`mailto:${contactEmail}`}>{contactEmail}</LegalLink>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
