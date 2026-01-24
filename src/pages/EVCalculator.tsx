import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EVCalculator() {
  const [potSize, setPotSize] = useState("");
  const [callCost, setCallCost] = useState("");
  const [equity, setEquity] = useState("");
  const [impliedOdds, setImpliedOdds] = useState("");
  const [result, setResult] = useState<{
    ev: number;
    recommendation: "call" | "fold" | "marginal";
    details: string;
  } | null>(null);

  const handleCalculate = () => {
    const pot = parseFloat(potSize) || 0;
    const call = parseFloat(callCost) || 0;
    const eq = parseFloat(equity) || 0;
    const implied = parseFloat(impliedOdds) || 0;

    if (pot <= 0 || call <= 0 || eq <= 0) return;

    const totalPot = pot + call + implied;
    const ev = (eq / 100) * totalPot - (1 - eq / 100) * call;
    
    let recommendation: "call" | "fold" | "marginal";
    let details: string;

    if (ev > call * 0.1) {
      recommendation = "call";
      details = `Situação forte de +EV. Você espera lucrar ${ev.toFixed(2)} em média.`;
    } else if (ev < -call * 0.1) {
      recommendation = "fold";
      details = `Spot de EV negativo. Você perderia ${Math.abs(ev).toFixed(2)} em média.`;
    } else {
      recommendation = "marginal";
      details = `Decisão próxima. Considere as tendências dos oponentes e dinâmica da mesa.`;
    }

    setResult({ ev, recommendation, details });
  };

  const handleReset = () => {
    setPotSize("");
    setCallCost("");
    setEquity("");
    setImpliedOdds("");
    setResult(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calculadora de EV</h1>
        <p className="text-muted-foreground">Calcule o Valor Esperado e tome decisões ótimas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card-glass rounded-xl p-6 space-y-6">
          <h3 className="font-semibold text-foreground">Parâmetros</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="potSize">Tamanho do Pote (BB)</Label>
              <Input
                id="potSize"
                type="number"
                placeholder="ex: 100"
                value={potSize}
                onChange={(e) => setPotSize(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">Pote total antes da sua decisão</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callCost">Custo do Call (BB)</Label>
              <Input
                id="callCost"
                type="number"
                placeholder="ex: 25"
                value={callCost}
                onChange={(e) => setCallCost(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">Valor que você precisa pagar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equity">Equity (%)</Label>
              <Input
                id="equity"
                type="number"
                placeholder="ex: 35"
                value={equity}
                onChange={(e) => setEquity(e.target.value)}
                className="h-11 bg-input border-border font-mono"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">Sua probabilidade estimada de ganhar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impliedOdds">Implied Odds (BB)</Label>
              <Input
                id="impliedOdds"
                type="number"
                placeholder="ex: 50"
                value={impliedOdds}
                onChange={(e) => setImpliedOdds(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">Ganhos futuros esperados se você acertar</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="gold" size="lg" className="flex-1" onClick={handleCalculate}>
              <Calculator className="w-5 h-5 mr-2" />
              Calcular EV
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset}>
              Limpar
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* EV Display */}
          <div className={cn(
            "card-glass rounded-xl p-6 transition-all",
            result && result.recommendation === "call" && "border-success/50",
            result && result.recommendation === "fold" && "border-destructive/50",
            result && result.recommendation === "marginal" && "border-warning/50"
          )}>
            <h3 className="font-semibold text-foreground mb-4">Valor Esperado</h3>
            
            {result ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className={cn(
                    "flex items-center gap-3 text-4xl font-mono font-bold",
                    result.ev >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {result.ev >= 0 ? (
                      <TrendingUp className="w-10 h-10" />
                    ) : (
                      <TrendingDown className="w-10 h-10" />
                    )}
                    <span>{result.ev >= 0 ? "+" : ""}{result.ev.toFixed(2)} BB</span>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-lg font-semibold",
                  result.recommendation === "call" && "bg-success/20 text-success",
                  result.recommendation === "fold" && "bg-destructive/20 text-destructive",
                  result.recommendation === "marginal" && "bg-warning/20 text-warning"
                )}>
                  {result.recommendation === "call" && "✓ PAGAR"}
                  {result.recommendation === "fold" && "✗ DESISTIR"}
                  {result.recommendation === "marginal" && "≈ MARGINAL"}
                </div>

                <p className="text-sm text-muted-foreground text-center">{result.details}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Insira os valores acima para calcular o valor esperado
                </p>
              </div>
            )}
          </div>

          {/* Formula Explanation */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Fórmula do EV</h3>
            <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm">
              <p className="text-primary">EV = (Equity × PoteTotal) - ((1 - Equity) × CustoCall)</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">PoteTotal</strong> = Pote + Call + Implied</p>
              <p><strong className="text-foreground">+EV</strong> = Call lucrativo a longo prazo</p>
              <p><strong className="text-foreground">-EV</strong> = Jogada perdedora a longo prazo</p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Dicas Rápidas</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Pot odds = Call / (Pote + Call)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Você precisa de mais equity que pot odds para pagar
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Adicione implied odds para mãos de draw
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
