
## What the User Is Proposing

The user has pasted two complete replacement files — a fully rewritten `src/lib/equityEngine.ts` and `src/lib/pokerAnalysis.ts`. These are substantial upgrades with new exports and changed interfaces that also affect consumers (`EquityCalculator.tsx`, `BettingAssistant.tsx`).

---

## Diff Analysis

### `src/lib/equityEngine.ts` — Full Replacement

**Current:** Exports `runMonteCarloEquity(heroCards, boardCards, iterations): Promise<EquityResult>` with `EquityResult = { win, tie, lose, iterations }`. Uses `isInVillainRange` filter, async chunked simulation.

**Proposed:** 
- New `EquityResult` shape: `{ winPct, tiePct, losePct, iterations, handCategory, outs, outsByType }` — different field names (`win` → `winPct`)
- Adds `OutsBreakdown` interface with detailed out types (flush/straight/set/pair, OESD/gutshot/backdoor flags)
- Adds `calculateOuts()` export — full outs calculator
- Adds `rule2and4()` export — convenience helper
- Adds `toEngineCard()` export — converts `{ rank: string; suit: string }` to `EngineCard`
- `runEquity()` replaces `runMonteCarloEquity()` — synchronous (no async/chunks), always deals villain from random deck (no range filter), runs 7500 iterations, returns enriched result
- Hand evaluator: cleaner polynomial encoding (`P = [1, 15, 225...]`) vs current magic constants
- Suit type changed from string `"h"|"d"|"c"|"s"` to numeric `0|1|2|3`

**Breaking changes in EquityCalculator.tsx:**
- Line 14: `import { runMonteCarloEquity }` → needs `import { runEquity, toEngineCard }`
- Line 110: `await runMonteCarloEquity(heroCards, boardCards, 5000)` → `runEquity(toEngineCard-mapped cards)` (synchronous)
- Line 111: `result.win` → `result.winPct`, `result.tie` → `result.tiePct`, `result.lose` → `result.losePct`
- `results` state: `{ win, tie, lose }` → needs `{ win, tie, lose }` remapped from `winPct/tiePct/losePct`

### `src/lib/pokerAnalysis.ts` — Full Replacement

**Current (662 lines):** Working but with simpler hand/recommendation logic.

**Proposed:**
- `HandAnalysis` interface adds: `isGutshot`, `isComboDraws`, `drawType: DrawType` (new type), changes `DrawType` categories
- `BoardTexture` adds: `wheelPossible` field
- `BettingRecommendation` adds: `potOdds?`, `drawInfo?`, changes `alternativeActions` to include `label?`  
- `GameContext.board` — no change (same `Card[]`)
- `BettingSize` adds `"25%"` size option (previously missing)
- `getVillainAdj()` extracted as helper function (cleaner)
- `getRecommendation()`: richer logic with `drawInfo`, `missScenario` in plans, more granular sizing
- `getMultiStreetPlan()`: returns `StreetPlan[]` with `missScenario?` added to interface
- `analyzeBoardTexture()`: adds `wheelPossible` to return, refines wetness scoring

**Breaking changes:**
- `BoardTexturePanel.tsx` uses `texture.straightDraw` — prop `"oesd"` vs `"oesd"` (same value, safe)
- `BettingAssistant.tsx` uses `handAnalysis.isOESD` — still present ✓
- `RecommendationPanel.tsx` renders `alternativeActions` — `label?` is additive, safe ✓
- `MultiStreetPlan.tsx` renders `StreetPlan.spr` — still present ✓
- New `drawInfo` on `BettingRecommendation` — optional, additive

**Consumer files to update:**
1. `EquityCalculator.tsx` — import + call signature + result field names
2. `BettingAssistant.tsx` — check for `isGutshot` and `drawType` additions (additive, likely safe without changes)

---

## Plan

### 1. Replace `src/lib/equityEngine.ts`
Full rewrite with the proposed content.

### 2. Replace `src/lib/pokerAnalysis.ts`
Full rewrite with the proposed content.

### 3. Update `src/pages/EquityCalculator.tsx`
Three targeted changes:
- Import: `runMonteCarloEquity` → `runEquity, toEngineCard, type EquityResult`
- `results` state type: keep `{ win, tie, lose }` internally, map from `winPct/tiePct/losePct`
- `handleCalculate`: remove `await`, convert cards with `toEngineCard`, map result fields
- `handleRequestAnalysis`: `results.win` still works (we keep internal state as `win`)

### 4. Update `src/components/betting/BoardTexturePanel.tsx`
Check if `wheelPossible` should be surfaced in UI (additive, optional display).

### 5. Check `src/pages/BettingAssistant.tsx`
Verify `HandAnalysis` new fields (`isGutshot`, `drawType`, `isComboDraws`) don't break destructuring.

---

## Files Changed

| File | Action |
|------|--------|
| `src/lib/equityEngine.ts` | Replace entirely with proposed version |
| `src/lib/pokerAnalysis.ts` | Replace entirely with proposed version |
| `src/pages/EquityCalculator.tsx` | Update import + `handleCalculate` to use new API |
| `src/pages/BettingAssistant.tsx` | Minor: handle new `HandAnalysis` fields in `handleRequestAIAnalysis` context builder |
