import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, type UpdateProfileData } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { queryClient } from '../queryClient';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { countries } from '../lib/geolocation';
import { DEV_MODE } from '../lib/devMode';
import { AtSign, Bell, BellOff, Calendar, Eye, Globe, LogOut, MapPin, Settings, Shield, Trash2, User, UserCircle2 } from 'lucide-react';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';
import { useReciprocityStatus, useOptIn, useOptOut } from '../hooks/useReciprocity';
import { useReminderSettings, useUpdateReminderSettings } from '../hooks/useReminders';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ReminderSettingsModal } from '../components/reminders/ReminderSettingsModal';

const AVATAR_BUCKET = 'avatars';
const AVATAR_SIZE = 512;
const AVATAR_THUMB_SIZE = 128;

async function resizeImage(file: File, size: number): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  const minSide = Math.min(imageBitmap.width, imageBitmap.height);
  const sx = (imageBitmap.width - minSide) / 2;
  const sy = (imageBitmap.height - minSide) / 2;

  ctx.drawImage(imageBitmap, sx, sy, minSide, minSide, 0, 0, size, size);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
}

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUser();
  const token = session?.access_token ?? '';
  const authUserId = session?.user?.id;

  const [form, setForm] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
    username: '',
    sex: '',
    dateOfBirth: '',
    showAge: false,
    country: '',
    location: '',
    profileVisibility: 'PRIVATE',
    searchableByEmail: false,
    avatarKey: undefined,
    avatarThumbKey: undefined,
  });

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showDeleteModal) cancelDeleteRef.current?.focus();
  }, [showDeleteModal]);

  const fillRandomProfile = () => {
    const names = ['Ana', 'Luis', 'Carla', 'Mateo', 'Sofia', 'Diego', 'Lucia', 'Javier'];
    const surnames = ['Lopez', 'Garcia', 'Hernandez', 'Perez', 'Martinez', 'Santos', 'Diaz'];
    const firstName = names[Math.floor(Math.random() * names.length)];
    const lastName = surnames[Math.floor(Math.random() * surnames.length)];
    const username = `${firstName}${lastName}`.toLowerCase();
    const sexes = ['male', 'female', 'other'];
    const visibilityOptions: UpdateProfileData['profileVisibility'][] = [
      'PRIVATE',
      'PUBLIC',
      'CONNECTIONS_ONLY',
    ];
    const randomCountry = countries[Math.floor(Math.random() * countries.length)]?.code ?? '';

    setForm({
      ...form,
      firstName,
      lastName,
      username: username.replace(/[^a-z0-9_]/g, ''),
      sex: sexes[Math.floor(Math.random() * sexes.length)],
      dateOfBirth: `19${80 + Math.floor(Math.random() * 20)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      showAge: Math.random() > 0.5,
      country: randomCountry,
      location: Math.random() > 0.5 ? 'Mexico City' : 'Austin, TX',
      profileVisibility: visibilityOptions[Math.floor(Math.random() * visibilityOptions.length)],
      searchableByEmail: Math.random() > 0.5,
    });
  };

  const resetFormFromProfile = useCallback(() => {
    if (!profile) {
      return;
    }
    setForm({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      username: profile.username ?? '',
      sex: profile.sex ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      showAge: profile.showAge ?? false,
      country: profile.country ?? '',
      location: profile.location ?? '',
      profileVisibility: profile.profileVisibility ?? 'PRIVATE',
      searchableByEmail: profile.searchableByEmail ?? false,
      avatarKey: undefined,
      avatarThumbKey: undefined,
    });
  }, [profile]);

  useEffect(() => {
    resetFormFromProfile();
  }, [resetFormFromProfile]);

  const avatarUrl = useMemo(() => profile?.avatarUrl || profile?.avatarThumbUrl, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => api.users.update(token, data),
    onSuccess: () => {
      setMessage(t('profile.saved'));
      setError(null);
      setErrorDetails([]);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (err: Error) => {
      const message = err.message || t('common.error');
      const data = err instanceof ApiError ? (err.data as { details?: string[] } | null | undefined) : null;
      const details = Array.isArray(data?.details) ? data.details : [];
      setError(message);
      setErrorDetails(details);
      setMessage(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.users.delete(token),
    onSuccess: async () => {
      setShowDeleteModal(false);
      await signOut();
      navigate('/');
    },
    onError: (err: Error) => {
      setDeleteError(err.message || t('common.error'));
    },
  });

  if (profileLoading) {
    return (
      <PageSkeleton titleWidth="w-52" subtitleWidth="w-80" loadingLabel={t('common.loading')}>
        <div className="card card-elevated space-y-4">
          <SkeletonBlock className="h-5 w-36 rounded-full" />
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-20 w-20 rounded-full" />
            <SkeletonBlock className="h-9 w-44 rounded-full" />
          </div>
        </div>
        <div className="card card-elevated space-y-4">
          <SkeletonBlock className="h-5 w-40 rounded-full" />
          <SkeletonRows rows={6} />
        </div>
      </PageSkeleton>
    );
  }

  const handleAvatarUpload = async (file: File) => {
    if (!profile || !authUserId) return;
    setUploading(true);
    try {
      const avatarKey = `profiles/${authUserId}/profile.png`;
      const thumbKey = `profiles/${authUserId}/thumb.png`;
      const [avatarBlob, thumbBlob] = await Promise.all([
        resizeImage(file, AVATAR_SIZE),
        resizeImage(file, AVATAR_THUMB_SIZE),
      ]);

      const uploadAvatar = supabase.storage
        .from(AVATAR_BUCKET)
        .upload(avatarKey, avatarBlob, { upsert: true, contentType: 'image/png' });
      const uploadThumb = supabase.storage
        .from(AVATAR_BUCKET)
        .upload(thumbKey, thumbBlob, { upsert: true, contentType: 'image/png' });

      const [avatarResult, thumbResult] = await Promise.all([uploadAvatar, uploadThumb]);
      if (avatarResult.error || thumbResult.error) {
        throw new Error(avatarResult.error?.message || thumbResult.error?.message);
      }

      updateMutation.mutate({
        avatarKey,
        avatarThumbKey: thumbKey,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setMessage(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={t('profile.avatarAlt')} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-muted">{t('profile.noAvatar')}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('profile.title')}</h1>
          <p className="text-muted">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="card card-elevated">
        <h3 className="font-semibold mb-4">{t('profile.avatar')}</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={t('profile.avatarAlt')} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-muted">{t('profile.noAvatar')}</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="btn btn-secondary btn-sm cursor-pointer">
              {t('profile.choosePhoto')}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            {uploading && <p className="text-xs text-muted">{t('common.loading')}</p>}
          </div>
        </div>
      </div>

      <form
        className="card card-elevated space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned: UpdateProfileData = {
            ...form,
            firstName: form.firstName?.trim() || undefined,
            lastName: form.lastName?.trim() || undefined,
            username: form.username?.trim() || undefined,
            sex: form.sex?.trim() || undefined,
            dateOfBirth: form.dateOfBirth?.trim() || undefined,
            country: form.country?.trim() || undefined,
            location: form.location?.trim() || undefined,
          };
          updateMutation.mutate(cleaned);
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold">{t('profile.aboutYou')}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(true)}
              >
                {t('common.edit')}
              </button>
            ) : (
              <>
                {DEV_MODE && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={fillRandomProfile}
                  >
                    {t('common.fillRandom')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    resetFormFromProfile();
                    setIsEditing(false);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </>
            )}
          </div>
        </div>

        {!isEditing ? (
          <div className="profile-card-details profile-card-grid">
            <div className="profile-detail">
              <UserCircle2 className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.firstName')}</p>
                <p className="profile-detail-value">{profile?.firstName || '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <User className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.lastName')}</p>
                <p className="profile-detail-value">{profile?.lastName || '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <AtSign className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.username')}</p>
                <p className="profile-detail-value">{profile?.username ? `@${profile.username}` : '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <User className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.sex')}</p>
                <p className="profile-detail-value">{profile?.sex || '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <Calendar className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.dateOfBirth')}</p>
                <p className="profile-detail-value">{profile?.dateOfBirth || '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <Eye className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('profile.showAge')}</p>
                <p className="profile-detail-value">{profile?.showAge ? t('common.confirm') : t('common.cancel')}</p>
              </div>
            </div>
            <div className="profile-detail">
              <MapPin className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.country')}</p>
                <p className="profile-detail-value">{profile?.country || '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <MapPin className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.location')}</p>
                <p className="profile-detail-value">{profile?.location || '—'}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="firstName">{t('auth.firstName')}</label>
                <input
                  id="firstName"
                  className="input"
                  value={form.firstName ?? ''}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="label" htmlFor="lastName">{t('auth.lastName')}</label>
                <input
                  id="lastName"
                  className="input"
                  value={form.lastName ?? ''}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="username">{t('auth.username')}</label>
                <input
                  id="username"
                  className="input"
                  value={form.username ?? ''}
                  onChange={(e) => setForm({
                    ...form,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  })}
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
              <div>
                <label className="label" htmlFor="sex">{t('auth.sex')}</label>
                <select
                  id="sex"
                  className="input"
                  value={form.sex ?? ''}
                  onChange={(e) => setForm({ ...form, sex: e.target.value })}
                >
                  <option value="">{t('common.select')}</option>
                  <option value="male">{t('auth.sexMale')}</option>
                  <option value="female">{t('auth.sexFemale')}</option>
                  <option value="other">{t('auth.sexOther')}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="dateOfBirth">{t('auth.dateOfBirth')}</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="input"
                  value={form.dateOfBirth ?? ''}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="showAge"
                  type="checkbox"
                  checked={!!form.showAge}
                  onChange={(e) => setForm({ ...form, showAge: e.target.checked })}
                />
                <label className="text-sm" htmlFor="showAge">{t('profile.showAge')}</label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="country">{t('auth.country')}</label>
                <select
                  id="country"
                  className="input"
                  value={form.country ?? ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  <option value="">{t('common.select')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="location">{t('auth.location')}</label>
                <input
                  id="location"
                  className="input"
                  value={form.location ?? ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  maxLength={150}
                />
              </div>
            </div>

          </>
        )}

        {message && <div className="alert alert-success">{message}</div>}
      {error && (
        <div className="alert alert-error space-y-2">
          <div>{error}</div>
          {errorDetails.length > 0 && (
            <ul className="list-disc list-inside text-sm text-muted">
              {errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

        {isEditing && (
          <button className="btn btn-primary" type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner" aria-hidden="true" />
                {t('common.loading')}
              </span>
            ) : t('common.save')}
          </button>
        )}
      </form>

      <PreferencesSection />

      <div className="flex justify-center">
        <button
          type="button"
          className="btn btn-secondary inline-flex items-center gap-2"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          {t('auth.signOut')}
        </button>
      </div>

      <div className="card border-red-200 bg-red-50/50 space-y-4">
        <h3 className="font-semibold text-red-700">{t('settings.dangerZone')}</h3>
        <p className="text-sm text-red-600">{t('settings.dangerZoneDescription')}</p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteConfirmText('');
            setDeleteError(null);
          }}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          {t('settings.deleteAccount')}
        </button>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowDeleteModal(false); }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold text-red-700">{t('settings.deleteAccount')}</h3>
            <p className="text-sm text-muted">{t('settings.deleteAccountWarning')}</p>
            <div>
              <label className="label" htmlFor="deleteConfirm">
                {t('settings.deleteAccountTypeConfirm')}
              </label>
              <input
                id="deleteConfirm"
                className="input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                maxLength={50}
              />
            </div>
            {deleteError && <div className="alert alert-error">{deleteError}</div>}
            <div className="flex justify-end gap-3">
              <button
                ref={cancelDeleteRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteMutation.isPending}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? t('common.loading') : t('settings.deleteAccountConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreferencesSection() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';
  const { data: profile } = useUser();
  const { data: reciprocityStatus, isLoading: reciprocityLoading } = useReciprocityStatus();
  const optInMutation = useOptIn();
  const optOutMutation = useOptOut();
  const { data: reminderSettings, isLoading: reminderLoading } = useReminderSettings();
  const updateReminderMutation = useUpdateReminderSettings();
  const { isSupported: pushSupported, permission: pushPermission, isSubscribed: pushSubscribed, isLoading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const visibilityMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => api.users.update(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });

  const profileVisibility = profile?.profileVisibility ?? 'PRIVATE';
  const isPublic = profileVisibility === 'PUBLIC';

  const isLoading = reciprocityLoading || reminderLoading;

  return (
    <>
      <div className="card card-elevated space-y-5">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 className="font-semibold">{t('preferences.title')}</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="spinner" aria-label={t('common.loading')} />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {/* Exposure Network */}
            <div className="py-4 first:pt-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{t('reciprocity.title')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {t('preferences.exposureDescription')}
                    </p>
                  </div>
                </div>
                {reciprocityStatus && (
                  <div className="flex-shrink-0">
                    {reciprocityStatus.optedIn ? (
                      !showLeaveConfirm ? (
                        <button
                          type="button"
                          className="badge badge-success text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowLeaveConfirm(true)}
                          title={t('reciprocity.optOut')}
                        >
                          {t('preferences.active')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm text-xs"
                            onClick={() => setShowLeaveConfirm(false)}
                            disabled={optOutMutation.isPending}
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm text-xs text-white"
                            style={{ background: '#dc3545' }}
                            onClick={() => {
                              optOutMutation.mutate(undefined, {
                                onSuccess: () => setShowLeaveConfirm(false),
                              });
                            }}
                            disabled={optOutMutation.isPending}
                          >
                            {optOutMutation.isPending ? (
                              <span className="spinner" aria-hidden="true" />
                            ) : (
                              t('preferences.leave')
                            )}
                          </button>
                        </div>
                      )
                    ) : reciprocityStatus.cooldownDaysRemaining && reciprocityStatus.cooldownDaysRemaining > 0 ? (
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {t('reciprocity.cooldown', { days: reciprocityStatus.cooldownDaysRemaining })}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm text-xs"
                        onClick={() => optInMutation.mutate()}
                        disabled={optInMutation.isPending}
                      >
                        {optInMutation.isPending ? (
                          <span className="spinner" aria-hidden="true" />
                        ) : (
                          t('preferences.joinNetwork')
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Visibility */}
            <div className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 pt-1">
                  <Eye className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{t('profile.visibility')}</p>
                  </div>
                </div>
                <div className="segmented-control flex-shrink-0" role="radiogroup" aria-label={t('profile.visibility')}>
                  {(['PRIVATE', 'CONNECTIONS_ONLY', 'PUBLIC'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={profileVisibility === value}
                      className={`segmented-control-item${profileVisibility === value ? ' segmented-control-item--active' : ''}`}
                      onClick={() => {
                        if (profileVisibility === value) return;
                        visibilityMutation.mutate({
                          profileVisibility: value,
                          searchableByEmail: value === 'PUBLIC' ? (profile?.searchableByEmail ?? false) : false,
                        });
                      }}
                      disabled={visibilityMutation.isPending}
                    >
                      {value === 'PRIVATE' && (<><span className="sm:hidden">{t('profile.visibilityPrivateShort')}</span><span className="hidden sm:inline">{t('profile.visibilityPrivate')}</span></>)}
                      {value === 'CONNECTIONS_ONLY' && (<><span className="sm:hidden">{t('profile.visibilityConnectionsShort')}</span><span className="hidden sm:inline">{t('profile.visibilityConnections')}</span></>)}
                      {value === 'PUBLIC' && (<><span className="sm:hidden">{t('profile.visibilityPublicShort')}</span><span className="hidden sm:inline">{t('profile.visibilityPublic')}</span></>)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Visibility (only when public) */}
            {isPublic && (
              <div className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium">{t('profile.searchVisibility')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={!!profile?.searchableByEmail}
                        onChange={(e) => {
                          visibilityMutation.mutate({
                            profileVisibility: 'PUBLIC',
                            searchableByEmail: e.target.checked,
                          });
                        }}
                        disabled={visibilityMutation.isPending}
                        className="accent-indigo-600"
                      />
                      {t('profile.searchBadgeEmail')}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Push Notifications */}
            {pushSupported && (
              <div className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium">{t('reminders.pushNotifications')}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {t('reminders.pushDescription')}
                      </p>
                      {pushPermission === 'denied' && (
                        <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                          <BellOff className="w-3 h-3" aria-hidden="true" />
                          {t('reminders.pushBlocked')}
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushSubscribed}
                    disabled={pushLoading || pushPermission === 'denied'}
                    onChange={(e) => {
                      if (e.target.checked) pushSubscribe();
                      else pushUnsubscribe();
                    }}
                    className="accent-indigo-600 w-5 h-5 flex-shrink-0"
                  />
                </div>
              </div>
            )}

            {/* Email Digest */}
            <div className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{t('reminders.emailDigest')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {t('preferences.emailDigestDescription')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!!reminderSettings?.emailDigestEnabled}
                  onChange={(e) => {
                    if (!reminderSettings) return;
                    updateReminderMutation.mutate({
                      ...reminderSettings,
                      emailDigestEnabled: e.target.checked,
                      emailDigestDay: e.target.checked ? (reminderSettings.emailDigestDay ?? 'MONDAY') : null,
                    });
                  }}
                  disabled={updateReminderMutation.isPending}
                  className="accent-indigo-600 w-5 h-5 flex-shrink-0"
                />
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{t('reminders.settings')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {t('preferences.reminderSettingsDescription')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={() => setShowReminderModal(true)}
                >
                  {t('preferences.configure')}
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="py-4 last:pb-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{t('settings.language')}</p>
                  </div>
                </div>
                <LanguageSwitcher className="flex items-center text-sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      <ReminderSettingsModal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} />
    </>
  );
}
