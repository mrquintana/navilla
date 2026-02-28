import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="card card-elevated text-center" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="mb-4">
          <svg className="mx-auto" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-2xl mb-4">{t('auth.passwordUpdated')}</h1>
        <p className="text-muted">{t('auth.redirecting')}</p>
      </div>
    );
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1 className="text-2xl mb-2">{t('auth.resetPassword')}</h1>
      <p className="text-muted mb-6">{t('auth.enterNewPassword')}</p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="password" className="label">
            {t('auth.newPassword')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            minLength={8}
            maxLength={128}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="label">
            {t('auth.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
            minLength={8}
            maxLength={128}
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.updatePassword')}
        </button>
      </form>

      <div className="divider" />

      <p className="text-center text-sm text-muted">
        <Link to="/login" className="text-primary font-medium">
          {t('auth.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}
