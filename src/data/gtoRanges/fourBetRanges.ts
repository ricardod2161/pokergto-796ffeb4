// GTO 4-Bet Ranges
// Based on professional solver outputs for 100bb deep

import { HandData } from "./types";
import { createEmptyRange, applyAction } from "./utils";

const POS_MULT = { value: 1.2, bluff: 0.8 };

function generate4BetVsLoose3Bet(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Value 4-bets (pure all-in or 4-bet/call)
  applyAction(range,
    ["AA", "KK", "QQ", "AKs", "AKo"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.value
  );
  
  // Mixed value (4-bet/fold some)
  applyAction(range,
    ["JJ", "AQs"],
    { raise: 0.85, call: 0, fold: 0.15 },
    POS_MULT.value
  );
  
  // TT+ often mixed
  applyAction(range,
    ["TT", "AQo"],
    { raise: 0.60, call: 0.25, fold: 0.15 },
    POS_MULT.value
  );
  
  // Bluff 4-bets (blockers)
  applyAction(range,
    ["A5s", "A4s"],
    { raise: 0.70, call: 0, fold: 0.30 },
    POS_MULT.bluff
  );
  
  applyAction(range,
    ["A3s", "A2s", "KQs"],
    { raise: 0.40, call: 0, fold: 0.60 },
    POS_MULT.bluff
  );
  
  return range;
}

function generate4BetVsTight3Bet(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Very tight against tight 3-bettor
  applyAction(range,
    ["AA", "KK"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.value
  );
  
  applyAction(range,
    ["QQ", "AKs"],
    { raise: 0.90, call: 0.10, fold: 0 },
    POS_MULT.value
  );
  
  applyAction(range,
    ["AKo", "JJ"],
    { raise: 0.65, call: 0.25, fold: 0.10 },
    POS_MULT.value
  );
  
  // Few bluffs vs tight range
  applyAction(range,
    ["A5s"],
    { raise: 0.45, call: 0, fold: 0.55 },
    POS_MULT.bluff
  );
  
  return range;
}

function generate4BetFromBTN(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Wider 4-bet from position
  applyAction(range,
    ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"],
    { raise: 1.0, call: 0, fold: 0 },
    POS_MULT.value
  );
  
  applyAction(range,
    ["TT", "99", "AQo", "AJs", "KQs"],
    { raise: 0.75, call: 0.15, fold: 0.10 },
    POS_MULT.value
  );
  
  // Bluffs with blockers
  applyAction(range,
    ["A5s", "A4s", "A3s", "A2s"],
    { raise: 0.80, call: 0, fold: 0.20 },
    POS_MULT.bluff
  );
  
  applyAction(range,
    ["K5s", "K4s", "87s", "76s"],
    { raise: 0.35, call: 0, fold: 0.65 },
    POS_MULT.bluff
  );
  
  return range;
}

function generate4BetFromBlinds(): Record<string, HandData> {
  const range = createEmptyRange();
  
  // Tighter from blinds (OOP)
  applyAction(range,
    ["AA", "KK", "QQ", "AKs", "AKo"],
    { raise: 1.0, call: 0, fold: 0 },
    0.9
  );
  
  applyAction(range,
    ["JJ", "AQs"],
    { raise: 0.80, call: 0.10, fold: 0.10 },
    0.9
  );
  
  applyAction(range,
    ["TT", "AQo", "AJs"],
    { raise: 0.55, call: 0.30, fold: 0.15 },
    0.9
  );
  
  // Bluffs
  applyAction(range,
    ["A5s", "A4s"],
    { raise: 0.60, call: 0, fold: 0.40 },
    0.7
  );
  
  return range;
}

export const fourBetRanges: Record<string, Record<string, HandData>> = {
  UTG: generate4BetVsTight3Bet(),
  UTG1: generate4BetVsTight3Bet(),
  MP: generate4BetVsLoose3Bet(),
  HJ: generate4BetVsLoose3Bet(),
  CO: generate4BetVsLoose3Bet(),
  BTN: generate4BetFromBTN(),
  SB: generate4BetFromBlinds(),
  BB: generate4BetFromBlinds()
};
