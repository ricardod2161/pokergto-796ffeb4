import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
      details = `Strong +EV situation. You're expected to profit ${ev.toFixed(2)} on average.`;
    } else if (ev < -call * 0.1) {
      recommendation = "fold";
      details = `Negative EV spot. You'd lose ${Math.abs(ev).toFixed(2)} on average.`;
    } else {
      recommendation = "marginal";
      details = `Close decision. Consider opponent tendencies and table dynamics.`;
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
        <h1 className="text-2xl font-bold text-foreground">EV Calculator</h1>
        <p className="text-muted-foreground">Calculate Expected Value and make optimal decisions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card-glass rounded-xl p-6 space-y-6">
          <h3 className="font-semibold text-foreground">Input Parameters</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="potSize">Pot Size (BB)</Label>
              <Input
                id="potSize"
                type="number"
                placeholder="e.g., 100"
                value={potSize}
                onChange={(e) => setPotSize(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">Total pot before your decision</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callCost">Call Cost (BB)</Label>
              <Input
                id="callCost"
                type="number"
                placeholder="e.g., 25"
                value={callCost}
                onChange={(e) => setCallCost(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">Amount you need to call</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equity">Equity (%)</Label>
              <Input
                id="equity"
                type="number"
                placeholder="e.g., 35"
                value={equity}
                onChange={(e) => setEquity(e.target.value)}
                className="h-11 bg-input border-border font-mono"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">Your estimated win probability</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impliedOdds">Implied Odds (BB)</Label>
              <Input
                id="impliedOdds"
                type="number"
                placeholder="e.g., 50"
                value={impliedOdds}
                onChange={(e) => setImpliedOdds(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">Expected future winnings if you hit</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="gold" size="lg" className="flex-1" onClick={handleCalculate}>
              <Calculator className="w-5 h-5 mr-2" />
              Calculate EV
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset}>
              Reset
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
            <h3 className="font-semibold text-foreground mb-4">Expected Value</h3>
            
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
                  {result.recommendation === "call" && "✓ CALL"}
                  {result.recommendation === "fold" && "✗ FOLD"}
                  {result.recommendation === "marginal" && "≈ MARGINAL"}
                </div>

                <p className="text-sm text-muted-foreground text-center">{result.details}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Enter values above to calculate expected value
                </p>
              </div>
            )}
          </div>

          {/* Formula Explanation */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">EV Formula</h3>
            <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm">
              <p className="text-primary">EV = (Equity × TotalPot) - ((1 - Equity) × CallCost)</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">TotalPot</strong> = Pot + Call + Implied</p>
              <p><strong className="text-foreground">+EV</strong> = Profitable call over time</p>
              <p><strong className="text-foreground">-EV</strong> = Losing play long-term</p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Pot odds = Call / (Pot + Call)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Need more equity than pot odds to call
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Add implied odds for drawing hands
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
