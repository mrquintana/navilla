import { ContentPage } from '../components/layout/ContentPage';

export function StatusPage() {
  return (
    <ContentPage
      seoTitle="System Status — Navilla"
      seoDescription="Current operational status of the Navilla platform."
      canonical="https://www.navilla.app/status"
      title="System Status"
      subtitle="Current operational status of the Navilla platform."
      sections={[
        {
          heading: '🟢 All systems operational',
          body: [
            'Frontend — Operational',
            'Backend API — Operational',
            'Database — Operational',
            'Authentication — Operational',
            'Email delivery — Operational',
          ],
        },
        {
          heading: 'Reporting an issue',
          body: 'If you are experiencing a problem that is not reflected here, please contact us at contact@navilla.app with a description of the issue and we will investigate promptly.',
        },
      ]}
    />
  );
}
