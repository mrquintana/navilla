import { ContentPage } from '../components/layout/ContentPage';

export function CookiePolicyPage() {
  return (
    <ContentPage
      seoTitle="Cookie Policy — Navilla"
      seoDescription="Navilla cookie policy. We use session cookies only — no tracking, no advertising."
      canonical="https://www.navilla.app/cookie-policy"
      title="Cookie Policy"
      subtitle="What cookies we use and why."
      lastUpdated="February 2026"
      sections={[
        {
          heading: 'The short version',
          body: 'Navilla uses session cookies only. We do not use tracking cookies, advertising cookies, or any third-party analytics tools that set cookies on your device.',
        },
        {
          heading: 'What cookies we set',
          body: 'We set one type of cookie:',
          list: [
            'Authentication session cookie — keeps you logged in during your session. This cookie is essential for the app to function. It is deleted when you log out or your session expires.',
          ],
        },
        {
          heading: 'What we do not do',
          list: [
            'We do not use Google Analytics or any behavioral analytics tool',
            'We do not use advertising pixels or retargeting cookies',
            'We do not share cookie data with third parties',
            'We do not track you across other websites',
          ],
        },
        {
          heading: 'Managing cookies',
          body: 'You can clear cookies at any time through your browser settings. Clearing your session cookie will log you out of Navilla. We show a lightweight cookie notice for transparency, even though we currently use essential cookies only.',
        },
        {
          heading: 'Questions',
          body: 'If you have questions about how we use cookies, contact us at contact@navilla.app.',
        },
      ]}
    />
  );
}
