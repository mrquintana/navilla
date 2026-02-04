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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('navilla_language', newLang);
  };

  return (
    <select
      id={id}
      value={i18n.language}
      onChange={handleChange}
      className={className ?? 'text-sm bg-transparent border border-border rounded px-2 py-1 cursor-pointer'}
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
