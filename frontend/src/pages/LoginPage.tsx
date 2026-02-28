import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { t } = useTranslation();
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  if (session) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="card card-elevated" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1 className="text-2xl mb-6">{t('auth.signIn')}</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="mb-4">
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
            maxLength={254}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="label">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            maxLength={128}
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.signIn')}
        </button>

        <p className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-primary">
            {t('auth.forgotPassword')}
          </Link>
        </p>
      </form>

      <div className="divider" />

      <p className="text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="text-primary font-medium">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  );
}
