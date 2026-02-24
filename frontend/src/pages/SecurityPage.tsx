import { ContentPage } from '../components/layout/ContentPage';

export function SecurityPage() {
  return (
    <ContentPage
      seoTitle="Security — Navilla"
      seoDescription="How Navilla secures your data. Our technical security practices and commitments."
      canonical="https://www.navilla.app/security"
      title="Security"
      subtitle="Our approach to keeping your data safe."
      sections={[
        {
          heading: 'Transport security',
          body: 'All communication between your device and Navilla is encrypted using HTTPS/TLS. The navilla.app domain enforces HTTPS at the registry level — browsers will refuse any unencrypted connection.',
        },
        {
          heading: 'Authentication',
          body: 'Authentication uses industry-standard JWT-based session management. Passwords are never stored in plain text. Sessions expire and require re-authentication.',
        },
        {
          heading: 'Data storage',
          body: [
            'All data is stored in a managed relational database with encryption at rest.',
            'Sensitive fields are additionally encrypted at the application layer before storage.',
          ],
        },
        {
          heading: 'Access control',
          body: 'The backend API validates every request against your session token before returning any data. You can only access data that belongs to you or your confirmed connections. No data is publicly accessible without authentication.',
        },
        {
          heading: 'Email security',
          body: 'Transactional emails are sent with full DKIM, SPF, and DMARC authentication on the navilla.app domain. This prevents spoofing and ensures that emails from no-reply@navilla.app are genuinely from us.',
        },
        {
          heading: 'What we do not do',
          list: [
            'We do not use third-party tracking scripts or analytics SDKs',
            'We do not embed advertising networks',
            'We do not share your data with data brokers',
            'We do not store health data in unencrypted form',
          ],
        },
        {
          heading: 'Reporting a vulnerability',
          body: 'If you discover a security vulnerability in Navilla, please report it responsibly to contact@navilla.app. We take all reports seriously and will respond promptly.',
        },
      ]}
    />
  );
}
