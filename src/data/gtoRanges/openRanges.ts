// GTO Open Raise (RFI) Ranges
// Based on GTO+ / PioSolver 100bb 6-max solutions

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

// Position multipliers for EV calculation
const POS_MULT = {
  UTG: 0.6,
  UTG1: 0.65, // Slightly more liberal than UTG
  MP: 0.8,
  HJ: 0.9,
  CO: 1.1,
  BTN: 1.3,
  SB: 0.85,
  BB: 1.0 // Not applicable for open
};

function generateUTGOpen(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises (100%)
  applyAction(range, 
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77",
     "AKs", "AQs", "AJs", "ATs", "KQs", "KJs", "QJs",
     "AKo", "AQo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.UTG
  );
  
  // High frequency raises (70-90%)
  applyAction(range,
    ["66", "AJo", "KTs", "QTs", "JTs"],
    { raise: 0.85, call: 0, fold: 0.15 },
    POS_MULT.UTG
  );
  
  // Mixed raises (40-60%)
  applyAction(range,
    ["55", "A9s", "KJo", "T9s"],
    { raise: 0.50, call: 0, fold: 0.50 },
    POS_MULT.UTG
  );
  
  return range;
}

// UTG+1 is one seat to the left of UTG in 8-handed games.
// Slightly wider than UTG: 66 is pure raise, A9s raises more, KJo added, T9s more frequent.
function generateUTG1Open(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises (100%) — same as UTG core + 66 upgraded to pure
  applyAction(range, 
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66",
     "AKs", "AQs", "AJs", "ATs", "KQs", "KJs", "QJs",
     "AKo", "AQo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.UTG1
  );
  
  // High frequency raises
  applyAction(range,
    ["55", "AJo", "KTs", "QTs", "JTs"],
    { raise: 0.85, call: 0, fold: 0.15 },
    POS_MULT.UTG1
  );
  
  // A9s upgraded from 50% to 70%
  applyAction(range,
    ["A9s"],
    { raise: 0.70, call: 0, fold: 0.30 },
    POS_MULT.UTG1
  );
  
  // KJo added (new vs UTG)
  applyAction(range,
    ["KJo"],
    { raise: 0.40, call: 0, fold: 0.60 },
    POS_MULT.UTG1
  );
  
  // T9s upgraded from 50% to 75%
  applyAction(range,
    ["T9s"],
    { raise: 0.75, call: 0, fold: 0.25 },
    POS_MULT.UTG1
  );
  
  return range;
}

function generateMPOpen(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66",
     "AKs", "AQs", "AJs", "ATs", "A9s", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs",
     "AKo", "AQo", "AJo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.MP
  );
  
  // High frequency
  applyAction(range,
    ["55", "44", "A8s", "A7s", "K9s", "Q9s", "J9s", "T9s", "98s",
     "KQo", "KJo"],
    { raise: 0.85, call: 0, fold: 0.15 },
    POS_MULT.MP
  );
  
  // Mixed
  applyAction(range,
    ["33", "22", "A6s", "A5s", "A4s", "87s", "76s", "ATo", "KTo"],
    { raise: 0.55, call: 0, fold: 0.45 },
    POS_MULT.MP
  );
  
  return range;
}

function generateHJOpen(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55",
     "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s",
     "KQs", "KJs", "KTs", "K9s", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "98s",
     "AKo", "AQo", "AJo", "ATo", "KQo", "KJo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.HJ
  );
  
  // High frequency
  applyAction(range,
    ["44", "33", "A4s", "A3s", "A2s", "K8s", "Q8s", "J8s", "T8s", "87s", "76s", "65s",
     "KTo", "QJo"],
    { raise: 0.80, call: 0, fold: 0.20 },
    POS_MULT.HJ
  );
  
  // Mixed
  applyAction(range,
    ["22", "K7s", "K6s", "97s", "86s", "75s", "54s", "QTo", "JTo"],
    { raise: 0.50, call: 0, fold: 0.50 },
    POS_MULT.HJ
  );
  
  return range;
}

function generateCOOpen(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33",
     "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "QJs", "QTs", "Q9s", "Q8s",
     "JTs", "J9s", "J8s", "T9s", "T8s", "98s", "97s", "87s", "76s", "65s",
     "AKo", "AQo", "AJo", "ATo", "A9o", "KQo", "KJo", "KTo", "QJo", "QTo", "JTo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.CO
  );
  
  // High frequency
  applyAction(range,
    ["22", "K6s", "K5s", "K4s", "Q7s", "J7s", "T7s", "86s", "75s", "64s", "54s", "53s",
     "A8o", "A7o", "K9o", "Q9o"],
    { raise: 0.75, call: 0, fold: 0.25 },
    POS_MULT.CO
  );
  
  // Mixed
  applyAction(range,
    ["K3s", "K2s", "Q6s", "Q5s", "96s", "85s", "74s", "43s",
     "A6o", "A5o", "J9o", "T9o"],
    { raise: 0.45, call: 0, fold: 0.55 },
    POS_MULT.CO
  );
  
  return range;
}

function generateBTNOpen(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises - very wide
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22",
     "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
     "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s",
     "JTs", "J9s", "J8s", "J7s", "J6s", "T9s", "T8s", "T7s", "T6s",
     "98s", "97s", "96s", "87s", "86s", "85s", "76s", "75s", "74s", "65s", "64s", "54s", "53s", "43s",
     "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o",
     "KQo", "KJo", "KTo", "K9o", "K8o", "K7o", "QJo", "QTo", "Q9o", "Q8o",
     "JTo", "J9o", "J8o", "T9o", "T8o", "98o", "87o"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.BTN
  );
  
  // High frequency
  applyAction(range,
    ["Q3s", "Q2s", "J5s", "J4s", "T5s", "95s", "84s", "73s", "63s", "52s", "42s",
     "K6o", "K5o", "Q7o", "J7o", "T7o", "97o", "76o"],
    { raise: 0.70, call: 0, fold: 0.30 },
    POS_MULT.BTN
  );
  
  // Mixed
  applyAction(range,
    ["J3s", "J2s", "T4s", "T3s", "94s", "83s", "72s", "62s", "32s",
     "K4o", "K3o", "K2o", "Q6o", "Q5o", "J6o", "T6o", "96o", "86o", "75o", "65o", "54o"],
    { raise: 0.40, call: 0, fold: 0.60 },
    POS_MULT.BTN
  );
  
  return range;
}

function generateSBOpen(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Pure raises (vs BB only)
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22",
     "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
     "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s",
     "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "T9s", "T8s", "T7s", "T6s",
     "98s", "97s", "96s", "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s", "43s",
     "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o",
     "KQo", "KJo", "KTo", "K9o", "K8o", "K7o", "K6o", "K5o", "K4o",
     "QJo", "QTo", "Q9o", "Q8o", "Q7o", "JTo", "J9o", "J8o", "J7o",
     "T9o", "T8o", "T7o", "98o", "97o", "87o", "86o", "76o", "65o"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.SB
  );
  
  // High frequency
  applyAction(range,
    ["J4s", "J3s", "T5s", "T4s", "95s", "85s", "74s", "63s", "52s", "42s",
     "K3o", "K2o", "Q6o", "Q5o", "J6o", "T6o", "96o", "75o", "54o"],
    { raise: 0.65, call: 0, fold: 0.35 },
    POS_MULT.SB
  );
  
  return range;
}

// Export all open ranges
export const openRanges: Record<string, Record<string, HandData>> = {
  UTG: generateUTGOpen(),
  UTG1: generateUTG1Open(), // Distinct 8-handed UTG+1 range
  MP: generateMPOpen(),
  HJ: generateHJOpen(),
  CO: generateCOOpen(),
  BTN: generateBTNOpen(),
  SB: generateSBOpen(),
  BB: createEmptyRange() // BB doesn't open
};
