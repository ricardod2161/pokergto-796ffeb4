import { Brain, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIAnalysisPanelProps {
  analysis: string;
  isLoading: boolean;
  error: string | null;
  onRequestAnalysis: () => void;
  canAnalyze: boolean;
}

export function AIAnalysisPanel({
  analysis,
  isLoading,
  error,
  onRequestAnalysis,
  canAnalyze,
}: AIAnalysisPanelProps) {
  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Análise IA Avançada</h3>
        </div>
        {analysis && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestAnalysis}
            disabled={!canAnalyze}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
        )}
      </div>

      {!analysis && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="relative mb-3">
            <Brain className="w-10 h-10 text-muted-foreground/30" />
            <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Obtenha uma análise GTO detalhada com explicações contextuais
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestAnalysis}
            disabled={!canAnalyze}
            className="border-primary/30 hover:bg-primary/10 text-primary"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Analisar com IA
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
          <p className="text-xs text-muted-foreground">Analisando situação...</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
          <p className="text-xs text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestAnalysis}
            disabled={!canAnalyze}
            className="mt-2 h-7 text-xs text-destructive hover:text-destructive"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-3">
          <div 
            className={cn(
              "prose prose-sm prose-invert max-w-none",
              "prose-p:text-xs prose-p:leading-relaxed prose-p:text-foreground/90",
              "prose-strong:text-primary prose-strong:font-semibold",
              "prose-headings:text-foreground prose-headings:font-semibold",
              "prose-h1:text-sm prose-h2:text-sm prose-h3:text-xs",
              "prose-ul:text-xs prose-ol:text-xs",
              "prose-li:text-foreground/90"
            )}
          >
            {analysis.split('\n').map((paragraph, i) => {
              if (!paragraph.trim()) return null;
              
              // Handle headers
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h4 key={i} className="text-xs font-semibold text-primary mt-3 mb-1">
                    {paragraph.replace(/\*\*/g, '')}
                  </h4>
                );
              }
              
              // Handle numbered lists
              if (/^\d+\./.test(paragraph)) {
                return (
                  <p key={i} className="text-xs text-foreground/90 leading-relaxed pl-2 border-l-2 border-primary/30 ml-1 my-1">
                    {paragraph.replace(/\*\*(.*?)\*\*/g, (_, text) => text)}
                  </p>
                );
              }
              
              // Regular paragraphs
              return (
                <p key={i} className="text-xs text-foreground/90 leading-relaxed my-2">
                  {paragraph.split(/\*\*(.*?)\*\*/g).map((part, j) => 
                    j % 2 === 1 ? (
                      <strong key={j} className="text-primary font-semibold">{part}</strong>
                    ) : part
                  )}
                </p>
              );
            })}
          </div>
          
          <div className="flex items-center gap-1.5 pt-2 border-t border-[hsl(220,15%,15%)]">
            <Sparkles className="w-3 h-3 text-primary/50" />
            <span className="text-[10px] text-muted-foreground">
              Análise gerada por IA • Considere o contexto completo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
