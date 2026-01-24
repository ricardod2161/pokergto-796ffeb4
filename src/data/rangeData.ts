type HandAction = "raise" | "call" | "fold" | "mixed";

interface HandData {
  action: HandAction;
  frequency: number;
  ev?: number;
}

const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

// Helper to generate range based on tightness percentage
const generateRange = (config: {
  premiumPairs: boolean;
  mediumPairs: boolean;
  smallPairs: boolean;
  broadwaysSuited: boolean;
  broadwaysOffsuit: boolean;
  suitedConnectors: boolean;
  suitedAces: boolean;
  suitedGappers: boolean;
  offsuitsWeak: boolean;
}): Record<string, HandData> => {
  const range: Record<string, HandData> = {};
  
  // Fill all with folds first
  for (let i = 0; i < ranks.length; i++) {
    for (let j = 0; j < ranks.length; j++) {
      let hand: string;
      if (i === j) {
        hand = `${ranks[i]}${ranks[j]}`;
      } else if (i < j) {
        hand = `${ranks[i]}${ranks[j]}s`;
      } else {
        hand = `${ranks[j]}${ranks[i]}o`;
      }
      range[hand] = { action: "fold", frequency: 0, ev: -0.02 };
    }
  }

  // Premium pairs (AA-TT)
  if (config.premiumPairs) {
    ["AA", "KK", "QQ", "JJ", "TT"].forEach(h => {
      range[h] = { action: "raise", frequency: 1, ev: 0.15 };
    });
  }

  // Medium pairs (99-66)
  if (config.mediumPairs) {
    ["99", "88", "77", "66"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.9, ev: 0.06 };
    });
  }

  // Small pairs (55-22)
  if (config.smallPairs) {
    ["55", "44", "33", "22"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.7, ev: 0.02 };
    });
  }

  // Broadway suited
  if (config.broadwaysSuited) {
    ["AKs", "AQs", "AJs", "ATs", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs"].forEach(h => {
      range[h] = { action: "raise", frequency: 1, ev: 0.10 };
    });
  }

  // Broadway offsuit
  if (config.broadwaysOffsuit) {
    ["AKo", "AQo", "AJo", "ATo", "KQo", "KJo", "QJo"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.85, ev: 0.05 };
    });
  }

  // Suited connectors
  if (config.suitedConnectors) {
    ["T9s", "98s", "87s", "76s", "65s", "54s"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.7, ev: 0.02 };
    });
  }

  // Suited aces
  if (config.suitedAces) {
    ["A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.8, ev: 0.03 };
    });
  }

  // Suited gappers
  if (config.suitedGappers) {
    ["J9s", "T8s", "97s", "86s", "75s", "64s", "53s"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.5, ev: 0.01 };
    });
  }

  // Weak offsuit (K9o, Q9o etc)
  if (config.offsuitsWeak) {
    ["KTo", "QTo", "JTo", "K9o", "Q9o"].forEach(h => {
      range[h] = { action: "raise", frequency: 0.6, ev: 0.01 };
    });
  }

  return range;
};

// Position-based opening ranges
export const openRanges: Record<string, Record<string, HandData>> = {
  UTG: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  UTG1: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  MP: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  HJ: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  CO: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: false,
  }),
  BTN: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
  SB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: true,
  }),
  BB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
};

// 3-Bet ranges (tighter)
export const threeBetRanges: Record<string, Record<string, HandData>> = {
  UTG: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: false,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  MP: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: false,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  HJ: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  CO: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BTN: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  SB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
};

// Cold Call ranges (calling a raise)
export const coldCallRanges: Record<string, Record<string, HandData>> = {
  MP: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: true,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  HJ: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  CO: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: false,
  }),
  BTN: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
  SB: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BB: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
};

// Squeeze ranges (3-betting after raise + call)
export const squeezeRanges: Record<string, Record<string, HandData>> = {
  CO: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BTN: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  SB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: false,
  }),
};

// Iso-Raise ranges (raising over limpers)
export const isoRaiseRanges: Record<string, Record<string, HandData>> = {
  MP: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  HJ: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: true,
  }),
  CO: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
  BTN: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
  SB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
};

// vs 3-Bet ranges (what to do facing a 3-bet)
export const vs3BetRanges: Record<string, Record<string, HandData>> = {
  UTG: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  MP: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  HJ: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  CO: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BTN: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: false,
  }),
  SB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
};

// 4-Bet ranges
export const fourBetRanges: Record<string, Record<string, HandData>> = {
  UTG: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: false,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  MP: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: false,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: false,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  CO: generateRange({
    premiumPairs: true,
    mediumPairs: false,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BTN: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  SB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  BB: generateRange({
    premiumPairs: true,
    mediumPairs: true,
    smallPairs: false,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: false,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
};

// BB Defense ranges (defending big blind vs raises)
export const bbDefenseRanges: Record<string, Record<string, HandData>> = {
  vsUTG: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: false,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: false,
    offsuitsWeak: false,
  }),
  vsMP: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: false,
  }),
  vsCO: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
  vsBTN: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
  vsSB: generateRange({
    premiumPairs: false,
    mediumPairs: true,
    smallPairs: true,
    broadwaysSuited: true,
    broadwaysOffsuit: true,
    suitedConnectors: true,
    suitedAces: true,
    suitedGappers: true,
    offsuitsWeak: true,
  }),
};

// Legacy export for backward compatibility
export const positionRanges = openRanges;
