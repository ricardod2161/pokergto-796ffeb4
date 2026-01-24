// GTO Cold Call Ranges
// Calling a raise without having put money in (not from blinds)

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

function generateColdCallIP(): Record<string, HandData> {
  // Calling from CO/BTN vs EP/MP open
  const range = createEmptyRange();
  
  // Prefer 3-bet with premiums, but call with implied odds hands
  // Pairs for set mining
  applyAction(range,
    ["TT", "99", "88", "77", "66", "55", "44", "33", "22"],
    { raise: 0.15, call: 0.85, fold: 0 },
    1.1
  );
  
  // Suited broadways
  applyAction(range,
    ["AQs", "AJs", "ATs", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs"],
    { raise: 0.30, call: 0.70, fold: 0 },
    1.1
  );
  
  // Suited connectors (great for cold calling)
  applyAction(range,
    ["T9s", "98s", "87s", "76s", "65s", "54s"],
    { raise: 0.10, call: 0.85, fold: 0.05 },
    1.0
  );
  
  // Suited aces
  applyAction(range,
    ["A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s"],
    { raise: 0.20, call: 0.75, fold: 0.05 },
    1.0
  );
  
  // Suited gappers
  applyAction(range,
    ["J9s", "T8s", "97s", "86s", "75s", "64s"],
    { raise: 0.05, call: 0.70, fold: 0.25 },
    0.95
  );
  
  // Broadway offsuit (calling with best)
  applyAction(range,
    ["AQo", "AJo", "KQo"],
    { raise: 0.25, call: 0.65, fold: 0.10 },
    1.0
  );
  
  return range;
}

function generateColdCallOOP(): Record<string, HandData> {
  // Calling from blinds vs LP open (tighter)
  const range = createEmptyRange();
  
  // Pairs
  applyAction(range,
    ["JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22"],
    { raise: 0.20, call: 0.75, fold: 0.05 },
    0.9
  );
  
  // Best suited hands
  applyAction(range,
    ["AQs", "AJs", "ATs", "KQs", "KJs", "QJs", "JTs"],
    { raise: 0.35, call: 0.60, fold: 0.05 },
    0.9
  );
  
  // Suited connectors (need better odds OOP)
  applyAction(range,
    ["T9s", "98s", "87s", "76s"],
    { raise: 0.10, call: 0.70, fold: 0.20 },
    0.85
  );
  
  // Suited aces
  applyAction(range,
    ["A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s"],
    { raise: 0.25, call: 0.60, fold: 0.15 },
    0.85
  );
  
  return range;
}

function generateColdCallBTN(): Record<string, HandData> {
  // BTN has great position - can call wide vs EP
  const range = createEmptyRange();
  
  // All pocket pairs
  applyAction(range,
    ["QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22"],
    { raise: 0.25, call: 0.75, fold: 0 },
    1.2
  );
  
  // All suited broadways
  applyAction(range,
    ["AQs", "AJs", "ATs", "A9s", "KQs", "KJs", "KTs", "K9s", 
     "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s"],
    { raise: 0.20, call: 0.80, fold: 0 },
    1.2
  );
  
  // All suited connectors
  applyAction(range,
    ["98s", "87s", "76s", "65s", "54s"],
    { raise: 0.05, call: 0.90, fold: 0.05 },
    1.1
  );
  
  // Suited gappers
  applyAction(range,
    ["T8s", "97s", "86s", "75s", "64s", "53s"],
    { raise: 0, call: 0.75, fold: 0.25 },
    1.0
  );
  
  // Suited aces
  applyAction(range,
    ["A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s"],
    { raise: 0.15, call: 0.80, fold: 0.05 },
    1.1
  );
  
  // Best offsuit
  applyAction(range,
    ["AQo", "AJo", "ATo", "KQo", "KJo", "QJo"],
    { raise: 0.30, call: 0.60, fold: 0.10 },
    1.1
  );
  
  return range;
}

export const coldCallRanges: Record<string, Record<string, HandData>> = {
  MP: generateColdCallOOP(),
  HJ: generateColdCallIP(),
  CO: generateColdCallIP(),
  BTN: generateColdCallBTN(),
  SB: generateColdCallOOP(),
  BB: generateColdCallOOP()
};
