import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const COOKIE_NOTICE_KEY = 'navilla_cookie_notice_ack_v1';

export function CookieNoticeBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem(COOKIE_NOTICE_KEY) === 'true';
      setVisible(!acknowledged);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(COOKIE_NOTICE_KEY, 'true');
    } catch {
      // If storage is unavailable, just close for this render lifecycle.
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-notice" role="region" aria-label={t('cookieNotice.ariaLabel', 'Cookie notice')}>
      <p className="cookie-notice-text">
        {t(
          'cookieNotice.body',
          'We use essential cookies for login and security. We do not use advertising or tracking cookies.'
        )}{' '}
        <Link to="/cookie-policy" className="cookie-notice-link">
          {t('cookieNotice.link', 'Learn more')}
        </Link>
      </p>
      <button type="button" className="btn btn-primary" onClick={handleAcknowledge}>
        {t('cookieNotice.ack', 'Got it')}
      </button>
    </div>
  );
}
