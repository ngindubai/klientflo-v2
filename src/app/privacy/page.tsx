import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — KlientFlo",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what personal data KlientFlo (&ldquo;we&rdquo;,
        &ldquo;the Service&rdquo;) processes on behalf of the real estate agent
        or brokerage operating it (&ldquo;the Agent&rdquo;), and how. It is
        written with the UAE Federal Decree-Law No. 45 of 2021 on the Protection
        of Personal Data (&ldquo;PDPL&rdquo;) in mind. Where the Agent determines
        the purposes of processing, the Agent is the data controller and
        KlientFlo acts as a processor.
      </p>

      <Section heading="Data we process">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Contacts &amp; leads:</strong> name, phone number, email,
            nationality, and stated property requirements (budget, area,
            bedrooms, timeline).
          </li>
          <li>
            <strong>WhatsApp conversations:</strong> message content, voice
            notes and their transcriptions, media, timestamps, and delivery
            status, ingested via the WhatsApp Business Platform.
          </li>
          <li>
            <strong>Owners database:</strong> owner names, contact details, and
            property/building/unit references uploaded by the Agent.
          </li>
          <li>
            <strong>Transactional records:</strong> deals, viewings, calendar
            events, uploaded documents, and generated brochures.
          </li>
          <li>
            <strong>Account data:</strong> agent/user login email and a
            password stored only as a salted hash.
          </li>
        </ul>
      </Section>

      <Section heading="How we use it">
        <p>
          To operate the Service for the Agent: organising WhatsApp
          communications, matching clients to properties, scheduling, document
          handling, reporting, and sending agent-initiated messages. We do not
          sell personal data or use it for third-party advertising.
        </p>
      </Section>

      <Section heading="AI processing">
        <p>
          Conversation text may be sent to Anthropic&rsquo;s Claude API to
          classify, summarise, extract requirements, and draft replies. This
          processing is to provide the Service&rsquo;s features. Where no AI key
          is configured, a local heuristic is used instead and no message
          content leaves the Service for AI processing.
        </p>
      </Section>

      <Section heading="WhatsApp consent">
        <p>
          Messaging via the WhatsApp Business Platform is subject to
          Meta&rsquo;s policies, including opt-in requirements and the 24-hour
          customer-service window. The Agent is responsible for obtaining and
          recording each contact&rsquo;s consent to be messaged and for honouring
          opt-out requests.
        </p>
      </Section>

      <Section heading="Sub-processors">
        <p>
          We rely on infrastructure and service providers that may process data
          on our behalf, including: Anthropic (AI), Meta Platforms (WhatsApp
          Business), Amazon Web Services (file storage), the speech-to-text
          provider configured by the Agent, and the application hosting provider.
          Each is engaged to deliver the Service only.
        </p>
      </Section>

      <Section heading="Retention &amp; security">
        <p>
          Personal data is retained while the Agent&rsquo;s account is active or
          as required to provide the Service, then deleted or anonymised on
          request. We apply access controls, encrypted transport (HTTPS), hashed
          credentials, and signed sessions. Uploaded files are stored in private
          object storage and served through authenticated application routes.
        </p>
      </Section>

      <Section heading="Your rights (PDPL)">
        <p>
          Data subjects may request access, correction, deletion, restriction of
          processing, or portability of their personal data, and may withdraw
          consent. Requests should be directed to the Agent operating this
          instance, who will action them in line with the PDPL.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          For privacy questions or data-subject requests, contact the Agent /
          brokerage operating this KlientFlo instance. (Insert your data
          protection contact details here.)
        </p>
      </Section>
    </LegalPage>
  );
}
