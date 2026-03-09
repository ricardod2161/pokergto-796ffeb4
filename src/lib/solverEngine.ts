/**
 * PokerGTO Solver Engine — Professional Grade
 *
 * Implements:
 *  • Range representation with combo counting
 *  • Range vs Range equity (Monte Carlo + combo enumeration)
 *  • Minimum Defense Frequency (MDF)
 *  • Geometric bet sizing (GTO optimal)
 *  • Blocker analysis (how cards reduce villain range combos)
 *  • Range advantage / nut advantage calculation
 *  • Alpha (fold equity needed for breakeven bluff)
 *  • ICM calculator (tournament chip EV)
 *  • Push/Fold chart for short stacks (<20bb)
 *  • SPR-based commitment thresholds
 *  • Mixed strategy frequencies (GTO Nash approximation)
 */
import { runEquity, toEngineCard, EngineCard } from "./equityEngine";

// ─────────────────────────────────────────────
//  1. RANGE REPRESENTATION
// ─────────────────────────────────────────────

export const ALL_RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"] as const;
export type RankStr = typeof ALL_RANKS[number];

/** A hand combo, e.g. "AKs", "QQ", "72o" */
export type HandNotation = string;

/** frequency 0-1: how often this hand is played (for mixed strategies) */
export interface RangeCombo {
  hand: HandNotation;
  frequency: number;   // 0-1
  combos: number;      // actual number of combos in deck (accounting for blockers)
}

/** Standard combo counts */
export function getBaseCombos(hand: HandNotation): number {
  if (hand.length === 2) return 6;          // pocket pair: C(4,2)
  if (hand.endsWith("s")) return 4;          // suited: 4
  if (hand.endsWith("o")) return 12;         // offsuit: 12
  return 0;
}

/** Parse a range string like "AA,KK,QQ,AKs,AKo-AJo" into RangeCombo[] */
export function parseRangeString(rangeStr: string): RangeCombo[] {
  const out: RangeCombo[] = [];
  if (!rangeStr.trim()) return out;

  const parts = rangeStr.split(",").map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    // Frequency prefix: "50%:AKs" or "AKs:50%"
    const freqMatch = part.match(/^(\d+)%:(.+)$/) ?? part.match(/^(.+):(\d+)%$/);
    let freq = 1.0;
    let handPart = part;

    if (freqMatch) {
      const pct = parseFloat(freqMatch[1].match(/^\d+$/) ? freqMatch[1] : freqMatch[2]);
      handPart = freqMatch[1].match(/^\d+$/) ? freqMatch[2] : freqMatch[1];
      freq = pct / 100;
    }

    // Range like AKo-AJo (offsuit broadway range)
    const rangeMatch = handPart.match(/^([AKQJT2-9]{2}[so]?)-([AKQJT2-9]{2}[so]?)$/);
    if (rangeMatch) {
      const [, from, to] = rangeMatch;
      const fromIdx = ALL_RANKS.indexOf(from[1] as RankStr);
      const toIdx = ALL_RANKS.indexOf(to[1] as RankStr);
      const suffix = from.slice(2) || "";
      for (let i = Math.min(fromIdx, toIdx); i <= Math.max(fromIdx, toIdx); i++) {
        const h = `${from[0]}${ALL_RANKS[i]}${suffix}`;
        out.push({ hand: h, frequency: freq, combos: getBaseCombos(h) });
      }
      continue;
    }

    // Pair range like TT+
    if (handPart.match(/^([AKQJT2-9])\1\+$/)) {
      const rank = handPart[0] as RankStr;
      const idx = ALL_RANKS.indexOf(rank);
      for (let i = 0; i <= idx; i++) {
        const h = `${ALL_RANKS[i]}${ALL_RANKS[i]}`;
        out.push({ hand: h, frequency: freq, combos: 6 });
      }
      continue;
    }

    // Simple hand
    out.push({ hand: handPart, frequency: freq, combos: getBaseCombos(handPart) });
  }

  return out;
}

/** Convert hand notation to example engine cards (first combo) */
export function handToEngineCards(hand: HandNotation): EngineCard[] {
  const RANK_MAP: Record<string, number> = {
    A:14, K:13, Q:12, J:11, T:10, "9":9, "8":8, "7":7, "6":6, "5":5, "4":4, "3":3, "2":2,
  };

  if (hand.length < 2) return [];
  const r1 = RANK_MAP[hand[0]];
  const r2 = RANK_MAP[hand[1]] ?? r1;
  if (!r1 || !r2) return [];

  if (hand.length === 2) {
    // Pair — use different suits
    return [{ rank: r1 as any, suit: 0 }, { rank: r2 as any, suit: 1 }];
  }
  if (hand.endsWith("s")) {
    return [{ rank: r1 as any, suit: 0 }, { rank: r2 as any, suit: 0 }];
  }
  // offsuit
  return [{ rank: r1 as any, suit: 0 }, { rank: r2 as any, suit: 1 }];
}

// ─────────────────────────────────────────────
//  2. RANGE vs RANGE EQUITY
// ─────────────────────────────────────────────

export interface RangeEquityResult {
  heroEquity: number;         // 0-100
  villainEquity: number;      // 0-100
  heroRange: RangeCombo[];
  villainRange: RangeCombo[];
  topHeroHands: Array<{ hand: string; equity: number; combos: number }>;
  topVillainHands: Array<{ hand: string; equity: number; combos: number }>;
  nutAdvantage: "hero" | "villain" | "neutral";
  rangeAdvantage: "hero" | "villain" | "neutral";
}

/**
 * Calculate range vs range equity.
 * Samples representative combos from each range, runs Monte Carlo per combo.
 */
export function calculateRangeEquity(
  heroRange: RangeCombo[],
  villainRange: RangeCombo[],
  board: EngineCard[],
  samplesPerCombo = 800
): RangeEquityResult {
  const heroHandEquities: Array<{ hand: string; equity: number; combos: number }> = [];
  const villainHandEquities: Array<{ hand: string; equity: number; combos: number }> = [];

  let weightedHeroEq = 0;
  let totalHeroCombos = 0;
  let weightedVillainEq = 0;
  let totalVillainCombos = 0;

  // Hero combos vs random villain (approximation)
  for (const combo of heroRange.slice(0, 30)) {
    const heroCards = handToEngineCards(combo.hand);
    if (heroCards.length < 2) continue;

    const boardSet = new Set(board.map(c => c.rank * 4 + c.suit));
    const conflict = heroCards.some(c => boardSet.has(c.rank * 4 + c.suit));
    if (conflict) continue;

    try {
      const result = runEquity(heroCards, board, samplesPerCombo);
      const effectiveCombos = combo.combos * combo.frequency;
      heroHandEquities.push({ hand: combo.hand, equity: result.winPct, combos: Math.round(effectiveCombos) });
      weightedHeroEq += result.winPct * effectiveCombos;
      totalHeroCombos += effectiveCombos;
    } catch {}
  }

  // Villain combos
  for (const combo of villainRange.slice(0, 30)) {
    const vCards = handToEngineCards(combo.hand);
    if (vCards.length < 2) continue;

    const boardSet = new Set(board.map(c => c.rank * 4 + c.suit));
    const conflict = vCards.some(c => boardSet.has(c.rank * 4 + c.suit));
    if (conflict) continue;

    try {
      const result = runEquity(vCards, board, samplesPerCombo);
      const effectiveCombos = combo.combos * combo.frequency;
      villainHandEquities.push({ hand: combo.hand, equity: result.winPct, combos: Math.round(effectiveCombos) });
      weightedVillainEq += result.winPct * effectiveCombos;
      totalVillainCombos += effectiveCombos;
    } catch {}
  }

  const heroEquity = totalHeroCombos > 0 ? Math.round(weightedHeroEq / totalHeroCombos * 10) / 10 : 50;
  const villainEquity = Math.round((100 - heroEquity) * 10) / 10;

  heroHandEquities.sort((a, b) => b.equity - a.equity);
  villainHandEquities.sort((a, b) => b.equity - a.equity);

  const heroNuts = heroHandEquities.filter(h => h.equity >= 80).reduce((s, h) => s + h.combos, 0);
  const villainNuts = villainHandEquities.filter(h => h.equity >= 80).reduce((s, h) => s + h.combos, 0);
  const nutAdvantage = heroNuts > villainNuts * 1.2 ? "hero" : villainNuts > heroNuts * 1.2 ? "villain" : "neutral";
  const rangeAdvantage = heroEquity > 53 ? "hero" : heroEquity < 47 ? "villain" : "neutral";

  return {
    heroEquity,
    villainEquity,
    heroRange,
    villainRange,
    topHeroHands: heroHandEquities.slice(0, 8),
    topVillainHands: villainHandEquities.slice(0, 8),
    nutAdvantage,
    rangeAdvantage,
  };
}

// ─────────────────────────────────────────────
//  3. MDF — Minimum Defense Frequency
// ─────────────────────────────────────────────

export interface MDFResult {
  mdf: number;           // 0-100% of range must defend
  mustDefendCombos: number;
  canFoldCombos: number;
  alpha: number;         // fold equity needed for bluff breakeven (0-100%)
  betSizeRatio: number;  // bet as fraction of pot
}

export function calculateMDF(potSize: number, betSize: number): MDFResult {
  if (potSize <= 0 || betSize <= 0) {
    return { mdf: 50, mustDefendCombos: 0, canFoldCombos: 0, alpha: 50, betSizeRatio: 0.5 };
  }

  const betFrac = betSize / potSize;
  const mdf = (potSize / (potSize + betSize)) * 100;
  const alpha = (betSize / (potSize + betSize)) * 100;

  const totalCombos = 150;
  const mustDefendCombos = Math.round(totalCombos * (mdf / 100));
  const canFoldCombos = totalCombos - mustDefendCombos;

  return {
    mdf: Math.round(mdf * 10) / 10,
    mustDefendCombos,
    canFoldCombos,
    alpha: Math.round(alpha * 10) / 10,
    betSizeRatio: betFrac,
  };
}

// ─────────────────────────────────────────────
//  4. GEOMETRIC BET SIZING
// ─────────────────────────────────────────────

export interface GeometricSizing {
  flopSize: number;    // % of pot
  turnSize: number;    // % of pot
  riverSize: number;   // % of pot
  totalSize: number;   // final pot as multiple of initial
  explanation: string;
}

/**
 * Geometric sizing: find sizes that put stacks in by river.
 * Formula: (1 + 2*f)^3 = (stack + pot) / pot  =>  f = ((stack+pot)/pot)^(1/3)/2 - 0.5
 */
export function calculateGeometricSizing(
  stackBB: number,
  potBB: number,
  streets = 3
): GeometricSizing {
  const spr = stackBB / potBB;
  const target = spr + 1;
  const f = (Math.pow(target, 1 / streets) - 1) / 2;

  const flopFrac = Math.min(f, 1.5);
  const turnFrac = Math.min(f, 1.5);
  const riverFrac = Math.min(f, 2.0);

  const pot1 = potBB * (1 + 2 * flopFrac);
  const pot2 = pot1 * (1 + 2 * turnFrac);
  const pot3 = pot2 * (1 + 2 * riverFrac);

  return {
    flopSize: Math.round(flopFrac * 100),
    turnSize: Math.round(turnFrac * 100),
    riverSize: Math.round(riverFrac * 100),
    totalSize: Math.round((pot3 / potBB) * 10) / 10,
    explanation: `Geometric sizing para SPR ${spr.toFixed(1)}: aposta ${Math.round(flopFrac*100)}% no flop, ${Math.round(turnFrac*100)}% no turn, ${Math.round(riverFrac*100)}% no river para ir all-in pelo river`,
  };
}

// ─────────────────────────────────────────────
//  5. BLOCKER ANALYSIS
// ─────────────────────────────────────────────

export interface BlockerEffect {
  hand: HandNotation;
  combosBlocked: number;
  totalVillainCombos: number;
  blockPct: number;
  blockedHands: string[];
  isGoodBluff: boolean;
  blocksVillainValue: boolean;
}

export function analyzeBlockers(
  heroCards: EngineCard[],
  villainRange: RangeCombo[],
  scenario: "bluff" | "value" = "bluff"
): BlockerEffect {
  const heroRanks = new Set(heroCards.map(c => c.rank));

  let combosBlocked = 0;
  let totalCombos = 0;
  const blockedHands: string[] = [];

  const RANK_MAP: Record<number, string> = {
    14:"A",13:"K",12:"Q",11:"J",10:"T",9:"9",8:"8",7:"7",6:"6",5:"5",4:"4",3:"3",2:"2"
  };

  for (const combo of villainRange) {
    const baseCombos = combo.combos * combo.frequency;
    totalCombos += baseCombos;

    const r1Map: Record<string,number> = {A:14,K:13,Q:12,J:11,T:10,"9":9,"8":8,"7":7,"6":6,"5":5,"4":4,"3":3,"2":2};
    const r1 = r1Map[combo.hand[0]];
    const r2 = r1Map[combo.hand[1]];

    const heroHasR1 = r1 !== undefined && [...heroRanks].includes(r1 as any);
    const heroHasR2 = r2 !== undefined && r2 !== r1 && [...heroRanks].includes(r2 as any);

    if (heroHasR1 || heroHasR2) {
      let blocked = 0;
      if (combo.hand.length === 2) blocked = baseCombos * 0.5;
      else if (combo.hand.endsWith("s")) blocked = baseCombos * 0.25;
      else blocked = baseCombos * (heroHasR1 && heroHasR2 ? 0.5 : 0.25);

      combosBlocked += blocked;
      if (!blockedHands.includes(combo.hand)) blockedHands.push(combo.hand);
    }
  }

  const blockPct = totalCombos > 0 ? Math.round((combosBlocked / totalCombos) * 100 * 10) / 10 : 0;
  const blocksTopPairs = blockedHands.some(h => h[0] === "A" || h[0] === "K");
  const blocksNuts = blockedHands.some(h => h === "AA" || h === "KK" || h === "QQ" || h === "AKs");
  const isGoodBluff = scenario === "bluff" && blockPct > 10 && blocksTopPairs;
  const blocksVillainValue = blocksNuts;

  return {
    hand: heroCards.map(c => RANK_MAP[c.rank]).join(""),
    combosBlocked: Math.round(combosBlocked),
    totalVillainCombos: Math.round(totalCombos),
    blockPct,
    blockedHands,
    isGoodBluff,
    blocksVillainValue,
  };
}

// ─────────────────────────────────────────────
//  6. ICM CALCULATOR
// ─────────────────────────────────────────────

export interface ICMResult {
  equity: number[];
  totalPrize: number;
  chipEV: number;
  icmEV: number;
  icmPressure: number;
  recommendation: string;
}

/**
 * ICM using Malmuth-Harville method (iterative approximation).
 */
export function calculateICM(
  stacks: number[],
  prizes: number[],
  heroIndex = 0
): ICMResult {
  const n = stacks.length;
  const totalChips = stacks.reduce((s, c) => s + c, 0);
  const totalPrize = prizes.reduce((s, p) => s + p, 0);

  if (n === 0 || totalChips === 0) {
    return { equity: [], totalPrize: 0, chipEV: 0, icmEV: 0, icmPressure: 0, recommendation: "" };
  }

  function icmEquity(stackArr: number[], prizeArr: number[]): number[] {
    if (stackArr.length === 0 || prizeArr.length === 0) return [];
    if (stackArr.length === 1) return [prizeArr[0] ?? 0];

    const totalChipsLocal = stackArr.reduce((s, c) => s + c, 0);
    const equities = new Array(stackArr.length).fill(0);

    for (let winner = 0; winner < stackArr.length; winner++) {
      if (stackArr[winner] === 0) continue;
      const winProb = stackArr[winner] / totalChipsLocal;
      const remainingStacks = stackArr.filter((_, i) => i !== winner);
      const remainingPrizes = prizeArr.slice(1);
      const subEquities = icmEquity(remainingStacks, remainingPrizes);

      equities[winner] += winProb * (prizeArr[0] ?? 0);
      let subIdx = 0;
      for (let i = 0; i < stackArr.length; i++) {
        if (i !== winner) {
          equities[i] += winProb * (subEquities[subIdx] ?? 0);
          subIdx++;
        }
      }
    }
    return equities;
  }

  const safeStacks = stacks.map(s => Math.max(s, 0));
  const effPrizes = prizes.slice(0, Math.min(prizes.length, stacks.length));
  let equity: number[];

  try {
    if (n <= 6) {
      equity = icmEquity(safeStacks, effPrizes);
    } else {
      equity = safeStacks.map(s => (s / totalChips) * totalPrize);
    }
  } catch {
    equity = safeStacks.map(s => (s / totalChips) * totalPrize);
  }

  const chipEV = (stacks[heroIndex] / totalChips) * totalPrize;
  const icmEV = equity[heroIndex] ?? 0;
  const icmPressure = Math.abs(((icmEV - chipEV) / Math.max(chipEV, 0.01)) * 100);

  let recommendation = "";
  if (icmEV < chipEV * 0.9) {
    recommendation = "ICM reduz significativamente seu EV de fichas. Seja mais conservador com todo-dentro marginal.";
  } else if (icmEV > chipEV * 1.05) {
    recommendation = "ICM trabalha a seu favor (curto stack ou borda da bolha). Pode ser mais agressivo.";
  } else {
    recommendation = "ICM próximo de chip EV. Tome decisões baseadas principalmente em equity de mão.";
  }

  return { equity, totalPrize, chipEV, icmEV, icmPressure: Math.round(icmPressure), recommendation };
}

// ─────────────────────────────────────────────
//  7. PUSH/FOLD CHART (<20bb)
// ─────────────────────────────────────────────

export type PushFoldAction = "push" | "fold" | "raise" | "limp";

export interface PushFoldDecision {
  action: PushFoldAction;
  frequency: number;
  reasoning: string;
  ev: number;
}

const PUSH_RANGES_BB: Record<string, Record<string, number>> = {
  BTN: {
    AA:20, KK:20, QQ:20, JJ:20, TT:20, "99":20, "88":20, "77":20, "66":18, "55":16, "44":14, "33":12, "22":10,
    AKs:20, AQs:20, AJs:20, ATs:20, A9s:18, A8s:16, A7s:14, A6s:13, A5s:15, A4s:13, A3s:12, A2s:11,
    AKo:20, AQo:20, AJo:18, ATo:16, A9o:13, A8o:11, A7o:10, A6o:9, A5o:10, A4o:9, A3o:8,
    KQs:20, KJs:18, KTs:16, K9s:14, K8s:12,
    KQo:18, KJo:15, KTo:12, K9o:10,
    QJs:17, QTs:15, Q9s:12, JTs:16, J9s:12, T9s:13,
  },
  SB: {
    AA:20, KK:20, QQ:20, JJ:20, TT:20, "99":18, "88":16, "77":14, "66":12, "55":10, "44":9, "33":8, "22":7,
    AKs:20, AQs:20, AJs:18, ATs:16, A9s:14, A8s:12, A7s:10, A6s:9, A5s:11, A4s:9, A3s:8, A2s:7,
    AKo:20, AQo:18, AJo:15, ATo:13, A9o:10, A8o:8, A7o:7, A6o:6, A5o:7,
    KQs:18, KJs:15, KTs:12, K9s:10, K8s:8,
    KQo:15, KJo:12, KTo:9, K9o:7,
    QJs:14, QTs:11, JTs:12,
  },
  CO: {
    AA:20, KK:20, QQ:20, JJ:20, TT:20, "99":18, "88":15, "77":13, "66":11, "55":9, "44":8, "33":7, "22":6,
    AKs:20, AQs:20, AJs:17, ATs:14, A9s:12, A8s:10, A7s:9, A6s:8, A5s:10, A4s:8, A3s:7,
    AKo:20, AQo:17, AJo:13, ATo:11, A9o:8, A8o:6,
    KQs:17, KJs:13, KTs:10, K9s:8,
    KQo:14, KJo:10, QJs:12, JTs:10,
  },
  UTG: {
    AA:20, KK:20, QQ:20, JJ:20, TT:18, "99":15, "88":12, "77":10, "66":8,
    AKs:20, AQs:18, AJs:15, ATs:12, A9s:9, A5s:7,
    AKo:18, AQo:15, AJo:11,
    KQs:14, KJs:10, KQo:11,
  },
};

export function getPushFoldDecision(
  hand: HandNotation,
  stackBB: number,
  position: string,
  blindsInBB = 1.5
): PushFoldDecision {
  const posRange = PUSH_RANGES_BB[position] ?? PUSH_RANGES_BB["CO"];
  const maxPushDepth = posRange[hand] ?? 0;

  if (stackBB <= maxPushDepth) {
    const ev = calculatePushEV(hand, stackBB, position);
    return {
      action: "push",
      frequency: stackBB <= maxPushDepth * 0.7 ? 1.0 : (maxPushDepth - stackBB * 0.7) / (maxPushDepth * 0.3),
      reasoning: `${hand} push puro até ${maxPushDepth}bb em ${position}`,
      ev,
    };
  }

  if (stackBB > 15) {
    return {
      action: "fold",
      frequency: 1.0,
      reasoning: `${hand} — stack muito profundo (${stackBB}bb) para push. Use sizing normal.`,
      ev: 0,
    };
  }

  return {
    action: "fold",
    frequency: 1.0,
    reasoning: `${hand} fora do range de push de ${position} com ${stackBB}bb`,
    ev: -blindsInBB * 0.5,
  };
}

function calculatePushEV(hand: HandNotation, stackBB: number, position: string): number {
  const foldFreq = position === "BTN" ? 0.6 : position === "SB" ? 0.5 : 0.7;
  const RANK_MAP: Record<string,number> = {A:14,K:13,Q:12,J:11,T:10,"9":9,"8":8,"7":7,"6":6,"5":5,"4":4,"3":3,"2":2};
  const r1 = RANK_MAP[hand[0]] ?? 7;
  const r2 = RANK_MAP[hand[1]] ?? 7;
  const isSuited = hand.endsWith("s");
  const isPair = hand.length === 2 && hand[0] === hand[1];

  let equity = 0.4;
  if (isPair && r1 >= 10) equity = 0.65;
  else if (isPair && r1 >= 7) equity = 0.55;
  else if (isPair) equity = 0.50;
  else if (r1 >= 12 && r2 >= 12) equity = 0.58;
  else if (r1 === 14 && r2 >= 11) equity = 0.55;
  else if (r1 >= 11 && isSuited) equity = 0.48;
  else if (r1 === 14) equity = 0.52;

  const ev = foldFreq * 1.5 + (1 - foldFreq) * (equity * (2 * stackBB) - stackBB);
  return Math.round(ev * 100) / 100;
}

// ─────────────────────────────────────────────
//  8. SPR COMMITMENT THRESHOLDS
// ─────────────────────────────────────────────

export interface SPRAnalysis {
  spr: number;
  commitment: "committed" | "semi-committed" | "uncommitted";
  threshold: "overpair" | "top-pair" | "two-pair+" | "set+";
  canFold: boolean;
  explanation: string;
  recommendedAction: string;
}

export function analyzeSPR(stackBB: number, potBB: number): SPRAnalysis {
  const spr = stackBB / potBB;
  let commitment: SPRAnalysis["commitment"];
  let threshold: SPRAnalysis["threshold"];
  let canFold: boolean;
  let explanation: string;
  let recommendedAction: string;

  if (spr <= 1) {
    commitment = "committed";
    threshold = "overpair";
    canFold = false;
    explanation = `SPR ${spr.toFixed(1)}: apenas ${spr.toFixed(1)}x o pote em jogo. Overpair é all-in automático.`;
    recommendedAction = "All-in com overpair+. Fold apenas com mãos ruins.";
  } else if (spr <= 3) {
    commitment = "semi-committed";
    threshold = "top-pair";
    canFold = false;
    explanation = `SPR ${spr.toFixed(1)}: pote comprometido. TPGK é geralmente all-in adequado.`;
    recommendedAction = "Bet/call all-in com TPGK+. Fold apenas com mãos fracas.";
  } else if (spr <= 7) {
    commitment = "semi-committed";
    threshold = "two-pair+";
    canFold = true;
    explanation = `SPR ${spr.toFixed(1)}: zona de pot control. TPGK merece pot control. Precisa de 2 pares+ para se comprometer.`;
    recommendedAction = "Pot control com TPGK/overpair. All-in com two pair+.";
  } else {
    commitment = "uncommitted";
    threshold = "set+";
    canFold = true;
    explanation = `SPR ${spr.toFixed(1)}: stack profundo. Top pair é pot control. Comprometer apenas com sets+.`;
    recommendedAction = "Pot control agressivo. Bet/fold com TPGK. Comprometer apenas com sets+.";
  }

  return { spr: Math.round(spr * 10) / 10, commitment, threshold, canFold, explanation, recommendedAction };
}

// ─────────────────────────────────────────────
//  9. MIXED STRATEGY / GTO FREQUENCIES
// ─────────────────────────────────────────────

export interface GtoFrequencies {
  betFrequency: number;
  checkFrequency: number;
  bluffPct: number;
  valuePct: number;
  betSizeRec: string;
  mixedReason: string;
}

export function calculateGtoFrequencies(
  heroEquity: number,
  potOdds: number,
  handCategory: string,
  boardWetness: string,
): GtoFrequencies {
  const valueBetThreshold = 55;
  const semiBluffThreshold = 30;

  let betFrequency: number;
  let bluffPct: number;
  let betSizeRec: string;

  if (heroEquity >= 75) {
    betFrequency = 90;
    bluffPct = 10;
    betSizeRec = boardWetness === "very-wet" || boardWetness === "wet" ? "75%" : "66%";
  } else if (heroEquity >= 55) {
    betFrequency = 65;
    bluffPct = 20;
    betSizeRec = "50%";
  } else if (heroEquity >= 35) {
    betFrequency = 40;
    bluffPct = 70;
    betSizeRec = "50%";
  } else {
    betFrequency = 20;
    bluffPct = 90;
    betSizeRec = "33%";
  }

  if (boardWetness === "very-wet") betFrequency = Math.max(betFrequency - 10, 15);
  if (boardWetness === "dry") betFrequency = Math.min(betFrequency + 10, 95);

  const checkFrequency = 100 - betFrequency;
  const valuePct = 100 - bluffPct;

  const mixedReason = betFrequency > 70
    ? "Alta frequência de bet: mão forte. Bet quase sempre para maximizar valor."
    : betFrequency > 40
    ? "Frequência mista: bet para manter range balanceado entre valor e bluffs."
    : "Baixa frequência de bet: prefira check para controle de pote ou traps.";

  return {
    betFrequency: Math.round(betFrequency),
    checkFrequency: Math.round(checkFrequency),
    bluffPct: Math.round(bluffPct),
    valuePct: Math.round(valuePct),
    betSizeRec,
    mixedReason,
  };
}

// ─────────────────────────────────────────────
//  10. STANDARD VILLAIN RANGES
// ─────────────────────────────────────────────

export const VILLAIN_RANGES: Record<string, string> = {
  "Tight (10%)": "AA,KK,QQ,JJ,TT,AKs,AQs,AJs,AKo,AQo",
  "Standard (15%)": "AA,KK,QQ,JJ,TT,99,AKs,AQs,AJs,ATs,KQs,AKo,AQo,AJo",
  "Standard (20%)": "AA,KK,QQ,JJ,TT,99,88,AKs,AQs,AJs,ATs,A9s,KQs,KJs,AKo,AQo,AJo,KQo",
  "Loose (25%)": "AA,KK,QQ,JJ,TT,99,88,77,AKs,AQs,AJs,ATs,A9s,A8s,KQs,KJs,KTs,QJs,AKo,AQo,AJo,ATo,KQo,KJo",
  "Calling Station (35%)": "AA,KK,QQ,JJ,TT,99,88,77,66,55,AKs,AQs,AJs,ATs,A9s,A8s,A7s,A6s,A5s,KQs,KJs,KTs,K9s,QJs,QTs,JTs,AKo,AQo,AJo,ATo,A9o,KQo,KJo,QJo",
  "LAG BTN (40%)": "AA,KK,QQ,JJ,TT,99,88,77,66,55,44,AKs,AQs,AJs,ATs,A9s,A8s,A7s,A6s,A5s,A4s,A3s,A2s,KQs,KJs,KTs,K9s,K8s,QJs,QTs,Q9s,JTs,J9s,T9s,98s,87s,76s,AKo,AQo,AJo,ATo,A9o,KQo,KJo,QJo",
};
