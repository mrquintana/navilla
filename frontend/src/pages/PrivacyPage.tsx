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
          body: 'Navilla exists because health exposure information is genuinely useful — and genuinely sensitive. We built the entire product around one constraint: you should be able to know your risk without anyone else knowing yours.',
        },
        {
          heading: 'What we never share',
          list: [
            'Your name is never shown to other users',
            'Your health status is never attributed to you by name',
            'Your network connections are never visible to people outside your connections',
            'Your data is never sold to third parties',
            'Your data is never used for advertising',
          ],
        },
        {
          heading: 'What we show instead',
          body: 'When you or someone in your network logs a health status, Navilla only surfaces the aggregate signal — a count or exposure level across your network. Individual statuses are combined and anonymized before they are shown to anyone.',
        },
        {
          heading: 'Minimum data collection',
          body: 'We collect what we need to make the product work and nothing else. We do not ask for your real name, phone number, date of birth, or location. We do not track your behavior across the web. We do not use third-party analytics.',
        },
        {
          heading: 'Your control',
          list: [
            'You choose who is in your network',
            'You decide when and what health status to log',
            'You can remove connections at any time',
            'You can delete your account and all associated data at any time',
          ],
        },
        {
          heading: 'The full policy',
          body: 'For the complete details of what data we collect, how we store it, who we share it with, and your rights under applicable law, see our Privacy Policy.',
        },
      ]}
    />
  );
}
