import { BoardTexture } from "@/lib/pokerAnalysis";
import { cn } from "@/lib/utils";
import { Droplets, Activity } from "lucide-react";

interface BoardTexturePanelProps {
  texture: BoardTexture;
  isOESD?: boolean; // from analyzeHand — undefined means board-only (no hero cards)
}

const wetnessColors = {
  "dry": "text-orange-400 bg-orange-400/10",
  "semi-wet": "text-yellow-400 bg-yellow-400/10",
  "wet": "text-blue-400 bg-blue-400/10",
  "very-wet": "text-cyan-400 bg-cyan-400/10"
};

const wetnessLabels = {
  "dry": "Seco",
  "semi-wet": "Semi-Molhado",
  "wet": "Molhado",
  "very-wet": "Muito Molhado"
};

export function BoardTexturePanel({ texture, isOESD }: BoardTexturePanelProps) {
  const flushDrawLabels = {
    "none": "Nenhum",
    "backdoor": "Backdoor",
    "possible": "Possível",
    "completed": "Completado"
  };

  // Straight draw label — use isOESD if available (hero info), else use board texture
  const getStraightDrawLabel = () => {
    if (texture.straightDraw === "none") return "Nenhum";
    if (texture.straightDraw === "completed") return "Completado";
    if (texture.straightDraw === "backdoor") return "Backdoor";

    // If we have hero-card context (isOESD prop passed)
    if (isOESD !== undefined) {
      return isOESD ? "OESD (8 outs)" : "Gutshot (4 outs)";
    }

    // Board-only fallback
    return texture.straightDraw === "oesd" ? "OESD (8 outs)" : "Gutshot (4 outs)";
  };

  const getStraightDrawBadgeColor = () => {
    if (texture.straightDraw === "none") return "";
    if (texture.straightDraw === "completed") return "text-foreground";
    if (texture.straightDraw === "backdoor") return "text-muted-foreground";

    const effectiveIsOESD = isOESD !== undefined
      ? isOESD
      : texture.straightDraw === "oesd";

    return effectiveIsOESD
      ? "text-success font-semibold"   // OESD — green
      : "text-warning font-semibold";  // Gutshot — yellow
  };

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Textura do Board</h3>
      </div>
      
      {/* Wetness indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            wetnessColors[texture.wetness]
          )}>
            <Droplets className="w-3 h-3" />
            {wetnessLabels[texture.wetness]}
          </div>
          <span className="text-xs text-muted-foreground">{texture.wetnessScore}%</span>
        </div>
        <div className="h-1.5 bg-[hsl(220,15%,12%)] rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              texture.wetnessScore <= 25 ? "bg-orange-400" :
              texture.wetnessScore <= 50 ? "bg-yellow-400" :
              texture.wetnessScore <= 75 ? "bg-blue-400" : "bg-cyan-400"
            )}
            style={{ width: `${texture.wetnessScore}%` }}
          />
        </div>
      </div>
      
      {/* Properties grid */}
      <div className="space-y-2">
        {[
          { label: "Flush Draws", value: flushDrawLabels[texture.flushDraw], 
            active: texture.flushDraw !== "none", colorClass: "" },
          { label: "Straight Draws", value: getStraightDrawLabel(),
            active: texture.straightDraw !== "none", colorClass: getStraightDrawBadgeColor() },
          { label: "Pareado", value: texture.paired ? "Sim" : "Não", 
            active: texture.paired, colorClass: "" },
          { label: "Trips", value: texture.trips ? "Sim" : "Não", 
            active: texture.trips, colorClass: "" },
          { label: "Conectado", value: texture.connected ? "Sim" : "Não", 
            active: texture.connected, colorClass: "" },
          { label: "Rainbow", value: texture.rainbow ? "Sim" : (texture.monotone ? "Monotone" : "Não"), 
            active: !texture.rainbow, colorClass: "" },
          { label: "High Card", value: texture.highCard, 
            active: true, colorClass: "" },
        ].map((item) => (
          <div key={item.label} className="flex justify-between text-xs py-1">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={cn(
              "font-medium",
              item.colorClass || (item.active ? "text-foreground" : "text-muted-foreground/50")
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
