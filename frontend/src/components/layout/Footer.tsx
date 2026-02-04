import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4 className="footer-title">{t('footer.product')}</h4>
            <ul className="footer-list">
              <li><a href="#">{t('footer.links.howItWorks')}</a></li>
              <li><a href="#">{t('footer.links.privacy')}</a></li>
              <li><a href="#">{t('footer.links.security')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.company')}</h4>
            <ul className="footer-list">
              <li><a href="#">{t('footer.links.about')}</a></li>
              <li><a href="#">{t('footer.links.contact')}</a></li>
              <li><a href="#">{t('footer.links.careers')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.legal')}</h4>
            <ul className="footer-list">
              <li><a href="#">{t('footer.links.terms')}</a></li>
              <li><a href="#">{t('footer.links.policy')}</a></li>
              <li><a href="#">{t('footer.links.cookies')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.support')}</h4>
            <ul className="footer-list">
              <li><a href="#">{t('footer.links.help')}</a></li>
              <li><a href="#">{t('footer.links.status')}</a></li>
              <li><a href="#">{t('footer.links.accessibility')}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('footer.copyright')}</span>
          <span className="footer-tagline">{t('privacy.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
