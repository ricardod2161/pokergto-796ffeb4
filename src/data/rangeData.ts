type HandAction = "raise" | "call" | "fold" | "mixed";

interface HandData {
  action: HandAction;
  frequency: number;
  ev?: number;
}

// GTO-style range data for different positions (simplified for demo)
const generateRange = (openPercent: number): Record<string, HandData> => {
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const range: Record<string, HandData> = {};
  
  // Premium pairs
  const premiumPairs = ["AA", "KK", "QQ", "JJ", "TT"];
  premiumPairs.forEach(h => {
    range[h] = { action: "raise", frequency: 1, ev: 0.15 };
  });
  
  // Medium pairs
  const mediumPairs = ["99", "88", "77", "66"];
  mediumPairs.forEach(h => {
    range[h] = { action: openPercent > 15 ? "raise" : "fold", frequency: 0.9, ev: 0.08 };
  });
  
  // Small pairs
  const smallPairs = ["55", "44", "33", "22"];
  smallPairs.forEach(h => {
    range[h] = { action: openPercent > 20 ? "raise" : "fold", frequency: 0.7, ev: 0.03 };
  });
  
  // Premium suited hands
  range["AKs"] = { action: "raise", frequency: 1, ev: 0.12 };
  range["AQs"] = { action: "raise", frequency: 1, ev: 0.10 };
  range["AJs"] = { action: "raise", frequency: 1, ev: 0.08 };
  range["ATs"] = { action: "raise", frequency: 0.95, ev: 0.06 };
  range["KQs"] = { action: "raise", frequency: 1, ev: 0.09 };
  range["KJs"] = { action: "raise", frequency: 0.95, ev: 0.07 };
  range["QJs"] = { action: "raise", frequency: 0.9, ev: 0.05 };
  range["JTs"] = { action: "raise", frequency: 0.85, ev: 0.04 };
  
  // Premium offsuit
  range["AKo"] = { action: "raise", frequency: 1, ev: 0.10 };
  range["AQo"] = { action: "raise", frequency: 0.95, ev: 0.07 };
  range["AJo"] = { action: openPercent > 15 ? "raise" : "fold", frequency: 0.8, ev: 0.04 };
  range["KQo"] = { action: openPercent > 18 ? "raise" : "fold", frequency: 0.85, ev: 0.05 };
  
  // Suited connectors
  if (openPercent > 20) {
    range["T9s"] = { action: "raise", frequency: 0.75, ev: 0.02 };
    range["98s"] = { action: "raise", frequency: 0.7, ev: 0.01 };
    range["87s"] = { action: "raise", frequency: 0.65, ev: 0.01 };
    range["76s"] = { action: openPercent > 25 ? "raise" : "fold", frequency: 0.6, ev: 0.005 };
    range["65s"] = { action: openPercent > 30 ? "raise" : "fold", frequency: 0.55, ev: 0.003 };
  }
  
  // Suited aces
  if (openPercent > 22) {
    range["A9s"] = { action: "raise", frequency: 0.8, ev: 0.04 };
    range["A8s"] = { action: "raise", frequency: 0.75, ev: 0.03 };
    range["A7s"] = { action: "raise", frequency: 0.7, ev: 0.02 };
    range["A6s"] = { action: "raise", frequency: 0.65, ev: 0.015 };
    range["A5s"] = { action: "raise", frequency: 0.8, ev: 0.025 };
    range["A4s"] = { action: "raise", frequency: 0.75, ev: 0.02 };
    range["A3s"] = { action: "raise", frequency: 0.7, ev: 0.015 };
    range["A2s"] = { action: "raise", frequency: 0.65, ev: 0.01 };
  }
  
  // Fill remaining with folds
  for (let i = 0; i < ranks.length; i++) {
    for (let j = 0; j < ranks.length; j++) {
      let hand: string;
      if (i === j) {
        hand = `${ranks[i]}${ranks[j]}`;
      } else if (i < j) {
        hand = `${ranks[i]}${ranks[j]}s`;
      } else {
        hand = `${ranks[j]}${ranks[i]}o`;
      }
      
      if (!range[hand]) {
        range[hand] = { action: "fold", frequency: 0, ev: -0.01 };
      }
    }
  }
  
  return range;
};

export const positionRanges: Record<string, Record<string, HandData>> = {
  UTG: generateRange(12),
  "UTG1": generateRange(14),
  MP: generateRange(17),
  HJ: generateRange(22),
  CO: generateRange(28),
  BTN: generateRange(42),
  SB: generateRange(35),
  BB: generateRange(100), // BB is special - calls/3bets
};
