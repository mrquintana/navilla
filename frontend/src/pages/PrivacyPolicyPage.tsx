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
          body: 'We collect data needed to operate the platform safely and provide requested features:',
          list: [
            'Account data: email address and username',
            'Age-gating/profile data: date of birth, sex, and optional profile fields (such as full name, country, location)',
            'Health data you provide: status updates and related timestamps',
            'Network data: connection requests, confirmed connections, and their lifecycle events',
            'Operational security data: authentication/session events and abuse-prevention logs',
          ],
          note: 'We do not require government ID or your legal name to use Navilla.',
        },
        {
          heading: 'How we use your data',
          list: [
            'To authenticate your account and maintain your session',
            'To enforce age restrictions and platform safety requirements',
            'To calculate and display aggregated exposure context to eligible connections',
            'To send transactional emails (account confirmation, password reset, product-critical notifications)',
            'To allow you to manage profile, connections, and health status',
            'To monitor abuse, secure the platform, and diagnose reliability issues',
          ],
        },
        {
          heading: 'What we never do',
          list: [
            'We do not sell your data to any third party',
            'We do not use your data for ad targeting',
            'We do not expose your individual health status as a named public record',
            'We do not run third-party cross-site tracking scripts for advertising',
          ],
        },
        {
          heading: 'Aggregation and privacy protections',
          body: 'Exposure context is generated from confirmed network data using aggregation rules and delayed snapshots. The product is designed to avoid exposing direct identity-path details in user-facing exposure responses.',
        },
        {
          heading: 'Verification labels',
          body: 'Most statuses are currently self-reported. If provider/lab verification features are enabled in the future, verification type will be displayed as a label to indicate confidence level. Additional consent requirements may apply for those features.',
        },
        {
          heading: 'Service providers',
          body: 'We use a limited set of vendors for infrastructure operations (such as auth, database, email delivery, and hosting). Each provider receives only the data needed to perform its service under applicable contractual safeguards.',
        },
        {
          heading: 'Data retention',
          body: 'Account data is retained while your account is active. After account deletion, personal data is deleted within 30 days, except where temporary retention is required for legal/security obligations. Non-attributable aggregate statistics may be retained for service reliability and product improvement.',
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
          body: 'We use essential cookies required for authentication and session continuity. See Cookie Policy for details.',
        },
        {
          heading: 'Contact',
          body: 'To exercise any of your rights or ask questions about this policy, contact us at contact@navilla.app.',
        },
      ]}
    />
  );
}
