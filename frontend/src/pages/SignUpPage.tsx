import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export function SignUpPage() {
  const { t } = useTranslation();
  const { session, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

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

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setShowConfirmation(true);
    }
  };

  if (showConfirmation) {
    return (
      <div className="card text-center">
        <h1 className="text-2xl font-semibold mb-4">{t('auth.verifyEmail')}</h1>
        <p className="text-muted mb-6">{t('auth.checkEmail')}</p>
        <Link to="/login" className="btn btn-primary">
          {t('auth.signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold mb-6">{t('auth.signUp')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
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
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.signUp')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {t('auth.signIn')}?{' '}
        <Link to="/login" className="text-accent hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  );
}
