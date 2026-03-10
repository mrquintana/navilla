---
sidebar_position: 2
title: Project Structure
---

# Frontend Project Structure

## Directory Layout

```
frontend/
├── src/
│   ├── main.tsx              # App entry point (renders App)
│   ├── App.tsx               # Root component with providers
│   ├── App.css               # App-level CSS
│   ├── router.tsx            # React Router v7 configuration (all routes)
│   ├── queryClient.ts        # TanStack Query client setup
│   ├── i18n.ts               # i18n configuration (react-i18next)
│   ├── index.css             # TailwindCSS global styles
│   ├── sw.ts                 # Custom service worker (Workbox + push)
│   │
│   ├── lib/
│   │   ├── api.ts            # Centralized API client (16 namespaces)
│   │   ├── supabase.ts       # Supabase client initialization
│   │   ├── pushNotifications.ts  # Push subscription utilities
│   │   ├── notifications.ts  # Notification helpers
│   │   ├── conditionInfo.ts  # Condition display helpers
│   │   ├── stiContent.ts     # STI educational content data
│   │   ├── renderMarkdown.tsx    # Markdown rendering utility
│   │   ├── structuredData.ts # JSON-LD structured data for SEO
│   │   ├── geolocation.ts    # Geolocation utilities
│   │   ├── env.ts            # Environment variable helper
│   │   ├── devMode.ts        # Dev mode detection utility
│   │   ├── e2eMocks.ts       # E2E test mock data
│   │   └── visualization/    # Network constellation visualization
│   │       ├── index.ts      # Engine exports + active engine selector
│   │       ├── types.ts      # VisualizationEngine interface + NetworkData
│   │       └── engines/
│   │           └── canvas2d/
│   │               └── Canvas2DEngine.ts  # Canvas 2D rendering engine
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Auth state management (Supabase)
│   │   └── ToastContext.tsx   # Toast notification state
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook (re-export from AuthContext)
│   │   ├── useUser.ts              # User profile query
│   │   ├── useCatalog.ts           # Catalog, conditions, network stages
│   │   ├── useJournal.ts           # Journal entries, partners, templates
│   │   ├── useHealthLog.ts         # Test visits, labs, condition history
│   │   ├── useMedications.ts       # Medications, dose logging, PrEP streak
│   │   ├── useVaccinations.ts      # Vaccination series + doses
│   │   ├── useReminders.ts         # Reminders + settings
│   │   ├── useInsights.ts          # Personal insights dashboard
│   │   ├── useReciprocity.ts       # Reciprocity opt-in/out
│   │   ├── useNetworkVisualization.ts  # Network data + stage resolution
│   │   ├── usePhoneMatch.ts        # Phone match notifications
│   │   ├── useLabProviders.ts      # Lab provider config
│   │   ├── useLabVerification.ts   # Lab verify + confirm mutations
│   │   ├── useSymptomFilter.ts     # Symptom filter for Layer 0 guides
│   │   ├── usePushNotifications.ts # Push permission + subscribe/unsubscribe
│   │   └── usePwaInstall.ts        # PWA install prompt management
│   │
│   ├── components/
│   │   ├── LanguageSwitcher.tsx     # Language toggle (en_US / es_MX)
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx  # Route guard (redirects to /login)
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Nav with auth state
│   │   │   ├── Layout.tsx          # Main layout + PWA + Cookie banner
│   │   │   ├── AuthLayout.tsx      # Centered auth pages layout
│   │   │   ├── Footer.tsx          # Site footer with nav links
│   │   │   └── ContentPage.tsx     # Reusable content page template (SEO)
│   │   ├── journal/
│   │   │   ├── JournalTimeline.tsx      # Month-grouped entry timeline
│   │   │   ├── JournalEntryCard.tsx     # Single journal entry display
│   │   │   ├── JournalEntryModal.tsx    # Create/edit entry form modal
│   │   │   ├── JournalCalendar.tsx      # Monthly calendar grid
│   │   │   ├── JournalEmptyState.tsx    # Empty state for journal
│   │   │   ├── JournalPartnersTab.tsx   # Partner list with add button
│   │   │   ├── JournalPartnerCard.tsx   # Single partner card
│   │   │   └── CreatePartnerModal.tsx   # New partner creation modal
│   │   ├── health-log/
│   │   │   ├── HealthLogStats.tsx       # Summary stats bar
│   │   │   ├── ConditionCard.tsx        # Single condition status card
│   │   │   ├── LabPicker.tsx            # Lab selection + inline creation
│   │   │   └── TestVisitModal.tsx       # Create/edit test visit modal (with lab verification)
│   │   ├── health/
│   │   │   └── LabVerificationModal.tsx # Multi-step lab verification flow
│   │   ├── reminders/
│   │   │   ├── MedicationCard.tsx           # Medication display card
│   │   │   ├── MedicationModal.tsx          # Create/edit medication modal
│   │   │   ├── DoseLogButton.tsx            # Quick dose logging button
│   │   │   ├── VaccinationSeriesCard.tsx    # Vaccine series progress card
│   │   │   ├── VaccinationModal.tsx         # Log vaccination dose modal
│   │   │   ├── UpcomingReminders.tsx        # Upcoming reminders list
│   │   │   └── ReminderSettingsModal.tsx    # Notification preferences modal
│   │   ├── onboarding/
│   │   │   └── OnboardingFlow.tsx      # 3-step onboarding carousel
│   │   ├── network/
│   │   │   ├── NetworkVisualizationHost.tsx  # Canvas host for visualization engine
│   │   │   └── ShareConstellationModal.tsx   # Share card export with identity picker
│   │   ├── reciprocity/
│   │   │   └── ReciprocityOptInCard.tsx # Opt-in/out card with cooldown display
│   │   ├── landing/
│   │   │   └── ConstellationGraphic.tsx # SVG constellation for landing hero
│   │   ├── layer0/
│   │   │   ├── FactChips.tsx           # STI type/transmission fact chips
│   │   │   └── SignUpCTA.tsx           # Sign-up call-to-action banner
│   │   ├── privacy/
│   │   │   └── CookieNoticeBanner.tsx  # Cookie consent banner
│   │   ├── pwa/
│   │   │   ├── InstallPrompt.tsx       # PWA install banner
│   │   │   ├── OfflineIndicator.tsx    # Offline status bar
│   │   │   └── PwaUpdatePrompt.tsx     # App update notification
│   │   └── ui/
│   │       ├── LoadingShell.tsx         # Skeleton loaders + full-page loader
│   │       └── Toast.tsx               # Toast notification renderer
│   │
│   ├── pages/                          # 37 page components
│   │   ├── HomePage.tsx                # Landing page
│   │   ├── LoginPage.tsx               # Login form
│   │   ├── SignUpPage.tsx              # Registration form
│   │   ├── ForgotPasswordPage.tsx      # Forgot password form
│   │   ├── ResetPasswordPage.tsx       # Reset password form
│   │   ├── DashboardPage.tsx           # Protected dashboard
│   │   ├── JournalPage.tsx             # Encounter journal (calendar + timeline + partners)
│   │   ├── PartnerDetailPage.tsx       # Partner detail + encounter history
│   │   ├── HealthLogPage.tsx           # Health log (visits, meds, vaccines, reminders)
│   │   ├── ConditionDetailPage.tsx     # Condition history timeline
│   │   ├── MedicationDetailPage.tsx    # Medication detail + adherence chart
│   │   ├── HealthStatusPage.tsx        # Health status management
│   │   ├── ConnectionsPage.tsx         # Connection management
│   │   ├── ProfilePage.tsx             # Profile + preferences
│   │   ├── NotificationsPage.tsx       # Push + email notification preferences
│   │   ├── InsightsPage.tsx            # Personal insights dashboard
│   │   ├── NetworkPage.tsx             # Network constellation visualization
│   │   ├── HowItWorksPage.tsx          # Product explanation (public)
│   │   ├── WindowPeriodCalculatorPage.tsx  # Window period calculator (Layer 0)
│   │   ├── GuidesIndexPage.tsx         # STI guides index (Layer 0)
│   │   ├── GuideDetailPage.tsx         # Individual STI guide (Layer 0)
│   │   ├── TestingCostPage.tsx         # Testing cost estimator (Layer 0)
│   │   ├── InfoPage.tsx                # General info page
│   │   ├── AboutPage.tsx               # About us
│   │   ├── ContactPage.tsx             # Contact info
│   │   ├── CareersPage.tsx             # Careers page
│   │   ├── PrivacyPage.tsx             # Privacy overview
│   │   ├── PrivacyPolicyPage.tsx       # Full privacy policy
│   │   ├── SecurityPage.tsx            # Security overview
│   │   ├── TermsPage.tsx               # Terms of service
│   │   ├── CookiePolicyPage.tsx        # Cookie policy
│   │   ├── HelpPage.tsx                # Help / FAQ
│   │   ├── StatusPage.tsx              # Service status
│   │   ├── AccessibilityPage.tsx       # Accessibility statement
│   │   ├── ErrorPage.tsx               # Error boundary page
│   │   └── NotFoundPage.tsx            # 404 page
│   │
│   ├── types/
│   │   ├── catalog.ts           # ConditionCatalogItem, NetworkStage
│   │   ├── reciprocity.ts       # ReciprocityStatus
│   │   ├── phoneMatch.ts        # PhoneMatchNotification
│   │   └── lab.ts               # LabProviderConfig, LabVerifyRequest/Response, LabConfirmRequest
│   │
│   ├── locales/
│   │   ├── en_US.json           # English translations
│   │   └── es_MX.json           # Spanish translations
│   │
│   ├── test/                    # Test setup/utilities
│   └── assets/                  # Static assets
│
├── e2e/                         # Playwright E2E tests
├── scripts/
│   └── prerender.ts             # SSR pre-rendering script (25 routes)
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── playwright.config.ts
└── package.json
```

## Key Files

### App.tsx
The root component that sets up all providers:
- `QueryClientProvider` -- TanStack Query for server state
- `AuthProvider` -- Supabase auth context
- `ToastProvider` -- Toast notification context
- `Suspense` -- Loading fallback with `FullPageLoader`
- `ToastContainer` -- Renders active toasts
- `RouterProvider` -- React Router v7

### router.tsx
Configures all application routes with lazy-loaded page components. All route-level pages are code-split via `React.lazy()`.

### Visualization Lib (`lib/visualization/`)
Pluggable engine architecture for the network constellation visualization. The `VisualizationEngine` interface defines `mount()`, `update()`, `exportImage()`, and `destroy()`. Swap engines by changing one line in `index.ts`. Currently ships with `Canvas2DEngine`.

## Route Table

### Auth Layout Routes (centered card layout)

| Path | Page | Auth |
|------|------|------|
| `/login` | LoginPage | No |
| `/signup` | SignUpPage | No |
| `/forgot-password` | ForgotPasswordPage | No |
| `/reset-password` | ResetPasswordPage | No |

### Main Layout Routes

| Path | Page | Auth | Description |
|------|------|------|-------------|
| `/` | HomePage | No | Landing page |
| `/dashboard` | DashboardPage | Yes | User dashboard |
| `/journal` | JournalPage | Yes | Encounter journal |
| `/journal/partner/:id` | PartnerDetailPage | Yes | Partner detail view |
| `/connections` | ConnectionsPage | Yes | Connection management |
| `/profile` | ProfilePage | Yes | Profile + preferences |
| `/health-log` | HealthLogPage | Yes | Health log hub |
| `/health-log/medication/:id` | MedicationDetailPage | Yes | Medication detail + adherence |
| `/health-log/:condition` | ConditionDetailPage | Yes | Condition test history |
| `/health` | -- | -- | Redirect to `/health-log` |
| `/notifications` | NotificationsPage | Yes | Notification preferences |
| `/insights` | InsightsPage | Yes | Personal insights |
| `/network` | NetworkPage | Yes | Network constellation |
| `/calculator` | WindowPeriodCalculatorPage | No | Window period calculator (Layer 0) |
| `/guides` | GuidesIndexPage | No | STI guides index (Layer 0) |
| `/guide/:slug` | GuideDetailPage | No | Individual STI guide (Layer 0) |
| `/testing-cost` | TestingCostPage | No | Testing cost estimator (Layer 0) |
| `/how-it-works` | HowItWorksPage | No | Product explanation |
| `/about` | AboutPage | No | About page |
| `/contact` | ContactPage | No | Contact info |
| `/careers` | CareersPage | No | Careers page |
| `/privacy` | PrivacyPage | No | Privacy overview |
| `/security` | SecurityPage | No | Security overview |
| `/terms` | TermsPage | No | Terms of service |
| `/privacy-policy` | PrivacyPolicyPage | No | Full privacy policy |
| `/cookie-policy` | CookiePolicyPage | No | Cookie policy |
| `/help` | HelpPage | No | Help / FAQ |
| `/status` | StatusPage | No | Service status |
| `/accessibility` | AccessibilityPage | No | Accessibility statement |
| `*` | NotFoundPage | No | 404 page |

## Hooks Reference (17 hook files)

| Hook File | Exported Hooks |
|-----------|---------------|
| `useAuth.ts` | `useAuth` -- re-export from AuthContext |
| `useUser.ts` | `useUser` -- user profile query |
| `useCatalog.ts` | `useCatalog`, `useConditionCatalog`, `useNetworkStages` |
| `useJournal.ts` | `useJournalEntries`, `useJournalSummary`, `useJournalTemplates`, `useCreateJournalEntry`, `useUpdateJournalEntry`, `useDeleteJournalEntry`, `useSaveJournalTemplates`, `useJournalPartners`, `useJournalPartner`, `useJournalPartnerEntries`, `useRecentAliases`, `useCreatePartner`, `useUpdatePartner`, `useDeletePartner`, `usePromoteAlias` |
| `useHealthLog.ts` | `useHealthLogSummary`, `useHealthLogVisits`, `useHealthLogVisit`, `useConditionHistory`, `useHealthLogLabs`, `useCreateTestVisit`, `useUpdateTestVisit`, `useDeleteTestVisit`, `useCreateLab`, `useUpdateLab`, `useDeleteLab` |
| `useMedications.ts` | `useMedications`, `useMedication`, `useCreateMedication`, `useUpdateMedication`, `useDeleteMedication`, `useLogDose`, `useAdherence`, `usePrepStreak` |
| `useVaccinations.ts` | `useVaccinations`, `useCreateVaccination`, `useUpdateVaccination`, `useDeleteVaccination` |
| `useReminders.ts` | `useReminders`, `useUpcomingReminders`, `useSnoozeReminder`, `useCompleteReminder`, `useToggleReminder`, `useDeleteReminder`, `useReminderSettings`, `useUpdateReminderSettings` |
| `useInsights.ts` | `useInsights` |
| `useReciprocity.ts` | `useReciprocityStatus`, `useOptIn`, `useOptOut` |
| `useNetworkVisualization.ts` | `useNetworkVisualization` |
| `usePhoneMatch.ts` | `usePendingPhoneMatches`, `useConfirmPhoneMatch`, `useDenyPhoneMatch`, `useBlockPhoneNumber` |
| `useLabProviders.ts` | `useLabProviders` |
| `useLabVerification.ts` | `useLabVerify`, `useLabConfirm` |
| `useSymptomFilter.ts` | `useSymptomFilter` (+ pure helpers: `computeMatchCounts`, `computeVisibleSlugs`, `computeAvailableSymptoms`) |
| `usePushNotifications.ts` | `usePushNotifications` |
| `usePwaInstall.ts` | `usePwaInstall` |

## Type Files

| File | Types |
|------|-------|
| `types/catalog.ts` | `ConditionCatalogItem`, `NetworkStage` |
| `types/reciprocity.ts` | `ReciprocityStatus` |
| `types/phoneMatch.ts` | `PhoneMatchNotification` |
| `types/lab.ts` | `LabProviderConfig`, `LabFieldConfig`, `LabTestResultDto`, `LabVerifyRequest`, `LabVerifyResponse`, `LabConfirmRequest` |

Most API response types are co-located in `lib/api.ts` and re-exported from their respective hooks.

## Contexts

| Context | Provides |
|---------|----------|
| `AuthContext` | `session`, `user`, `isLoading`, `signIn`, `signUp`, `signOut` |
| `ToastContext` | `toasts`, `addToast`, `removeToast` |
