import { ContentPage } from '../components/layout/ContentPage';

export function SecurityPage() {
  return (
    <ContentPage
      seoTitle="Security — Navilla"
      seoDescription="How Navilla encrypts and secures your data. Current encryption architecture and our roadmap toward end-to-end encryption."
      canonical="https://www.navilla.app/security"
      title="Security"
      subtitle="How we protect your most sensitive data — and where we're headed."
      sections={[
        {
          heading: 'How your data is encrypted today',
          body: [
            'Every sensitive field — partner names, encounter notes, health records, and personal identifiers — is encrypted at the application layer using AES-256-GCM before it reaches the database. This is the same encryption standard used by banks and governments.',
            'Each user has a unique encryption key derived from a master secret using HKDF (HMAC-based Key Derivation Function). This means that even if the database were compromised, encrypted fields cannot be decrypted without the application-layer keys.',
            'Emails are additionally hashed with SHA-256 + a secret pepper for lookups, so the plaintext email is never used as a database key.',
          ],
        },
        {
          heading: 'What gets encrypted',
          list: [
            'Partner names and aliases',
            'Encounter journal notes and custom field values',
            'Health status records',
            'Email addresses (encrypted + hashed separately)',
            'Display names and profile information',
            'Exposure network snapshots',
          ],
        },
        {
          heading: 'Transport security',
          body: 'All communication between your device and Navilla is encrypted in transit using HTTPS/TLS. We enforce secure transport across all environments.',
        },
        {
          heading: 'Authentication',
          body: 'Authentication uses token-based session management via Supabase Auth. Passwords are never stored in plain text. Sessions expire and require re-authentication. Refresh tokens are rotated on every use.',
        },
        {
          heading: 'Access control',
          body: 'The backend API validates every request against your session token before returning any data. You can only access data that belongs to you. No data is publicly accessible without authentication.',
        },
        {
          heading: 'Our encryption roadmap',
          body: [
            'Our current architecture encrypts data at the application layer — the server encrypts and decrypts on your behalf. This protects against database breaches and unauthorized access, but it means the server can technically read your data during processing.',
            'We are working toward true end-to-end encryption (E2EE), where your data is encrypted on your device before it ever leaves, and only your device holds the keys. This is the model used by Signal and Telegram\'s secret chats — the server becomes a blind relay that stores data it cannot read.',
            'The goal: even if Navilla\'s servers were fully compromised, your health data, partner names, and encounter history would remain unreadable.',
          ],
        },
        {
          heading: 'E2EE implementation plan',
          list: [
            'Client-side key generation — encryption keys created and stored on your device',
            'Zero-knowledge storage — the server stores only ciphertext it cannot decrypt',
            'Secure key backup — optional encrypted key backup for device recovery, protected by a passphrase only you know',
            'Multi-device sync — secure key transfer between your devices using established protocols',
          ],
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
          heading: 'Email security',
          body: 'Transactional email is configured with modern domain authentication controls (SPF, DKIM, DMARC) to reduce spoofing risk.',
        },
        {
          heading: 'Reporting a vulnerability',
          body: 'If you discover a security vulnerability in Navilla, please report it responsibly to contact@navilla.app. We take all reports seriously and will respond promptly.',
        },
      ]}
    />
  );
}
