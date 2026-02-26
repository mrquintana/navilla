import { ContentPage } from '../components/layout/ContentPage';

export function PrivacyPage() {
  return (
    <ContentPage
      seoTitle="Privacy — Navilla"
      seoDescription="How Navilla protects your identity and data. Our privacy principles and what we never do."
      canonical="https://www.navilla.app/privacy"
      title="Privacy"
      subtitle="How we protect your identity and your data."
      sections={[
        {
          heading: 'Privacy is the product',
          body: 'Navilla exists because sexual health information is useful and sensitive at the same time. The product is designed so you can make informed decisions without exposing personal details to your network.',
        },
        {
          heading: 'What we never share',
          list: [
            'Your individual health status is not shown to other users with your identity',
            'Your network graph is not publicly visible',
            'Your data is not sold to third parties',
            'Your data is not used for ad targeting',
            'We do not run third-party behavioral tracking across the web',
          ],
        },
        {
          heading: 'What users can see',
          body: 'Users see aggregate exposure context: counts, nearest degree, and timing buckets. They do not get a list of who reported what condition.',
        },
        {
          heading: 'What we collect',
          list: [
            'Account data: email and username',
            'Age-gating and profile context: date of birth, sex, and optional profile fields',
            'Health and network data you choose to provide: status updates and confirmed connections',
            'Security and operational data needed to run the service safely',
          ],
          note: 'We do not require government ID, and we do not ask for your real legal name to use Navilla.',
        },
        {
          heading: 'How privacy protections work',
          list: [
            'Exposure snapshots are delayed instead of real-time',
            'Minimum network thresholds reduce re-identification risk',
            'Exposure calculations are done server-side and returned as aggregated outputs',
            'Connection controls let you remove people from your active graph',
          ],
        },
        {
          heading: 'Your control',
          list: [
            'You choose who is in your network',
            'You decide when and what health status to log',
            'You can remove connections at any time',
            'You can delete your account and associated personal data',
          ],
        },
        {
          heading: 'Verification roadmap',
          body: 'Today, most reports are self-reported. As provider/lab integrations become available, Navilla will label verification level so you can interpret confidence without compromising privacy.',
        },
        {
          heading: 'Read the legal policy',
          body: 'For legal details on processing, retention, and user rights, see the full Privacy Policy.',
        },
        {
          heading: 'What we do not do',
          list: [
            'We do not offer medical diagnosis',
            'We do not replace professional medical advice',
            'We do not provide emergency response services',
          ],
        },
        {
          heading: 'Where to read more',
          body: 'You can find technical and legal details in Security, Privacy Policy, and Terms.',
        },
      ]}
    />
  );
}
