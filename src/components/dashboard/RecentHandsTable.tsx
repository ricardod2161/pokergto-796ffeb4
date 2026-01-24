import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HandHistory {
  id: string;
  date: string;
  stakes: string;
  position: string;
  hand: string;
  result: number;
  action: string;
}

const mockHands: HandHistory[] = [
  { id: "1", date: "15/01/2024", stakes: "NL100", position: "BTN", hand: "A♠K♦", result: 245, action: "3-Bet" },
  { id: "2", date: "15/01/2024", stakes: "NL100", position: "CO", hand: "Q♣Q♥", result: -120, action: "Call" },
  { id: "3", date: "14/01/2024", stakes: "NL50", position: "BB", hand: "J♠T♠", result: 89, action: "Check" },
  { id: "4", date: "14/01/2024", stakes: "NL100", position: "UTG", hand: "A♥A♣", result: 520, action: "4-Bet" },
  { id: "5", date: "13/01/2024", stakes: "NL50", position: "SB", hand: "7♦7♠", result: -45, action: "Fold" },
];

export function RecentHandsTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Mãos Recentes</h3>
        <Link to="/hand-analysis/import" className="text-sm text-primary hover:underline">
          Ver todas
        </Link>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stakes</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Posição</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mão</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockHands.map((hand) => (
              <tr 
                key={hand.id} 
                className="hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-muted-foreground">{hand.date}</td>
                <td className="px-4 py-3 font-mono text-foreground">{hand.stakes}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                    {hand.position}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-medium text-foreground">{hand.hand}</td>
                <td className="px-4 py-3 text-muted-foreground">{hand.action}</td>
                <td className={cn(
                  "px-4 py-3 text-right font-mono font-medium",
                  hand.result >= 0 ? "text-success" : "text-destructive"
                )}>
                  {hand.result >= 0 ? "+" : ""}{hand.result} BB
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
