import { cn } from "@/lib/utils";
import { MDFResult, SPRAnalysis, GeometricSizing, GtoFrequencies } from "@/lib/solverEngine";
import { Shield, Layers, TrendingUp, BarChart2 } from "lucide-react";

interface SolverPanelProps {
  mdf?: MDFResult;
  spr?: SPRAnalysis;
  geo?: GeometricSizing;
  gtoFreq?: GtoFrequencies;
}

const commitmentColors = {
  "committed":      "text-destructive bg-destructive/10 border-destructive/30",
  "semi-committed": "text-warning bg-warning/10 border-warning/30",
  "uncommitted":    "text-success bg-success/10 border-success/30",
};

const commitmentLabels = {
  "committed":      "Comprometido",
  "semi-committed": "Semi-Comprometido",
  "uncommitted":    "Livre",
};

export function SolverPanel({ mdf, spr, geo, gtoFreq }: SolverPanelProps) {
  if (!mdf && !spr && !geo && !gtoFreq) return null;

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Análise GTO</h3>
      </div>

      {/* SPR Analysis */}
      {spr && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SPR</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
              commitmentColors[spr.commitment]
            )}>
              {commitmentLabels[spr.commitment]}
            </span>
            <span className="font-mono font-bold text-foreground text-sm">
              {spr.spr}x
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-1">
            {spr.explanation}
          </p>
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-[hsl(220,15%,12%)]">
            <span className="text-xs text-muted-foreground">Threshold:</span>
            <span className="text-xs font-semibold text-foreground">{spr.threshold}</span>
            {spr.canFold && (
              <span className="ml-auto text-xs text-success">pode foldar</span>
            )}
          </div>
        </div>
      )}

      {/* MDF */}
      {mdf && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MDF</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-[hsl(220,15%,10%)] text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Defender</p>
              <p className="font-mono font-bold text-success text-sm">{mdf.mdf}%</p>
            </div>
            <div className="p-2 rounded-lg bg-[hsl(220,15%,10%)] text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Alpha (bluff BE)</p>
              <p className="font-mono font-bold text-warning text-sm">{mdf.alpha}%</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Deve defender</span>
              <span>Pode foldar</span>
            </div>
            <div className="h-2 bg-[hsl(220,15%,12%)] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-success/60 rounded-l-full"
                style={{ width: `${mdf.mdf}%` }}
              />
              <div
                className="h-full bg-destructive/40 rounded-r-full"
                style={{ width: `${100 - mdf.mdf}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* GTO Frequencies */}
      {gtoFreq && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequências GTO</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="p-2 rounded-lg bg-[hsl(220,15%,10%)]">
              <p className="text-xs text-muted-foreground mb-0.5">Bet freq.</p>
              <p className="font-mono font-bold text-primary text-sm">{gtoFreq.betFrequency}%</p>
            </div>
            <div className="p-2 rounded-lg bg-[hsl(220,15%,10%)]">
              <p className="text-xs text-muted-foreground mb-0.5">Sizing rec.</p>
              <p className="font-mono font-bold text-foreground text-sm">{gtoFreq.betSizeRec}</p>
            </div>
          </div>
          {/* Bet breakdown */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 p-1.5 rounded bg-[hsl(220,15%,12%)] text-center">
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="text-xs font-semibold text-success">{gtoFreq.valuePct}%</p>
            </div>
            <div className="flex-1 p-1.5 rounded bg-[hsl(220,15%,12%)] text-center">
              <p className="text-xs text-muted-foreground">Bluff</p>
              <p className="text-xs font-semibold text-destructive">{gtoFreq.bluffPct}%</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{gtoFreq.mixedReason}</p>
        </div>
      )}

      {/* Geometric sizing */}
      {geo && (
        <div className="pt-3 border-t border-[hsl(220,15%,15%)]">
          <p className="text-xs text-muted-foreground mb-2">Sizing Geométrico (all-in by river)</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Flop", value: `${geo.flopSize}%` },
              { label: "Turn", value: `${geo.turnSize}%` },
              { label: "River", value: `${geo.riverSize}%` },
            ].map(s => (
              <div key={s.label} className="p-1.5 rounded bg-[hsl(220,15%,12%)] text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xs font-mono font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
