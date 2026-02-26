import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from '../LanguageSwitcher';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4 className="footer-title">{t('footer.product')}</h4>
            <ul className="footer-list">
              <li><Link to="/how-it-works">{t('footer.links.howItWorks')}</Link></li>
              <li><Link to="/privacy">{t('footer.links.privacy')}</Link></li>
              <li><Link to="/security">{t('footer.links.security')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.tools', 'Tools')}</h4>
            <ul className="footer-list">
              <li><Link to="/calculator">{t('footer.links.calculator', 'Window Period Calculator')}</Link></li>
              <li><Link to="/guides">{t('footer.links.guides', 'STI Guides')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.company')}</h4>
            <ul className="footer-list">
              <li><Link to="/about">{t('footer.links.about')}</Link></li>
              <li><Link to="/contact">{t('footer.links.contact')}</Link></li>
              <li><Link to="/careers">{t('footer.links.careers')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.legal')}</h4>
            <ul className="footer-list">
              <li><Link to="/terms">{t('footer.links.terms')}</Link></li>
              <li><Link to="/privacy-policy">{t('footer.links.policy')}</Link></li>
              <li><Link to="/cookie-policy">{t('footer.links.cookies')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">{t('footer.support')}</h4>
            <ul className="footer-list">
              <li><Link to="/help">{t('footer.links.help')}</Link></li>
              <li><Link to="/status">{t('footer.links.status')}</Link></li>
              <li><Link to="/accessibility">{t('footer.links.accessibility')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('footer.copyright')}</span>
          <span className="footer-tagline">{t('privacy.tagline')}</span>
          <LanguageSwitcher className="flex items-center text-sm text-stone-200" />
        </div>
      </div>
    </footer>
  );
}
