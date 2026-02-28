import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  HeartPulse,
  Users,
  Network,
  Calculator,
  Shield,
  UserCog,
  Compass,
} from 'lucide-react';

interface SectionProps {
  sectionId?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ sectionId, icon, title, children }: SectionProps) {
  return (
    <section
      id={sectionId}
      className="card card-elevated space-y-3"
      style={sectionId ? { scrollMarginTop: '5rem' } : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-sm text-muted space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

export function HowItWorksPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-10 space-y-6 max-w-3xl">
      <title>{t('howItWorks.seoTitle')}</title>
      <meta name="description" content={t('howItWorks.seoDescription')} />
      <link rel="canonical" href="https://www.navilla.app/how-it-works" />
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('howItWorks.title')}</h1>
        <p className="text-muted">{t('howItWorks.subtitle')}</p>
      </div>

      {/* Overview */}
      <Section
        icon={<Compass className="w-5 h-5 text-primary" />}
        title={t('howItWorks.overview.title')}
      >
        <p>{t('howItWorks.overview.body1')}</p>
        <p>{t('howItWorks.overview.body2')}</p>
      </Section>

      {/* Encounter Journal */}
      <Section
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        title={t('howItWorks.journal.title')}
      >
        <p>{t('howItWorks.journal.body1')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.journal.item1')}</li>
          <li>{t('howItWorks.journal.item2')}</li>
          <li>{t('howItWorks.journal.item3')}</li>
          <li>{t('howItWorks.journal.item4')}</li>
          <li>{t('howItWorks.journal.item5')}</li>
        </ul>
      </Section>

      {/* Partner Tracking */}
      <Section
        icon={<Users className="w-5 h-5 text-primary" />}
        title={t('howItWorks.partners.title')}
      >
        <p>{t('howItWorks.partners.body1')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.partners.item1')}</li>
          <li>{t('howItWorks.partners.item2')}</li>
          <li>{t('howItWorks.partners.item3')}</li>
        </ul>
        <p>{t('howItWorks.partners.body2')}</p>
      </Section>

      {/* Health Log */}
      <Section
        icon={<HeartPulse className="w-5 h-5 text-primary" />}
        title={t('howItWorks.healthLog.title')}
      >
        <p>{t('howItWorks.healthLog.body1')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.healthLog.item1')}</li>
          <li>{t('howItWorks.healthLog.item2')}</li>
          <li>{t('howItWorks.healthLog.item3')}</li>
          <li>{t('howItWorks.healthLog.item4')}</li>
          <li>{t('howItWorks.healthLog.item5')}</li>
        </ul>
      </Section>

      {/* Exposure Network */}
      <Section
        sectionId="network-size-explainer"
        icon={<Network className="w-5 h-5 text-primary" />}
        title={t('howItWorks.network.title')}
      >
        <p>{t('howItWorks.network.body1')}</p>
        <p>{t('howItWorks.network.body2')}</p>
        <p>{t('howItWorks.network.body3')}</p>
        <p>{t('howItWorks.network.body4')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.network.item1')}</li>
          <li>{t('howItWorks.network.item2')}</li>
          <li>{t('howItWorks.network.item3')}</li>
          <li>{t('howItWorks.network.item4')}</li>
        </ul>
      </Section>

      {/* Free Tools */}
      <Section
        icon={<Calculator className="w-5 h-5 text-primary" />}
        title={t('howItWorks.freeTools.title')}
      >
        <p>{t('howItWorks.freeTools.body1')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.freeTools.item1')}</li>
          <li>{t('howItWorks.freeTools.item2')}</li>
          <li>{t('howItWorks.freeTools.item3')}</li>
        </ul>
      </Section>

      {/* Privacy & Security */}
      <Section
        icon={<Shield className="w-5 h-5 text-primary" />}
        title={t('howItWorks.privacy.title')}
      >
        <p>{t('howItWorks.privacy.body1')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.privacy.item1')}</li>
          <li>{t('howItWorks.privacy.item2')}</li>
          <li>{t('howItWorks.privacy.item3')}</li>
          <li>{t('howItWorks.privacy.item4')}</li>
          <li>{t('howItWorks.privacy.item5')}</li>
        </ul>
        <p>
          {t('howItWorks.privacy.learnMore')}{' '}
          <Link to="/security" className="text-primary font-medium hover:underline">
            {t('howItWorks.privacy.securityLink')}
          </Link>
        </p>
      </Section>

      {/* Your Data Rights */}
      <Section
        icon={<UserCog className="w-5 h-5 text-primary" />}
        title={t('howItWorks.dataRights.title')}
      >
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.dataRights.item1')}</li>
          <li>{t('howItWorks.dataRights.item2')}</li>
          <li>{t('howItWorks.dataRights.item3')}</li>
          <li>{t('howItWorks.dataRights.item4')}</li>
          <li>{t('howItWorks.dataRights.item5')}</li>
        </ul>
      </Section>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/signup" className="btn btn-primary">
          {t('howItWorks.getStarted')}
        </Link>
        <Link to="/" className="btn btn-secondary">
          {t('common.backToHome')}
        </Link>
      </div>
    </div>
  );
}
