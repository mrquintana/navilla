import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Network,
  Users,
  Calculator,
  AlertTriangle,
  BarChart3,
  UserCog,
} from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="card card-elevated space-y-3">
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
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('howItWorks.title')}</h1>
        <p className="text-muted">{t('howItWorks.subtitle')}</p>
      </div>

      <Section
        icon={<Eye className="w-5 h-5 text-primary" />}
        title={t('howItWorks.showYou.title')}
      >
        <p>{t('howItWorks.showYou.intro')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.showYou.item1')}</li>
          <li>{t('howItWorks.showYou.item2')}</li>
          <li>{t('howItWorks.showYou.item3')}</li>
          <li>{t('howItWorks.showYou.item4')}</li>
          <li>{t('howItWorks.showYou.item5')}</li>
        </ul>
      </Section>

      <Section
        icon={<EyeOff className="w-5 h-5 text-primary" />}
        title={t('howItWorks.neverShowYou.title')}
      >
        <p>{t('howItWorks.neverShowYou.intro')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.neverShowYou.item1')}</li>
          <li>{t('howItWorks.neverShowYou.item2')}</li>
          <li>{t('howItWorks.neverShowYou.item3')}</li>
        </ul>
      </Section>

      <Section
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        title={t('howItWorks.dataSource.title')}
      >
        <p>{t('howItWorks.dataSource.body1')}</p>
        <p>{t('howItWorks.dataSource.body2')}</p>
      </Section>

      <Section
        icon={<Users className="w-5 h-5 text-primary" />}
        title={t('howItWorks.connections.title')}
      >
        <p>{t('howItWorks.connections.body1')}</p>
        <p>{t('howItWorks.connections.body2')}</p>
        <p>{t('howItWorks.connections.body3')}</p>
      </Section>

      <Section
        icon={<Calculator className="w-5 h-5 text-primary" />}
        title={t('howItWorks.exposure.title')}
      >
        <p>{t('howItWorks.exposure.body1')}</p>
        <p>{t('howItWorks.exposure.body2')}</p>
      </Section>

      <Section
        icon={<AlertTriangle className="w-5 h-5 text-primary" />}
        title={t('howItWorks.accuracy.title')}
      >
        <p>{t('howItWorks.accuracy.body1')}</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.accuracy.item1')}</li>
          <li>{t('howItWorks.accuracy.item2')}</li>
          <li>{t('howItWorks.accuracy.item3')}</li>
          <li>{t('howItWorks.accuracy.item4')}</li>
          <li>{t('howItWorks.accuracy.item5')}</li>
        </ul>
      </Section>

      <Section
        icon={<Network className="w-5 h-5 text-primary" />}
        title={t('howItWorks.whatYouCanDo.title')}
      >
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{t('howItWorks.whatYouCanDo.item1')}</li>
          <li>{t('howItWorks.whatYouCanDo.item2')}</li>
          <li>{t('howItWorks.whatYouCanDo.item3')}</li>
          <li>{t('howItWorks.whatYouCanDo.item4')}</li>
        </ul>
      </Section>

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
        <Link to="/dashboard" className="btn btn-primary">
          {t('howItWorks.goToDashboard')}
        </Link>
        <Link to="/" className="btn btn-secondary">
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
}
