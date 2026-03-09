
## Overview

The user has submitted 11 detailed technical issues. I'll address each one, grouped by file/scope. This is a large but well-scoped refactor — all changes are in existing files plus one new file (`src/lib/equityEngine.ts`).

---

## Issues and Their Solutions

### 1. EquityCalculator — Replace Math.random() with Monte Carlo Engine
**File:** `src/lib/equityEngine.ts` (new), `src/pages/EquityCalculator.tsx`

Create a real Monte Carlo engine:
- Build full 52-card deck, remove known cards (hero + board)
- For each iteration: shuffle remaining deck, deal 2 cards to villain (top-30% range filter), complete board with missing cards, evaluate 5-card hands using a proper evaluator
- Return win%, tie%, lose%
- Use `requestIdleCallback` or chunked async (no Web Worker needed in browser) to avoid UI freeze
- Replace the `setTimeout` + `Math.random()` in `handleCalculate()`

Hand evaluator: implement proper rank for flush, straight, pairs, two pair, trips, full house, quads, straight flush — using 5-7 card best-hand selection.

### 2. pokerAnalysis.ts — Fix drawOuts bug (gutshot always 8)
**File:** `src/lib/pokerAnalysis.ts` line 235

```typescript
// BUG: hasStraightDraw ? 8 : 4 always = 8 inside if(hasStraightDraw)
if (hasStraightDraw && !hasStraight) drawOuts += hasStraightDraw ? 8 : 4;

// FIX: detect OESD vs gutshot properly
let isOESD = false;
for (let i = 0; i <= uniqueValues.length - 4; i++) {
  if (uniqueValues[i + 3] - uniqueValues[i] === 3) { isOESD = true; break; }
}
const straightOuts = isOESD ? 8 : 4;
if (hasStraightDraw && !hasStraight) drawOuts += straightOuts;
```
Export `isOESD` in the `HandAnalysis` interface and return value.

### 3. pokerAnalysis.ts — Fix false positive straight draw (hero not participating)
**File:** `src/lib/pokerAnalysis.ts`

When checking `hasStraightDraw`, verify at least one hero card participates in the 4-card draw window:
```typescript
const heroValues = heroCards.map(c => RANK_VALUES[c.rank]);
// In straight draw loop:
const drawValues = uniqueValues.slice(i, i + 4);
const heroParticipates = heroValues.some(v => drawValues.includes(v));
if (heroParticipates) { hasStraightDraw = true; break; }
// Same for hasStraight check
```

### 4. pokerAnalysis.ts — Fix Ace-low straight (wheel A-2-3-4-5)
**File:** `src/lib/pokerAnalysis.ts`

After building `uniqueValues`, add Ace as value 1 when Ace exists and low cards (2-5) present:
```typescript
const hasAce = uniqueValues.includes(14);
const hasLowCards = uniqueValues.some(v => v <= 5);
let valuesForStraight = [...uniqueValues];
if (hasAce && hasLowCards) valuesForStraight = [1, ...uniqueValues];
// Use valuesForStraight in all straight/draw detection loops
```
Apply same fix in `analyzeBoardTexture()`.

### 5. Statistics.tsx — Replace hardcoded data with Supabase + empty state
**File:** `src/pages/Statistics.tsx`

- Create table `hand_sessions` (migration): `id, user_id, position, result_bb, vpip, pfr, three_bet, date`
- Use `useQuery` + supabase to fetch stats per user
- When no data: show `EmptyState` card with instruction "Importe mãos via Análise de Mãos para ver suas estatísticas"
- When data exists: aggregate and display real numbers

### 6. openRanges.ts — Create distinct UTG1 range
**File:** `src/data/gtoRanges/openRanges.ts`

Create `generateUTG1Open()` separate from `generateUTGOpen()`:
- 66: 100% (vs UTG's mixed)
- A9s: 70% raise (vs UTG's 50%)
- KJo: 40% raise (new)
- T9s: 75% (vs UTG's 50%)
- Everything else from UTG range

Export `UTG1: generateUTG1Open()`.

### 7. pokerAnalysis.ts — Run-out probabilistic model in getMultiStreetPlan()
**File:** `src/lib/pokerAnalysis.ts`

In `getMultiStreetPlan()`, for draw category:
- Flop→Turn: simulate 35% draw completion chance
- Turn→River: simulate 18% chance
- If "not completed" (use deterministic simulation based on seed): reclassify category to `"air"` or `"weak-made"`, update reasoning accordingly: "Se o draw não completar no turn, considere give up"

### 8. pokerAnalysis.ts — Villain type adjustments to equity in getRecommendation()
**File:** `src/lib/pokerAnalysis.ts`

In `getRecommendation()`, before pot odds comparison, apply villain multipliers:
```typescript
let adjustedEquity = equity;
if (context.villainType === "tight") adjustedEquity -= 8;
if (context.villainType === "loose") adjustedEquity += 5;
let foldEquityBonus = 0;
if ((hasFlushDraw || hasStraightDraw) && context.villainType === "aggressive") foldEquityBonus = 15;
if (context.villainType === "passive") foldEquityBonus = -20;
```
Use `adjustedEquity` instead of raw `equity` in comparisons.

### 9. handHistoryParser.ts — Implement GGPoker parser
**File:** `src/lib/handHistoryParser.ts`

Implement `parseGGPokerHand()` with:
- Header regex: `Poker Hand #HD...`
- `[ME]` marker for hero detection
- `Blinds X/Y` format
- Wire into `parseHandHistory()` switch for `"GGPoker"`

### 10. BoardTexturePanel.tsx + analyzeHand — Show OESD vs Gutshot in UI
**Files:** `src/components/betting/BoardTexturePanel.tsx`, `src/lib/pokerAnalysis.ts`

Since `isOESD` is now exported from `analyzeHand()`, update `BoardTexturePanel` to show:
- "OESD (8 outs)" with green badge
- "Gutshot (4 outs)" with yellow badge  
- "Backdoor straight draw" with gray badge

The panel already renders `texture.straightDraw` from `analyzeBoardTexture()`. Since board texture doesn't know hero cards, the OESD/gutshot badge will come from `HandAnalysis.isOESD` passed as a prop in `BettingAssistant`.

### 11. EVCalculator.tsx — Add outs-based equity calculator
**File:** `src/pages/EVCalculator.tsx`

Add optional "Número de Outs" input + street selector (flop/turn/river):
- River: `(outs / 46) * 100`
- Turn: `(outs / 46) * 100`
- Flop: `outs * 4` (simplified rule of 4)
Display: "Estimativa pela Regra do 2&4: X%" next to equity field. User can still override manually.

### 12. handHistoryParser.ts — validateParsedHand()
**File:** `src/lib/handHistoryParser.ts`

Export `validateParsedHand(hand: ParsedHand): string[]` that checks:
- Duplicate cards across hero + board
- Board > 5 cards
- Hero > 2 cards
- Returns Portuguese error messages array

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/equityEngine.ts` | CREATE — Monte Carlo engine |
| `src/lib/pokerAnalysis.ts` | MODIFY — bugs 2, 3, 4, 7, 8 |
| `src/lib/handHistoryParser.ts` | MODIFY — bugs 9, 12 |
| `src/pages/EquityCalculator.tsx` | MODIFY — use equityEngine, add outs calculator |
| `src/pages/Statistics.tsx` | MODIFY — Supabase data + empty state |
| `src/data/gtoRanges/openRanges.ts` | MODIFY — distinct UTG1 range |
| `src/components/betting/BoardTexturePanel.tsx` | MODIFY — OESD/gutshot badges |
| `src/pages/EVCalculator.tsx` | MODIFY — outs-based equity helper |
| Database migration | CREATE — `hand_sessions` table |

---

## Execution Order

1. `src/lib/equityEngine.ts` — independent new file
2. `src/lib/pokerAnalysis.ts` — fix all 4 bugs at once
3. `src/lib/handHistoryParser.ts` — GGPoker + validation
4. `src/pages/EquityCalculator.tsx` — use new engine
5. `src/pages/EVCalculator.tsx` — outs helper
6. `src/data/gtoRanges/openRanges.ts` — UTG1 range
7. `src/components/betting/BoardTexturePanel.tsx` — OESD/gutshot UI
8. Database migration + `src/pages/Statistics.tsx` — last (requires DB)
