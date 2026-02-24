import { ContentPage } from '../components/layout/ContentPage';

export function PrivacyPolicyPage() {
  return (
    <ContentPage
      seoTitle="Privacy Policy — Navilla"
      seoDescription="Navilla privacy policy. What data we collect, how we use it, and your rights."
      canonical="https://www.navilla.app/privacy-policy"
      title="Privacy Policy"
      subtitle="What we collect, how we use it, and your rights."
      lastUpdated="February 2026"
      sections={[
        {
          heading: 'Data we collect',
          body: 'We collect only what is necessary to operate the platform:',
          list: [
            'Email address — for account creation and transactional email',
            'Username — the name you choose to display to your connections',
            'Health status updates — the statuses you voluntarily log (positive, negative, etc.)',
            'Connection relationships — who you have confirmed as a trusted connection',
          ],
          note: 'We do not collect your real name, phone number, date of birth, or location.',
        },
        {
          heading: 'How we use your data',
          list: [
            'To authenticate your account and maintain your session',
            'To calculate and display anonymized exposure signals to your connections',
            'To send transactional emails (account confirmation, password reset, notifications)',
            'To allow you to manage your connections and health status',
          ],
        },
        {
          heading: 'What we never do',
          list: [
            'We do not sell your data to any third party',
            'We do not use your data for advertising',
            'We do not share your individual health status with any third party',
            'We do not use third-party analytics or tracking tools',
          ],
        },
        {
          heading: 'Third-party services',
          body: 'We use a small number of trusted infrastructure providers to operate the platform. These cover authentication, database hosting, email delivery, and application hosting. We do not share more data than necessary with any of them, and each operates under their own data processing agreements and security standards.',
        },
        {
          heading: 'Data retention',
          body: 'Your data is retained for as long as your account is active. If you delete your account, your data is permanently deleted within 30 days. Anonymized, non-attributable aggregate data may be retained for service improvement purposes.',
        },
        {
          heading: 'Your rights',
          body: 'Depending on your jurisdiction, you may have the right to:',
          list: [
            'Access the personal data we hold about you',
            'Correct inaccurate data',
            'Request deletion of your data',
            'Object to or restrict certain processing',
            'Receive a copy of your data in a portable format',
          ],
          note: 'Navilla complies with the Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) for users in Mexico and aligns with GDPR principles for users in the EU.',
        },
        {
          heading: 'Cookies',
          body: 'We use session cookies only for authentication. See our Cookie Policy for details.',
        },
        {
          heading: 'Contact',
          body: 'To exercise any of your rights or ask questions about this policy, contact us at contact@navilla.app.',
        },
      ]}
    />
  );
}
