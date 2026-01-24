// GTO 3-Bet Ranges
// Based on GTO+ / PioSolver 100bb 6-max solutions

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

const POS_MULT = {
  UTG: 0.5,
  MP: 0.6,
  HJ: 0.75,
  CO: 0.9,
  BTN: 1.1,
  SB: 0.95,
  BB: 1.0
};

function generate3BetVsUTG(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Value 3-bets (pure)
  applyAction(range,
    ["AA", "KK", "QQ", "AKs", "AKo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.UTG
  );
  
  // Mixed value
  applyAction(range,
    ["JJ", "AQs"],
    { raise: 0.85, call: 0.15, fold: 0 },
    POS_MULT.UTG
  );
  
  // Bluff 3-bets (polarized)
  applyAction(range,
    ["A5s", "A4s"],
    { raise: 0.70, call: 0, fold: 0.30 },
    POS_MULT.UTG
  );
  
  applyAction(range,
    ["A3s", "A2s", "76s", "65s"],
    { raise: 0.35, call: 0, fold: 0.65 },
    POS_MULT.UTG
  );
  
  return range;
}

function generate3BetVsMP(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure value
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.MP
  );
  
  // Mixed value
  applyAction(range,
    ["TT", "AQo", "AJs", "KQs"],
    { raise: 0.80, call: 0.20, fold: 0 },
    POS_MULT.MP
  );
  
  // Bluff 3-bets
  applyAction(range,
    ["A5s", "A4s", "A3s"],
    { raise: 0.75, call: 0, fold: 0.25 },
    POS_MULT.MP
  );
  
  applyAction(range,
    ["A2s", "87s", "76s", "65s", "54s"],
    { raise: 0.45, call: 0, fold: 0.55 },
    POS_MULT.MP
  );
  
  return range;
}

function generate3BetVsCO(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure value
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AKo", "AQs", "AQo", "AJs", "KQs"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.CO
  );
  
  // Mixed value
  applyAction(range,
    ["99", "88", "ATs", "AJo", "KJs", "KQo", "QJs"],
    { raise: 0.75, call: 0.25, fold: 0 },
    POS_MULT.CO
  );
  
  // Bluff 3-bets (wider)
  applyAction(range,
    ["A5s", "A4s", "A3s", "A2s", "K9s", "Q9s", "J9s"],
    { raise: 0.80, call: 0, fold: 0.20 },
    POS_MULT.CO
  );
  
  applyAction(range,
    ["T9s", "98s", "87s", "76s", "65s", "54s", "K8s", "Q8s"],
    { raise: 0.50, call: 0, fold: 0.50 },
    POS_MULT.CO
  );
  
  return range;
}

function generate3BetVsBTN(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure value
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99",
     "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs",
     "KQs", "KQo", "KJs"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.BTN
  );
  
  // Mixed value
  applyAction(range,
    ["88", "77", "A9s", "KTs", "QJs", "QTs", "JTs", "KJo"],
    { raise: 0.70, call: 0.30, fold: 0 },
    POS_MULT.BTN
  );
  
  // Bluff 3-bets
  applyAction(range,
    ["A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K9s", "K8s", "Q9s", "J9s", "T9s"],
    { raise: 0.85, call: 0, fold: 0.15 },
    POS_MULT.BTN
  );
  
  applyAction(range,
    ["98s", "87s", "76s", "65s", "54s", "K7s", "K6s", "Q8s", "J8s", "T8s"],
    { raise: 0.55, call: 0, fold: 0.45 },
    POS_MULT.BTN
  );
  
  return range;
}

function generateBBvsSB(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Very wide vs SB open
  // Pure value
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77",
     "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "A9s",
     "KQs", "KQo", "KJs", "KTs", "QJs", "QTs", "JTs"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.BB
  );
  
  // Mixed value
  applyAction(range,
    ["66", "55", "44", "A8s", "A7s", "A6s", "A5s", "ATo",
     "K9s", "KJo", "Q9s", "J9s", "T9s", "98s"],
    { raise: 0.75, call: 0.25, fold: 0 },
    POS_MULT.BB
  );
  
  // Bluff 3-bets
  applyAction(range,
    ["33", "22", "A4s", "A3s", "A2s", "K8s", "K7s", "K6s", "K5s",
     "Q8s", "J8s", "T8s", "87s", "76s", "65s", "54s",
     "A9o", "A8o", "KTo", "QJo", "QTo", "JTo"],
    { raise: 0.50, call: 0.30, fold: 0.20 },
    POS_MULT.BB
  );
  
  return range;
}

// Export by position (3-bet ranges are relative to opener position)
export const threeBetRanges: Record<string, Record<string, HandData>> = {
  UTG: generate3BetVsUTG(),
  UTG1: generate3BetVsUTG(),
  MP: generate3BetVsMP(),
  HJ: generate3BetVsCO(), // Similar
  CO: generate3BetVsCO(),
  BTN: generate3BetVsBTN(),
  SB: generate3BetVsBTN(), // From SB vs BTN open
  BB: generateBBvsSB()     // BB vs SB special case
};
