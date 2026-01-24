// GTO Range Types - Professional Solver Standard

export type HandAction = "raise" | "call" | "fold" | "mixed";

export interface ActionFrequency {
  raise: number;  // 0-1
  call: number;   // 0-1
  fold: number;   // 0-1
}

export interface HandData {
  action: HandAction;
  frequency: number;      // Overall action frequency (for primary action)
  ev?: number;            // Expected Value in bb
  frequencies?: ActionFrequency;  // Detailed breakdown for mixed strategies
  combos?: number;        // Number of combinations
}

export interface RangeStats {
  totalHands: number;
  raiseHands: number;
  callHands: number;
  foldHands: number;
  mixedHands: number;
  raisePercent: number;
  callPercent: number;
  avgEV: number;
}

export type Position = "UTG" | "UTG1" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB";
export type StackDepth = "20bb" | "40bb" | "60bb" | "100bb" | "150bb";
export type Scenario = 
  | "open" 
  | "3bet" 
  | "4bet" 
  | "squeeze" 
  | "coldcall" 
  | "vs3bet" 
  | "isoraise" 
  | "bbdefense";

export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
export type Rank = typeof RANKS[number];

// Hand strength tiers for EV calculation
export const HAND_TIERS = {
  PREMIUM: ["AA", "KK", "QQ", "AKs", "AKo"],
  STRONG: ["JJ", "TT", "AQs", "AQo", "AJs", "KQs"],
  MEDIUM: ["99", "88", "77", "ATs", "KJs", "KTs", "QJs", "AJo", "KQo"],
  SPECULATIVE: ["66", "55", "44", "33", "22", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", 
                "K9s", "Q9s", "J9s", "T9s", "98s", "87s", "76s", "65s", "54s"],
  MARGINAL: ["A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o", "KJo", "KTo", "QJo", "QTo", "JTo",
             "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "Q8s", "J8s", "T8s", "97s", "86s", "75s", "64s", "53s"],
  WEAK: [] as string[] // Everything else
} as const;
