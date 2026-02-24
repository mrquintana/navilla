import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en_US', label: 'English' },
  { code: 'es_MX', label: 'Español' },
];

interface LanguageSwitcherProps {
  className?: string;
  id?: string;
}

export function LanguageSwitcher({ className, id }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const switchTo = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('navilla_language', code);
  };

  return (
    <div id={id} className={className} role="group" aria-label="Select language">
      {languages.map((lang, idx) => (
        <span key={lang.code}>
          {idx > 0 && <span className="mx-2 opacity-40">|</span>}
          <button
            onClick={() => switchTo(lang.code)}
            lang={lang.code.split('_')[0]}
            className={
              i18n.language === lang.code
                ? 'font-semibold underline underline-offset-2'
                : 'opacity-50 hover:opacity-80 transition-opacity'
            }
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
