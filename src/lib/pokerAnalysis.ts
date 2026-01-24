// Poker Analysis Engine - Board Texture, Equity & Recommendations

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface Card {
  rank: Rank;
  suit: Suit;
}

// Rank values for calculations
const RANK_VALUES: Record<Rank, number> = {
  "A": 14, "K": 13, "Q": 12, "J": 11, "T": 10,
  "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2
};

// Board Texture Analysis
export interface BoardTexture {
  wetness: "dry" | "semi-wet" | "wet" | "very-wet";
  wetnessScore: number; // 0-100
  flushDraw: "none" | "backdoor" | "possible" | "completed";
  straightDraw: "none" | "gutshot" | "oesd" | "completed";
  paired: boolean;
  trips: boolean;
  highCard: Rank;
  connected: boolean;
  monotone: boolean;
  rainbow: boolean;
}

export function analyzeBoardTexture(board: Card[]): BoardTexture {
  if (board.length < 3) {
    return {
      wetness: "dry",
      wetnessScore: 0,
      flushDraw: "none",
      straightDraw: "none",
      paired: false,
      trips: false,
      highCard: "A",
      connected: false,
      monotone: false,
      rainbow: true
    };
  }

  const suits = board.map(c => c.suit);
  const ranks = board.map(c => c.rank);
  const values = board.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  
  // Suit analysis
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxSuitCount = Math.max(...Object.values(suitCounts));
  
  const monotone = maxSuitCount === board.length;
  const rainbow = Object.values(suitCounts).every(c => c === 1);
  
  let flushDraw: BoardTexture["flushDraw"] = "none";
  if (maxSuitCount >= 5 || (board.length >= 5 && maxSuitCount >= 5)) {
    flushDraw = "completed";
  } else if (maxSuitCount >= 4 || (board.length >= 4 && maxSuitCount >= 4)) {
    flushDraw = "possible";
  } else if (maxSuitCount >= 3) {
    flushDraw = "possible";
  } else if (maxSuitCount >= 2) {
    flushDraw = "backdoor";
  }
  
  // Pair analysis
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxRankCount = Math.max(...Object.values(rankCounts));
  const paired = maxRankCount >= 2;
  const trips = maxRankCount >= 3;
  
  // Connectivity analysis
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  let maxGap = 0;
  for (let i = 1; i < uniqueValues.length; i++) {
    maxGap = Math.max(maxGap, uniqueValues[i - 1] - uniqueValues[i]);
  }
  const connected = maxGap <= 2 && uniqueValues.length >= 3;
  
  // Straight draw analysis
  let straightDraw: BoardTexture["straightDraw"] = "none";
  const spread = uniqueValues[0] - uniqueValues[uniqueValues.length - 1];
  
  if (spread <= 4 && uniqueValues.length >= 5) {
    straightDraw = "completed";
  } else if (spread <= 4 && uniqueValues.length >= 3) {
    straightDraw = "oesd";
  } else if (spread <= 5 && uniqueValues.length >= 3) {
    straightDraw = "gutshot";
  }
  
  // Wetness score
  let wetnessScore = 0;
  if (flushDraw === "completed") wetnessScore += 40;
  else if (flushDraw === "possible") wetnessScore += 30;
  else if (flushDraw === "backdoor") wetnessScore += 10;
  
  if (straightDraw === "completed") wetnessScore += 40;
  else if (straightDraw === "oesd") wetnessScore += 25;
  else if (straightDraw === "gutshot") wetnessScore += 15;
  
  if (connected) wetnessScore += 15;
  if (paired) wetnessScore -= 10;
  if (values[0] <= 9) wetnessScore += 10; // Low boards are wetter
  
  wetnessScore = Math.max(0, Math.min(100, wetnessScore));
  
  let wetness: BoardTexture["wetness"];
  if (wetnessScore <= 20) wetness = "dry";
  else if (wetnessScore <= 45) wetness = "semi-wet";
  else if (wetnessScore <= 70) wetness = "wet";
  else wetness = "very-wet";
  
  return {
    wetness,
    wetnessScore,
    flushDraw,
    straightDraw,
    paired,
    trips,
    highCard: ranks[values.indexOf(Math.max(...values))],
    connected,
    monotone,
    rainbow
  };
}

// Hand Strength Categories
export type HandStrengthCategory = 
  | "monster"      // Set+, two pair+
  | "top-pair"     // Top pair good kicker
  | "overpair"     // Pocket pair above board
  | "second-pair"  // Second pair
  | "draw"         // Flush draw or straight draw
  | "weak-made"    // Bottom pair, weak kicker
  | "air";         // Nothing

export interface HandAnalysis {
  category: HandStrengthCategory;
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;
  drawOuts: number;
  madeHandStrength: number; // 0-100
  equity: number; // 0-100 estimated
}

export function analyzeHand(heroCards: Card[], board: Card[]): HandAnalysis {
  if (heroCards.length < 2 || board.length < 3) {
    return {
      category: "air",
      hasFlushDraw: false,
      hasStraightDraw: false,
      drawOuts: 0,
      madeHandStrength: 0,
      equity: 50
    };
  }

  const allCards = [...heroCards, ...board];
  const heroRanks = heroCards.map(c => c.rank);
  const heroSuits = heroCards.map(c => c.suit);
  const boardRanks = board.map(c => c.rank);
  const boardValues = board.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  
  // Check for pairs with board
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
  
  // Check overpair
  const minHeroValue = Math.min(...heroValues);
  if (heroRanks[0] === heroRanks[1] && minHeroValue > boardValues[0]) {
    overpair = true;
  }
  
  // Two pair
  if (pairCount >= 2) twoPair = true;
  
  // Flush draw check
  const suitCounts = allCards.reduce((acc, c) => {
    acc[c.suit] = (acc[c.suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const hasFlushDraw = heroSuits.some(s => suitCounts[s] >= 4);
  const hasFlush = heroSuits.some(s => suitCounts[s] >= 5);
  
  // Straight draw (simplified)
  const allValues = allCards.map(c => RANK_VALUES[c.rank]);
  const uniqueValues = [...new Set(allValues)].sort((a, b) => a - b);
  
  let hasStraightDraw = false;
  let hasStraight = false;
  
  // Check for 5 consecutive
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i + 4] - uniqueValues[i] === 4) {
      hasStraight = true;
      break;
    }
  }
  
  // Check for 4 within 5 gap
  for (let i = 0; i <= uniqueValues.length - 4; i++) {
    if (uniqueValues[i + 3] - uniqueValues[i] <= 4) {
      hasStraightDraw = true;
      break;
    }
  }
  
  // Calculate draw outs
  let drawOuts = 0;
  if (hasFlushDraw && !hasFlush) drawOuts += 9;
  if (hasStraightDraw && !hasStraight) drawOuts += hasStraightDraw ? 8 : 4;
  
  // Determine category
  let category: HandStrengthCategory;
  let madeHandStrength: number;
  
  if (hasFlush || hasStraight || trips || twoPair) {
    category = "monster";
    madeHandStrength = 85;
  } else if (overpair) {
    category = "overpair";
    madeHandStrength = 70;
  } else if (topPair) {
    category = "top-pair";
    madeHandStrength = 60;
  } else if (pairCount === 1) {
    category = "second-pair";
    madeHandStrength = 40;
  } else if (hasFlushDraw || hasStraightDraw) {
    category = "draw";
    madeHandStrength = 35;
  } else if (Math.max(...heroValues) >= 12) {
    category = "weak-made";
    madeHandStrength = 25;
  } else {
    category = "air";
    madeHandStrength = 10;
  }
  
  // Estimate equity
  let equity = madeHandStrength;
  if (hasFlushDraw && !hasFlush) equity += 18;
  if (hasStraightDraw && !hasStraight) equity += 12;
  equity = Math.min(95, Math.max(5, equity));
  
  return {
    category,
    hasFlushDraw: hasFlushDraw && !hasFlush,
    hasStraightDraw: hasStraightDraw && !hasStraight,
    drawOuts,
    madeHandStrength,
    equity
  };
}

// Betting Recommendation Engine
export type BettingAction = "bet" | "check" | "raise" | "call" | "fold";
export type BettingSize = "33%" | "50%" | "66%" | "75%" | "100%" | "125%" | "150%" | "all-in";

export interface BettingRecommendation {
  primaryAction: BettingAction;
  sizing?: BettingSize;
  confidence: number; // 0-100
  reason: string;
  equityNeeded?: number;
  evEstimate?: number; // bb
  alternativeActions: Array<{
    action: BettingAction;
    sizing?: BettingSize;
    frequency: number;
  }>;
}

export interface GameContext {
  heroCards: Card[];
  board: Card[];
  potSize: number; // in bb
  street: "flop" | "turn" | "river";
  position: "ip" | "oop";
  facingBet: boolean;
  betSize?: number; // in bb
  villainType: "unknown" | "tight" | "loose" | "aggressive" | "passive";
  stackSize: number; // effective in bb
}

export function getRecommendation(context: GameContext): BettingRecommendation {
  const boardTexture = analyzeBoardTexture(context.board);
  const handAnalysis = analyzeHand(context.heroCards, context.board);
  
  const { category, hasFlushDraw, hasStraightDraw, equity } = handAnalysis;
  const { wetness, wetnessScore, paired } = boardTexture;
  
  // Base recommendation logic
  let primaryAction: BettingAction = "check";
  let sizing: BettingSize | undefined;
  let confidence = 50;
  let reason = "";
  const alternativeActions: BettingRecommendation["alternativeActions"] = [];
  
  // Monster hands
  if (category === "monster") {
    if (context.facingBet) {
      primaryAction = "raise";
      sizing = "100%";
      confidence = 90;
      reason = "Mão muito forte - construindo pote por valor";
    } else {
      primaryAction = "bet";
      sizing = wetness === "dry" ? "33%" : "75%";
      confidence = 85;
      reason = `Mão forte em board ${wetness === "dry" ? "seco" : "molhado"} - valor e proteção`;
      alternativeActions.push({ action: "check", frequency: 15 });
    }
  }
  // Overpair / Top Pair
  else if (category === "overpair" || category === "top-pair") {
    if (context.facingBet) {
      const potOdds = context.betSize ? (context.betSize / (context.potSize + context.betSize)) * 100 : 0;
      if (equity > potOdds + 10) {
        primaryAction = "call";
        confidence = 70;
        reason = `Pot odds favoráveis (${potOdds.toFixed(0)}% vs ${equity.toFixed(0)}% equity)`;
        alternativeActions.push({ action: "raise", sizing: "75%", frequency: 20 });
      } else {
        primaryAction = "fold";
        confidence = 60;
        reason = "Pot odds desfavoráveis para continuar";
      }
    } else {
      primaryAction = "bet";
      if (wetness === "wet" || wetness === "very-wet") {
        sizing = "75%";
        reason = "Board molhado - apostando para proteção e valor";
      } else {
        sizing = "50%";
        reason = "Board seco - sizing menor para induzir calls";
      }
      confidence = 75;
      alternativeActions.push({ action: "check", frequency: 25 });
    }
  }
  // Draws
  else if (category === "draw") {
    const drawStrength = (hasFlushDraw ? 1 : 0) + (hasStraightDraw ? 0.7 : 0);
    
    if (context.facingBet) {
      const impliedOdds = context.stackSize > context.potSize * 2;
      if (impliedOdds || equity > 30) {
        primaryAction = "call";
        confidence = 65;
        reason = `Draw forte com implied odds${impliedOdds ? " favoráveis" : ""}`;
      } else {
        primaryAction = "fold";
        confidence = 55;
        reason = "Draw fraco para pot odds atual";
      }
    } else {
      // Semi-bluff opportunity
      if (context.position === "ip" || wetnessScore > 50) {
        primaryAction = "bet";
        sizing = "66%";
        confidence = 60;
        reason = "Semi-bluff com equity de draw";
        alternativeActions.push({ action: "check", frequency: 40 });
      } else {
        primaryAction = "check";
        confidence = 55;
        reason = "Check com draw OOP para controlar tamanho do pote";
        alternativeActions.push({ action: "bet", sizing: "50%", frequency: 30 });
      }
    }
  }
  // Second pair / Weak made hands
  else if (category === "second-pair" || category === "weak-made") {
    if (context.facingBet) {
      primaryAction = "fold";
      confidence = 70;
      reason = "Mão marginal enfrentando agressão - fold defensivo";
      alternativeActions.push({ action: "call", frequency: 20 });
    } else {
      primaryAction = "check";
      confidence = 65;
      reason = "Controle de pote com mão marginal";
      alternativeActions.push({ action: "bet", sizing: "33%", frequency: 25 });
    }
  }
  // Air
  else {
    if (context.facingBet) {
      primaryAction = "fold";
      confidence = 85;
      reason = "Sem equity - fold limpo";
    } else {
      // Bluff spots
      const goodBluffSpot = context.position === "ip" && 
                           (paired || wetness === "dry") && 
                           context.street !== "river";
      
      if (goodBluffSpot) {
        primaryAction = "bet";
        sizing = "33%";
        confidence = 45;
        reason = "Spot de bluff - board favorece range do agressor";
        alternativeActions.push({ action: "check", frequency: 55 });
      } else {
        primaryAction = "check";
        confidence = 75;
        reason = "Sem equity - give up";
      }
    }
  }
  
  // EV estimate
  let evEstimate = 0;
  if (primaryAction === "bet" || primaryAction === "raise") {
    const foldEquity = category === "air" ? 40 : 20;
    const valueEquity = equity / 100;
    evEstimate = (foldEquity / 100) * context.potSize + (1 - foldEquity / 100) * valueEquity * context.potSize * 1.5;
    evEstimate = Math.round(evEstimate * 10) / 10;
  }
  
  return {
    primaryAction,
    sizing,
    confidence,
    reason,
    equityNeeded: context.betSize ? Math.round((context.betSize / (context.potSize + context.betSize)) * 100) : undefined,
    evEstimate,
    alternativeActions
  };
}

// Multi-street planning
export interface StreetPlan {
  street: "flop" | "turn" | "river";
  action: BettingAction;
  sizing?: BettingSize;
  reasoning: string;
  spr: number;
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
  
  for (let i = startIndex; i < 3; i++) {
    const street = streets[i];
    const spr = currentStack / currentPot;
    
    let action: BettingAction = "check";
    let sizing: BettingSize | undefined;
    let reasoning = "";
    
    // Strong hands - keep betting
    if (handAnalysis.category === "monster" || handAnalysis.category === "overpair") {
      if (spr > 2) {
        action = "bet";
        sizing = spr > 4 ? "66%" : "75%";
        reasoning = `Continuar construindo valor (SPR: ${spr.toFixed(1)})`;
      } else {
        action = "bet";
        sizing = "all-in";
        reasoning = `SPR baixo (${spr.toFixed(1)}) - all-in por valor`;
      }
    }
    // Draws - depends on street
    else if (handAnalysis.category === "draw") {
      if (street === "flop" || street === "turn") {
        action = "bet";
        sizing = "50%";
        reasoning = "Semi-bluff com outs para melhorar";
      } else {
        if (handAnalysis.equity < 30) {
          action = "check";
          reasoning = "River sem melhorar - give up ou value check";
        } else {
          action = "bet";
          sizing = "66%";
          reasoning = "Draw completou - value bet";
        }
      }
    }
    // Marginal hands - pot control
    else if (handAnalysis.category === "top-pair" || handAnalysis.category === "second-pair") {
      if (street === "flop") {
        action = "bet";
        sizing = boardTexture.wetness === "dry" ? "33%" : "50%";
        reasoning = "Bet de valor fino";
      } else if (street === "turn") {
        action = spr > 3 ? "check" : "bet";
        sizing = action === "bet" ? "50%" : undefined;
        reasoning = action === "bet" ? "Continuar valor" : "Pot control no turn";
      } else {
        action = "check";
        reasoning = "Check-call ou check-fold no river";
      }
    }
    // Air - bluff or give up
    else {
      if (street === "flop" && boardTexture.wetness === "dry") {
        action = "bet";
        sizing = "33%";
        reasoning = "C-bet light em board favorável";
      } else {
        action = "check";
        reasoning = "Give up sem equity";
      }
    }
    
    plans.push({ street, action, sizing, reasoning, spr });
    
    // Update pot/stack for next street
    if (sizing) {
      const betAmount = sizing === "all-in" ? currentStack :
                        currentPot * (parseInt(sizing) / 100);
      currentPot += betAmount * 2;
      currentStack -= betAmount;
    }
  }
  
  return plans;
}
