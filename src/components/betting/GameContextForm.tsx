import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";

interface GameContextFormProps {
  potSize: string;
  setPotSize: (value: string) => void;
  stackSize: string;
  setStackSize: (value: string) => void;
  betSize: string;
  setBetSize: (value: string) => void;
  position: "ip" | "oop";
  setPosition: (value: "ip" | "oop") => void;
  facingBet: boolean;
  setFacingBet: (value: boolean) => void;
  villainType: "unknown" | "tight" | "loose" | "aggressive" | "passive";
  setVillainType: (value: "unknown" | "tight" | "loose" | "aggressive" | "passive") => void;
}

export function GameContextForm({
  potSize,
  setPotSize,
  stackSize,
  setStackSize,
  betSize,
  setBetSize,
  position,
  setPosition,
  facingBet,
  setFacingBet,
  villainType,
  setVillainType
}: GameContextFormProps) {
  const villainTypes = [
    { value: "unknown", label: "Desconhecido" },
    { value: "tight", label: "Tight" },
    { value: "loose", label: "Loose" },
    { value: "aggressive", label: "Agressivo" },
    { value: "passive", label: "Passivo" }
  ] as const;

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Contexto do Jogo</h3>
      </div>
      
      <div className="space-y-3">
        {/* Pot and Stack */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="potSize" className="text-xs text-muted-foreground">
              Tamanho do Pote (bb)
            </Label>
            <Input
              id="potSize"
              type="number"
              placeholder="ex: 45"
              value={potSize}
              onChange={(e) => setPotSize(e.target.value)}
              className="h-8 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono text-sm focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="stackSize" className="text-xs text-muted-foreground">
              Stack Efetivo (bb)
            </Label>
            <Input
              id="stackSize"
              type="number"
              placeholder="ex: 100"
              value={stackSize}
              onChange={(e) => setStackSize(e.target.value)}
              className="h-8 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono text-sm focus:border-primary"
            />
          </div>
        </div>

        {/* Position */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Posição</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "ip", label: "In Position" },
              { value: "oop", label: "Out of Position" }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPosition(opt.value as "ip" | "oop")}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-medium transition-all border",
                  position === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-[hsl(220,15%,10%)] text-muted-foreground border-[hsl(220,15%,18%)] hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facing bet */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Situação</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFacingBet(false)}
              className={cn(
                "py-1.5 rounded-lg text-xs font-medium transition-all border",
                !facingBet
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-[hsl(220,15%,10%)] text-muted-foreground border-[hsl(220,15%,18%)] hover:text-foreground"
              )}
            >
              Primeiro a Agir
            </button>
            <button
              onClick={() => setFacingBet(true)}
              className={cn(
                "py-1.5 rounded-lg text-xs font-medium transition-all border",
                facingBet
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-[hsl(220,15%,10%)] text-muted-foreground border-[hsl(220,15%,18%)] hover:text-foreground"
              )}
            >
              Enfrentando Bet
            </button>
          </div>
        </div>

        {/* Bet size if facing bet */}
        {facingBet && (
          <div>
            <Label htmlFor="betSize" className="text-xs text-muted-foreground">
              Tamanho do Bet (bb)
            </Label>
            <Input
              id="betSize"
              type="number"
              placeholder="ex: 15"
              value={betSize}
              onChange={(e) => setBetSize(e.target.value)}
              className="h-8 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono text-sm focus:border-primary"
            />
          </div>
        )}

        {/* Villain type */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo de Vilão</Label>
          <div className="flex flex-wrap gap-1.5">
            {villainTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setVillainType(type.value)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-all border",
                  villainType === type.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-[hsl(220,15%,10%)] text-muted-foreground border-[hsl(220,15%,18%)] hover:text-foreground"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
