import { HelpCircle, BookOpen, TrendingUp, Users, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TooltipData {
  title: string;
  description: string;
  example?: string;
}

export const educationalContent: Record<string, TooltipData> = {
  // Scenarios
  open: {
    title: "Open Raise (RFI)",
    description: "Primeira aposta pré-flop quando ninguém abriu antes de você. É a ação mais comum para iniciar uma mão.",
    example: "Exemplo: Você está no CO com AKs e todos foldaram. Você faz um raise de 2.5bb.",
  },
  "3bet": {
    title: "3-Bet",
    description: "Re-raise contra quem fez o open raise. Mostra força e coloca pressão no oponente.",
    example: "Exemplo: UTG abre 2.5bb, você está no BTN com QQ e faz 3-bet para 8bb.",
  },
  "4bet": {
    title: "4-Bet",
    description: "Re-raise contra um 3-bet. Normalmente feito com mãos premium ou como bluff balanceado.",
    example: "Exemplo: Você abriu CO, BTN fez 3-bet, você 4-beta com AA ou AK.",
  },
  squeeze: {
    title: "Squeeze",
    description: "3-bet após um open e um ou mais callers. Aproveita a situação de dead money no pote.",
    example: "Exemplo: UTG abre, MP paga, você está no BTN com TT e faz squeeze para 12bb.",
  },
  coldcall: {
    title: "Cold Call",
    description: "Pagar um raise sem ter investido dinheiro antes. Usado com mãos especulativas em posição.",
    example: "Exemplo: CO abre, você está no BTN com 87s e apenas paga.",
  },
  vs3bet: {
    title: "vs 3-Bet",
    description: "Como responder quando você abriu e alguém fez 3-bet. Decidir entre 4-bet, call ou fold.",
    example: "Exemplo: Você abriu CO, BTN fez 3-bet. Você decide se defende ou não.",
  },
  isoraise: {
    title: "Iso-Raise",
    description: "Raise para isolar um limper (quem apenas pagou o big blind). Objetivo é jogar heads-up em posição.",
    example: "Exemplo: HJ faz limp, você está no CO com AJ e faz iso-raise para 4bb.",
  },
  bbdefense: {
    title: "BB Defense",
    description: "Defesa do Big Blind contra opens. Você já tem dinheiro investido e está fechando a ação.",
    example: "Exemplo: BTN abre 2.5bb, SB folda, você está no BB com K9s e defende.",
  },
  
  // Positions
  UTG: {
    title: "Under The Gun",
    description: "Primeira posição a agir. Range mais apertado pois muitos jogadores ainda podem atuar depois.",
  },
  MP: {
    title: "Middle Position",
    description: "Posição intermediária na mesa. Range moderado, ainda com jogadores para agir.",
  },
  CO: {
    title: "Cutoff",
    description: "Penúltima posição antes do dealer. Boa posição com ranges mais amplos.",
  },
  BTN: {
    title: "Button (Dealer)",
    description: "Melhor posição da mesa. Sempre age por último no pós-flop. Ranges mais amplos.",
  },
  SB: {
    title: "Small Blind",
    description: "Pior posição pós-flop. Age primeiro em todas as streets. Range mais seletivo.",
  },
  BB: {
    title: "Big Blind",
    description: "Última posição pré-flop com dinheiro investido. Pode defender range amplo com desconto.",
  },
  
  // Actions
  raise: {
    title: "Raise (Aumentar)",
    description: "Apostar ou aumentar para colocar pressão e construir pote com mãos fortes ou bluffs.",
  },
  call: {
    title: "Call (Pagar)",
    description: "Igualar a aposta do oponente. Usado com mãos especulativas ou para controlar o pote.",
  },
  fold: {
    title: "Fold (Desistir)",
    description: "Descartar a mão sem investir mais dinheiro. Essencial para preservar stack.",
  },
  
  // Hand Types
  suited: {
    title: "Suited (Mesmo Naipe)",
    description: "Cartas do mesmo naipe (ex: A♠K♠). Tem mais valor por poder fazer flush.",
    example: "AKs = Ás e Rei suited. Apenas 4 combinações possíveis.",
  },
  offsuit: {
    title: "Offsuit (Naipes Diferentes)",
    description: "Cartas de naipes diferentes (ex: A♠K♥). Menos valor que suited.",
    example: "AKo = Ás e Rei offsuit. 12 combinações possíveis.",
  },
  pair: {
    title: "Par",
    description: "Duas cartas do mesmo valor. Forte pré-flop, especialmente pares altos.",
    example: "AA = Par de Ases. 6 combinações possíveis.",
  },
  
  // Stats
  range: {
    title: "Range",
    description: "Conjunto de mãos que você joga em uma situação. Medido em % das 169 mãos possíveis.",
  },
  frequency: {
    title: "Frequência",
    description: "Quão frequentemente você executa uma ação com determinada mão (0-100%).",
  },
  ev: {
    title: "EV (Expected Value)",
    description: "Valor esperado em big blinds. Positivo = lucro no longo prazo.",
  },
  combos: {
    title: "Combinações",
    description: "Número de formas de formar uma mão. Pares = 6, Suited = 4, Offsuit = 12.",
  },
};

interface EducationalTooltipProps {
  term: keyof typeof educationalContent;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function EducationalTooltip({ term, children, showIcon = true, className }: EducationalTooltipProps) {
  const content = educationalContent[term];
  if (!content) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {children}
            {showIcon && (
              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs bg-[hsl(220,18%,10%)] border-[hsl(220,15%,18%)] p-3"
          side="top"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{content.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {content.description}
            </p>
            {content.example && (
              <p className="text-[10px] text-primary/80 italic border-l-2 border-primary/30 pl-2">
                {content.example}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface QuickHelpProps {
  className?: string;
}

export function QuickHelp({ className }: QuickHelpProps) {
  return (
    <div className={cn("bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] p-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Guia Rápido</span>
      </div>
      
      <div className="space-y-3 text-[10px]">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded bg-[hsl(142,70%,35%)] flex items-center justify-center shrink-0">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <div>
            <span className="font-semibold text-[hsl(142,70%,55%)]">Verde = Raise</span>
            <p className="text-muted-foreground">Mãos que você deve apostar ou aumentar</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded bg-[hsl(210,85%,45%)] flex items-center justify-center shrink-0">
            <Layers className="w-3 h-3 text-white" />
          </div>
          <div>
            <span className="font-semibold text-[hsl(210,85%,65%)]">Azul = Call</span>
            <p className="text-muted-foreground">Mãos especulativas para pagar</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded bg-[hsl(220,15%,15%)] border border-[hsl(220,15%,25%)] flex items-center justify-center shrink-0">
            <span className="text-[8px] text-[hsl(220,15%,45%)]">X</span>
          </div>
          <div>
            <span className="font-semibold text-[hsl(220,15%,60%)]">Escuro = Fold</span>
            <p className="text-muted-foreground">Mãos que você deve desistir</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-[hsl(220,15%,15%)]">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Notação das mãos:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div>
              <span className="font-mono font-bold text-foreground">AA</span>
              <span className="text-muted-foreground"> = Par</span>
            </div>
            <div>
              <span className="font-mono font-bold text-foreground">AKs</span>
              <span className="text-muted-foreground"> = Suited</span>
            </div>
            <div>
              <span className="font-mono font-bold text-foreground">AKo</span>
              <span className="text-muted-foreground"> = Offsuit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
