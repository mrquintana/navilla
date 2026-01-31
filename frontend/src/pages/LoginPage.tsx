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
    <div className="card">
      <h1 className="text-2xl font-semibold mb-6">{t('auth.signIn')}</h1>

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
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.signIn')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {t('auth.signUp')}?{' '}
        <Link to="/signup" className="text-accent hover:underline">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  );
}
