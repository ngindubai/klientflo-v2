import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Klientflo",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern use of the Klientflo application (&ldquo;the
        Service&rdquo;) by the real estate agent or brokerage operating it and
        its authorised users (&ldquo;you&rdquo;). By using the Service you agree
        to these terms.
      </p>

      <Section heading="Use of the Service">
        <p>
          The Service is provided to help manage WhatsApp-based client
          communication, listings, scheduling, documents, and reporting. You are
          responsible for the accuracy of data you enter and for using the
          Service in compliance with applicable law and the policies of any
          connected platform (including Meta&rsquo;s WhatsApp Business policies).
        </p>
      </Section>

      <Section heading="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Do not use the Service to send spam or unsolicited messages.</li>
          <li>
            Obtain valid consent before messaging contacts and honour opt-out
            requests.
          </li>
          <li>
            Do not upload data you have no right to process, or use the Service
            for unlawful purposes.
          </li>
          <li>Keep your login credentials confidential.</li>
        </ul>
      </Section>

      <Section heading="Messaging &amp; third-party platforms">
        <p>
          Outbound messaging depends on the WhatsApp Business Platform and is
          subject to Meta&rsquo;s rules, rate limits, template approvals, and the
          24-hour customer-service window. AI features depend on third-party
          model providers. Availability and behaviour of these platforms are
          outside our control.
        </p>
      </Section>

      <Section heading="Data">
        <p>
          Your use of personal data through the Service is also governed by our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . You remain responsible, as data controller, for the lawful basis of
          processing the contacts and owners you load into the Service.
        </p>
      </Section>

      <Section heading="Availability &amp; warranties">
        <p>
          The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis without warranties of any kind. We do not
          warrant that it will be uninterrupted or error-free. AI-generated
          content may be inaccurate and should be reviewed before being sent or
          relied upon.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, we are not liable for indirect,
          incidental, or consequential damages, or for loss of data, profits, or
          business arising from use of the Service.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms from time to time. Continued use of the
          Service after changes take effect constitutes acceptance of the
          updated terms.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms should be directed to the Agent /
          brokerage operating this Klientflo instance. (Insert your contact
          details here.)
        </p>
      </Section>
    </LegalPage>
  );
}
