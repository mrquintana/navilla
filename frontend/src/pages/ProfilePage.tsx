import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type UpdateProfileData } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { queryClient } from '../queryClient';

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
  const { session } = useAuth();
  const { data: profile } = useUser();
  const token = session?.access_token ?? '';

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
  const isPublic = form.profileVisibility === 'PUBLIC';

  useEffect(() => {
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
  }, [profile]);

  const avatarUrl = useMemo(() => profile?.avatarUrl || profile?.avatarThumbUrl, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => api.users.update(token, data),
    onSuccess: () => {
      setMessage(t('profile.saved'));
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (err: any) => {
      setError(err.message || t('common.error'));
      setMessage(null);
    },
  });

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    try {
      const avatarKey = `profiles/${profile.id}/profile.png`;
      const thumbKey = `profiles/${profile.id}/thumb.png`;
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
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('profile.title')}</h1>
        <p className="text-muted">{t('profile.subtitle')}</p>
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
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              disabled={uploading}
            />
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
        <h3 className="font-semibold">{t('profile.aboutYou')}</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t('auth.displayName')}</label>
            <input
              className="input"
              value={form.displayName ?? ''}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input
              className="input"
              value={form.fullName ?? ''}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t('auth.username')}</label>
            <input
              className="input"
              value={form.username ?? ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('auth.sex')}</label>
            <select
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
            <label className="label">{t('auth.dateOfBirth')}</label>
            <input
              type="date"
              className="input"
              value={form.dateOfBirth ?? ''}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={!!form.showAge}
              onChange={(e) => setForm({ ...form, showAge: e.target.checked })}
            />
            <span className="text-sm">{t('profile.showAge')}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t('auth.country')}</label>
            <input
              className="input"
              value={form.country ?? ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('auth.location')}</label>
            <input
              className="input"
              value={form.location ?? ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <h3 className="font-semibold pt-2">{t('profile.privacy')}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t('profile.visibility')}</label>
            <select
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
                type="checkbox"
                checked={!!form.displayNamePublic && isPublic}
                onChange={(e) => setForm({ ...form, displayNamePublic: e.target.checked })}
                disabled={!isPublic}
              />
              {t('profile.displayNamePublic')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.searchableByEmail && isPublic}
                onChange={(e) => setForm({ ...form, searchableByEmail: e.target.checked })}
                disabled={!isPublic}
              />
              {t('profile.searchableByEmail')}
            </label>
          </div>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t('common.loading') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
