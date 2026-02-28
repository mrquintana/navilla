import { useTranslation } from 'react-i18next';
import { ContentPage } from '../components/layout/ContentPage';

export function SecurityPage() {
  const { t } = useTranslation();

  return (
    <ContentPage
      seoTitle={t('security.seoTitle')}
      seoDescription={t('security.seoDescription')}
      canonical="https://www.navilla.app/security"
      title={t('security.title')}
      subtitle={t('security.subtitle')}
      sections={[
        {
          heading: t('security.encryptionTodayHeading'),
          body: [
            t('security.encryptionTodayBody1'),
            t('security.encryptionTodayBody2'),
            t('security.encryptionTodayBody3'),
          ],
        },
        {
          heading: t('security.whatGetsEncryptedHeading'),
          list: [
            t('security.whatGetsEncrypted1'),
            t('security.whatGetsEncrypted2'),
            t('security.whatGetsEncrypted3'),
            t('security.whatGetsEncrypted4'),
            t('security.whatGetsEncrypted5'),
            t('security.whatGetsEncrypted6'),
          ],
        },
        {
          heading: t('security.transportHeading'),
          body: t('security.transportBody'),
        },
        {
          heading: t('security.authHeading'),
          body: t('security.authBody'),
        },
        {
          heading: t('security.accessHeading'),
          body: t('security.accessBody'),
        },
        {
          heading: t('security.roadmapHeading'),
          body: [
            t('security.roadmapBody1'),
            t('security.roadmapBody2'),
            t('security.roadmapBody3'),
          ],
        },
        {
          heading: t('security.e2eePlanHeading'),
          list: [
            t('security.e2eePlan1'),
            t('security.e2eePlan2'),
            t('security.e2eePlan3'),
            t('security.e2eePlan4'),
          ],
        },
        {
          heading: t('security.whatWeDoNotDoHeading'),
          list: [
            t('security.whatWeDoNotDo1'),
            t('security.whatWeDoNotDo2'),
            t('security.whatWeDoNotDo3'),
            t('security.whatWeDoNotDo4'),
          ],
        },
        {
          heading: t('security.emailSecurityHeading'),
          body: t('security.emailSecurityBody'),
        },
        {
          heading: t('security.vulnerabilityHeading'),
          body: t('security.vulnerabilityBody'),
        },
      ]}
    />
  );
}
