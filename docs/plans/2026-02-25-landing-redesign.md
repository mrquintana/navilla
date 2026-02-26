# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic corporate-blue landing page with a warm, editorial aesthetic — Fraunces serif headlines, a two-column hero with constellation network graphic, and coherent warm-indigo styling across all landing sections ("How it Works" + "Why it Feels Different" + bottom CTA).

**Architecture:** CSS variable additions scoped to landing page tokens, transparent-overlay header (sticky + negative margin trick), pure SVG constellation component, targeted style overrides on existing landing-section CSS classes.

**Tech Stack:** React 19, Vite, TypeScript, TailwindCSS + custom CSS, Vitest + React Testing Library

---

## Design Tokens

| Token | Value | Used for |
|-------|-------|----------|
| `--color-landing-bg` | `#f7f3ee` | Warm ivory hero + header on landing |
| `--color-landing-accent` | `#6366f1` | Warm indigo — replaces corporate blue on landing |
| `--color-landing-accent-dark` | `#4f46e5` | Hover/dark variant |
| `--color-landing-text` | `#1a1612` | Near-black warm title text |
| `--font-display` | `'Fraunces', Georgia, serif` | Display headlines |

---

## Task 1: Add Fraunces font + CSS design tokens

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css:1-37` (`:root` and `html` blocks)

### Step 1: Add Fraunces to `frontend/index.html`

Add the Fraunces variable font link **after** the existing Plus Jakarta Sans link (line 10):

```html
<!-- Display font: Fraunces — warm variable serif for landing headlines -->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900&display=swap" rel="stylesheet" />
```

Also update the theme-color meta tag from corporate blue to warm tone:
```html
<meta name="theme-color" content="#f7f3ee" />
```

### Step 2: Add CSS design tokens to `:root` in `frontend/src/index.css`

After the `--color-border-light` line (line 21), add:

```css
  /* Landing page design tokens */
  --color-landing-bg: #f7f3ee;
  --color-landing-accent: #6366f1;
  --color-landing-accent-dark: #4f46e5;
  --color-landing-text: #1a1612;
  --font-display: 'Fraunces', Georgia, serif;
```

### Step 3: Verify

```bash
cd frontend && npm run type-check
```
Expected: no errors (these are CSS-only changes)

---

## Task 2: Create ConstellationGraphic component + test

**Files:**
- Create: `frontend/src/components/landing/ConstellationGraphic.tsx`
- Create: `frontend/src/components/landing/ConstellationGraphic.test.tsx`

### Step 1: Write the failing test

`frontend/src/components/landing/ConstellationGraphic.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { ConstellationGraphic } from './ConstellationGraphic';

describe('ConstellationGraphic', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConstellationGraphic />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has aria-hidden to hide from screen readers', () => {
    const { container } = render(<ConstellationGraphic />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('accepts a className prop', () => {
    const { container } = render(<ConstellationGraphic className="hero-constellation" />);
    expect(container.querySelector('svg')?.classList.contains('hero-constellation')).toBe(true);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd frontend && npm test -- --run ConstellationGraphic
```
Expected: FAIL with "Cannot find module './ConstellationGraphic'"

### Step 3: Create `frontend/src/components/landing/ConstellationGraphic.tsx`

```tsx
interface ConstellationGraphicProps {
  className?: string;
}

export function ConstellationGraphic({ className }: ConstellationGraphicProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
    >
      {/* Connection lines */}
      <g stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.25">
        <line x1="90" y1="210" x2="170" y2="130" />
        <line x1="90" y1="210" x2="180" y2="290" />
        <line x1="170" y1="130" x2="270" y2="150" />
        <line x1="170" y1="130" x2="210" y2="210" />
        <line x1="180" y1="290" x2="210" y2="210" />
        <line x1="180" y1="290" x2="295" y2="310" />
        <line x1="210" y1="210" x2="270" y2="150" />
        <line x1="210" y1="210" x2="295" y2="310" />
        <line x1="270" y1="150" x2="340" y2="190" />
        <line x1="295" y1="310" x2="340" y2="190" />
        <line x1="340" y1="190" x2="210" y2="210" />
        <line x1="90" y1="210" x2="130" y2="105" />
        <line x1="130" y1="105" x2="170" y2="130" />
        <line x1="270" y1="150" x2="355" y2="108" />
        <line x1="295" y1="310" x2="360" y2="350" />
      </g>

      {/* Animated glow rings on primary nodes */}
      <circle cx="210" cy="210" r="22" fill="#6366f1" opacity="0.07" className="constellation-pulse" />
      <circle cx="90" cy="210" r="14" fill="#818cf8" opacity="0.06" className="constellation-pulse-delay" />
      <circle cx="340" cy="190" r="14" fill="#818cf8" opacity="0.05" className="constellation-pulse-delay-2" />

      {/* Primary hub node */}
      <circle cx="210" cy="210" r="9" fill="#6366f1" />

      {/* Secondary nodes */}
      <circle cx="90" cy="210" r="6.5" fill="#818cf8" />
      <circle cx="170" cy="130" r="5.5" fill="#a5b4fc" />
      <circle cx="180" cy="290" r="5.5" fill="#a5b4fc" />
      <circle cx="270" cy="150" r="7" fill="#818cf8" />
      <circle cx="295" cy="310" r="5" fill="#a5b4fc" />
      <circle cx="340" cy="190" r="6" fill="#a5b4fc" />

      {/* Tertiary nodes */}
      <circle cx="130" cy="105" r="4" fill="#c7d2fe" />
      <circle cx="355" cy="108" r="3.5" fill="#c7d2fe" />
      <circle cx="360" cy="350" r="3.5" fill="#c7d2fe" />
      <circle cx="55" cy="150" r="3" fill="#e0e7ff" />
      <circle cx="60" cy="320" r="2.5" fill="#e0e7ff" />
      <circle cx="380" cy="270" r="2.5" fill="#e0e7ff" />
    </svg>
  );
}
```

### Step 4: Add CSS animation to `frontend/src/index.css`

Add before the `/* Hero section */` comment (around line 405):

```css
/* ConstellationGraphic — breathing glow animation */
.constellation-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: constellation-breathe 3.5s ease-in-out infinite;
}

.constellation-pulse-delay {
  transform-box: fill-box;
  transform-origin: center;
  animation: constellation-breathe 3.5s ease-in-out 1.2s infinite;
}

.constellation-pulse-delay-2 {
  transform-box: fill-box;
  transform-origin: center;
  animation: constellation-breathe 3.5s ease-in-out 2.4s infinite;
}

@keyframes constellation-breathe {
  0%, 100% { transform: scale(1); opacity: 0.07; }
  50% { transform: scale(1.5); opacity: 0.13; }
}
```

### Step 5: Run test to verify it passes

```bash
cd frontend && npm test -- --run ConstellationGraphic
```
Expected: 3 tests PASS

### Step 6: Commit

```bash
cd frontend && git add src/components/landing/ConstellationGraphic.tsx src/components/landing/ConstellationGraphic.test.tsx src/index.css && git commit -m "feat: add ConstellationGraphic SVG component with animated glow"
```

---

## Task 3: Update Header — transparent overlay on landing page + scroll transition

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/layout/Header.test.tsx`
- Modify: `frontend/src/index.css` (add `.navbar--transparent` styles)

### Step 1: Write failing test for transparent header

Add a new describe block at the bottom of `frontend/src/components/layout/Header.test.tsx`:

```tsx
describe('Header — transparent landing variant', () => {
  beforeEach(() => {
    useAuthOptionalMock.mockReturnValue({ session: null, signOut: vi.fn() });
    useUserMock.mockReturnValue({ data: undefined });
    useQueryMock.mockReturnValue({ data: undefined });
  });

  it('has navbar--transparent class on landing page when not scrolled', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );
    expect(container.querySelector('header')?.classList.contains('navbar--transparent')).toBe(true);
  });

  it('does NOT have navbar--transparent class on non-landing pages', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/guides']}>
        <Header />
      </MemoryRouter>
    );
    expect(container.querySelector('header')?.classList.contains('navbar--transparent')).toBe(false);
  });
});
```

Note: The existing `renderHeader()` helper uses plain `<MemoryRouter>` without `initialEntries`, which defaults to `/`. Update tests in the first describe block that rely on `renderHeader()` to use `<MemoryRouter initialEntries={['/dashboard']}>` instead.

### Step 2: Run tests to verify they fail

```bash
cd frontend && npm test -- --run Header
```
Expected: new tests FAIL

### Step 3: Add CSS for transparent navbar variant

In `frontend/src/index.css`, after the `.navbar` block (after line ~918), add:

```css
/* Transparent navbar variant — landing page hero overlay */
.navbar--transparent {
  background: transparent;
  box-shadow: none;
  border-bottom-color: transparent;
  transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.navbar--transparent .navbar-logo-text {
  color: var(--color-landing-text);
}

.navbar--transparent .nav-link {
  color: #3d3730;
}

.navbar--transparent .nav-link:hover {
  color: var(--color-landing-accent);
  background-color: rgba(99, 102, 241, 0.08);
}
```

### Step 4: Update `frontend/src/components/layout/Header.tsx`

**Add these changes to the Header component:**

After line 18 (`const { pathname } = useLocation();`), add:

```tsx
  const isLanding = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll(); // set initial state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLanding]);
```

Update the `<header>` opening tag (line 68):

```tsx
    <header className={`navbar${isLanding && !scrolled ? ' navbar--transparent' : ' border-b border-border-light'}`}>
```

Update the logo span to include `navbar-logo-text` class (line 72):

```tsx
          <span className="text-2xl font-extrabold tracking-tight text-primary navbar-logo-text">
```

### Step 5: Run tests to verify they pass

```bash
cd frontend && npm test -- --run Header
```
Expected: all Header tests PASS (including the new transparent variant tests)

### Step 6: Commit

```bash
git add frontend/src/components/layout/Header.tsx frontend/src/components/layout/Header.test.tsx frontend/src/index.css && git commit -m "feat: transparent header overlay on landing page with scroll transition"
```

---

## Task 4: Update landing section CSS — warm editorial style

**Files:**
- Modify: `frontend/src/index.css` (hero, landing panels, feature cards, section headings)

This task has NO new tests — it's pure CSS. The existing visual checks happen in the manual review.

### Step 1: Replace hero CSS (lines 405–524)

Replace the entire `.hero` block and all `.hero-*` rules with:

```css
/* Hero section — warm editorial two-column layout */
.hero {
  background: var(--color-landing-bg);
  text-align: left;
  overflow: hidden;
  position: relative;
  /* Extends 60px behind the sticky header via negative margin */
  margin-top: -60px;
  padding-top: 60px;
}

.hero > .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  min-height: 88vh;
  padding-top: 3rem;
  padding-bottom: 4rem;
  position: relative;
  z-index: 1;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-constellation {
  width: 100%;
  max-width: 420px;
  height: auto;
  opacity: 0.9;
}

.hero-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-landing-accent);
  margin: 0 0 1.25rem;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 5vw, 4.25rem);
  font-weight: 700;
  font-optical-sizing: auto;
  color: var(--color-landing-text);
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 1rem;
}

.hero-subtitle {
  font-family: var(--font-display);
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  font-weight: 400;
  font-style: italic;
  color: var(--color-landing-accent);
  margin: 0 0 1.5rem;
  line-height: 1.4;
}

.hero-description {
  font-size: 1.0625rem;
  color: #4a4540;
  max-width: 460px;
  margin: 0 0 2.5rem;
  line-height: 1.75;
}

.hero-kicker {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 1rem;
}

.hero-note {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--color-muted);
}

/* Hero CTA group — left-aligned, single primary + subtle sign-in hint */
.hero-cta-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.875rem;
}

.hero-signin-hint {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0;
}

.hero-signin-link {
  color: var(--color-landing-accent);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}

.hero-signin-link:hover {
  opacity: 0.75;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .hero > .container {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 2rem;
    padding-bottom: 3rem;
    gap: 2.5rem;
  }

  .hero-copy {
    align-items: center;
    text-align: center;
  }

  .hero-cta-group {
    align-items: center;
  }

  .hero-description {
    max-width: 100%;
  }

  .hero-constellation {
    max-width: 280px;
  }
}
```

### Step 2: Update landing panel and feature card CSS — warm tones

Replace `.landing-panel` (line ~676):
```css
.landing-panel {
  background: #ffffff;
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 1rem;
  padding: 2.1rem;
  box-shadow: 0 8px 24px rgba(26, 22, 18, 0.06);
}

.landing-panel--steps {
  background: linear-gradient(160deg, #faf9f7 0%, #ffffff 100%);
}

.landing-panel--values {
  background: linear-gradient(160deg, #ffffff 0%, #faf7ff 100%);
}
```

Replace `.feature-card::before` stripe (line ~741):
```css
.feature-card::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.85), rgba(99, 102, 241, 0.25));
  border-radius: 1rem 1rem 0 0;
}
```

Replace `.feature-card:hover` border (line ~751):
```css
.feature-card:hover {
  border-color: rgba(99, 102, 241, 0.22);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1);
}
```

Replace `.feature-icon` color (line ~776):
```css
.feature-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-landing-accent);
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.14);
}
```

Replace `.feature-kicker` color (line ~768):
```css
.feature-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-landing-accent);
}
```

### Step 3: Add section heading font override

Add after `.landing-section + .landing-section` (line ~672):
```css
/* Landing section headings use display font for editorial warmth */
.landing-section h2 {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  letter-spacing: -0.02em;
}
```

### Step 4: Verify visually (no new tests — CSS only)

```bash
cd frontend && npm run build:full
```
Expected: builds cleanly, no type errors

### Step 5: Commit

```bash
git add frontend/src/index.css && git commit -m "feat: warm editorial CSS for landing hero, panels, and feature cards"
```

---

## Task 5: Rewrite HomePage — two-column hero + all landing sections in sync

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

### Step 1: No new test (existing page render tests would break if we ran them — there are none for HomePage, so skip)

### Step 2: Replace `frontend/src/pages/HomePage.tsx`

Full replacement (keep the same locale key references, only restructure JSX + add ConstellationGraphic):

```tsx
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../contexts/AuthContext';
import { Network, ShieldCheck, UserPlus, UserRoundCheck, Activity, LockKeyhole, ArrowRight } from 'lucide-react';
import { ConstellationGraphic } from '../components/landing/ConstellationGraphic';

export function HomePage() {
  const { t } = useTranslation();
  const session = useAuthOptional()?.session ?? null;

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <title>Navilla — Know your exposure risk, protect your privacy</title>
      <meta name="description" content="Navilla shows you anonymized health exposure signals from your trusted network. Numbers, not names. Your privacy is our priority." />
      <link rel="canonical" href="https://www.navilla.app/" />
      <meta property="og:url" content="https://www.navilla.app/" />
      <meta property="og:title" content="Navilla — Know your exposure risk, protect your privacy" />
      <meta property="og:description" content="Navilla shows you anonymized health exposure signals from your trusted network. Numbers, not names. Your privacy is our priority." />

      {/* Hero — warm ivory, two-column editorial */}
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <p className="hero-eyebrow">Sexual health, reimagined</p>
            <h1 className="hero-title">{t('common.appName')}</h1>
            <p className="hero-subtitle">{t('privacy.tagline')}</p>
            <p className="hero-description">{t('privacy.description')}</p>

            <div className="hero-cta-group">
              <Link to="/signup" className="btn btn-primary btn-lg">
                {t('landing.heroCta', 'Get started — it\'s free')}
              </Link>
              <p className="hero-signin-hint">
                {t('landing.heroSignInHint', 'Already have an account?')}{' '}
                <Link to="/login" className="hero-signin-link">
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <ConstellationGraphic className="hero-constellation" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-12 landing-section">
        <div className="landing-panel landing-panel--steps">
          <h2 className="text-center mb-6">{t('landing.howTitle')}</h2>
          <div className="landing-grid landing-grid--steps">
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">Step 1</span>
                <span className="feature-icon" aria-hidden="true">
                  <UserPlus className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepOneTitle')}</h3>
              <p>{t('landing.stepOneBody')}</p>
            </div>
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">Step 2</span>
                <span className="feature-icon" aria-hidden="true">
                  <UserRoundCheck className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepTwoTitle')}</h3>
              <p>{t('landing.stepTwoBody')}</p>
            </div>
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">Step 3</span>
                <span className="feature-icon" aria-hidden="true">
                  <Network className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepThreeTitle')}</h3>
              <p>{t('landing.stepThreeBody')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why it feels different */}
      <section className="container landing-section">
        <div className="landing-panel landing-panel--values">
          <h2 className="text-center mb-6">{t('landing.valueTitle')}</h2>
          <div className="landing-grid landing-grid--values">
            <div className="feature-card feature-card--value">
              <div className="feature-card-head feature-card-head--icon-only">
                <span className="feature-icon" aria-hidden="true">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.valueOneTitle')}</h3>
              <p>{t('landing.valueOneBody')}</p>
            </div>
            <div className="feature-card feature-card--value">
              <div className="feature-card-head feature-card-head--icon-only">
                <span className="feature-icon" aria-hidden="true">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.valueTwoTitle')}</h3>
              <p>{t('landing.valueTwoBody')}</p>
            </div>
            <div className="feature-card feature-card--value">
              <div className="feature-card-head feature-card-head--icon-only">
                <span className="feature-icon" aria-hidden="true">
                  <LockKeyhole className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.valueThreeTitle')}</h3>
              <p>{t('landing.valueThreeBody')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom conversion CTA */}
      <section className="container landing-section pb-16">
        <div className="landing-cta-section">
          <div className="landing-cta-left">
            <p className="landing-cta-eyebrow">
              {t('landing.ctaEyebrow', 'Free. Private. No judgment.')}
            </p>
            <h2 className="landing-cta-heading">
              {t('landing.ctaHeading', 'Your health deserves better tools.')}
            </h2>
            <p className="landing-cta-body">
              {t(
                'landing.ctaBody',
                'Track your testing history, log encounters, and see anonymized risk signals from your network — all without anyone knowing your name.'
              )}
            </p>
            <div className="landing-cta-actions">
              <Link to="/signup" className="btn landing-cta-btn">
                {t('landing.ctaButton', 'Create your free account')}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>
              <p className="landing-cta-fine-print">
                {t('landing.ctaFinePrint', 'No credit card. Delete any time.')}
              </p>
            </div>
          </div>
          <div className="landing-cta-right" aria-hidden="true">
            <div className="landing-cta-stat">
              <span className="landing-cta-stat-number">0</span>
              <span className="landing-cta-stat-label">
                {t('landing.ctaStatLabel', 'names shared. Ever.')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

Note: The `<section className="hero">` uses `hero > .container` CSS rule. Since we changed the hero to a CSS grid, the `container` div now serves as the grid wrapper. The `.hero-copy` and `.hero-visual` are direct children of `.container` (the grid). No extra wrapper div is needed.

### Step 3: Run lint + full build

```bash
cd frontend && npm run lint && npm run build:full
```
Expected: no errors, all prerender routes complete including `/`

### Step 4: Manual verification checklist

```
npm run dev
# Open http://localhost:5173/
# Check:
# [ ] Header is transparent (warm ivory hero bleeds through)
# [ ] Header transitions to white as you scroll past hero
# [ ] Two-column hero: copy on left, constellation on right
# [ ] Fraunces serif font on hero h1 and subtitle
# [ ] h2 section headings in "How it Works" and "Why it Feels Different" use Fraunces
# [ ] Feature card icon tops are warm indigo, not corporate blue
# [ ] Step kickers ("Step 1", "Step 2", "Step 3") in warm indigo, not gray
# [ ] Bottom dark navy CTA section still present and intact
# [ ] Mobile: single column, constellation below copy
# [ ] Scroll to /dashboard (other page): header returns to white immediately
```

### Step 5: Commit

```bash
git add frontend/src/pages/HomePage.tsx && git commit -m "feat: redesign landing page with warm editorial hero, constellation graphic, and cohesive section styling"
```

---

## Final Verification

```bash
cd frontend && npm run type-check && npm test && npm run build:full
```

All three must pass cleanly before marking complete.

---

## Commit Summary

By the end, 4 commits:
1. `feat: add ConstellationGraphic SVG component with animated glow`
2. `feat: transparent header overlay on landing page with scroll transition`
3. `feat: warm editorial CSS for landing hero, panels, and feature cards`
4. `feat: redesign landing page with warm editorial hero, constellation graphic, and cohesive section styling`

Then push: `git push`
