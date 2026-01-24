import { Brain, Loader2, Sparkles, RefreshCw, Calculator, TrendingUp, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EVAIPanelProps {
  analysis: string;
  isLoading: boolean;
  error: string | null;
  onRequestAnalysis: () => void;
  canAnalyze: boolean;
  hasResult: boolean;
}

export function EVAIPanel({
  analysis,
  isLoading,
  error,
  onRequestAnalysis,
  canAnalyze,
  hasResult,
}: EVAIPanelProps) {
  const parseAnalysis = (text: string) => {
    const sections: { title: string; content: string; icon: React.ReactNode }[] = [];
    
    // Split by section headers (** text **)
    const parts = text.split(/\*\*(\d+\.\s*[^*]+)\*\*/);
    
    let currentTitle = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      if (i % 2 === 1) {
        // This is a header
        currentTitle = part.replace(/^\d+\.\s*/, '').replace(/[:\?]/g, '').trim();
      } else if (currentTitle) {
        // This is content after a header
        let icon: React.ReactNode = <BookOpen className="w-3.5 h-3.5" />;
        const lowerTitle = currentTitle.toLowerCase();
        
        if (lowerTitle.includes('decisão') || lowerTitle.includes('analise')) {
          icon = <Calculator className="w-3.5 h-3.5" />;
        } else if (lowerTitle.includes('número') || lowerTitle.includes('entendendo')) {
          icon = <TrendingUp className="w-3.5 h-3.5" />;
        } else if (lowerTitle.includes('pot odds') || lowerTitle.includes('conceito')) {
          icon = <BookOpen className="w-3.5 h-3.5" />;
        } else if (lowerTitle.includes('implied')) {
          icon = <Sparkles className="w-3.5 h-3.5" />;
        } else if (lowerTitle.includes('dica')) {
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

  const getSectionStyle = (index: number) => {
    const styles = [
      "bg-[hsl(210,85%,35%)]/10 border-[hsl(210,85%,45%)]/30",
      "bg-[hsl(142,70%,25%)]/10 border-[hsl(142,70%,35%)]/30",
      "bg-[hsl(260,60%,40%)]/10 border-[hsl(260,60%,50%)]/30",
      "bg-[hsl(43,90%,45%)]/10 border-[hsl(43,90%,50%)]/30",
      "bg-[hsl(330,70%,40%)]/10 border-[hsl(330,70%,50%)]/30",
    ];
    return styles[index % styles.length];
  };

  const getSectionTextColor = (index: number) => {
    const colors = [
      "text-[hsl(210,85%,65%)]",
      "text-[hsl(142,70%,55%)]",
      "text-[hsl(260,60%,65%)]",
      "text-[hsl(43,90%,55%)]",
      "text-[hsl(330,70%,60%)]",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[hsl(220,15%,13%)] flex items-center justify-between bg-gradient-to-r from-[hsl(220,18%,10%)] to-[hsl(210,50%,15%)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Brain className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Explicação IA</h3>
            <p className="text-[9px] text-muted-foreground">Análise personalizada da decisão de EV</p>
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

      <div className="p-4 max-h-[500px] overflow-y-auto">
        {!analysis && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-400/50" />
              </div>
              <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h4 className="text-sm font-medium text-foreground mb-1">
              {hasResult ? 'Entenda sua decisão' : 'Calcule o EV primeiro'}
            </h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[250px]">
              {hasResult 
                ? 'A IA vai explicar detalhadamente porque esta é a decisão correta, com conceitos didáticos para iniciantes'
                : 'Preencha os campos e calcule o EV para receber uma explicação personalizada'}
            </p>
            {hasResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestAnalysis}
                disabled={!canAnalyze}
                className="border-blue-500/30 hover:bg-blue-500/10 text-blue-300"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Explicar com IA
              </Button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-blue-500/20 rounded-full animate-ping" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Analisando sua decisão...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Preparando explicação didática</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestAnalysis}
              disabled={!canAnalyze}
              className="h-8 text-xs text-destructive hover:text-destructive"
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
                  getSectionStyle(i)
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  getSectionTextColor(i)
                )}>
                  {section.icon}
                  <span className="text-xs font-semibold">{section.title}</span>
                </div>
                <div className="text-[11px] text-foreground/80 leading-relaxed space-y-2">
                  {section.content.split('\n').map((paragraph, j) => {
                    if (!paragraph.trim()) return null;
                    
                    // Handle bold text
                    const parts = paragraph.split(/\*\*([^*]+)\*\*/g);
                    return (
                      <p key={j}>
                        {parts.map((part, k) => 
                          k % 2 === 1 ? (
                            <strong key={k} className="text-foreground font-medium">{part}</strong>
                          ) : part
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Fallback if no sections parsed */}
            {parseAnalysis(analysis).length === 0 && (
              <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {analysis.split(/\*\*([^*]+)\*\*/g).map((part, i) => 
                  i % 2 === 1 ? (
                    <strong key={i} className="text-primary font-medium">{part}</strong>
                  ) : part
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-3 border-t border-[hsl(220,15%,15%)]">
              <Sparkles className="w-3 h-3 text-blue-400/50" />
              <span className="text-[10px] text-muted-foreground">
                Análise gerada por IA • Use como guia educacional
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
