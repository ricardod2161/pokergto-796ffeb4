// GTO Squeeze Ranges
// 3-betting after a raise and one or more callers

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

function generateSqueezeFromCO(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Value squeezes
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"],
    { raise: 1.0, call: 0, fold: 0 },
    1.0
  );
  
  applyAction(range,
    ["TT", "99", "AQo", "AJs", "KQs"],
    { raise: 0.75, call: 0.20, fold: 0.05 },
    1.0
  );
  
  // Bluff squeezes (fold equity high)
  applyAction(range,
    ["A5s", "A4s", "A3s", "A2s"],
    { raise: 0.80, call: 0, fold: 0.20 },
    0.85
  );
  
  applyAction(range,
    ["K9s", "K8s", "Q9s", "J9s", "T9s"],
    { raise: 0.50, call: 0.30, fold: 0.20 },
    0.85
  );
  
  return range;
}

function generateSqueezeFromBTN(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Wider value from position
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99",
     "AKs", "AKo", "AQs", "AQo", "AJs", "ATs", "KQs", "KJs"],
    { raise: 1.0, call: 0, fold: 0 },
    1.2
  );
  
  applyAction(range,
    ["88", "77", "AJo", "KTs", "QJs", "QTs", "JTs"],
    { raise: 0.70, call: 0.25, fold: 0.05 },
    1.1
  );
  
  // Many bluffs from BTN
  applyAction(range,
    ["A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K9s", "K8s", "Q9s", "J9s", "T9s", "98s"],
    { raise: 0.85, call: 0, fold: 0.15 },
    1.0
  );
  
  applyAction(range,
    ["K7s", "K6s", "Q8s", "J8s", "T8s", "87s", "76s", "65s", "54s"],
    { raise: 0.50, call: 0.20, fold: 0.30 },
    0.9
  );
  
  return range;
}

function generateSqueezeFromSB(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Tighter from SB (will be OOP)
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"],
    { raise: 1.0, call: 0, fold: 0 },
    0.9
  );
  
  applyAction(range,
    ["TT", "99", "AQo", "AJs", "KQs"],
    { raise: 0.70, call: 0.20, fold: 0.10 },
    0.9
  );
  
  // Bluffs with blockers
  applyAction(range,
    ["A5s", "A4s", "A3s"],
    { raise: 0.65, call: 0, fold: 0.35 },
    0.8
  );
  
  applyAction(range,
    ["K9s", "Q9s", "J9s"],
    { raise: 0.40, call: 0.30, fold: 0.30 },
    0.8
  );
  
  return range;
}

function generateSqueezeFromBB(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // BB has best odds to squeeze (already invested)
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT",
     "AKs", "AKo", "AQs", "AQo", "AJs", "KQs"],
    { raise: 1.0, call: 0, fold: 0 },
    1.0
  );
  
  applyAction(range,
    ["99", "88", "ATs", "AJo", "KJs", "KTs", "QJs", "JTs"],
    { raise: 0.75, call: 0.20, fold: 0.05 },
    0.95
  );
  
  // Wide bluffs from BB
  applyAction(range,
    ["77", "66", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K9s", "K8s", "Q9s", "Q8s", "J9s", "T9s", "98s", "87s"],
    { raise: 0.60, call: 0.25, fold: 0.15 },
    0.9
  );
  
  applyAction(range,
    ["55", "44", "33", "K7s", "K6s", "76s", "65s", "54s",
     "ATo", "KQo", "KJo"],
    { raise: 0.40, call: 0.35, fold: 0.25 },
    0.85
  );
  
  return range;
}

export const squeezeRanges: Record<string, Record<string, HandData>> = {
  CO: generateSqueezeFromCO(),
  BTN: generateSqueezeFromBTN(),
  SB: generateSqueezeFromSB(),
  BB: generateSqueezeFromBB()
};
