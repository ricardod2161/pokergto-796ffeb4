
## Engineering Audit: All Issues Addressed

After reading all relevant files, here's the complete picture:

### What's Already Done (from previous sessions)
- `pokerAnalysis.ts`: OESD/gutshot fix, hero participation check, ace-low wheel, villain adjustments, multi-street run-out model — **all already implemented correctly**
- `BoardTexturePanel.tsx`: OESD/Gutshot badges with green/yellow colors — **already done**
- `Statistics.tsx`: Real Supabase data + EmptyState — **already done**
- `ProtectedRoute.tsx`: The `/upgrade` redirect bug exists — there's no `/upgrade` route, and the `if (requirePlan && subscription)` check only fires when `subscription` is truthy but the plan doesn't match (the null-subscription case passes through)

### What Actually Needs to Be Fixed

**1. ProtectedRoute — `/upgrade` route doesn't exist + logic bug**
- Line 38: `if (requirePlan && subscription)` — if `subscription` is null, the guard is skipped entirely (user can access any plan-gated route with no subscription)
- Line 41: redirects to `/upgrade` which has no route — falls to 404
- Fix: redirect to `/pricing` and handle null subscription case

**2. AuthContext — stale state on user switch + RPC failure handling**
- `fetchUserData` lines 70-82: uses `if (profileData)` / `if (subData)` — if a second user has no record, state from the first user persists (stale state)
- Line 150: `reset_user_daily_usage` in `signIn` — if it fails (RPC error), the error is silently swallowed but could cause the login to appear broken in some scenarios. Should be wrapped in try/catch that doesn't fail login
- Fix: clear profile/subscription to `null` when queries return empty, wrap RPC in try/catch

**3. Dashboard.tsx — hardcoded stats bar + position win rates**
- Lines 23-32: `stats` array with hardcoded VPIP, PFR, BB/100 etc. shown to all users
- Lines 152-162: position win rates (UTG +2.1, BTN +12.4, etc.) all hardcoded
- Fix: fetch real aggregated stats from `hand_sessions` table (same query pattern as Statistics.tsx), show dashes "—" when no data

**4. .gitignore — missing .env**
- `.gitignore` doesn't include `.env` — the file with `VITE_SUPABASE_URL` and keys will be committed
- Fix: add `.env` and `.env.local` to `.gitignore`, create `.env.example`

---

### Plan

#### File: `.gitignore`
Add `.env` and `.env.local` entries, then create `.env.example` with placeholder keys.

#### File: `src/components/auth/ProtectedRoute.tsx`
```
// BEFORE (line 38-43):
if (requirePlan && subscription) {
  const userPlan = subscription.plan;
  if (!requirePlan.includes(userPlan)) {
    return <Navigate to="/upgrade" replace />;
  }
}

// AFTER:
if (requirePlan) {
  const userPlan = subscription?.plan;
  if (!userPlan || !requirePlan.includes(userPlan)) {
    return <Navigate to="/pricing" replace />;
  }
}
```

#### File: `src/contexts/AuthContext.tsx`
In `fetchUserData` (lines 61-96):
- After profile query: always call `setProfile(profileData ?? null)` — not guarded by `if (profileData)`
- After subscription query: always call `setSubscription(subData ?? null)`
- After roles query: always call `setRoles(rolesData ? [...] : [])`
- Wrap the RPC call in `signIn` in its own try/catch that never throws

#### File: `src/pages/Dashboard.tsx`
Replace the hardcoded `stats` array and position win rate grid with live data from `hand_sessions`:
- Add `useQuery` to fetch from `hand_sessions` (same as Statistics.tsx uses)
- Import `aggregateStats` helper or inline a lighter version
- When no data: show dashes `—` with a small "Sem dados" pill
- When data: show real VPIP/PFR/BB/100 etc.
- The "Sessões Recentes" sidebar section: fetch last 3 rows from `hand_sessions` ordered by `session_date desc`
- Remove the `Percent`, `Crosshair` etc. imports that are no longer used for the static stat objects

#### File: `.env.example` (new file)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

### Files Changed

| File | Change |
|------|--------|
| `.gitignore` | Add `.env`, `.env.local` |
| `.env.example` | Create with placeholder keys |
| `src/components/auth/ProtectedRoute.tsx` | Fix `/upgrade` → `/pricing`, fix null subscription guard |
| `src/contexts/AuthContext.tsx` | Fix stale state on user switch, safe RPC error handling |
| `src/pages/Dashboard.tsx` | Replace hardcoded stats with real Supabase data, remove unused imports |

---

### No DB Migration Needed
`hand_sessions` table already exists with correct columns and RLS policies. The Dashboard will simply query the same table Statistics.tsx already uses.
