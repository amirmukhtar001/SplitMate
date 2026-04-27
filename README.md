# Smart Udhaar

## Backend without separate deployment (Supabase)

This app now supports a managed backend using Supabase, with no separate Node/Express deployment required.

- If Supabase env vars are configured, loan data syncs with Supabase.
- If not configured (or network fails), the app falls back to local AsyncStorage.

### 1) Create Supabase project

Create a new project at [Supabase](https://supabase.com/).

### 2) Create loans table

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

### 3) Configure env variables

Copy `.env.example` to `.env` and fill in your project values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4) Restart Expo

After changing env values, restart Metro:

```bash
npx expo start -c
```

## Email OTP (Supabase Auth)

This app includes an email sign-in screen using Supabase OTP.

Enable OTP in Supabase:

1. Open Supabase Dashboard -> Authentication -> Providers.
2. Enable Email provider.
3. Save settings.

App flow:
- Language select -> Email -> OTP verify -> Home

Template requirement for OTP emails:

- In Supabase templates, use `{{ .Token }}` (do not use `{{ .ConfirmationURL }}`) in both:
  - `Magic Link`
  - `Confirm signup`

The app also supports pasting a full verification URL (with `token_hash`) as a fallback.

## Legal and store release

- Privacy policy file: `docs/privacy-policy.md`
- Release checklist: `docs/store-release-checklist.md`
- In-app legal screen: `Legal & Support` quick action on Home

Before store submission, host privacy policy at a public HTTPS URL and update:

- `src/config/appMeta.js` (`supportEmail`, `privacyPolicyUrl`)
- `src/config/appMeta.js` (`accountDeletionUrl`)
- `app.json` -> `expo.extra.privacyPolicyUrl`, `expo.extra.accountDeletionUrl`

## Notes

- Supabase integration is handled inside `src/storage/loanStorage.js`.
- Client setup is in `src/lib/supabaseClient.js`.
- No backend server deployment is required.
# SplitMate
