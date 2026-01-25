// Parser for poker hand histories from various sites

export interface ParsedHand {
  site: string;
  handId: string;
  gameType: string;
  blinds: { sb: number; bb: number };
  players: Player[];
  hero: Player | null;
  heroPosition: string;
  heroCards: { rank: CardRank; suit: CardSuit }[];
  communityCards: {
    flop: { rank: CardRank; suit: CardSuit }[];
    turn: { rank: CardRank; suit: CardSuit } | null;
    river: { rank: CardRank; suit: CardSuit } | null;
  };
  actions: Action[];
  potSize: number;
  winner: string | null;
  showdown: boolean;
}

export interface Player {
  name: string;
  position: string;
  stack: number;
  cards?: { rank: CardRank; suit: CardSuit }[];
}

export interface Action {
  player: string;
  action: ActionType;
  amount?: number;
  street: Street;
  isHero: boolean;
}

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "all-in";
export type Street = "preflop" | "flop" | "turn" | "river";
export type CardRank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";

const suitMap: Record<string, CardSuit> = {
  h: "hearts",
  d: "diamonds",
  c: "clubs",
  s: "spades",
};

const rankMap: Record<string, CardRank> = {
  A: "A", K: "K", Q: "Q", J: "J", T: "T",
  "10": "T", "9": "9", "8": "8", "7": "7",
  "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
};

function parseCard(cardStr: string): { rank: CardRank; suit: CardSuit } | null {
  const match = cardStr.match(/^([AKQJT2-9]|10)([hdcs])$/i);
  if (!match) return null;
  
  const rank = rankMap[match[1].toUpperCase()] || rankMap[match[1]];
  const suit = suitMap[match[2].toLowerCase()];
  
  if (!rank || !suit) return null;
  return { rank, suit };
}

function parseCards(cardsStr: string): { rank: CardRank; suit: CardSuit }[] {
  const cards: { rank: CardRank; suit: CardSuit }[] = [];
  const cardMatches = cardsStr.match(/([AKQJT2-9]|10)[hdcs]/gi) || [];
  
  for (const cardStr of cardMatches) {
    const card = parseCard(cardStr);
    if (card) cards.push(card);
  }
  
  return cards;
}

function detectSite(handHistory: string): string {
  if (handHistory.includes("PokerStars")) return "PokerStars";
  if (handHistory.includes("888poker") || handHistory.includes("Pacific Poker")) return "888poker";
  if (handHistory.includes("partypoker")) return "PartyPoker";
  if (handHistory.includes("GGPoker") || handHistory.includes("GG Network")) return "GGPoker";
  if (handHistory.includes("Winamax")) return "Winamax";
  if (handHistory.includes("iPoker")) return "iPoker";
  return "Unknown";
}

function parsePokerStarsHand(handHistory: string): ParsedHand | null {
  try {
    const lines = handHistory.split("\n").map(l => l.trim()).filter(Boolean);
    
    // Parse hand ID and game type
    const headerMatch = lines[0]?.match(/Hand #(\d+).*?(Hold'em No Limit|Hold'em Limit|Omaha)/i);
    const handId = headerMatch?.[1] || "Unknown";
    const gameType = headerMatch?.[2] || "Hold'em No Limit";
    
    // Parse blinds
    const blindsMatch = lines[0]?.match(/\((\$?[\d.]+)\/(\$?[\d.]+)/);
    const sb = blindsMatch ? parseFloat(blindsMatch[1].replace("$", "")) : 0;
    const bb = blindsMatch ? parseFloat(blindsMatch[2].replace("$", "")) : 0;
    
    // Parse players
    const players: Player[] = [];
    const positions = ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "MP+1", "HJ", "CO"];
    
    for (const line of lines) {
      const seatMatch = line.match(/Seat (\d+): (.+?) \((\$?[\d.]+)/);
      if (seatMatch) {
        const playerName = seatMatch[2];
        const stack = parseFloat(seatMatch[3].replace("$", ""));
        
        // Try to determine position
        let position = "Unknown";
        if (line.includes("button")) position = "BTN";
        else if (line.includes("small blind")) position = "SB";
        else if (line.includes("big blind")) position = "BB";
        
        players.push({ name: playerName, position, stack });
      }
    }
    
    // Find hero
    let hero: Player | null = null;
    let heroCards: { rank: CardRank; suit: CardSuit }[] = [];
    
    for (const line of lines) {
      const dealtMatch = line.match(/Dealt to (.+?) \[(.+?)\]/);
      if (dealtMatch) {
        const heroName = dealtMatch[1];
        hero = players.find(p => p.name === heroName) || null;
        heroCards = parseCards(dealtMatch[2]);
        if (hero) hero.cards = heroCards;
        break;
      }
    }
    
    // Parse community cards
    let flopCards: { rank: CardRank; suit: CardSuit }[] = [];
    let turnCard: { rank: CardRank; suit: CardSuit } | null = null;
    let riverCard: { rank: CardRank; suit: CardSuit } | null = null;
    
    for (const line of lines) {
      if (line.includes("*** FLOP ***")) {
        const flopMatch = line.match(/\[(.+?)\]/);
        if (flopMatch) flopCards = parseCards(flopMatch[1]);
      } else if (line.includes("*** TURN ***")) {
        const turnMatch = line.match(/\] \[(.+?)\]/);
        if (turnMatch) {
          const cards = parseCards(turnMatch[1]);
          turnCard = cards[0] || null;
        }
      } else if (line.includes("*** RIVER ***")) {
        const riverMatch = line.match(/\] \[(.+?)\]/);
        if (riverMatch) {
          const cards = parseCards(riverMatch[1]);
          riverCard = cards[0] || null;
        }
      }
    }
    
    // Parse actions
    const actions: Action[] = [];
    let currentStreet: Street = "preflop";
    
    for (const line of lines) {
      if (line.includes("*** FLOP ***")) currentStreet = "flop";
      else if (line.includes("*** TURN ***")) currentStreet = "turn";
      else if (line.includes("*** RIVER ***")) currentStreet = "river";
      
      // Parse action
      const actionPatterns = [
        { regex: /(.+?): folds/, action: "fold" as ActionType },
        { regex: /(.+?): checks/, action: "check" as ActionType },
        { regex: /(.+?): calls (\$?[\d.]+)/, action: "call" as ActionType },
        { regex: /(.+?): bets (\$?[\d.]+)/, action: "bet" as ActionType },
        { regex: /(.+?): raises .+ to (\$?[\d.]+)/, action: "raise" as ActionType },
        { regex: /(.+?): is all-in/, action: "all-in" as ActionType },
      ];
      
      for (const pattern of actionPatterns) {
        const match = line.match(pattern.regex);
        if (match) {
          const playerName = match[1];
          const amount = match[2] ? parseFloat(match[2].replace("$", "")) : undefined;
          const isHero = hero?.name === playerName;
          
          actions.push({
            player: playerName,
            action: pattern.action,
            amount,
            street: currentStreet,
            isHero,
          });
          break;
        }
      }
    }
    
    // Parse pot and winner
    let potSize = 0;
    let winner: string | null = null;
    let showdown = false;
    
    for (const line of lines) {
      const potMatch = line.match(/Total pot (\$?[\d.]+)/);
      if (potMatch) potSize = parseFloat(potMatch[1].replace("$", ""));
      
      const winnerMatch = line.match(/(.+?) collected (\$?[\d.]+)/);
      if (winnerMatch) winner = winnerMatch[1];
      
      if (line.includes("*** SHOW DOWN ***")) showdown = true;
    }
    
    return {
      site: "PokerStars",
      handId,
      gameType,
      blinds: { sb, bb },
      players,
      hero,
      heroPosition: hero?.position || "Unknown",
      heroCards,
      communityCards: {
        flop: flopCards,
        turn: turnCard,
        river: riverCard,
      },
      actions,
      potSize,
      winner,
      showdown,
    };
  } catch (error) {
    console.error("Error parsing PokerStars hand:", error);
    return null;
  }
}

export function parseHandHistory(handHistory: string): ParsedHand | null {
  if (!handHistory.trim()) return null;
  
  const site = detectSite(handHistory);
  
  switch (site) {
    case "PokerStars":
      return parsePokerStarsHand(handHistory);
    case "888poker":
    case "PartyPoker":
    case "GGPoker":
      // For now, try PokerStars parser as fallback (similar format)
      return parsePokerStarsHand(handHistory);
    default:
      // Try generic parser
      return parsePokerStarsHand(handHistory);
  }
}

// Generate sample hand history for demo with random cards and actions
export function generateSampleHand(): ParsedHand {
  const usedCards = new Set<string>();
  
  const getRandomCard = (): { rank: CardRank; suit: CardSuit } => {
    const allRanks: CardRank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    const allSuits: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];
    let card: { rank: CardRank; suit: CardSuit };
    do {
      const rank = allRanks[Math.floor(Math.random() * allRanks.length)];
      const suit = allSuits[Math.floor(Math.random() * allSuits.length)];
      card = { rank, suit };
    } while (usedCards.has(`${card.rank}${card.suit}`));
    usedCards.add(`${card.rank}${card.suit}`);
    return card;
  };

  // Generate hero cards - prefer premium hands for interesting demos
  const premiumHands: { rank: CardRank; suit: CardSuit }[][] = [
    [{ rank: "A", suit: "spades" }, { rank: "K", suit: "hearts" }],
    [{ rank: "Q", suit: "diamonds" }, { rank: "Q", suit: "clubs" }],
    [{ rank: "A", suit: "hearts" }, { rank: "Q", suit: "hearts" }],
    [{ rank: "J", suit: "spades" }, { rank: "J", suit: "diamonds" }],
    [{ rank: "K", suit: "clubs" }, { rank: "Q", suit: "spades" }],
    [{ rank: "A", suit: "diamonds" }, { rank: "J", suit: "diamonds" }],
    [{ rank: "T", suit: "hearts" }, { rank: "T", suit: "clubs" }],
    [{ rank: "9", suit: "spades" }, { rank: "9", suit: "hearts" }],
  ];
  const heroHand = premiumHands[Math.floor(Math.random() * premiumHands.length)];
  heroHand.forEach(c => usedCards.add(`${c.rank}${c.suit}`));

  // Generate random board
  const flopCards = [getRandomCard(), getRandomCard(), getRandomCard()];
  const turnCard = getRandomCard();
  const riverCard = getRandomCard();

  // Generate random actions with varying bet sizes
  const openSizes = [6, 7, 8, 5];
  const openSize = openSizes[Math.floor(Math.random() * openSizes.length)];
  const threeBetMultiplier = Math.random() > 0.5 ? 3 : 3.5;
  const threeBetSize = Math.round(openSize * threeBetMultiplier);
  
  const flopBetSizes = [18, 22, 25, 30, 15];
  const flopBetSize = flopBetSizes[Math.floor(Math.random() * flopBetSizes.length)];
  
  const turnBetSizes = [35, 45, 55, 40, 50];
  const turnBetSize = turnBetSizes[Math.floor(Math.random() * turnBetSizes.length)];

  // Random pot size based on action progression
  const potSizes = [85, 120, 150, 180, 220, 245, 280];
  const potSize = potSizes[Math.floor(Math.random() * potSizes.length)];

  const actions: Action[] = [
    { player: "Vilão", action: "raise", amount: openSize, street: "preflop", isHero: false },
    { player: "Herói", action: "raise", amount: threeBetSize, street: "preflop", isHero: true },
    { player: "Vilão", action: "call", amount: threeBetSize - openSize, street: "preflop", isHero: false },
    { player: "Vilão", action: "check", street: "flop", isHero: false },
    { player: "Herói", action: "bet", amount: flopBetSize, street: "flop", isHero: true },
    { player: "Vilão", action: "call", amount: flopBetSize, street: "flop", isHero: false },
  ];

  // Randomly add turn action
  if (Math.random() > 0.3) {
    actions.push({ player: "Vilão", action: "check", street: "turn", isHero: false });
    actions.push({ player: "Herói", action: "bet", amount: turnBetSize, street: "turn", isHero: true });
  }

  return {
    site: "Demo",
    handId: String(Math.floor(Math.random() * 999999999)),
    gameType: "Hold'em No Limit",
    blinds: { sb: 1, bb: 2 },
    players: [
      { name: "Herói", position: "BTN", stack: 500, cards: heroHand },
      { name: "Vilão", position: "BB", stack: 485 },
    ],
    hero: { name: "Herói", position: "BTN", stack: 500, cards: heroHand },
    heroPosition: "BTN",
    heroCards: heroHand,
    communityCards: {
      flop: flopCards,
      turn: turnCard,
      river: riverCard,
    },
    actions,
    potSize,
    winner: null,
    showdown: false,
  };
}
