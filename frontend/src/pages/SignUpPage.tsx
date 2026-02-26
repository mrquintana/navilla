import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type UserMetadata } from '../contexts/AuthContext';
import { detectCountry, countries } from '../lib/geolocation';
import { DEV_MODE } from '../lib/devMode';

type Sex = 'male' | 'female' | 'other';

export function SignUpPage() {
  const { t } = useTranslation();
  const { session, signUp } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [country, setCountry] = useState(() => detectCountry()?.countryCode ?? '');
  const [location, setLocation] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form

  const fillRandomSignup = () => {
    const names = ['Ana', 'Luis', 'Carla', 'Mateo', 'Sofia', 'Diego', 'Lucia', 'Javier'];
    const surnames = ['Lopez', 'Garcia', 'Hernandez', 'Perez', 'Martinez', 'Santos', 'Diaz'];
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const fullNameValue = `${name} ${surname}`;
    const usernameValue = `${name}${surname}`.toLowerCase();
    const randomEmail = `${name}.${surname}${Math.floor(Math.random() * 900 + 100)}@navilla.app`.toLowerCase();
    const sexes: Sex[] = ['male', 'female', 'other'];
    const randomCountry = countries[Math.floor(Math.random() * countries.length)]?.code ?? '';

    setEmail(randomEmail);
    setPassword('Test1234');
    setConfirmPassword('Test1234');
    setUsername(usernameValue.replace(/[^a-z0-9_]/g, ''));
    setFullName(fullNameValue);
    setDateOfBirth(`19${80 + Math.floor(Math.random() * 20)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`);
    setSex(sexes[Math.floor(Math.random() * sexes.length)]);
    setCountry(randomCountry);
    setLocation(Math.random() > 0.5 ? 'Mexico City' : 'Austin, TX');
    setStep(2);
  };


  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      setError(t('errors.required'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return false;
    }
    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!username) {
      setError(t('errors.usernameRequired'));
      return false;
    }
    if (username.length < 3) {
      setError(t('errors.usernameTooShort'));
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(t('errors.usernameInvalid'));
      return false;
    }
    if (!dateOfBirth) {
      setError(t('errors.dobRequired'));
      return false;
    }
    if (!sex) {
      setError(t('errors.sexRequired'));
      return false;
    }
    // Check age (must be 18+)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      setError(t('errors.mustBe18'));
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    const metadata: UserMetadata = {
      username,
      fullName: fullName || undefined,
      dateOfBirth: dateOfBirth,
      sex: sex as Sex,
      country: country || undefined,
      location: location || undefined,
    };

    const { error, needsEmailConfirmation } = await signUp(email, password, metadata);

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else if (needsEmailConfirmation) {
      setShowConfirmation(true);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  if (showConfirmation) {
    return (
      <div className="card card-elevated text-center" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="mb-4">
          <svg className="mx-auto" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-2xl mb-4">{t('auth.verifyEmail')}</h1>
        <p className="text-muted mb-6">{t('auth.checkEmail')}</p>
        <Link to="/login" className="btn btn-primary">
          {t('auth.signIn')}
        </Link>
      </div>
    );
  }

  // Calculate max date for DOB (18 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="card card-elevated" style={{ maxWidth: '440px', margin: '0 auto' }}>
      <h1 className="text-2xl mb-2">{t('auth.signUp')}</h1>
      <p className="text-muted text-sm mb-6">
        {step === 1 ? t('auth.step1of2') : t('auth.step2of2')}
      </p>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-primary' : 'bg-stone-200'}`} />
        <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-stone-200'}`} />
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit}>
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="mb-4">
              <label htmlFor="email" className="label">
                {t('auth.email')} *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="label">
                {t('auth.password')} *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted mt-1">{t('auth.passwordHint')}</p>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="label">
                {t('auth.confirmPassword')} *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              {t('common.next')}
            </button>
            {DEV_MODE && (
              <button type="button" className="btn btn-secondary w-full mt-3" onClick={fillRandomSignup}>
                {t('common.fillRandom')}
              </button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-4">
              <label htmlFor="username" className="label">
                {t('auth.username')} *
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="input"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                placeholder="your_username"
                autoComplete="username"
              />
              <p className="text-xs text-muted mt-1">{t('auth.usernameHint')}</p>
            </div>

            <div className="mb-4">
              <label htmlFor="fullName" className="label">
                {t('auth.fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                autoComplete="name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="dateOfBirth" className="label">
                {t('auth.dateOfBirth')} *
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="input"
                required
                max={maxDateStr}
              />
              <p className="text-xs text-muted mt-1">{t('auth.mustBe18')}</p>
            </div>

            <div className="mb-4">
              <label htmlFor="sex" className="label">
                {t('auth.sex')} *
              </label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="input"
                required
              >
                <option value="">{t('common.select')}</option>
                <option value="male">{t('auth.sexMale')}</option>
                <option value="female">{t('auth.sexFemale')}</option>
                <option value="other">{t('auth.sexOther')}</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="country" className="label">
                {t('auth.country')}
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input"
              >
                <option value="">{t('common.select')}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="location" className="label">
                {t('auth.location')}
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input"
                placeholder={t('auth.locationPlaceholder')}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handlePrevStep} className="btn btn-secondary flex-1">
                {t('common.back')}
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('auth.signUp')}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="divider" />

      <p className="text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-primary font-medium">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  );
}
