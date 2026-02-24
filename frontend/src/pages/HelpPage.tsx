import { ContentPage } from '../components/layout/ContentPage';

export function HelpPage() {
  return (
    <ContentPage
      seoTitle="Help Center — Navilla"
      seoDescription="Answers to common questions about Navilla — how it works, privacy, connections, and your data."
      canonical="https://www.navilla.app/help"
      title="Help Center"
      subtitle="Answers to common questions."
      sections={[
        {
          heading: 'What is Navilla?',
          body: 'Navilla is a private health exposure network. It tells you what health conditions are circulating in your trusted circle without revealing who has what. You see exposure signals — counts and levels — not names or individual statuses.',
        },
        {
          heading: 'Who can see my health status?',
          body: 'Nobody sees your individual health status directly. When you log a status, it is combined with the statuses of others in the network to produce an anonymized aggregate signal. Your name is never associated with any health condition shown to other users.',
        },
        {
          heading: 'How do I connect with someone?',
          body: 'Go to the Connections page and search for the person by username or email. Send a connection request. Once they accept, you become part of each other\'s trusted network and your health signals are included in each other\'s exposure calculations.',
        },
        {
          heading: 'How many connections do I need?',
          body: 'Exposure signals become meaningful once you have a few confirmed connections. With very few connections, a single status update can dominate the signal, which reduces the anonymization. We recommend connecting with at least 3–5 people you genuinely trust.',
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
          body: 'No. Navilla provides informational exposure signals based on self-reported data from your network. It is not a diagnostic tool and should not replace professional medical advice. Use it as one input among many.',
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
