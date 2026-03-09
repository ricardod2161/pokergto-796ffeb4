// Real Monte Carlo Equity Engine
// Evaluates poker hand equity via simulation against a representative villain range

type Suit = "h" | "d" | "c" | "s";
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

interface EngineCard {
  rank: Rank;
  suit: Suit;
}

export interface EquityResult {
  win: number;   // 0-100
  tie: number;   // 0-100
  lose: number;  // 0-100
  iterations: number;
}

// ──────────────────────────────────────────
// Card encoding: 0–51 (rank*4 + suit index)
// ──────────────────────────────────────────

const SUITS: Suit[] = ["h", "d", "c", "s"];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function encodeCard(rank: Rank, suit: Suit): number {
  return (rank - 2) * 4 + SUITS.indexOf(suit);
}

function decodeCard(n: number): EngineCard {
  return { rank: (Math.floor(n / 4) + 2) as Rank, suit: SUITS[n % 4] };
}

const FULL_DECK: number[] = Array.from({ length: 52 }, (_, i) => i);

// ──────────────────────────────────────────
// Top ~30% preflop range filter
// Hand represented as two sorted ranks (high, low) + suited flag
// ──────────────────────────────────────────

function isInVillainRange(c1: EngineCard, c2: EngineCard): boolean {
  const hi = Math.max(c1.rank, c2.rank);
  const lo = Math.min(c1.rank, c2.rank);
  const suited = c1.suit === c2.suit;

  // Pocket pairs 22+
  if (hi === lo) return hi >= 2;

  // Broadway combinations
  if (hi >= 10 && lo >= 10) return true;

  // Suited aces
  if (hi === 14 && suited) return true;

  // Suited kings
  if (hi === 13 && lo >= 7 && suited) return true;

  // Suited connectors & one-gappers
  if (suited && hi - lo <= 2 && lo >= 5) return true;

  // Offsuit aces with decent kicker
  if (hi === 14 && lo >= 9) return true;

  // KQ, KJ, QJ offsuit
  if (hi === 13 && lo >= 11) return true;
  if (hi === 12 && lo === 11) return true;

  // Suited queens
  if (hi === 12 && lo >= 8 && suited) return true;

  return false;
}

// ──────────────────────────────────────────
// Fisher-Yates shuffle (in-place, partial)
// ──────────────────────────────────────────

function shufflePartial(deck: number[], count: number): void {
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (deck.length - i));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
}

// ──────────────────────────────────────────
// 5-card hand evaluator
// Returns a numeric score: higher = better hand
// ──────────────────────────────────────────

function evaluateFiveCards(cards: EngineCard[]): number {
  // Sort descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);

  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  // Rank counts
  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const countVals = Object.values(counts).sort((a, b) => b - a);
  const countKeys = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]))
    .map(e => parseInt(e[0]));

  // Straight check (including wheel A-2-3-4-5)
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqueRanks.length >= 5) {
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
        isStraight = true;
        straightHigh = uniqueRanks[i];
        break;
      }
    }
    // Wheel: A-2-3-4-5
    if (!isStraight && uniqueRanks.includes(14) && uniqueRanks.includes(5) &&
        uniqueRanks.includes(4) && uniqueRanks.includes(3) && uniqueRanks.includes(2)) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Hand rankings (8=straight flush, 7=quads, 6=full house, 5=flush,
  //                4=straight, 3=trips, 2=two pair, 1=pair, 0=high card)

  if (isFlush && isStraight) {
    return 8_000_000 + straightHigh;
  }
  if (countVals[0] === 4) {
    return 7_000_000 + countKeys[0] * 100 + countKeys[1];
  }
  if (countVals[0] === 3 && countVals[1] === 2) {
    return 6_000_000 + countKeys[0] * 100 + countKeys[1];
  }
  if (isFlush) {
    return 5_000_000 + ranks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
  }
  if (isStraight) {
    return 4_000_000 + straightHigh;
  }
  if (countVals[0] === 3) {
    const kickers = countKeys.slice(1, 3);
    return 3_000_000 + countKeys[0] * 10000 + kickers[0] * 100 + kickers[1];
  }
  if (countVals[0] === 2 && countVals[1] === 2) {
    const pair1 = Math.max(countKeys[0], countKeys[1]);
    const pair2 = Math.min(countKeys[0], countKeys[1]);
    const kicker = countKeys[2];
    return 2_000_000 + pair1 * 10000 + pair2 * 100 + kicker;
  }
  if (countVals[0] === 2) {
    const kickers = countKeys.slice(1, 4);
    return 1_000_000 + countKeys[0] * 100000 + kickers[0] * 1000 + kickers[1] * 10 + kickers[2];
  }
  // High card
  return ranks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
}

// ──────────────────────────────────────────
// Best 5-card hand from 6 or 7 cards
// ──────────────────────────────────────────

const COMBOS_7C5: number[][] = [];
(function buildCombos() {
  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++)
      for (let c = b + 1; c < 7; c++)
        for (let d = c + 1; d < 7; d++)
          for (let e = d + 1; e < 7; e++)
            COMBOS_7C5.push([a, b, c, d, e]);
})();

function bestHandScore(sevenCards: EngineCard[]): number {
  let best = -1;
  for (const combo of COMBOS_7C5) {
    const five = combo.map(i => sevenCards[i]);
    const score = evaluateFiveCards(five);
    if (score > best) best = score;
  }
  return best;
}

// ──────────────────────────────────────────
// Convert public card format to EngineCard
// ──────────────────────────────────────────

const RANK_NAME_TO_INT: Record<string, Rank> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14
};

const SUIT_NAME_TO_SHORT: Record<string, Suit> = {
  hearts: "h", diamonds: "d", clubs: "c", spades: "s"
};

interface PublicCard {
  rank: string;
  suit: string;
}

function toEngineCard(c: PublicCard): EngineCard {
  return {
    rank: RANK_NAME_TO_INT[c.rank] ?? 2,
    suit: SUIT_NAME_TO_SHORT[c.suit] ?? "h",
  };
}

// ──────────────────────────────────────────
// Main Monte Carlo simulation
// ──────────────────────────────────────────

export async function runMonteCarloEquity(
  heroCards: PublicCard[],
  boardCards: PublicCard[],
  iterations = 5000
): Promise<EquityResult> {
  const heroEngineCards = heroCards.map(toEngineCard);
  const boardEngineCards = boardCards.map(toEngineCard);

  // Encode known cards to exclude from deck
  const knownEncoded = new Set<number>([
    ...heroEngineCards.map(c => encodeCard(c.rank, c.suit)),
    ...boardEngineCards.map(c => encodeCard(c.rank, c.suit)),
  ]);

  const availableDeck = FULL_DECK.filter(n => !knownEncoded.has(n));
  const boardNeeded = 5 - boardEngineCards.length; // cards to complete board
  const CARDS_NEEDED = 2 + boardNeeded; // 2 villain + missing board

  let wins = 0, ties = 0, losses = 0;
  let validIterations = 0;

  // Chunked async to avoid blocking UI
  const CHUNK_SIZE = 500;
  const chunks = Math.ceil(iterations / CHUNK_SIZE);

  const runChunk = (chunkIterations: number): void => {
    const workDeck = [...availableDeck];
    for (let iter = 0; iter < chunkIterations; iter++) {
      shufflePartial(workDeck, CARDS_NEEDED);

      const villainCards: EngineCard[] = [
        decodeCard(workDeck[0]),
        decodeCard(workDeck[1]),
      ];

      // Filter villain to top 30% range
      if (!isInVillainRange(villainCards[0], villainCards[1])) continue;
      validIterations++;

      const runoutCards: EngineCard[] = [];
      for (let i = 0; i < boardNeeded; i++) {
        runoutCards.push(decodeCard(workDeck[2 + i]));
      }

      const fullBoard = [...boardEngineCards, ...runoutCards];

      const heroScore = bestHandScore([...heroEngineCards, ...fullBoard]);
      const villainScore = bestHandScore([...villainCards, ...fullBoard]);

      if (heroScore > villainScore) wins++;
      else if (heroScore === villainScore) ties++;
      else losses++;
    }
  };

  for (let c = 0; c < chunks; c++) {
    const chunkIterations = c < chunks - 1 ? CHUNK_SIZE : iterations - c * CHUNK_SIZE;
    runChunk(chunkIterations);

    // Yield to browser between chunks
    if (c < chunks - 1) {
      await new Promise<void>(resolve => {
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => resolve(), { timeout: 50 });
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }

  const total = Math.max(validIterations, 1);
  return {
    win: Math.round((wins / total) * 1000) / 10,
    tie: Math.round((ties / total) * 1000) / 10,
    lose: Math.round((losses / total) * 1000) / 10,
    iterations: validIterations,
  };
}
