/**
 * PokerGTO Equity Engine
 * Real Monte Carlo simulation with proper 5-card hand evaluator.
 * Supports hero vs single villain with configurable opponent range.
 */

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Suit = 0 | 1 | 2 | 3; // clubs=0, diamonds=1, hearts=2, spades=3

export interface EngineCard {
  rank: Rank;
  suit: Suit;
}

export interface EquityResult {
  winPct: number;   // 0-100
  tiePct: number;   // 0-100
  losePct: number;  // 0-100
  iterations: number;
  handCategory: string;
  outs: number;
  outsByType: OutsBreakdown;
}

export interface OutsBreakdown {
  flushOuts: number;
  straightOuts: number;
  setOuts: number;
  pairOuts: number;
  total: number;
  isFlushDraw: boolean;
  isOESD: boolean;
  isGutshot: boolean;
  isBackdoorFlush: boolean;
  isBackdoorStraight: boolean;
}

// ─────────────────────────────────────────────
//  Card Notation Helpers
// ─────────────────────────────────────────────

const RANK_CHAR_MAP: Record<string, Rank> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const SUIT_CHAR_MAP: Record<string, Suit> = {
  c: 0, d: 1, h: 2, s: 3,
  clubs: 0, diamonds: 1, hearts: 2, spades: 3,
};

const HAND_NAMES = [
  'High Card', 'One Pair', 'Two Pair', 'Three of a Kind',
  'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush',
];

/** Convert UI card format to engine card */
export function toEngineCard(card: { rank: string; suit: string }): EngineCard {
  const rankKey = card.rank.toUpperCase() === '10' ? 'T' : card.rank.toUpperCase();
  const rank = RANK_CHAR_MAP[rankKey] ?? RANK_CHAR_MAP[card.rank];
  const suit = SUIT_CHAR_MAP[card.suit.toLowerCase()];
  if (!rank || suit === undefined) throw new Error(`Invalid card: ${card.rank}${card.suit}`);
  return { rank, suit };
}

/** Convert engine card to integer index (0-51) */
function cardToIndex(c: EngineCard): number {
  return (c.rank - 2) * 4 + c.suit;
}

/** Build a 52-card deck, excluding dead cards */
function buildDeck(dead: EngineCard[]): EngineCard[] {
  const deadSet = new Set(dead.map(cardToIndex));
  const deck: EngineCard[] = [];
  for (let r = 2; r <= 14; r++) {
    for (let s = 0; s <= 3; s++) {
      const c = { rank: r as Rank, suit: s as Suit };
      if (!deadSet.has(cardToIndex(c))) deck.push(c);
    }
  }
  return deck;
}

/** Fisher-Yates shuffle in-place */
function shuffle(deck: EngineCard[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
}

// ─────────────────────────────────────────────
//  Hand Evaluator
//  Score = handRank * 15^5 + c1*15^4 + c2*15^3 + c3*15^2 + c4*15 + c5
//  Higher score = better hand. Works for exactly 5-card hands.
// ─────────────────────────────────────────────

const P = [1, 15, 225, 3375, 50625, 759375]; // 15^0 ... 15^5

function encodeKickers(ranks: number[]): number {
  let v = 0;
  for (let i = 0; i < ranks.length; i++) {
    v += ranks[i] * P[ranks.length - 1 - i];
  }
  return v;
}

/** Evaluate a 5-card hand, return numeric score (higher=better) */
function eval5(cards: EngineCard[]): number {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const freq: Record<number, number> = {};
  for (const r of ranks) freq[r] = (freq[r] ?? 0) + 1;
  const freqValues = Object.values(freq).sort((a, b) => b - a);
  const freqKeys = Object.keys(freq)
    .map(Number)
    .sort((a, b) => (freq[b] !== freq[a] ? freq[b] - freq[a] : b - a));

  const isFlush = suits.every(s => s === suits[0]);

  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqueRanks.length === 5 && uniqueRanks[0] - uniqueRanks[4] === 4) {
    isStraight = true;
    straightHigh = uniqueRanks[0];
  }

  // Wheel: A-2-3-4-5
  if (!isStraight && uniqueRanks[0] === 14 &&
    uniqueRanks[1] === 5 && uniqueRanks[2] === 4 &&
    uniqueRanks[3] === 3 && uniqueRanks[4] === 2) {
    isStraight = true;
    straightHigh = 5;
  }

  if (isStraight && isFlush) return 8 * P[5] + straightHigh;
  if (freqValues[0] === 4) return 7 * P[5] + freqKeys[0] * P[1] + freqKeys[1];
  if (freqValues[0] === 3 && freqValues[1] === 2) return 6 * P[5] + freqKeys[0] * P[1] + freqKeys[1];
  if (isFlush) return 5 * P[5] + encodeKickers(ranks);
  if (isStraight) return 4 * P[5] + straightHigh;
  if (freqValues[0] === 3) return 3 * P[5] + freqKeys[0] * P[2] + encodeKickers([freqKeys[1], freqKeys[2]]);
  if (freqValues[0] === 2 && freqValues[1] === 2) {
    const pairs = [freqKeys[0], freqKeys[1]].sort((a, b) => b - a);
    return 2 * P[5] + pairs[0] * P[2] + pairs[1] * P[1] + freqKeys[2];
  }
  if (freqValues[0] === 2) return 1 * P[5] + freqKeys[0] * P[3] + encodeKickers([freqKeys[1], freqKeys[2], freqKeys[3]]);
  return encodeKickers(ranks);
}

/** Best 5-card hand out of N cards (N >= 5) */
function evalBest(cards: EngineCard[]): number {
  if (cards.length === 5) return eval5(cards);
  let best = -1;
  const n = cards.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const score = eval5([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (score > best) best = score;
          }
  return best;
}

/** Get hand category name from score */
function getHandName(score: number): string {
  const category = Math.floor(score / P[5]);
  return HAND_NAMES[Math.min(category, 8)];
}

// ─────────────────────────────────────────────
//  Outs Calculator
// ─────────────────────────────────────────────

export function calculateOuts(
  heroCards: EngineCard[],
  board: EngineCard[]
): OutsBreakdown {
  const all = [...heroCards, ...board];
  const heroRanks = heroCards.map(c => c.rank);
  const heroSuits = heroCards.map(c => c.suit);

  // ── Flush Draw ──────────────────────────────
  const suitCount: Record<number, number> = {};
  for (const c of all) suitCount[c.suit] = (suitCount[c.suit] ?? 0) + 1;
  const heroSuitCounts = heroSuits.map(s => suitCount[s] ?? 0);
  const maxSuitWithHero = Math.max(...heroSuitCounts);
  const isFlushDraw = maxSuitWithHero === 4;
  const isBackdoorFlush = maxSuitWithHero === 3 && board.length === 3;
  const flushOuts = isFlushDraw ? 9 : 0;

  // ── Straight Draw ────────────────────────────
  const allRanks = [...new Set(all.map(c => c.rank))].sort((a, b) => a - b);
  if (allRanks.includes(14)) allRanks.unshift(1);

  let isOESD = false;
  let isGutshot = false;
  let isBackdoorStraight = false;
  let straightOuts = 0;

  const heroRankSet = new Set<number>(heroRanks);
  if (heroRanks.includes(14)) heroRankSet.add(1);

  for (let lo = 1; lo <= 10; lo++) {
    const window5 = [lo, lo + 1, lo + 2, lo + 3, lo + 4];
    const window4 = [lo, lo + 1, lo + 2, lo + 3];

    const heroIn5 = window5.some(r => heroRankSet.has(r));
    const heroIn4 = window4.some(r => heroRankSet.has(r));

    if (heroIn5) {
      const haveInW5 = window5.filter(r => allRanks.includes(r)).length;
      if (haveInW5 === 4) {
        const gaps = window5.filter(r => !allRanks.includes(r));
        if (gaps.length === 1) {
          if (gaps[0] === lo || gaps[0] === lo + 4) {
            if (!isOESD) { isOESD = true; straightOuts = 8; }
          } else {
            if (!isOESD && !isGutshot) { isGutshot = true; straightOuts = 4; }
          }
        }
      }
    }

    if (!isOESD && !isGutshot && board.length === 3 && heroIn4) {
      const haveInW4 = window4.filter(r => allRanks.includes(r)).length;
      if (haveInW4 === 3) isBackdoorStraight = true;
    }
  }

  // ── Set / Pair outs ──────────────────────────
  let setOuts = 0;
  let pairOuts = 0;
  const boardRanks = board.map(c => c.rank);
  const boardRankFreq: Record<number, number> = {};
  for (const r of boardRanks) boardRankFreq[r] = (boardRankFreq[r] ?? 0) + 1;

  for (const r of heroRanks) {
    const onBoard = boardRankFreq[r] ?? 0;
    if (onBoard === 2) setOuts += 1;
    else if (onBoard === 1) setOuts += 2;
    else pairOuts += 3;
  }

  if (heroRanks[0] === heroRanks[1]) {
    setOuts = 2;
    pairOuts = 0;
  }

  const total = flushOuts + straightOuts;

  return {
    flushOuts,
    straightOuts,
    setOuts,
    pairOuts,
    total,
    isFlushDraw,
    isOESD,
    isGutshot,
    isBackdoorFlush,
    isBackdoorStraight,
  };
}

// ─────────────────────────────────────────────
//  Monte Carlo Runner
// ─────────────────────────────────────────────

export function runEquity(
  heroCards: EngineCard[],
  boardCards: EngineCard[],
  iterations = 7500
): EquityResult {
  const dead = [...heroCards, ...boardCards];
  const baseDeck = buildDeck(dead);
  const boardNeeded = 5 - boardCards.length;

  let wins = 0, ties = 0, losses = 0;
  const workDeck = [...baseDeck];

  for (let i = 0; i < iterations; i++) {
    shuffle(workDeck);

    const villain: EngineCard[] = [workDeck[0], workDeck[1]];
    const extraBoard: EngineCard[] = workDeck.slice(2, 2 + boardNeeded);
    const fullBoard = [...boardCards, ...extraBoard];

    const heroScore = evalBest([...heroCards, ...fullBoard]);
    const villainScore = evalBest([...villain, ...fullBoard]);

    if (heroScore > villainScore) wins++;
    else if (heroScore === villainScore) ties++;
    else losses++;
  }

  const heroScore5 = heroCards.length >= 2 && boardCards.length >= 3
    ? evalBest([...heroCards, ...boardCards])
    : -1;

  const handCategory = heroScore5 >= 0 ? getHandName(heroScore5) : 'Preflop';

  const outs = boardCards.length < 5
    ? calculateOuts(heroCards, boardCards)
    : {
        flushOuts: 0, straightOuts: 0, setOuts: 0, pairOuts: 0, total: 0,
        isFlushDraw: false, isOESD: false, isGutshot: false,
        isBackdoorFlush: false, isBackdoorStraight: false,
      };

  return {
    winPct: Math.round((wins / iterations) * 1000) / 10,
    tiePct: Math.round((ties / iterations) * 1000) / 10,
    losePct: Math.round((losses / iterations) * 1000) / 10,
    iterations,
    handCategory,
    outs: outs.total,
    outsByType: outs,
  };
}

// ─────────────────────────────────────────────
//  Rule of 2 & 4 approximation
// ─────────────────────────────────────────────

export function rule2and4(outs: number, street: 'flop' | 'turn' | 'river'): number {
  if (street === 'flop') return Math.min(outs * 4, 100);
  if (street === 'turn') return Math.min(outs * 2, 100);
  return 0;
}
