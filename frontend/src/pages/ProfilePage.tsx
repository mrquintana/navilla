import { useEffect, useMemo, useState } from 'react';
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
import { AtSign, Calendar, Eye, MapPin, Shield, Trash2, User, UserCircle2 } from 'lucide-react';

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
  const { data: profile } = useUser();
  const token = session?.access_token ?? '';
  const authUserId = session?.user?.id;

  const [form, setForm] = useState<UpdateProfileData>({
    displayName: '',
    fullName: '',
    username: '',
    sex: '',
    dateOfBirth: '',
    showAge: false,
    country: '',
    location: '',
    profileVisibility: 'PRIVATE',
    displayNamePublic: false,
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
  const isPublic = form.profileVisibility === 'PUBLIC';

  const fillRandomProfile = () => {
    const names = ['Ana', 'Luis', 'Carla', 'Mateo', 'Sofia', 'Diego', 'Lucia', 'Javier'];
    const surnames = ['Lopez', 'Garcia', 'Hernandez', 'Perez', 'Martinez', 'Santos', 'Diaz'];
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const fullName = `${name} ${surname}`;
    const displayName = `${name} ${surname.charAt(0)}.`;
    const username = `${name}${surname}`.toLowerCase();
    const sexes = ['male', 'female', 'other'];
    const visibilityOptions: UpdateProfileData['profileVisibility'][] = [
      'PRIVATE',
      'PUBLIC',
      'CONNECTIONS_ONLY',
    ];
    const randomCountry = countries[Math.floor(Math.random() * countries.length)]?.code ?? '';

    setForm({
      ...form,
      displayName,
      fullName,
      username: username.replace(/[^a-z0-9_]/g, ''),
      sex: sexes[Math.floor(Math.random() * sexes.length)],
      dateOfBirth: `19${80 + Math.floor(Math.random() * 20)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      showAge: Math.random() > 0.5,
      country: randomCountry,
      location: Math.random() > 0.5 ? 'Mexico City' : 'Austin, TX',
      profileVisibility: visibilityOptions[Math.floor(Math.random() * visibilityOptions.length)],
      displayNamePublic: Math.random() > 0.5,
      searchableByEmail: Math.random() > 0.5,
    });
  };

  const resetFormFromProfile = () => {
    if (!profile) {
      return;
    }
    setForm({
      displayName: profile.displayName ?? '',
      fullName: profile.fullName ?? '',
      username: profile.username ?? '',
      sex: profile.sex ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      showAge: profile.showAge ?? false,
      country: profile.country ?? '',
      location: profile.location ?? '',
      profileVisibility: profile.profileVisibility ?? 'PRIVATE',
      displayNamePublic: profile.displayNamePublic ?? false,
      searchableByEmail: profile.searchableByEmail ?? false,
      avatarKey: undefined,
      avatarThumbKey: undefined,
    });
  };

  useEffect(() => {
    resetFormFromProfile();
  }, [profile]);

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
    onError: (err: any) => {
      const message = err?.message || t('common.error');
      const details = err instanceof ApiError && Array.isArray((err.data as any)?.details)
        ? (err.data as any).details as string[]
        : [];
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
    onError: (err: any) => {
      setDeleteError(err?.message || t('common.error'));
    },
  });

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
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setMessage(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
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
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
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
            displayName: form.displayName?.trim() || undefined,
            fullName: form.fullName?.trim() || undefined,
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
                <p className="profile-detail-label">{t('auth.displayName')}</p>
                <p className="profile-detail-value">{profile?.displayName || '—'}</p>
              </div>
            </div>
            <div className="profile-detail">
              <User className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('auth.fullName')}</p>
                <p className="profile-detail-value">{profile?.fullName || '—'}</p>
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
            <div className="profile-detail">
              <Shield className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('profile.visibility')}</p>
                <p className="profile-detail-value">
                  {profile?.profileVisibility === 'PUBLIC' && t('profile.visibilityPublic')}
                  {profile?.profileVisibility === 'CONNECTIONS_ONLY' && t('profile.visibilityConnections')}
                  {profile?.profileVisibility === 'PRIVATE' && t('profile.visibilityPrivate')}
                </p>
              </div>
            </div>
            <div className="profile-detail">
              <Shield className="profile-detail-icon" aria-hidden="true" />
              <div>
                <p className="profile-detail-label">{t('profile.searchVisibility')}</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.profileVisibility !== 'PUBLIC' ? (
                    <span className="badge badge-warning text-xs">
                      {t('profile.searchNotAvailable')}
                    </span>
                  ) : profile?.displayNamePublic || profile?.searchableByEmail ? (
                    <>
                      {profile?.displayNamePublic && (
                        <span className="badge badge-success text-xs">
                          {t('profile.searchBadgeDisplay')}
                        </span>
                      )}
                      {profile?.searchableByEmail && (
                        <span className="badge badge-success text-xs">
                          {t('profile.searchBadgeEmail')}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="badge badge-warning text-xs">
                      {t('profile.searchDisabled')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="displayName">{t('auth.displayName')}</label>
                <input
                  id="displayName"
                  className="input"
                  value={form.displayName ?? ''}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="fullName">{t('auth.fullName')}</label>
                <input
                  id="fullName"
                  className="input"
                  value={form.fullName ?? ''}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
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
                />
              </div>
            </div>

            <h3 className="font-semibold pt-2">{t('profile.privacy')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="profileVisibility">{t('profile.visibility')}</label>
                <select
                  id="profileVisibility"
                  className="input"
                  value={form.profileVisibility ?? 'PRIVATE'}
                  onChange={(e) => {
                    const visibility = e.target.value;
                    setForm({
                      ...form,
                      profileVisibility: visibility,
                      displayNamePublic: visibility === 'PUBLIC' ? form.displayNamePublic : false,
                      searchableByEmail: visibility === 'PUBLIC' ? form.searchableByEmail : false,
                    });
                  }}
                >
                  <option value="PUBLIC">{t('profile.visibilityPublic')}</option>
                  <option value="CONNECTIONS_ONLY">{t('profile.visibilityConnections')}</option>
                  <option value="PRIVATE">{t('profile.visibilityPrivate')}</option>
                </select>
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="displayNamePublic"
                    type="checkbox"
                    checked={!!form.displayNamePublic && isPublic}
                    onChange={(e) => setForm({ ...form, displayNamePublic: e.target.checked })}
                    disabled={!isPublic}
                  />
                  <span>{t('profile.displayNamePublic')}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="searchableByEmail"
                    type="checkbox"
                    checked={!!form.searchableByEmail && isPublic}
                    onChange={(e) => setForm({ ...form, searchableByEmail: e.target.checked })}
                    disabled={!isPublic}
                  />
                  <span>{t('profile.searchableByEmail')}</span>
                </label>
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

      <div className="card card-elevated space-y-4">
        <h3 className="font-semibold">{t('settings.title')}</h3>
        <div>
          <label className="label" htmlFor="language">{t('settings.language')}</label>
          <LanguageSwitcher className="input" id="language" />
        </div>
        <div className="pt-2">
          <button className="btn btn-secondary" onClick={() => signOut()}>
            {t('auth.signOut')}
          </button>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
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
              />
            </div>
            {deleteError && <div className="alert alert-error">{deleteError}</div>}
            <div className="flex justify-end gap-3">
              <button
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
