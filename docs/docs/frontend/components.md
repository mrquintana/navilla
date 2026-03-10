---
sidebar_position: 3
title: Components
---

# Frontend Components

## Layout Components

### Header (`components/layout/Header.tsx`)
Navigation header with auth-aware content:
- Shows "Navilla" wordmark with link to home (Fraunces font, `text-primary`)
- When logged in: Dashboard, Journal, Health Log, Insights, Network nav links; user avatar/email; Sign Out
- When logged out: Sign In and Sign Up buttons
- Transparent with white text on dark hero; warm off-white on app pages

### Layout (`components/layout/Layout.tsx`)
Main layout wrapper for all pages:
- Header component
- Main content area with `<Outlet />`
- `OfflineIndicator` (top amber bar when offline)
- `InstallPrompt` (PWA install banner, auth-only)
- `PwaUpdatePrompt` (new version available notification)
- `CookieNoticeBanner` (cookie consent, bottom-positioned)

### AuthLayout (`components/layout/AuthLayout.tsx`)
Centered layout for auth pages (login, signup, forgot/reset password):
- "Navilla" wordmark link at top
- Centered card container for forms

### Footer (`components/layout/Footer.tsx`)
Site footer with navigation links organized in columns:
- Product links (How It Works, Privacy, Security)
- Resources links
- Legal links (Terms, Privacy Policy, Cookie Policy)
- `LanguageSwitcher` component

### ContentPage (`components/layout/ContentPage.tsx`)
Reusable template for static content pages (About, Terms, Privacy, etc.):
- Props: `seoTitle`, `seoDescription`, `canonical`, `title`, `subtitle`, `lastUpdated`, `sections`, `footer`
- Renders `ContentSection[]` with heading, body (string or string[]), list, and note
- Back-to-home link with i18n
- Used by ~12 content pages

### Brand Wordmark Consistency
The `Navilla` wordmark uses the same style in every app surface:
- `text-2xl font-extrabold tracking-tight text-primary`
- Always uses `text-primary` (indigo-600) in nav/auth headers
- Never uses alternate weights (`font-semibold`/regular)

## Auth Components

### ProtectedRoute (`components/auth/ProtectedRoute.tsx`)
Route guard for protected pages:
- Shows loading state while checking auth
- Redirects to `/login` if not authenticated
- Preserves intended destination for redirect after login

## Journal Components

### JournalTimeline (`components/journal/JournalTimeline.tsx`)
Groups journal entries by month and renders them in a vertical timeline.
- **Props**: `entries: JournalEntry[]`, `onEdit`, `onDelete`, `deletingId`, `hidePartnerLink`, `hidePartnerName`
- Entries are expected pre-sorted newest-first from the API
- Month headers use locale-aware formatting

### JournalEntryCard (`components/journal/JournalEntryCard.tsx`)
Displays a single journal entry in the timeline.
- **Props**: `entry: JournalEntry`, `onEdit`, `onDelete`, `isDeleting`, `hidePartnerLink`, `hidePartnerName`
- Shows date, partner alias (clickable link to partner detail), encounter types, protection methods, custom fields
- Edit and delete action buttons

### JournalEntryModal (`components/journal/JournalEntryModal.tsx`)
Modal form for creating or editing a journal entry.
- **Props**: `isOpen`, `onClose`, `entry` (null = create mode), `onPromote`
- Date picker, partner selection (alias autocomplete from recent aliases + partner list), connection linking
- Encounter types and protection methods from catalog
- Custom fields with save-for-future template support
- Phone number field for phone matching
- Notes field

### JournalCalendar (`components/journal/JournalCalendar.tsx`)
Monthly calendar grid showing days with journal entries highlighted.
- **Props**: `entries: JournalEntry[]`, `currentMonth: Date`, `onDayClick`, `selectedDate`
- Pure presentational -- receives entries as props, no API calls
- Week starts on Monday (ISO / Mexico convention)
- Dot indicators on days with entries

### JournalEmptyState (`components/journal/JournalEmptyState.tsx`)
Empty state displayed when the journal has no entries.
- **Props**: `onAdd: () => void`
- Centered illustration with shield icon, title, description, and CTA button

### JournalPartnersTab (`components/journal/JournalPartnersTab.tsx`)
Tab content showing the list of journal partners.
- Uses `useJournalPartners` hook
- Renders `JournalPartnerCard` for each partner
- "Add Partner" button that opens `CreatePartnerModal`

### JournalPartnerCard (`components/journal/JournalPartnerCard.tsx`)
Displays a single partner with encounter summary.
- **Props**: `partner: JournalPartner`
- Shows alias, encounter count, last encounter date, connection link indicator
- Clickable -- navigates to `/journal/partner/:id`

### CreatePartnerModal (`components/journal/CreatePartnerModal.tsx`)
Modal form for creating a new journal partner.
- **Props**: `isOpen`, `onClose`
- Alias input (required) and notes textarea
- Uses `useCreatePartner` mutation

## Health Log Components

### HealthLogStats (`components/health-log/HealthLogStats.tsx`)
Summary statistics bar for the health log.
- **Props**: `summary: HealthLogSummary`
- Displays: days since last test (large number), tests this year, conditions covered (with percentage bar)

### ConditionCard (`components/health-log/ConditionCard.tsx`)
Card showing a single condition's latest test status.
- **Props**: `condition: ConditionSummary`
- Status badge (color-coded: NEGATIVE=info, POSITIVE=error, PENDING/INDETERMINATE=warning)
- Last test date, total test count
- Clickable -- navigates to `/health-log/:condition`

### LabPicker (`components/health-log/LabPicker.tsx`)
Lab selection dropdown with inline lab creation.
- **Props**: `selectedLabId`, `onSelect`, `onCreateNew`
- Lists user's saved labs from `useHealthLogLabs`
- Supports providers: CHOPO, SALUD_DIGNA, OTHER
- Inline form for creating new lab accounts with credentials

### TestVisitModal (`components/health-log/TestVisitModal.tsx`)
Multi-step modal for recording a test visit.
- **Props**: `isOpen`, `onClose`, `editVisit`
- Date picker, lab selection (via `LabPicker`), lab reference number
- Dynamic result rows: condition type (from catalog), status, result value, reference range
- Integrated lab verification flow (uses `useLabProviders`, `useLabVerify`, `useLabConfirm`)
- Uses `useCreateTestVisit` / `useUpdateTestVisit` mutations

## Lab Verification Components

### LabVerificationModal (`components/health/LabVerificationModal.tsx`)
Multi-step lab verification flow.
- **Props**: `visitId`, `onClose`, `onVerified`
- Step 1 (`select`): Choose lab provider from `useLabProviders`
- Step 2 (`credentials`): Enter provider-specific credentials
- Step 3 (`results`): Review fetched results and confirm
- Uses `useLabVerify` and `useLabConfirm` mutations
- Invalidates health-log and exposure caches on success

## Medication Components

### MedicationCard (`components/reminders/MedicationCard.tsx`)
Displays a single medication entry.
- **Props**: `medication: Medication`
- Shows type label, frequency, dosage, active/inactive state (dimmed when inactive)
- Includes inline `DoseLogButton` for quick dose logging
- Clickable -- navigates to `/health-log/medication/:id`

### MedicationModal (`components/reminders/MedicationModal.tsx`)
Modal form for creating or editing a medication.
- **Props**: `isOpen`, `onClose`, `medication` (null = create)
- Medication type selector (from catalog), name, dosage, start/end date, frequency, reminder time, notes
- Uses `useCreateMedication` / `useUpdateMedication` mutations

### DoseLogButton (`components/reminders/DoseLogButton.tsx`)
Quick action button to log today's medication dose.
- **Props**: `medicationId: string`
- Uses `useLogDose` mutation
- Shows checkmark animation after successful log

## Vaccination Components

### VaccinationSeriesCard (`components/reminders/VaccinationSeriesCard.tsx`)
Displays a vaccine series with completion progress.
- **Props**: `series: VaccineSeries`, `onLogDose`
- Shows vaccine type, dose progress (e.g., 2/3), next dose date, completion indicator
- "Log Dose" button when series is incomplete

### VaccinationModal (`components/reminders/VaccinationModal.tsx`)
Modal form for logging a vaccination dose.
- **Props**: `isOpen`, `onClose`, `existingSeries` (pre-fills type + auto-calculates next dose number)
- Vaccine type selector (from catalog), dose number, administered date, location, notes
- Uses `useCreateVaccination` mutation

## Reminder Components

### UpcomingReminders (`components/reminders/UpcomingReminders.tsx`)
Displays upcoming reminders for the next N days.
- Uses `useUpcomingReminders` hook
- Renders reminder cards with type icons (Pill, Syringe, ClipboardCheck)
- Relative time display (overdue, due today, due tomorrow, due in N days)
- Complete and snooze action buttons
- Settings gear icon opens `ReminderSettingsModal`

### ReminderSettingsModal (`components/reminders/ReminderSettingsModal.tsx`)
Modal for configuring notification preferences.
- Quiet hours (start/end time pickers)
- Email digest toggle + day-of-week selector
- Push notifications toggle with permission-denied warning
- Per-type toggles (testing, medication, vaccination)
- Uses `useReminderSettings` / `useUpdateReminderSettings`

## Onboarding Components

### OnboardingFlow (`components/onboarding/OnboardingFlow.tsx`)
3-step onboarding carousel shown to new users.
- **Props**: `onComplete: () => void`
- Steps: Health tracking (Heart), Reminders (Bell), Insights (BarChart3)
- Stores completion in `localStorage` (`navilla_onboarding_complete`)
- Next/finish navigation with step indicator dots

## Network / Constellation Components

### NetworkVisualizationHost (`components/network/NetworkVisualizationHost.tsx`)
Canvas host component for the visualization engine.
- **Props**: `engine: VisualizationEngine`, `data: NetworkData`, `className`
- Mounts the engine into a div ref on first render
- Updates engine data when `data` prop changes
- Cleans up engine on unmount

### ShareConstellationModal (`components/network/ShareConstellationModal.tsx`)
Modal for exporting the constellation visualization as a shareable image.
- **Props**: `isOpen`, `onClose`, `engine: VisualizationEngine`, `data: NetworkData`
- Identity picker: display name, username, full name, or anonymous
- Uses `engine.exportImage()` to generate image blob
- Download and native share (Web Share API) buttons
- Uses `useUser` to populate identity options from profile fields only (no free text)

## Reciprocity Components

### ReciprocityOptInCard (`components/reciprocity/ReciprocityOptInCard.tsx`)
Card for managing reciprocity opt-in status.
- Uses `useReciprocityStatus`, `useOptIn`, `useOptOut` hooks
- Three states: opted in (green check, leave button), opted out with cooldown (clock + days remaining), opted out (opt-in button)
- Leave confirmation dialog before opting out

## Landing Page Components

### ConstellationGraphic (`components/landing/ConstellationGraphic.tsx`)
Decorative SVG constellation graphic for the landing page hero section.
- **Props**: `className`
- Static SVG with animated gradient lines and node dots
- `aria-hidden="true"` (purely decorative)

## Layer 0 Components

### FactChips (`components/layer0/FactChips.tsx`)
Displays fact chips (type, transmission) for STI guide pages.
- **Props**: `facts: STIContent['facts']`
- Color-coded by type: bacterial, viral, parasitic

### SignUpCTA (`components/layer0/SignUpCTA.tsx`)
Sign-up call-to-action banner for Layer 0 public pages.
- **Props**: `titleEn`, `titleEs`, `bodyEn`, `bodyEs`
- Hidden when user is already authenticated
- Bilingual title and body text

## Privacy Components

### CookieNoticeBanner (`components/privacy/CookieNoticeBanner.tsx`)
Cookie consent banner displayed at bottom of page.
- Stores acknowledgment in localStorage (`navilla_cookie_notice_ack_v1`)
- Link to cookie policy page
- Accept button dismisses permanently

## PWA Components

### InstallPrompt (`components/pwa/InstallPrompt.tsx`)
PWA install banner for authenticated users:
- Captures `beforeinstallprompt` event via `usePwaInstall` hook
- Indigo accent, bottom-positioned banner
- 7-day dismiss stored in localStorage

### OfflineIndicator (`components/pwa/OfflineIndicator.tsx`)
Amber top bar when device is offline:
- Listens to `online`/`offline` events
- Auto-hides when connection restored

### PwaUpdatePrompt (`components/pwa/PwaUpdatePrompt.tsx`)
New version notification:
- Uses `useRegisterSW` from `virtual:pwa-register/react`
- Update button sends `SKIP_WAITING` to service worker

## UI Components

### LoadingShell (`components/ui/LoadingShell.tsx`)
Collection of skeleton loading components:
- `SkeletonBlock` -- single animated skeleton block
- `SkeletonRows` -- multiple skeleton rows
- `PageSkeleton` -- full page skeleton with title + subtitle + rows
- `FullPageLoader` -- centered spinner for route-level Suspense fallback

### Toast (`components/ui/Toast.tsx`)
Toast notification renderer:
- Consumes `useToast()` from `ToastContext`
- Three types: `success` (green), `error` (red), `info` (indigo)
- Icons: CheckCircle, AlertCircle, Info
- Dismiss button on each toast
- Auto-dismiss after 4 seconds

### LanguageSwitcher (`components/LanguageSwitcher.tsx`)
Language toggle between English and Spanish:
- Stores selection in localStorage (`navilla_language`)
- Uses `i18n.changeLanguage()` from react-i18next

## Component Patterns

### i18n
All UI text uses `useTranslation` hook:
```tsx
const { t } = useTranslation();
return <button>{t('auth.signIn')}</button>;
```

### Styling
Components use Tailwind utilities and predefined CSS classes:
- `.btn` -- Base button styles
- `.btn-primary` -- Primary action button
- `.btn-secondary` -- Secondary action button
- `.card` / `.card-elevated` -- Card containers
- `.input` -- Form input
- `.badge` / `.badge-info` / `.badge-error` / `.badge-warning` -- Status badges
- `.journal-entry-card` -- Journal/medication card style
- `.skeleton` -- Loading skeleton animation
- `.spinner` -- Loading spinner

### Auth State
Components access auth via `useAuth` hook:
```tsx
const { session, user, signOut, isLoading } = useAuth();
```

### Toast Notifications
Components display feedback via `useToast` hook:
```tsx
const { addToast } = useToast();
addToast('success', t('medication.saved'));
addToast('error', t('common.error'));
```

### Modal Pattern
Most modals follow the same pattern:
- `isOpen` / `onClose` props
- `createPortal` to `document.body`
- Backdrop click and Escape key close
- Form reset on open via `useEffect`
- Loading/error state management
