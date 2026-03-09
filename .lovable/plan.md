
## What the User Is Proposing

Two things combined:

1. **New file: `src/lib/solverEngine.ts`** — A professional-grade poker solver with 10 modules: range representation, range-vs-range equity, MDF, geometric bet sizing, blocker analysis, ICM calculator, push/fold chart, SPR analysis, GTO frequencies, and standard villain ranges.

2. **A list of improvements** grouped into 4 categories (bug fixes, code professionalization, visual polish, poker function refinement), with a recommended priority order.

The user explicitly states they want to follow the order: bugs first → visual polish → poker refinements.

---

## Current State Assessment

Reading the files, the project is already quite solid:
- `ProtectedRoute.tsx` correctly uses `subscription?.plan` — no bugs visible
- `AuthContext.tsx` has `Promise.all` + try/catch — already clean
- `App.tsx` has `AuthProvider` wrapping — already correct
- `EquityCalculator.tsx` already uses synchronous `runEquity` + `toEngineCard` — last session fixed this
- `BettingAssistant.tsx` uses the updated `handAnalysis` fields — compatible
- `RecommendationPanel.tsx` renders `alternativeActions` with optional `label` — additive safe
- `MultiStreetPlan.tsx` renders `spr` — present in new `StreetPlan`
- `BoardTexturePanel.tsx` imports `BoardTexture` — the new `pokerAnalysis.ts` adds `wheelPossible` (additive)

The **main action** the user wants now is: add the new `solverEngine.ts` file and integrate it into the UI.

Looking at priority order the user stated:
1. Fix bugs / stability first
2. Visual improvements
3. Poker function refinements

However, the user's primary message content is the `solverEngine.ts` code paste — they want this integrated.

---

## Plan

### Phase 1 — Create `src/lib/solverEngine.ts`
Create the new file with all 10 modules as provided. This is a pure library file with no breaking changes — it only adds new exports.

### Phase 2 — Replace `src/lib/pokerAnalysis.ts` (already approved last session but not yet fully done)
The old `pokerAnalysis.ts` (662 lines) is still the original version. The v2 replacement from the previous approved plan needs to be applied. The new version adds `wheelPossible`, `isGutshot`, `isComboDraws`, `drawType`, `drawInfo`, `potOdds` — all additive to consumers.

### Phase 3 — Integrate solver modules into `BettingAssistant.tsx`
Add solver panel below the recommendation showing:
- MDF calculation when facing a bet
- SPR analysis (always)
- Geometric sizing suggestion
- GTO frequencies

This is the most impactful UI addition — transforms Betting Assistant from a simple recommender into a professional solver tool.

### Phase 4 — Bug fixes and code cleanup
- Remove unused `HandAnalysis` import warnings (already present in `BettingAssistant.tsx` — `handAnalysis.isOESD` used correctly)
- Fix `BoardTexturePanel` to handle new `wheelPossible` field
- Fix the `sizingOptions` array in `RecommendationPanel` to include `"25%"` (new `BettingSize`)

---

## Detailed Changes

### `src/lib/solverEngine.ts` (NEW FILE)
Create exactly as provided by user.

### `src/lib/pokerAnalysis.ts` (REPLACE)
Replace with the v2 version the user provided — the version with `wheelPossible`, `DrawType`, `isGutshot`, `isComboDraws`, `drawInfo`, `potOdds`, `missScenario`.

### `src/components/betting/RecommendationPanel.tsx`
- Add `"25%"` to `sizingOptions` array
- Add `drawInfo` display section when `recommendation.drawInfo` is present (new optional field)
- Add `potOdds` display alongside `equityNeeded`
- Show `alt.label` when present in alternative actions

### `src/components/betting/MultiStreetPlan.tsx`
- Add `missScenario` display when present in a plan

### `src/components/betting/BoardTexturePanel.tsx`
- Add `wheelPossible` badge row (additive — field is now in `BoardTexture`)

### `src/pages/BettingAssistant.tsx`
- Import MDF, SPR, GeoSizing, GTO frequencies from `solverEngine`
- Compute and display `MDFResult`, `SPRAnalysis`, `GeometricSizing`, `GtoFrequencies` when `recommendation` is available
- Add a new `SolverPanel` inline component or a new component file showing these 4 solver metrics

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/solverEngine.ts` | Create (new) |
| `src/lib/pokerAnalysis.ts` | Replace with v2 |
| `src/components/betting/RecommendationPanel.tsx` | Add drawInfo, potOdds, alt labels, 25% sizing |
| `src/components/betting/MultiStreetPlan.tsx` | Add missScenario display |
| `src/components/betting/BoardTexturePanel.tsx` | Add wheelPossible row |
| `src/pages/BettingAssistant.tsx` | Wire solver metrics + new solver panel |
