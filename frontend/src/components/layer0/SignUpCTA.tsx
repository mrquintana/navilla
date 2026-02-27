import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useAuthOptional } from '../../contexts/AuthContext';
import type { Lang } from '../../lib/stiContent';

interface SignUpCTAProps {
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
}

export function SignUpCTA({ titleEn, titleEs, bodyEn, bodyEs }: SignUpCTAProps) {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const session = useAuthOptional()?.session ?? null;

  if (session) return null;

  return (
    <div className="guide-cta">
      <h3>{lang === 'es' ? titleEs : titleEn}</h3>
      <p>{lang === 'es' ? bodyEs : bodyEn}</p>
      <Link to="/signup" className="btn">
        {lang === 'es' ? 'Crear cuenta gratis' : 'Create free account'}
        <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
      </Link>
    </div>
  );
}
