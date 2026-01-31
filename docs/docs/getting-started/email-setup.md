---
sidebar_position: 4
title: Email Setup (SMTP)
---

# Email Setup (SendGrid SMTP)

Navilla uses Supabase Auth for authentication, which requires SMTP configuration for sending verification emails, password resets, and other transactional emails.

## Current Setup: SendGrid

We use **SendGrid** as our SMTP provider for transactional emails.

### Why SendGrid?
- Industry standard for transactional email
- Reliable delivery rates
- Free tier: 100 emails/day
- Good analytics and deliverability tools

## Configuration

### 1. SendGrid Account Setup

1. Create an account at [sendgrid.com](https://sendgrid.com)
2. Complete sender verification (verify your domain or single sender)
3. Create an API key:
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Select **Restricted Access**
   - Enable **Mail Send** → **Full Access**
   - Copy the API key (you won't see it again)

### 2. Supabase SMTP Configuration

In your Supabase Dashboard:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Enter the following:

| Field | Value |
|-------|-------|
| Host | `smtp.sendgrid.net` |
| Port | `587` |
| Username | `apikey` |
| Password | Your SendGrid API key |
| Sender email | `noreply@navilla.app` |
| Sender name | `Navilla` |

4. Click **Save**

### 3. Email Templates

Customize email templates in Supabase:
- **Authentication** → **Email Templates**

Available templates:
- **Confirm signup** - Email verification
- **Magic Link** - Passwordless login
- **Change Email Address** - Email change confirmation
- **Reset Password** - Password reset link

## Testing

After configuring SMTP:

1. Try signing up with a real email address
2. Check your inbox (and spam folder) for the verification email
3. Click the verification link to confirm it works

## Troubleshooting

### Emails not arriving?

1. **Check spam folder** - First delivery often goes to spam
2. **Verify sender domain** - SendGrid requires domain or sender verification
3. **Check SendGrid Activity** - Go to SendGrid → Activity to see email status
4. **Check Supabase logs** - Project Settings → Edge Functions → Logs

### For Development

If you want to skip email verification during development:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle OFF **"Confirm email"**

This allows users to sign in immediately without email verification.

## Alternative Providers

If SendGrid doesn't meet your needs, alternatives include:

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| [Resend](https://resend.com) | 3,000/month | Simplicity, modern DX |
| [Mailgun](https://mailgun.com) | 5,000/month (3 months) | High volume |
| [Amazon SES](https://aws.amazon.com/ses/) | 62,000/month (from EC2) | AWS users |
| [Postmark](https://postmarkapp.com) | 100/month | Deliverability focus |

## Security Notes

- Never commit API keys to the repository
- Store SendGrid API key in Supabase's secure SMTP settings only
- Use a dedicated sending domain for better deliverability
- Consider setting up SPF, DKIM, and DMARC records for your domain
