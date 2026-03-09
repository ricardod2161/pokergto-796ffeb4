// Poker Analysis Engine v2 — Board Texture, Equity & Recommendations

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface Card {
  rank: Rank;
  suit: Suit;
}

const RANK_VALUES: Record<Rank, number> = {
  "A": 14, "K": 13, "Q": 12, "J": 11, "T": 10,
  "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2
};

// ─────────────────────────────────────────────
//  BOARD TEXTURE
// ─────────────────────────────────────────────

export interface BoardTexture {
  wetness: "dry" | "semi-wet" | "wet" | "very-wet";
  wetnessScore: number;
  flushDraw: "none" | "backdoor" | "possible" | "completed";
  straightDraw: "none" | "gutshot" | "oesd" | "completed";
  paired: boolean;
  trips: boolean;
  highCard: Rank;
  connected: boolean;
  monotone: boolean;
  rainbow: boolean;
  wheelPossible: boolean; // A-2-3-4-5 possible
}

export function analyzeBoardTexture(board: Card[]): BoardTexture {
  if (board.length < 3) {
    return {
      wetness: "dry", wetnessScore: 0, flushDraw: "none", straightDraw: "none",
      paired: false, trips: false, highCard: "A", connected: false,
      monotone: false, rainbow: true, wheelPossible: false
    };
  }

  const suits = board.map(c => c.suit);
  const ranks = board.map(c => c.rank);
  const values = board.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);

  const suitCounts = suits.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {} as Record<string, number>);
  const maxSuitCount = Math.max(...Object.values(suitCounts));

  const monotone = maxSuitCount === board.length;
  const rainbow = Object.values(suitCounts).every(c => c === 1);

  let flushDraw: BoardTexture["flushDraw"] = "none";
  if (maxSuitCount >= 5) flushDraw = "completed";
  else if (maxSuitCount >= 4) flushDraw = "possible";
  else if (maxSuitCount >= 3) flushDraw = "possible";
  else if (maxSuitCount >= 2) flushDraw = "backdoor";

  const rankCounts = ranks.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {} as Record<string, number>);
  const maxRankCount = Math.max(...Object.values(rankCounts));
  const paired = maxRankCount >= 2;
  const trips = maxRankCount >= 3;

  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

  // Ace-low support
  const hasAce = uniqueValues.includes(14);
  const hasLowCards = uniqueValues.some(v => v <= 5);
  const wheelPossible = hasAce && uniqueValues.filter(v => v <= 5 || v === 14).length >= 2;
  const valuesForStraight = (hasAce && hasLowCards) ? [1, ...uniqueValues] : [...uniqueValues];

  let maxGap = 0;
  for (let i = 1; i < uniqueValues.length; i++) {
    maxGap = Math.max(maxGap, uniqueValues[i - 1] - uniqueValues[i]);
  }
  const connected = maxGap <= 2 && uniqueValues.length >= 3;

  let straightDraw: BoardTexture["straightDraw"] = "none";
  let boardHasStraight = false;
  for (let i = 0; i <= valuesForStraight.length - 5; i++) {
    if (valuesForStraight[i + 4] - valuesForStraight[i] === 4) { boardHasStraight = true; break; }
  }

  if (boardHasStraight) {
    straightDraw = "completed";
  } else {
    let isOESD = false;
    let isGutshot = false;
    for (let i = 0; i <= valuesForStraight.length - 4; i++) {
      const span = valuesForStraight[i + 3] - valuesForStraight[i];
      if (span === 3) { isOESD = true; break; }
      if (span === 4) { isGutshot = true; }
    }
    if (isOESD) straightDraw = "oesd";
    else if (isGutshot) straightDraw = "gutshot";
  }

  let wetnessScore = 0;
  if (flushDraw === "completed") wetnessScore += 40;
  else if (flushDraw === "possible") wetnessScore += 30;
  else if (flushDraw === "backdoor") wetnessScore += 10;

  if (straightDraw === "completed") wetnessScore += 40;
  else if (straightDraw === "oesd") wetnessScore += 25;
  else if (straightDraw === "gutshot") wetnessScore += 15;

  if (connected) wetnessScore += 15;
  if (paired) wetnessScore -= 10;
  if (values[0] <= 9) wetnessScore += 10;

  wetnessScore = Math.max(0, Math.min(100, wetnessScore));

  let wetness: BoardTexture["wetness"];
  if (wetnessScore <= 20) wetness = "dry";
  else if (wetnessScore <= 45) wetness = "semi-wet";
  else if (wetnessScore <= 70) wetness = "wet";
  else wetness = "very-wet";

  return {
    wetness, wetnessScore, flushDraw, straightDraw, paired, trips,
    highCard: ranks[values.indexOf(Math.max(...values))],
    connected, monotone, rainbow, wheelPossible
  };
}

// ─────────────────────────────────────────────
//  HAND ANALYSIS
// ─────────────────────────────────────────────

export type HandStrengthCategory =
  | "monster"
  | "top-pair"
  | "overpair"
  | "second-pair"
  | "draw"
  | "weak-made"
  | "air";

export type DrawType = "none" | "flush-draw" | "oesd" | "gutshot" | "combo-draw" | "backdoor";

export interface HandAnalysis {
  category: HandStrengthCategory;
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;
  isOESD: boolean;
  isGutshot: boolean;
  isComboDraws: boolean;  // flush + straight draw
  drawType: DrawType;
  drawOuts: number;
  madeHandStrength: number;
  equity: number;
}

export function analyzeHand(heroCards: Card[], board: Card[]): HandAnalysis {
  if (heroCards.length < 2 || board.length < 3) {
    return {
      category: "air", hasFlushDraw: false, hasStraightDraw: false,
      isOESD: false, isGutshot: false, isComboDraws: false, drawType: "none",
      drawOuts: 0, madeHandStrength: 0, equity: 50
    };
  }

  const allCards = [...heroCards, ...board];
  const heroRanks = heroCards.map(c => c.rank);
  const heroSuits = heroCards.map(c => c.suit);
  const boardRanks = board.map(c => c.rank);
  const boardValues = board.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const heroValues = heroCards.map(c => RANK_VALUES[c.rank]);

  let pairCount = 0;
  let topPair = false;
  let overpair = false;
  let trips = false;
  let twoPair = false;

  for (const heroRank of heroRanks) {
    const matches = boardRanks.filter(r => r === heroRank).length;
    if (matches >= 2) trips = true;
    if (matches >= 1) {
      pairCount++;
      if (RANK_VALUES[heroRank] === boardValues[0]) topPair = true;
    }
  }

  const minHeroValue = Math.min(...heroValues);
  if (heroRanks[0] === heroRanks[1] && minHeroValue > boardValues[0]) overpair = true;
  if (pairCount >= 2) twoPair = true;

  const suitCounts = allCards.reduce((acc, c) => ({ ...acc, [c.suit]: (acc[c.suit] || 0) + 1 }), {} as Record<string, number>);
  const hasFlushDraw = heroSuits.some(s => suitCounts[s] >= 4);
  const hasFlush = heroSuits.some(s => suitCounts[s] >= 5);

  const allValues = allCards.map(c => RANK_VALUES[c.rank]);
  const uniqueAllValues = [...new Set(allValues)].sort((a, b) => a - b);
  const hasAce = uniqueAllValues.includes(14);
  const hasLowCards = uniqueAllValues.some(v => v <= 5);
  const uniqueValues = (hasAce && hasLowCards) ? [1, ...uniqueAllValues] : [...uniqueAllValues];
  const heroValuesExt = heroValues.includes(14) ? [...heroValues, 1] : heroValues;

  let hasStraightDraw = false;
  let hasStraight = false;
  let isOESD = false;
  let isGutshot = false;

  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i + 4] - uniqueValues[i] === 4) {
      const straightVals = uniqueValues.slice(i, i + 5);
      if (heroValuesExt.some(v => straightVals.includes(v))) { hasStraight = true; break; }
    }
  }

  for (let i = 0; i <= uniqueValues.length - 4; i++) {
    const span = uniqueValues[i + 3] - uniqueValues[i];
    if (span <= 4) {
      const drawValues = uniqueValues.slice(i, i + 4);
      if (heroValuesExt.some(v => drawValues.includes(v))) {
        hasStraightDraw = true;
        if (span === 3) isOESD = true;
        else isGutshot = true;
        break;
      }
    }
  }

  const isComboDraws = (hasFlushDraw && !hasFlush) && (hasStraightDraw && !hasStraight);

  let drawOuts = 0;
  if (hasFlushDraw && !hasFlush) drawOuts += 9;
  if (hasStraightDraw && !hasStraight) drawOuts += isOESD ? 8 : 4;
  if (isComboDraws) drawOuts -= 2; // overlap correction

  let drawType: DrawType = "none";
  if (isComboDraws) drawType = "combo-draw";
  else if (hasFlushDraw && !hasFlush) drawType = "flush-draw";
  else if (isOESD) drawType = "oesd";
  else if (isGutshot) drawType = "gutshot";

  let category: HandStrengthCategory;
  let madeHandStrength: number;

  if (hasFlush || hasStraight || trips || twoPair) {
    category = "monster"; madeHandStrength = 85;
  } else if (overpair) {
    category = "overpair"; madeHandStrength = 70;
  } else if (topPair) {
    category = "top-pair"; madeHandStrength = 60;
  } else if (pairCount === 1) {
    category = "second-pair"; madeHandStrength = 40;
  } else if (hasFlushDraw || hasStraightDraw) {
    category = "draw"; madeHandStrength = 35;
  } else if (Math.max(...heroValues) >= 12) {
    category = "weak-made"; madeHandStrength = 25;
  } else {
    category = "air"; madeHandStrength = 10;
  }

  let equity = madeHandStrength;
  if (hasFlushDraw && !hasFlush) equity += isComboDraws ? 12 : 18;
  if (hasStraightDraw && !hasStraight) equity += isOESD ? 14 : 8;
  equity = Math.min(95, Math.max(5, equity));

  return {
    category,
    hasFlushDraw: hasFlushDraw && !hasFlush,
    hasStraightDraw: hasStraightDraw && !hasStraight,
    isOESD,
    isGutshot,
    isComboDraws,
    drawType,
    drawOuts,
    madeHandStrength,
    equity
  };
}

// ─────────────────────────────────────────────
//  BETTING RECOMMENDATION ENGINE
// ─────────────────────────────────────────────

export type BettingAction = "bet" | "check" | "raise" | "call" | "fold";
export type BettingSize = "25%" | "33%" | "50%" | "66%" | "75%" | "100%" | "125%" | "150%" | "all-in";

export interface DrawInfo {
  type: DrawType;
  outs: number;
  rule2: number;   // equity gained per street (outs × 2)
  rule4: number;   // equity to river (outs × 4)
}

export interface BettingRecommendation {
  primaryAction: BettingAction;
  sizing?: BettingSize;
  confidence: number;
  reason: string;
  equityNeeded?: number;
  potOdds?: number;
  evEstimate?: number;
  drawInfo?: DrawInfo;
  alternativeActions: Array<{
    action: BettingAction;
    sizing?: BettingSize;
    frequency: number;
    label?: string;
  }>;
}

export interface GameContext {
  heroCards: Card[];
  board: Card[];
  potSize: number;
  street: "flop" | "turn" | "river";
  position: "ip" | "oop";
  facingBet: boolean;
  betSize?: number;
  villainType: "unknown" | "tight" | "loose" | "aggressive" | "passive";
  stackSize: number;
}

export function getRecommendation(context: GameContext): BettingRecommendation {
  const boardTexture = analyzeBoardTexture(context.board);
  const handAnalysis = analyzeHand(context.heroCards, context.board);

  const { category, hasFlushDraw, hasStraightDraw, isOESD, drawType, drawOuts, equity: rawEquity } = handAnalysis;
  const { wetness, wetnessScore, paired } = boardTexture;

  // Villain-type equity adjustments
  let adjustedEquity = rawEquity;
  if (context.villainType === "tight") adjustedEquity -= 8;
  if (context.villainType === "loose") adjustedEquity += 5;
  adjustedEquity = Math.max(5, Math.min(95, adjustedEquity));

  let foldEquityBonus = 0;
  if (hasFlushDraw || hasStraightDraw) {
    if (context.villainType === "aggressive") foldEquityBonus = 15;
    if (context.villainType === "passive") foldEquityBonus = -20;
  }

  const equity = adjustedEquity;

  // Pot odds calculation
  const potOdds = context.facingBet && context.betSize
    ? Math.round((context.betSize / (context.potSize + context.betSize)) * 100 * 10) / 10
    : undefined;

  // Draw info
  let drawInfo: DrawInfo | undefined;
  if (drawType !== "none" && drawOuts > 0) {
    drawInfo = {
      type: drawType,
      outs: drawOuts,
      rule2: drawOuts * 2,
      rule4: drawOuts * 4,
    };
  }

  let primaryAction: BettingAction = "check";
  let sizing: BettingSize | undefined;
  let confidence = 50;
  let reason = "";
  const alternativeActions: BettingRecommendation["alternativeActions"] = [];

  if (category === "monster") {
    if (context.facingBet) {
      primaryAction = "raise";
      sizing = "100%";
      confidence = 90;
      reason = "Mão muito forte — raise para construir pote máximo";
      alternativeActions.push({ action: "call", frequency: 15, label: "Slowplay" });
    } else {
      primaryAction = "bet";
      sizing = wetness === "dry" ? "33%" : "75%";
      confidence = 85;
      reason = `Mão forte em board ${wetness === "dry" ? "seco" : "molhado"} — valor e proteção`;
      alternativeActions.push({ action: "check", frequency: 15, label: "Trap" });
    }
  } else if (category === "overpair" || category === "top-pair") {
    if (context.facingBet) {
      const odds = potOdds ?? 0;
      if (equity > odds + 10) {
        primaryAction = "call";
        confidence = 70;
        reason = `Pot odds favoráveis (${odds.toFixed(0)}% necessário vs ${equity.toFixed(0)}% equity)`;
        alternativeActions.push({ action: "raise", sizing: "75%", frequency: 20, label: "3-bet" });
      } else {
        primaryAction = "fold";
        confidence = 60;
        reason = "Pot odds desfavoráveis para continuar com mão marginal";
      }
    } else {
      primaryAction = "bet";
      if (wetness === "wet" || wetness === "very-wet") {
        sizing = "75%";
        reason = "Board molhado — apostando para proteção e valor";
      } else {
        sizing = "50%";
        reason = "Board seco — sizing menor para induzir calls";
      }
      confidence = 75;
      alternativeActions.push({ action: "check", frequency: 25, label: "Pot control" });
    }
  } else if (category === "draw") {
    const effectiveFoldEquity = 20 + foldEquityBonus;

    if (context.facingBet) {
      const impliedOdds = context.stackSize > context.potSize * 2;
      if (impliedOdds || equity > 30) {
        primaryAction = "call";
        confidence = 65;
        reason = `Draw com implied odds${impliedOdds ? " favoráveis" : ""} — ${drawOuts} outs (regra ${drawOuts * 2}%/${drawOuts * 4}%)`;
        alternativeActions.push({ action: "raise", sizing: "66%", frequency: 15, label: "Semi-bluff" });
      } else {
        primaryAction = "fold";
        confidence = 55;
        reason = "Draw fraco para pot odds atual sem implied odds suficientes";
      }
    } else {
      if (effectiveFoldEquity > 10 && (context.position === "ip" || wetnessScore > 50)) {
        primaryAction = "bet";
        sizing = handAnalysis.isComboDraws ? "66%" : "50%";
        confidence = 60;
        reason = `Semi-bluff com ${drawOuts} outs${handAnalysis.isComboDraws ? " (combo draw)" : ""}`;
        alternativeActions.push({ action: "check", frequency: 40, label: "Pot control" });
      } else {
        primaryAction = "check";
        confidence = 55;
        reason = "Check com draw OOP — controle de pote e pot odds favoráveis";
        alternativeActions.push({ action: "bet", sizing: "50%", frequency: 30, label: "Semi-bluff" });
      }
    }
  } else if (category === "second-pair" || category === "weak-made") {
    if (context.facingBet) {
      primaryAction = "fold";
      confidence = 70;
      reason = "Mão marginal enfrentando agressão — fold defensivo";
      alternativeActions.push({ action: "call", frequency: 20, label: "Float" });
    } else {
      primaryAction = "check";
      confidence = 65;
      reason = "Controle de pote com mão marginal";
      alternativeActions.push({ action: "bet", sizing: "25%", frequency: 25, label: "Probe" });
    }
  } else {
    if (context.facingBet) {
      primaryAction = "fold";
      confidence = 85;
      reason = "Sem equity — fold limpo";
    } else {
      const goodBluffSpot = context.position === "ip" &&
                           (paired || wetness === "dry") &&
                           context.street !== "river";
      if (goodBluffSpot) {
        primaryAction = "bet";
        sizing = "33%";
        confidence = 45;
        reason = "Spot de bluff — board favorece range do agressor IP";
        alternativeActions.push({ action: "check", frequency: 55, label: "Give up" });
      } else {
        primaryAction = "check";
        confidence = 75;
        reason = "Sem equity — give up";
      }
    }
  }

  let evEstimate = 0;
  if (primaryAction === "bet" || primaryAction === "raise") {
    const foldEq = category === "air" ? 40 : 20 + foldEquityBonus;
    evEstimate = (foldEq / 100) * context.potSize + (1 - foldEq / 100) * (equity / 100) * context.potSize * 1.5;
    evEstimate = Math.round(evEstimate * 10) / 10;
  }

  return {
    primaryAction,
    sizing,
    confidence,
    reason,
    equityNeeded: potOdds,
    potOdds,
    evEstimate,
    drawInfo,
    alternativeActions
  };
}

// ─────────────────────────────────────────────
//  MULTI-STREET PLANNING
// ─────────────────────────────────────────────

export interface StreetPlan {
  street: "flop" | "turn" | "river";
  action: BettingAction;
  sizing?: BettingSize;
  reasoning: string;
  spr: number;
  missScenario?: string; // what to do if draw misses
}

export function getMultiStreetPlan(context: GameContext): StreetPlan[] {
  const plans: StreetPlan[] = [];
  const handAnalysis = analyzeHand(context.heroCards, context.board);
  const boardTexture = analyzeBoardTexture(context.board);

  const initialSPR = context.stackSize / context.potSize;
  let currentPot = context.potSize;
  let currentStack = context.stackSize;

  const streets: Array<"flop" | "turn" | "river"> = ["flop", "turn", "river"];
  const startIndex = streets.indexOf(context.street);

  const DRAW_COMPLETE_FLOP_TURN = 0.35;
  const DRAW_COMPLETE_TURN_RIVER = 0.18;

  const handSeed = context.heroCards.reduce((acc, c) => acc + c.rank.charCodeAt(0) + c.suit.charCodeAt(0), 0);
  const pseudoRand = (salt: number) => {
    const x = Math.sin(handSeed + salt) * 10000;
    return x - Math.floor(x);
  };

  let drawCompleted: boolean | null = null;

  for (let i = startIndex; i < 3; i++) {
    const street = streets[i];
    const spr = currentStack / currentPot;

    let action: BettingAction = "check";
    let sizing: BettingSize | undefined;
    let reasoning = "";
    let missScenario: string | undefined;

    let effectiveCategory = handAnalysis.category;

    if (handAnalysis.category === "draw") {
      if (street === "turn" && drawCompleted === null) {
        drawCompleted = pseudoRand(1) < DRAW_COMPLETE_FLOP_TURN;
      } else if (street === "river" && drawCompleted === null) {
        drawCompleted = pseudoRand(2) < DRAW_COMPLETE_TURN_RIVER;
      } else if (street === "river" && drawCompleted === false) {
        drawCompleted = pseudoRand(3) < DRAW_COMPLETE_TURN_RIVER;
      }

      if (drawCompleted === true) effectiveCategory = "monster";
      else if (drawCompleted === false && street === "river") effectiveCategory = "air";
      else if (drawCompleted === false && street === "turn") effectiveCategory = "weak-made";
    }

    if (effectiveCategory === "monster" || effectiveCategory === "overpair") {
      if (spr > 2) {
        action = "bet";
        sizing = spr > 4 ? "66%" : "75%";
        reasoning = `Continuar construindo valor (SPR: ${spr.toFixed(1)})`;
      } else {
        action = "bet";
        sizing = "all-in";
        reasoning = `SPR baixo (${spr.toFixed(1)}) — all-in por valor`;
      }
    } else if (effectiveCategory === "draw" && handAnalysis.category === "draw") {
      if (street === "flop" || street === "turn") {
        action = "bet";
        sizing = "50%";
        reasoning = `Semi-bluff com ${handAnalysis.drawOuts} outs para melhorar`;
        missScenario = street === "turn"
          ? "Se draw não completar: give up no river ou bluff pequeno"
          : "Se draw não completar no turn: reduzir frequência de bet";
      } else {
        action = "check";
        reasoning = "River sem melhorar — give up ou value check";
      }
    } else if (handAnalysis.category === "draw" && effectiveCategory === "weak-made") {
      action = "check";
      reasoning = "Draw não completou no turn — controle de pote, aguarde river";
      missScenario = "Give up no river se draw não completar";
    } else if (handAnalysis.category === "draw" && effectiveCategory === "air") {
      action = "check";
      reasoning = "Draw não completou — give up ou bluff pequeno em boards favoráveis";
    } else if (effectiveCategory === "top-pair" || effectiveCategory === "second-pair") {
      if (street === "flop") {
        action = "bet";
        sizing = boardTexture.wetness === "dry" ? "33%" : "50%";
        reasoning = "Bet de valor fino com proteção";
      } else if (street === "turn") {
        action = spr > 3 ? "check" : "bet";
        sizing = action === "bet" ? "50%" : undefined;
        reasoning = action === "bet" ? "Continuar valor no turn" : "Pot control no turn";
      } else {
        action = "check";
        reasoning = "Check-call ou check-fold no river";
      }
    } else {
      if (street === "flop" && boardTexture.wetness === "dry") {
        action = "bet";
        sizing = "33%";
        reasoning = "C-bet light em board favorável";
      } else {
        action = "check";
        reasoning = "Give up sem equity";
      }
    }

    plans.push({ street, action, sizing, reasoning, spr, missScenario });

    if (sizing) {
      const betAmount = sizing === "all-in" ? currentStack
        : currentPot * (parseInt(sizing) / 100);
      currentPot += betAmount * 2;
      currentStack -= betAmount;
    }
  }

  return plans;
}
