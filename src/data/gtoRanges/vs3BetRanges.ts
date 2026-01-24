// GTO vs 3-Bet Ranges
// What to do when facing a 3-bet after opening

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

function generateVs3BetFromUTG(): Record<string, HandData> {
  // Very tight vs 3-bet when opened UTG
  const range = createEmptyRange();
  
  // 4-bet or call (never fold)
  applyAction(range,
    ["AA", "KK"],
    { raise: 1.0, call: 0, fold: 0 },
    1.3
  );
  
  applyAction(range,
    ["QQ", "AKs"],
    { raise: 0.85, call: 0.15, fold: 0 },
    1.2
  );
  
  applyAction(range,
    ["JJ", "AKo", "AQs"],
    { raise: 0.50, call: 0.45, fold: 0.05 },
    1.1
  );
  
  // Calling range
  applyAction(range,
    ["TT", "99", "AQo", "AJs", "KQs"],
    { raise: 0.15, call: 0.70, fold: 0.15 },
    0.95
  );
  
  // Fold most of opening range vs 3-bet
  applyAction(range,
    ["88", "77", "ATs", "KJs", "QJs", "JTs"],
    { raise: 0, call: 0.35, fold: 0.65 },
    0.75
  );
  
  return range;
}

function generateVs3BetFromMP(): Record<string, HandData> {
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "AKs", "AKo"],
    { raise: 1.0, call: 0, fold: 0 },
    1.25
  );
  
  applyAction(range,
    ["JJ", "AQs"],
    { raise: 0.65, call: 0.35, fold: 0 },
    1.15
  );
  
  applyAction(range,
    ["TT", "99", "AQo", "AJs", "KQs"],
    { raise: 0.25, call: 0.65, fold: 0.10 },
    1.0
  );
  
  applyAction(range,
    ["88", "77", "66", "ATs", "KJs", "KTs", "QJs", "JTs", "T9s"],
    { raise: 0.05, call: 0.55, fold: 0.40 },
    0.85
  );
  
  return range;
}

function generateVs3BetFromCO(): Record<string, HandData> {
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "AKs", "AKo"],
    { raise: 1.0, call: 0, fold: 0 },
    1.2
  );
  
  applyAction(range,
    ["TT", "99", "AQs", "AQo", "AJs", "KQs"],
    { raise: 0.50, call: 0.45, fold: 0.05 },
    1.1
  );
  
  applyAction(range,
    ["88", "77", "66", "ATs", "A9s", "KJs", "KTs", "QJs", "QTs", "JTs"],
    { raise: 0.15, call: 0.65, fold: 0.20 },
    0.95
  );
  
  applyAction(range,
    ["55", "44", "A8s", "A7s", "A6s", "A5s", "K9s", "T9s", "98s", "87s", "76s",
     "AJo", "KQo"],
    { raise: 0.05, call: 0.50, fold: 0.45 },
    0.8
  );
  
  return range;
}

function generateVs3BetFromBTN(): Record<string, HandData> {
  // Widest vs 3-bet (opened wide)
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AKo", "AQs"],
    { raise: 1.0, call: 0, fold: 0 },
    1.25
  );
  
  applyAction(range,
    ["99", "88", "AQo", "AJs", "ATs", "KQs", "KJs"],
    { raise: 0.45, call: 0.50, fold: 0.05 },
    1.1
  );
  
  applyAction(range,
    ["77", "66", "55", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s",
     "KTs", "K9s", "QJs", "QTs", "JTs", "T9s", "98s"],
    { raise: 0.15, call: 0.65, fold: 0.20 },
    0.95
  );
  
  applyAction(range,
    ["44", "33", "22", "A3s", "A2s", "K8s", "K7s", "Q9s", "J9s",
     "87s", "76s", "65s", "54s",
     "AJo", "ATo", "KQo", "KJo", "QJo"],
    { raise: 0.05, call: 0.45, fold: 0.50 },
    0.8
  );
  
  return range;
}

function generateVs3BetFromSB(): Record<string, HandData> {
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT",
     "AKs", "AKo", "AQs", "AQo"],
    { raise: 1.0, call: 0, fold: 0 },
    1.15
  );
  
  applyAction(range,
    ["99", "88", "AJs", "ATs", "KQs", "KJs"],
    { raise: 0.40, call: 0.55, fold: 0.05 },
    1.0
  );
  
  applyAction(range,
    ["77", "66", "A9s", "A8s", "A5s", "KTs", "QJs", "QTs", "JTs", "T9s"],
    { raise: 0.10, call: 0.60, fold: 0.30 },
    0.9
  );
  
  return range;
}

export const vs3BetRanges: Record<string, Record<string, HandData>> = {
  UTG: generateVs3BetFromUTG(),
  UTG1: generateVs3BetFromUTG(),
  MP: generateVs3BetFromMP(),
  HJ: generateVs3BetFromMP(),
  CO: generateVs3BetFromCO(),
  BTN: generateVs3BetFromBTN(),
  SB: generateVs3BetFromSB()
};
