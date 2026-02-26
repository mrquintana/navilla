import { ContentPage } from '../components/layout/ContentPage';

export function HelpPage() {
  return (
    <ContentPage
      seoTitle="Help Center — Navilla"
      seoDescription="Answers to common questions about Navilla — how it works, privacy, connections, and your data."
      canonical="https://www.navilla.app/help"
      title="Help Center"
      subtitle="FAQ and practical answers."
      sections={[
        {
          heading: 'What is Navilla?',
          body: 'Navilla is a private sexual health companion. It combines educational tools with anonymized network exposure context to help you make informed decisions.',
        },
        {
          heading: 'Who can see my exact health status?',
          body: 'Other users do not get a named view of your individual status. Exposure is shown as aggregate context (counts, degree, timing) rather than identity-linked records.',
        },
        {
          heading: 'What does self-reported vs provider-verified vs lab-verified mean?',
          body: [
            'Self-reported: entered directly by the user.',
            'Provider-verified: confirmed by a registered clinical provider in the platform workflow.',
            'Lab-verified: confirmed through a lab integration or verification process.',
          ],
          note: 'Most statuses are currently self-reported. Verification tiers are a roadmap feature and will be clearly labeled when available.',
        },
        {
          heading: 'How do I connect with someone?',
          body: 'Go to the Connections page and search for the person by username or email. Send a connection request. Once they accept, you become part of each other\'s trusted network and your health signals are included in each other\'s exposure calculations.',
        },
        {
          heading: 'How many connections do I need?',
          body: 'With very few connections, a single update can dominate the signal and weaken privacy. Exposure output is gated by minimum thresholds to reduce re-identification risk.',
        },
        {
          heading: 'Does timing matter?',
          body: 'Yes. Timing is critical in sexual health context. Exposure interpretation should consider recency, test windows, and whether reports are current or old.',
        },
        {
          heading: 'How do I update my health status?',
          body: 'Go to the Health page and log your current status. You can update it as your situation changes. Your status affects the exposure signals visible to your connections, but it is never shown attributed to you by name.',
        },
        {
          heading: 'Can I delete my account?',
          body: 'Yes. Go to your Profile page and scroll to the bottom. There is a delete account option. Deleting your account permanently removes your data within 30 days.',
        },
        {
          heading: 'Is Navilla a medical service?',
          body: 'No. Navilla is informational. It is not a diagnosis, treatment, or emergency medical service. Use it as one signal and consult a qualified professional for medical decisions.',
        },
        {
          heading: 'Who is Navilla for?',
          body: 'Navilla is for adults aged 18 and older who want to make informed health decisions without compromising their own privacy or anyone else\'s.',
        },
        {
          heading: 'Still have a question?',
          body: 'Send us an email at contact@navilla.app and we\'ll get back to you within 1–2 business days.',
        },
      ]}
      footer={
        <div className="card space-y-2">
          <p className="text-sm text-muted">Can't find what you're looking for?</p>
          <a
            href="mailto:contact@navilla.app"
            className="text-sm text-primary font-medium hover:underline"
          >
            contact@navilla.app
          </a>
        </div>
      }
    />
  );
}
