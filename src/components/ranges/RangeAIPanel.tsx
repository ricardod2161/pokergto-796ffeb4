import { Brain, Loader2, Sparkles, RefreshCw, BookOpen, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RangeAIPanelProps {
  analysis: string;
  isLoading: boolean;
  error: string | null;
  onRequestAnalysis: () => void;
  canAnalyze: boolean;
  hand: string | null;
}

export function RangeAIPanel({
  analysis,
  isLoading,
  error,
  onRequestAnalysis,
  canAnalyze,
  hand,
}: RangeAIPanelProps) {
  const parseAnalysis = (text: string) => {
    const sections: { title: string; content: string; icon: React.ReactNode }[] = [];
    
    // Split by section headers (** text **)
    const parts = text.split(/\*\*([^*]+)\*\*/);
    
    let currentTitle = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      if (i % 2 === 1) {
        // This is a header
        currentTitle = part.replace(/[:\?]/g, '').trim();
      } else if (currentTitle) {
        // This is content after a header
        let icon: React.ReactNode = <BookOpen className="w-3.5 h-3.5" />;
        if (currentTitle.toLowerCase().includes('por que') || currentTitle.toLowerCase().includes('ação')) {
          icon = <Target className="w-3.5 h-3.5" />;
        } else if (currentTitle.toLowerCase().includes('conceito')) {
          icon = <BookOpen className="w-3.5 h-3.5" />;
        } else if (currentTitle.toLowerCase().includes('dica')) {
          icon = <Lightbulb className="w-3.5 h-3.5" />;
        }
        
        sections.push({
          title: currentTitle,
          content: part.trim(),
          icon,
        });
        currentTitle = '';
      }
    }
    
    return sections;
  };

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden max-h-[400px] overflow-y-auto">
      <div className="px-4 py-3 border-b border-[hsl(220,15%,13%)] flex items-center justify-between bg-gradient-to-r from-[hsl(220,18%,10%)] to-[hsl(260,30%,12%)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Análise IA</h3>
            <p className="text-[9px] text-muted-foreground">Explicação detalhada para iniciantes</p>
          </div>
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

      <div className="p-4">
        {!analysis && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-purple-400/50" />
              </div>
              <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h4 className="text-sm font-medium text-foreground mb-1">
              {hand ? `Analisar ${hand}?` : 'Selecione uma mão'}
            </h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
              {hand 
                ? 'Obtenha uma explicação detalhada do porquê esta é a ação GTO correta'
                : 'Clique em uma mão da matriz para ver análise'}
            </p>
            {hand && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestAnalysis}
                disabled={!canAnalyze}
                className="border-purple-500/30 hover:bg-purple-500/10 text-purple-300"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Explicar com IA
              </Button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-purple-500/20 rounded-full animate-ping" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Analisando estratégia GTO...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
            <p className="text-xs text-destructive mb-2">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestAnalysis}
              disabled={!canAnalyze}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="space-y-3">
            {parseAnalysis(analysis).map((section, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-3 rounded-lg border",
                  i === 0 && "bg-[hsl(142,70%,25%)]/10 border-[hsl(142,70%,35%)]/30",
                  i === 1 && "bg-[hsl(210,85%,35%)]/10 border-[hsl(210,85%,45%)]/30",
                  i === 2 && "bg-[hsl(43,90%,45%)]/10 border-[hsl(43,90%,50%)]/30",
                  i > 2 && "bg-[hsl(220,15%,12%)] border-[hsl(220,15%,18%)]"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  i === 0 && "text-[hsl(142,70%,55%)]",
                  i === 1 && "text-[hsl(210,85%,65%)]",
                  i === 2 && "text-[hsl(43,90%,55%)]",
                  i > 2 && "text-foreground"
                )}>
                  {section.icon}
                  <span className="text-xs font-semibold">{section.title}</span>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}

            {/* If no sections were parsed, show raw text */}
            {parseAnalysis(analysis).length === 0 && (
              <p className="text-xs text-foreground/80 leading-relaxed">
                {analysis}
              </p>
            )}

            <div className="flex items-center gap-1.5 pt-2 border-t border-[hsl(220,15%,15%)]">
              <Sparkles className="w-3 h-3 text-purple-400/50" />
              <span className="text-[10px] text-muted-foreground">
                Análise gerada por IA • Adapte ao seu estilo de jogo
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
