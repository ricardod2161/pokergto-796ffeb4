// GTO Iso-Raise Ranges
// Raising after one or more limpers

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

function generateIsoFromMP(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Value iso-raises
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88",
     "AKs", "AKo", "AQs", "AQo", "AJs", "ATs",
     "KQs", "KJs", "KQo"],
    { raise: 1.0, call: 0, fold: 0 },
    1.0
  );
  
  applyAction(range,
    ["77", "66", "AJo", "KTs", "QJs", "QTs", "JTs"],
    { raise: 0.85, call: 0.10, fold: 0.05 },
    0.95
  );
  
  // Bluff isos
  applyAction(range,
    ["55", "44", "A9s", "A8s", "K9s", "KJo", "T9s"],
    { raise: 0.60, call: 0.25, fold: 0.15 },
    0.85
  );
  
  return range;
}

function generateIsoFromHJ(): Record<string, HandData> {
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77",
     "AKs", "AKo", "AQs", "AQo", "AJs", "ATs", "A9s",
     "KQs", "KJs", "KTs", "KQo", "KJo",
     "QJs", "QTs", "JTs"],
    { raise: 1.0, call: 0, fold: 0 },
    1.05
  );
  
  applyAction(range,
    ["66", "55", "AJo", "ATo", "A8s", "A7s", "K9s", "Q9s", "J9s", "T9s", "98s",
     "KTo", "QJo"],
    { raise: 0.80, call: 0.15, fold: 0.05 },
    0.95
  );
  
  applyAction(range,
    ["44", "33", "A6s", "A5s", "K8s", "87s", "76s", "65s",
     "QTo", "JTo"],
    { raise: 0.55, call: 0.25, fold: 0.20 },
    0.85
  );
  
  return range;
}

function generateIsoFromCO(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Wide value
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55",
     "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "A9s", "A8s", "A7s",
     "KQs", "KJs", "KTs", "K9s", "KQo", "KJo", "KTo",
     "QJs", "QTs", "Q9s", "QJo",
     "JTs", "J9s", "T9s", "98s"],
    { raise: 1.0, call: 0, fold: 0 },
    1.1
  );
  
  applyAction(range,
    ["44", "33", "ATo", "A6s", "A5s", "A4s", "K8s", "K7s", "Q8s", "J8s", "T8s",
     "87s", "76s", "65s", "54s",
     "QTo", "JTo"],
    { raise: 0.80, call: 0.15, fold: 0.05 },
    1.0
  );
  
  applyAction(range,
    ["22", "A3s", "A2s", "K6s", "K5s", "97s", "86s", "75s",
     "A9o", "K9o", "Q9o"],
    { raise: 0.55, call: 0.25, fold: 0.20 },
    0.9
  );
  
  return range;
}

function generateIsoFromBTN(): Record<string, HandData> {
  // Very wide from BTN
  const range = createEmptyRange();
  
  // Almost everything playable
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22",
     "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "ATo", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
     "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "KQo", "KJo", "KTo", "K9o",
     "QJs", "QTs", "Q9s", "Q8s", "Q7s", "QJo", "QTo", "Q9o",
     "JTs", "J9s", "J8s", "J7s", "JTo", "J9o",
     "T9s", "T8s", "T7s", "T9o",
     "98s", "97s", "96s", "98o",
     "87s", "86s", "85s", "87o",
     "76s", "75s", "65s", "64s", "54s", "53s", "43s"],
    { raise: 1.0, call: 0, fold: 0 },
    1.2
  );
  
  applyAction(range,
    ["A9o", "A8o", "A7o", "A6o", "A5o",
     "K8o", "K7o", "Q8o", "J8o", "T8o",
     "76o", "65o"],
    { raise: 0.75, call: 0.15, fold: 0.10 },
    1.1
  );
  
  return range;
}

function generateIsoFromSB(): Record<string, HandData> {
  const range = createEmptyRange();
  
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44",
     "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s",
     "KQs", "KJs", "KTs", "K9s", "K8s", "KQo", "KJo", "KTo",
     "QJs", "QTs", "Q9s", "Q8s", "QJo", "QTo",
     "JTs", "J9s", "J8s", "JTo",
     "T9s", "T8s", "98s", "97s", "87s", "76s", "65s", "54s"],
    { raise: 1.0, call: 0, fold: 0 },
    1.05
  );
  
  applyAction(range,
    ["33", "22", "A3s", "A2s", "ATo", "K7s", "K6s", "Q7s", "J7s", "T7s",
     "86s", "75s", "64s", "53s",
     "K9o", "Q9o", "J9o", "T9o"],
    { raise: 0.70, call: 0.20, fold: 0.10 },
    0.95
  );
  
  return range;
}

export const isoRaiseRanges: Record<string, Record<string, HandData>> = {
  MP: generateIsoFromMP(),
  HJ: generateIsoFromHJ(),
  CO: generateIsoFromCO(),
  BTN: generateIsoFromBTN(),
  SB: generateIsoFromSB()
};
