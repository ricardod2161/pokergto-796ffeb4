import { cn } from "@/lib/utils";

const positions = [
  { id: "UTG", label: "UTG", fullName: "Under the Gun" },
  { id: "UTG1", label: "UTG+1", fullName: "Under the Gun +1" },
  { id: "MP", label: "MP", fullName: "Posição Média" },
  { id: "HJ", label: "HJ", fullName: "Hijack" },
  { id: "CO", label: "CO", fullName: "Cutoff" },
  { id: "BTN", label: "BTN", fullName: "Button" },
  { id: "SB", label: "SB", fullName: "Small Blind" },
  { id: "BB", label: "BB", fullName: "Big Blind" },
];

interface PositionSelectorProps {
  selectedPosition: string;
  onPositionChange: (position: string) => void;
}

export function PositionSelector({ selectedPosition, onPositionChange }: PositionSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-muted-foreground">Posição</label>
      <div className="grid grid-cols-4 gap-2">
        {positions.map((pos) => (
          <button
            key={pos.id}
            onClick={() => onPositionChange(pos.id)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "border hover:border-primary/50",
              selectedPosition === pos.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary"
            )}
          >
            <span className="font-semibold">{pos.label}</span>
            <span className={cn(
              "text-[10px]",
              selectedPosition === pos.id ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {pos.fullName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
