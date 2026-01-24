// GTO BB Defense Ranges
// Defending the big blind vs various opening positions

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

function generateBBDefenseVsUTG(): Record<string, HandData> {
  // Tight defense vs UTG open
  const range = createEmptyRange();
  
  // 3-bet or fold with premiums
  applyAction(range,
    ["AA", "KK", "QQ", "AKs", "AKo"],
    { raise: 0.90, call: 0.10, fold: 0 },
    1.0
  );
  
  // Mixed 3-bet/call
  applyAction(range,
    ["JJ", "TT", "AQs"],
    { raise: 0.45, call: 0.55, fold: 0 },
    0.95
  );
  
  // Calling range (set mining, implied odds)
  applyAction(range,
    ["99", "88", "77", "66", "55", "44", "33", "22",
     "AQo", "AJs", "ATs", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs"],
    { raise: 0.10, call: 0.80, fold: 0.10 },
    0.85
  );
  
  // Marginal calls
  applyAction(range,
    ["A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K9s", "Q9s", "J9s", "T9s", "98s", "87s", "76s", "65s", "54s"],
    { raise: 0.05, call: 0.55, fold: 0.40 },
    0.75
  );
  
  return range;
}

function generateBBDefenseVsMP(): Record<string, HandData> {
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"],
    { raise: 0.85, call: 0.15, fold: 0 },
    1.0
  );
  
  applyAction(range,
    ["TT", "99", "AQo", "AJs", "KQs"],
    { raise: 0.40, call: 0.60, fold: 0 },
    0.95
  );
  
  applyAction(range,
    ["88", "77", "66", "55", "44", "33", "22",
     "ATs", "A9s", "KJs", "KTs", "K9s", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "98s",
     "AJo", "KQo"],
    { raise: 0.10, call: 0.80, fold: 0.10 },
    0.85
  );
  
  applyAction(range,
    ["A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K8s", "Q8s", "J8s", "T8s", "87s", "76s", "65s", "54s",
     "ATo", "KJo", "QJo"],
    { raise: 0.05, call: 0.65, fold: 0.30 },
    0.75
  );
  
  return range;
}

function generateBBDefenseVsCO(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Wider 3-bet vs CO
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AKo", "AQs", "AQo", "AJs", "KQs"],
    { raise: 0.80, call: 0.20, fold: 0 },
    1.05
  );
  
  applyAction(range,
    ["99", "88", "ATs", "A9s", "KJs", "KTs", "QJs", "QTs", "JTs",
     "AJo", "KQo", "KJo"],
    { raise: 0.35, call: 0.60, fold: 0.05 },
    0.95
  );
  
  applyAction(range,
    ["77", "66", "55", "44", "33", "22",
     "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K9s", "K8s", "Q9s", "Q8s", "J9s", "J8s", "T9s", "T8s", "98s", "97s", "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s",
     "ATo", "KTo", "QJo", "QTo", "JTo"],
    { raise: 0.10, call: 0.75, fold: 0.15 },
    0.85
  );
  
  applyAction(range,
    ["K7s", "K6s", "K5s", "K4s", "Q7s", "J7s", "T7s", "96s", "85s", "74s", "43s",
     "A9o", "A8o", "K9o", "Q9o", "J9o", "T9o"],
    { raise: 0.05, call: 0.55, fold: 0.40 },
    0.75
  );
  
  return range;
}

function generateBBDefenseVsBTN(): Record<string, HandData> {
  // Widest defense vs BTN
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99",
     "AKs", "AKo", "AQs", "AQo", "AJs", "ATs", "KQs", "KJs", "KTs", "QJs"],
    { raise: 0.75, call: 0.25, fold: 0 },
    1.1
  );
  
  applyAction(range,
    ["88", "77", "66",
     "A9s", "A8s", "A7s", "A6s", "A5s", "K9s", "K8s", "Q9s", "Q8s", "J9s", "T9s", "98s",
     "AJo", "ATo", "KQo", "KJo", "KTo", "QJo", "QTo", "JTo"],
    { raise: 0.40, call: 0.55, fold: 0.05 },
    1.0
  );
  
  applyAction(range,
    ["55", "44", "33", "22",
     "A4s", "A3s", "A2s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
     "Q7s", "Q6s", "Q5s", "J8s", "J7s", "T8s", "T7s",
     "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s", "43s",
     "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o",
     "K9o", "K8o", "Q9o", "Q8o", "J9o", "J8o", "T9o", "T8o", "98o", "87o"],
    { raise: 0.15, call: 0.70, fold: 0.15 },
    0.9
  );
  
  applyAction(range,
    ["Q4s", "Q3s", "Q2s", "J6s", "J5s", "J4s", "T6s", "T5s", "96s", "95s", "85s", "84s", "74s", "63s", "52s", "42s", "32s",
     "K7o", "K6o", "K5o", "Q7o", "J7o", "T7o", "97o", "76o", "65o", "54o"],
    { raise: 0.05, call: 0.45, fold: 0.50 },
    0.75
  );
  
  return range;
}

function generateBBDefenseVsSB(): Record<string, HandData> {
  // Widest defense (SB opens wide, we're closing action)
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88",
     "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "A9s",
     "KQs", "KJs", "KTs", "K9s", "KQo", "KJo",
     "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s"],
    { raise: 0.70, call: 0.30, fold: 0 },
    1.15
  );
  
  applyAction(range,
    ["77", "66", "55", "44", "33", "22",
     "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
     "Q8s", "Q7s", "Q6s", "Q5s", "J8s", "J7s", "J6s", "T8s", "T7s",
     "98s", "97s", "96s", "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s", "43s",
     "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o",
     "KTo", "K9o", "K8o", "K7o", "QJo", "QTo", "Q9o", "Q8o",
     "JTo", "J9o", "J8o", "T9o", "T8o", "98o", "97o", "87o", "76o", "65o"],
    { raise: 0.25, call: 0.65, fold: 0.10 },
    1.0
  );
  
  applyAction(range,
    ["Q4s", "Q3s", "Q2s", "J5s", "J4s", "J3s", "T6s", "T5s", "T4s",
     "95s", "94s", "85s", "84s", "74s", "73s", "63s", "62s", "52s", "42s", "32s",
     "K6o", "K5o", "K4o", "K3o", "K2o", "Q7o", "Q6o", "Q5o",
     "J7o", "J6o", "T7o", "T6o", "96o", "86o", "75o", "64o", "54o", "43o"],
    { raise: 0.10, call: 0.50, fold: 0.40 },
    0.85
  );
  
  return range;
}

export const bbDefenseRanges: Record<string, Record<string, HandData>> = {
  vsUTG: generateBBDefenseVsUTG(),
  vsUTG1: generateBBDefenseVsUTG(), // Similar
  vsMP: generateBBDefenseVsMP(),
  vsHJ: generateBBDefenseVsMP(), // Similar
  vsCO: generateBBDefenseVsCO(),
  vsBTN: generateBBDefenseVsBTN(),
  vsSB: generateBBDefenseVsSB()
};
