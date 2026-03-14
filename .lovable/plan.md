
## What the User Wants

The user wants a clear, readable reference showing: **"which hands I should call and how many BB from each position"** — organized per position (vs UTG, vs CO, vs BTN, vs SB), displayed proportionally.

Currently the Call tab shows a 13×13 grid + a table of top 20 hands for the *currently selected* position. The user wants to see **all 4 positions simultaneously** in a structured reference format, sorted by hand strength, showing the max BB per hand.

---

## Plan

### What to change: `src/pages/Solver.tsx`

Add a new **"Ranges de Call"** section inside the Call sub-tab of the Push/Fold chart. Instead of just showing the interactive grid for one position at a time, add a **multi-position reference table** below the grid that shows:

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📞 Ranges de Call por Posição                               │
│  Máximo de BB para chamar um all-in de cada posição          │
├─────────────────────────────────────────────────────────────┤
│  Mão    │  vs UTG  │  vs CO  │  vs BTN  │  vs SB            │
│  ────── │ ──────── │ ─────── │ ──────── │ ──────            │
│  AA     │  20bb ✓  │  20bb ✓ │  20bb ✓  │  20bb ✓           │
│  KK     │  20bb ✓  │  20bb ✓ │  20bb ✓  │  20bb ✓           │
│  QQ     │  20bb ✓  │  20bb ✓ │  20bb ✓  │  20bb ✓           │
│  JJ     │  15bb    │  17bb   │  18bb    │  20bb ✓           │
│  AKs    │  20bb ✓  │  20bb ✓ │  20bb ✓  │  20bb ✓           │
│  ...    │          │         │          │                    │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- The current `stack` slider value is used to highlight which hands are callable **right now** at the current stack depth
- Rows are sorted by hand strength (pairs desc, then suited broadway, then offsuit broadway, etc.)
- Each cell shows the max BB with a colored dot:
  - **Green dot + bold**: Can call at current stack
  - **Yellow dot**: Mixed strategy at current stack  
  - **Gray/dim**: Cannot call at current stack (hand is foldable)
  - **—**: Hand not in calling range at all
- This table updates reactively with the stack slider (no button needed)
- The table is scrollable with sticky header

**Hand ordering** — build a sorted list of all unique hands present in any of the 4 CALL_RANGES_BB tables (union), sorted by:
1. Pairs first (AA→22)
2. Suited cards (AKs→22s)  
3. Offsuit cards (AKo→22o)
Then within each group, sorted by hand strength (descending).

**Implementation details:**
- Export `CALL_RANGES_BB` from `solverEngine.ts` (currently unexported — just add `export`)
- In `Solver.tsx`, inside the `PushFoldChart` function's Call tab section, add this reference table below the existing interactive grid
- Use the existing `stack` state from the parent `PushFoldChart` function — no new state needed
- Table is always visible when `activeTab === "call"`

### Also add to `solverEngine.ts`
Export the `CALL_RANGES_BB` constant (change `const` → `export const`) so `Solver.tsx` can directly access the raw data for the multi-column table.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/solverEngine.ts` | Add `export` to `CALL_RANGES_BB` |
| `src/pages/Solver.tsx` | Import `CALL_RANGES_BB`, add multi-position call reference table in the Call sub-tab |
