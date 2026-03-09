
## Solver Page at /solver

### What to Build

A new dedicated page with 3 tabs, each exposing a core solver engine module:

1. **Range vs Range** — equity calculator with range string inputs + board cards
2. **ICM Calculator** — tournament equity with stack/prize inputs  
3. **Push/Fold Chart** — 13×13 grid showing push/fold decisions for a given stack depth + position

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Solver.tsx` | New page with 3 tabs |
| `src/App.tsx` | Add `/solver` route inside protected routes |
| `src/components/layout/Sidebar.tsx` | Add "Solver GTO" nav link |

---

### Tab 1 — Range vs Range Equity

**Inputs:**
- Hero range string text input (e.g. `AA,KK,AKs`) + preset dropdown from `VILLAIN_RANGES`
- Villain range string text input + preset dropdown
- Board cards (0–5) via `CardPicker` component (reuse existing)
- "Calcular Equidade" button

**Results (from `calculateRangeEquity`):**
- Two big equity bars (hero % vs villain %) with range/nut advantage badge
- Top hands tables side-by-side: hero top 8, villain top 8 — showing hand, equity%, combos
- Total combo counts for each range (parsed from `parseRangeString`)

**UX:** Show a loading spinner while computing (it runs MC per combo, ~1–2s)

---

### Tab 2 — ICM Calculator

**Inputs:**
- Number of players selector (2–9)
- Dynamic table of rows: Player name + chip stack + prize amount
- Hero index selector (which player is you)
- "Calcular ICM" button

**Results (from `calculateICM`):**
- Table showing each player: chips, chip EV ($), ICM EV ($), difference
- Hero row highlighted
- `icmPressure` gauge bar (0–100%) labeled "Pressão ICM"
- `recommendation` text card

**UX:** Default populated with a 6-player MTT bubble example

---

### Tab 3 — Push/Fold Chart

**Inputs:**
- Stack depth slider: 1–20bb
- Position selector: UTG / CO / BTN / SB

**Results (from `getPushFoldDecision` called for all 169 hand combinations):**
- Full 13×13 grid (same layout as `RangeMatrix` in `src/components/poker/RangeMatrix.tsx`)
- Cell colors: **green** = push, **red** = fold, **yellow** = mixed (frequency 0.3–0.7)
- Selected cell shows `PushFoldDecision` detail: action, frequency, reasoning, EV estimate
- Legend row below grid

**UX:** Reuses the 13×13 rank grid structure from `RangeMatrix`. Updates instantly on slider/position change (no button click needed).

---

### Page Layout

```text
┌──────────────────────────────────────────────────────┐
│  ⚙ Solver GTO                    [UsageBadge]         │
│  Ferramentas avançadas de análise                     │
├──────────────────────────────────────────────────────┤
│  [Range vs Range] [ICM Calculator] [Push/Fold Chart] │
├──────────────────────────────────────────────────────┤
│                    Tab Content                        │
└──────────────────────────────────────────────────────┘
```

Uses `Tabs`/`TabsList`/`TabsTrigger` from existing `@radix-ui/react-tabs` (already in `src/components/ui/tabs.tsx`).

---

### Sidebar Nav Entry

Added between "Assistente de Bet" and "Planos":
```ts
{ name: "Solver GTO", href: "/solver", icon: Cpu }
```

Import `Cpu` from `lucide-react` (already available).

---

### Implementation Notes

- `calculateRangeEquity` is synchronous but slow — wrap in `setTimeout(..., 0)` and show spinner to avoid UI freeze
- Push/fold grid recalculates with `useMemo` on stack/position change — fast enough (~169 calls to `getPushFoldDecision`)
- Reuse existing styling tokens: `hsl(220,18%,8%)` card bg, `border-[hsl(220,15%,15%)]` borders
- All text in Portuguese to match project style
- Page protected route (user must be logged in)
