// Main export for GTO Range Data
// Consolidated access to all professional GTO ranges

export * from "./types";
export * from "./utils";
export { openRanges } from "./openRanges";
export { threeBetRanges } from "./threeBetRanges";
export { fourBetRanges } from "./fourBetRanges";
export { coldCallRanges } from "./coldCallRanges";
export { squeezeRanges } from "./squeezeRanges";
export { vs3BetRanges } from "./vs3BetRanges";
export { isoRaiseRanges } from "./isoRaiseRanges";
export { bbDefenseRanges } from "./bbDefenseRanges";

import { HandData, RangeStats } from "./types";
import { openRanges } from "./openRanges";
import { threeBetRanges } from "./threeBetRanges";
import { fourBetRanges } from "./fourBetRanges";
import { coldCallRanges } from "./coldCallRanges";
import { squeezeRanges } from "./squeezeRanges";
import { vs3BetRanges } from "./vs3BetRanges";
import { isoRaiseRanges } from "./isoRaiseRanges";
import { bbDefenseRanges } from "./bbDefenseRanges";

// Legacy compatibility aliases
export const positionRanges = openRanges;

/**
 * Get range data for a specific scenario and position
 */
export function getRangeData(
  scenario: string,
  position: string
): Record<string, HandData> {
  switch (scenario) {
    case "open":
      return openRanges[position] || openRanges.UTG;
    case "3bet":
      return threeBetRanges[position] || threeBetRanges.UTG;
    case "4bet":
      return fourBetRanges[position] || fourBetRanges.UTG;
    case "squeeze":
      return squeezeRanges[position] || squeezeRanges.BTN;
    case "coldcall":
      return coldCallRanges[position] || coldCallRanges.BTN;
    case "vs3bet":
      return vs3BetRanges[position] || vs3BetRanges.BTN;
    case "isoraise":
      return isoRaiseRanges[position] || isoRaiseRanges.BTN;
    case "bbdefense":
      return bbDefenseRanges[position] || bbDefenseRanges.vsBTN;
    default:
      return openRanges[position] || openRanges.UTG;
  }
}

/**
 * Calculate range statistics
 */
export function calculateRangeStats(range: Record<string, HandData>): RangeStats {
  let raiseHands = 0;
  let callHands = 0;
  let foldHands = 0;
  let mixedHands = 0;
  let totalEV = 0;
  let evCount = 0;

  Object.values(range).forEach((data) => {
    switch (data.action) {
      case "raise":
        raiseHands++;
        break;
      case "call":
        callHands++;
        break;
      case "fold":
        foldHands++;
        break;
      case "mixed":
        mixedHands++;
        break;
    }
    if (data.ev !== undefined && data.action !== "fold") {
      totalEV += data.ev;
      evCount++;
    }
  });

  const totalHands = 169;
  const playableHands = raiseHands + callHands + mixedHands;

  return {
    totalHands,
    raiseHands,
    callHands,
    foldHands,
    mixedHands,
    raisePercent: (playableHands / totalHands) * 100,
    callPercent: (callHands / totalHands) * 100,
    avgEV: evCount > 0 ? totalEV / evCount : 0
  };
}

/**
 * Get available positions for a scenario
 */
export function getAvailablePositions(scenario: string): string[] {
  switch (scenario) {
    case "open":
      return ["UTG", "UTG1", "MP", "HJ", "CO", "BTN", "SB"];
    case "3bet":
      return ["UTG", "UTG1", "MP", "HJ", "CO", "BTN", "SB", "BB"];
    case "4bet":
      return ["UTG", "UTG1", "MP", "HJ", "CO", "BTN", "SB", "BB"];
    case "squeeze":
      return ["CO", "BTN", "SB", "BB"];
    case "coldcall":
      return ["MP", "HJ", "CO", "BTN", "SB", "BB"];
    case "vs3bet":
      return ["UTG", "UTG1", "MP", "HJ", "CO", "BTN", "SB"];
    case "isoraise":
      return ["MP", "HJ", "CO", "BTN", "SB"];
    case "bbdefense":
      return ["vsUTG", "vsUTG1", "vsMP", "vsHJ", "vsCO", "vsBTN", "vsSB"];
    default:
      return ["UTG", "MP", "HJ", "CO", "BTN", "SB", "BB"];
  }
}

/**
 * Get scenario display info
 */
export function getScenarioInfo(scenario: string): { name: string; description: string; tips: string[] } {
  const info: Record<string, { name: string; description: string; tips: string[] }> = {
    open: {
      name: "RFI (Open Raise)",
      description: "Opening ranges when folded to you preflop",
      tips: [
        "Widen range in late position",
        "Tighten from EP due to more players behind",
        "Consider table dynamics and opponent tendencies"
      ]
    },
    "3bet": {
      name: "3-Bet",
      description: "Re-raising after an open raise",
      tips: [
        "Use polarized range: value + bluffs",
        "Bluffs should have blockers (Ax suited)",
        "Adjust based on opener's position"
      ]
    },
    "4bet": {
      name: "4-Bet",
      description: "Re-raising a 3-bet",
      tips: [
        "Very narrow value range",
        "Use blockers (AK, A5s) as bluffs",
        "Consider stack depth carefully"
      ]
    },
    squeeze: {
      name: "Squeeze Play",
      description: "3-betting after raise + call",
      tips: [
        "High fold equity due to dead money",
        "Use larger sizing (4-5x)",
        "Bluff more from BTN/SB"
      ]
    },
    coldcall: {
      name: "Cold Call",
      description: "Calling a raise without initiative",
      tips: [
        "Prefer hands with good implied odds",
        "Pairs and suited connectors perform well",
        "Position is crucial for cold calling"
      ]
    },
    vs3bet: {
      name: "vs 3-Bet",
      description: "Facing a 3-bet after you opened",
      tips: [
        "Tightest from EP opens",
        "Consider 4-bet bluffing from late position",
        "Stack depth affects calling range"
      ]
    },
    isoraise: {
      name: "Iso-Raise",
      description: "Raising over limpers",
      tips: [
        "Use larger sizing (4-5bb + 1bb per limper)",
        "Wide value range, limpers are weak",
        "Position matters less vs passive players"
      ]
    },
    bbdefense: {
      name: "BB Defense",
      description: "Defending the big blind vs raises",
      tips: [
        "Getting best odds in the game",
        "3-bet more vs late position opens",
        "Call wide vs BTN/SB opens"
      ]
    }
  };

  return info[scenario] || info.open;
}
