// GTO Range Utilities

import { RANKS, HandData, ActionFrequency, HandAction } from "./types";

/**
 * Generate hand notation from matrix position
 */
export function getHandNotation(row: number, col: number): string {
  if (row === col) {
    return `${RANKS[row]}${RANKS[col]}`; // Pairs
  } else if (row < col) {
    return `${RANKS[row]}${RANKS[col]}s`; // Suited
  } else {
    return `${RANKS[col]}${RANKS[row]}o`; // Offsuit
  }
}

/**
 * Get number of combinations for a hand type
 */
export function getCombos(hand: string): number {
  if (hand.length === 2) return 6; // Pairs
  if (hand.endsWith('s')) return 4; // Suited
  return 12; // Offsuit
}

/**
 * Determine primary action from frequencies
 */
export function getPrimaryAction(freq: ActionFrequency): HandAction {
  if (freq.raise >= 0.9) return "raise";
  if (freq.call >= 0.9) return "call";
  if (freq.fold >= 0.9) return "fold";
  return "mixed";
}

/**
 * Calculate EV based on hand strength and position
 */
export function calculateEV(
  handStrength: number, // 0-1
  positionMultiplier: number, // 0.5-1.5
  isAggressor: boolean
): number {
  const baseEV = (handStrength - 0.3) * 0.5; // Scale to roughly -0.15 to +0.35
  const positionAdjust = baseEV * positionMultiplier;
  const aggressionBonus = isAggressor ? 0.02 : 0;
  return Math.round((positionAdjust + aggressionBonus) * 100) / 100;
}

/**
 * Get hand strength score (0-1)
 */
export function getHandStrength(hand: string): number {
  const strengthMap: Record<string, number> = {
    // Premium (0.9-1.0)
    "AA": 1.0, "KK": 0.98, "QQ": 0.95, "AKs": 0.93, "AKo": 0.90,
    // Strong (0.8-0.89)
    "JJ": 0.88, "AQs": 0.87, "TT": 0.85, "AQo": 0.84, "AJs": 0.83, "KQs": 0.82,
    // Good (0.7-0.79)
    "99": 0.79, "ATs": 0.78, "KJs": 0.77, "KQo": 0.76, "AJo": 0.75, "KTs": 0.74,
    "QJs": 0.73, "88": 0.72, "A9s": 0.71, "QTs": 0.70,
    // Playable (0.55-0.69)
    "77": 0.69, "ATo": 0.68, "JTs": 0.67, "KJo": 0.66, "A8s": 0.65, "K9s": 0.64,
    "66": 0.63, "QJo": 0.62, "A7s": 0.61, "T9s": 0.60, "Q9s": 0.59, "A5s": 0.58,
    "55": 0.57, "A6s": 0.56, "KTo": 0.55,
    // Marginal (0.40-0.54)
    "44": 0.54, "J9s": 0.53, "A4s": 0.52, "QTo": 0.51, "98s": 0.50, "A3s": 0.49,
    "33": 0.48, "K8s": 0.47, "A2s": 0.46, "87s": 0.45, "JTo": 0.44, "22": 0.43,
    "K7s": 0.42, "T8s": 0.41, "76s": 0.40,
    // Weak (0.25-0.39)
    "A9o": 0.39, "Q8s": 0.38, "K6s": 0.37, "97s": 0.36, "65s": 0.35, "J8s": 0.34,
    "K5s": 0.33, "A8o": 0.32, "86s": 0.31, "54s": 0.30, "T7s": 0.29, "K4s": 0.28,
    "K9o": 0.27, "75s": 0.26, "Q7s": 0.25,
    // Very weak (0.15-0.24)
    "K3s": 0.24, "96s": 0.23, "Q9o": 0.22, "J7s": 0.21, "K2s": 0.20, "64s": 0.19,
    "A7o": 0.18, "Q6s": 0.17, "85s": 0.16, "53s": 0.15,
    // Trash (<0.15)
    "T9o": 0.14, "J9o": 0.13, "A6o": 0.12, "Q5s": 0.11, "74s": 0.10, "T6s": 0.09,
    "A5o": 0.08, "Q4s": 0.07, "98o": 0.06, "43s": 0.05
  };
  
  return strengthMap[hand] ?? 0.03;
}

/**
 * Initialize empty range (all folds)
 */
export function createEmptyRange(): Record<string, HandData> {
  const range: Record<string, HandData> = {};
  
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandNotation(row, col);
      range[hand] = {
        action: "fold",
        frequency: 0,
        ev: -0.02,
        frequencies: { raise: 0, call: 0, fold: 1 },
        combos: getCombos(hand)
      };
    }
  }
  
  return range;
}

/**
 * Apply action to hands with frequency and EV
 */
export function applyAction(
  range: Record<string, HandData>,
  hands: string[],
  frequencies: ActionFrequency,
  positionMultiplier: number
): void {
  for (const hand of hands) {
    if (!range[hand]) continue;
    
    const strength = getHandStrength(hand);
    const ev = calculateEV(strength, positionMultiplier, frequencies.raise > 0.5);
    const action = getPrimaryAction(frequencies);
    
    range[hand] = {
      action,
      frequency: Math.max(frequencies.raise, frequencies.call),
      ev,
      frequencies: { ...frequencies },
      combos: getCombos(hand)
    };
  }
}
