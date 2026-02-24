import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-10 space-y-6 max-w-2xl">
      <title>{t('contact.pageTitle')}</title>
      <meta name="description" content={t('contact.metaDescription')} />
      <link rel="canonical" href="https://www.navilla.app/contact" />

      <div>
        <h1 className="text-3xl font-bold mb-2">{t('contact.title')}</h1>
        <p className="text-muted">{t('contact.subtitle')}</p>
      </div>

      <div className="card card-elevated space-y-4">
        <p className="text-sm">{t('contact.body')}</p>
        <a
          href="mailto:contact@navilla.app"
          className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
        >
          <Mail className="w-4 h-4" aria-hidden="true" />
          contact@navilla.app
        </a>
        <p className="text-xs text-muted">{t('contact.responseTime')}</p>
      </div>

      <Link to="/" className="text-sm text-primary font-medium">
        {t('common.back')}
      </Link>
    </div>
  );
}
