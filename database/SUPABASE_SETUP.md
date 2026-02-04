# Supabase Setup Guide

This guide walks you through setting up Supabase for Navilla.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `navilla` (or `navilla-staging` for staging)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be ready (takes ~2 minutes)

## 2. Get Project Credentials

Once the project is ready, go to **Settings > API** and note:

```
Project URL:     https://xxxxxxxxxxxx.supabase.co
anon (public):   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Go to **Settings > Database** and note:

```
Host:            db.xxxxxxxxxxxx.supabase.co
Database name:   postgres
Port:            5432
User:            postgres
Password:        [your database password]
```

## 3. Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for first setup)

1. Go to **SQL Editor** in Supabase dashboard
2. Copy contents of each migration file in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_row_level_security.sql`
   - `migrations/003_functions.sql`
   - `migrations/004_add_user_profile_columns.sql`
   - `migrations/004_user_enhancements.sql`
3. Run each one

### Option B: Using psql CLI

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres"

# Run migrations
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_row_level_security.sql
psql $DATABASE_URL -f migrations/003_functions.sql
psql $DATABASE_URL -f migrations/004_add_user_profile_columns.sql
psql $DATABASE_URL -f migrations/004_user_enhancements.sql
```

## 4. Configure Authentication

### Email Authentication (Required)

1. Go to **Authentication > Providers**
2. Email should be enabled by default
3. Configure:
   - **Confirm email**: Enabled
   - **Secure email change**: Enabled

### OAuth Providers (Optional)

For Google:
1. Go to **Authentication > Providers > Google**
2. Enable and add your Google OAuth credentials

For Apple:
1. Go to **Authentication > Providers > Apple**
2. Enable and add your Apple OAuth credentials

## 5. Configure Email Templates

Go to **Authentication > Email Templates** and customize:

- **Confirm signup**: Welcome email with verification link
- **Magic link**: Passwordless login
- **Change email**: Email change confirmation
- **Reset password**: Password reset link

## 6. Environment Variables

Create these environment files:

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Database (direct connection for backend)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres

# Application (used for encryption and hashing operations in the backend)
APP_SECRET=generate-a-long-random-string-here
ENCRYPTION_PEPPER=another-long-random-string-for-hashing
```

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=http://localhost:8080
```

## 7. Verify Setup

After running migrations, verify in Supabase dashboard:

1. **Table Editor**: Should see tables:
   - `users`
   - `connections`
   - `health_status`
   - `exposure_snapshots`
   - `notifications`

2. **Authentication**: Try creating a test user

3. **SQL Editor**: Run test query:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

## Security Checklist

- [ ] Database password is strong and stored securely
- [ ] `service_role` key is NEVER exposed to frontend
- [ ] RLS policies are enabled on all tables
- [ ] Email verification is required
- [ ] Rate limiting is configured (Settings > Auth > Rate Limits)

## Environments

For production, create a separate Supabase project with:
- Different credentials
- Production-appropriate rate limits
- Backup enabled (Pro plan)
