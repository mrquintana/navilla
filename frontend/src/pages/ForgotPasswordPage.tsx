import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="card card-elevated text-center" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="mb-4">
          <svg className="mx-auto" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-2xl mb-4">{t('auth.checkYourEmail')}</h1>
        <p className="text-muted mb-6">{t('auth.resetEmailSent')}</p>
        <Link to="/login" className="btn btn-primary">
          {t('auth.backToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1 className="text-2xl mb-2">{t('auth.forgotPassword')}</h1>
      <p className="text-muted mb-6">{t('auth.forgotPasswordDescription')}</p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="email" className="label">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.sendResetLink')}
        </button>
      </form>

      <div className="divider" />

      <p className="text-center text-sm text-muted">
        {t('auth.rememberPassword')}{' '}
        <Link to="/login" className="text-primary font-medium">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  );
}
