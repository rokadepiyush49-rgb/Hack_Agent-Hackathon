<<<<<<< HEAD
# BoardroomAI — Frontend

An AI-powered virtual board of directors. Founders pitch; a panel of AI
executives (CEO, CTO, CFO, CMO, VC, Legal, Research, Growth agents) debates
and produces an investment decision, SWOT, market research, financials, a
pitch deck, a roadmap, a PRD, and an executive report. **Frontend only** —
every screen runs on realistic mock data; there is no backend, auth, or
live AI call anywhere in this repo.

## Getting started

```bash
npm install
npm run dev
```

Visit `/` for the landing page, `/dashboard` for the signed-in app shell.
Every route below is live and navigable — none are placeholders.

## Routes

**Marketing** (`components/layout/marketing-navbar.tsx` + `footer.tsx`):
- `/` — Landing (hero, how it works, executives, features, testimonials, pricing, FAQ, CTA)
- `/pricing` — Standalone pricing + FAQ
- `/about` — Mission, values, board roster

**App** (`components/layout/app-shell.tsx` — collapsible Sidebar + Navbar):
- `/dashboard` — Metrics, score trend, recent meetings, activity feed
- `/meeting/new` — Pitch submission form (react-hook-form), executive multi-select, hands off to `/boardroom`
- `/boardroom` — Live session: seating grid, transcript feed, consensus panel
- `/reports` — Searchable report list
- `/reports/[id]` — Full report: executive summary, SWOT, radar chart, risk matrix, financial highlights
- `/market-research` — Market sizing donut, growth trend, competitor matrix
- `/financials` — KPI metrics, revenue/expense chart, cap table
- `/startup-health` — Health score ring, dimension radar, flags
- `/executives` — Full 8-agent roster, filterable, with profile dialog
- `/pitch-deck` — Slide thumbnail rail + preview pane
- `/prd-generator` — Section outline + generated spec content
- `/kanban` — 4-column visual board (no live drag-and-drop yet)
- `/hackathon` — Event banner, leaderboard, schedule
- `/history` — Version timeline across reports/decks/specs
- `/settings` — Profile / Workspace / Notifications / Billing tabs

## What's built

- ✅ Full design system — see `DESIGN_SYSTEM.md`.
- ✅ All UI primitives (`components/ui/`): Button, Input, Textarea, Label,
  Select, Switch, Card, Badge, Avatar, Tooltip, Dialog, Drawer, Separator,
  Skeleton.
- ✅ Shared composed components (`components/shared/`): SectionHeader,
  MetricCard, ScoreCard, ExecutiveCard, Timeline, ChartWrapper,
  BoardroomRadarChart, EmptyState, ErrorState.
- ✅ Two app shells (`components/layout/`): the authenticated `AppShell`
  (Sidebar + Navbar) and the marketing shell (MarketingNavbar + Footer).
- ✅ Every route in the PRD's page list, each with its own `features/<name>/`
  module (mock data + types + components).
- ✅ Custom 404 (`app/not-found.tsx`) styled to the design system.

## What's intentionally not here

- No backend, auth, database, or real AI calls — every number, transcript
  line, and report is hand-authored mock data in each feature's `mock.ts`.
- No live drag-and-drop on `/kanban` — visually complete, interaction is a
  documented next step.
- No `service.ts` per feature yet — see `features/README.md` for the
  convention future backend integration should follow; today every
  component reads directly from its feature's `mock.ts`.

## Folder structure

```
app/
  (app)/               # Route group: every authenticated page, wrapped by AppShell
  (marketing)/          # Route group: /pricing, /about, wrapped by MarketingNavbar + Footer
  page.tsx              # Landing page ("/"), self-contained with its own nav/footer
  layout.tsx            # Root layout — fonts + providers only
components/
  ui/                   # Primitives
  shared/               # Composed, cross-feature components
  layout/               # Sidebar, Navbar, AppShell, MarketingNavbar, Footer
features/<name>/        # One folder per route: components/, mock.ts, types.ts
hooks/                  # useMediaQuery, useReducedMotion, useDisclosure
lib/                    # utils.ts (cn, formatters), motion.ts, fonts.ts
providers/               # ThemeProvider, AppProviders
constants/               # design-tokens.ts, nav.ts
types/                   # common.ts — cross-feature primitive types
mock/                    # Reserved for datasets shared across features (see mock/README.md)
public/
```

## Conventions to keep following

- **Feature-first**: each route owns its `components/`, `mock.ts`, and
  `types.ts`. When a backend arrives, introduce `service.ts` per feature
  per `features/README.md` — components should call that, never `mock.ts`
  directly, so the swap touches one file per feature.
- **No hardcoded colors/shadows/easing** — always reach for a Tailwind
  token from `tailwind.config.ts` or a constant from `lib/motion.ts` /
  `constants/design-tokens.ts`.
- **Accessibility is not optional** — every interactive primitive ships
  focus-visible rings, ARIA wiring (via Radix where applicable), and
  `prefers-reduced-motion` handling.
=======

