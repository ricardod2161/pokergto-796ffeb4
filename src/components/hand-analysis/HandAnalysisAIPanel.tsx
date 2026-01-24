import { Brain, Loader2, Sparkles, RefreshCw, AlertCircle, ChartBar, CheckCircle, AlertTriangle, Lightbulb, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HandAnalysisAIPanelProps {
  analysis: string;
  isLoading: boolean;
  error: string | null;
  onRequestAnalysis: () => void;
  canAnalyze: boolean;
}

interface AnalysisSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  colorClass: string;
}

function parseAnalysis(text: string): AnalysisSection[] {
  const sections: AnalysisSection[] = [];
  
  // Match sections with **emoji title** pattern
  const sectionRegex = /\*\*([^*]+)\*\*\s*([\s\S]*?)(?=\*\*[^*]+\*\*|$)/g;
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    
    if (!content) continue;

    let icon: React.ReactNode = <Brain className="w-4 h-4" />;
    let colorClass = "text-primary";

    if (title.includes("Análise") || title.includes("📊")) {
      icon = <ChartBar className="w-4 h-4" />;
      colorClass = "text-primary";
    } else if (title.includes("bem") || title.includes("✅")) {
      icon = <CheckCircle className="w-4 h-4" />;
      colorClass = "text-success";
    } else if (title.includes("Erro") || title.includes("⚠️")) {
      icon = <AlertTriangle className="w-4 h-4" />;
      colorClass = "text-warning";
    } else if (title.includes("GTO") || title.includes("💡") || title.includes("Recomendada")) {
      icon = <Lightbulb className="w-4 h-4" />;
      colorClass = "text-gold";
    } else if (title.includes("Dica") || title.includes("🎯")) {
      icon = <Target className="w-4 h-4" />;
      colorClass = "text-success";
    } else if (title.includes("Conceito") || title.includes("📈")) {
      icon = <TrendingUp className="w-4 h-4" />;
      colorClass = "text-primary";
    }

    sections.push({ title: title.replace(/[📊✅⚠️💡🎯📈]/g, "").trim(), content, icon, colorClass });
  }

  return sections;
}

function formatContent(content: string): React.ReactNode {
  // Process markdown-like formatting
  const lines = content.split("\n");
  
  return lines.map((line, i) => {
    // Handle bullet points
    if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
      const text = line.replace(/^[\s-•]+/, "");
      return (
        <div key={i} className="flex gap-2 mb-1.5">
          <span className="text-muted-foreground mt-1">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(text) }} />
        </div>
      );
    }
    
    // Handle numbered lists
    const numberedMatch = line.match(/^\d+\.\s*(.+)/);
    if (numberedMatch) {
      return (
        <div key={i} className="flex gap-2 mb-1.5">
          <span className="text-primary font-medium min-w-[20px]">{line.match(/^\d+/)?.[0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(numberedMatch[1]) }} />
        </div>
      );
    }
    
    // Regular paragraph
    if (line.trim()) {
      return (
        <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />
      );
    }
    
    return null;
  });
}

function formatInlineText(text: string): string {
  // Bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
  // Italic text
  text = text.replace(/\*([^*]+)\*/g, '<em class="text-muted-foreground">$1</em>');
  // Inline code/terms
  text = text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-primary/20 text-primary text-xs font-mono">$1</code>');
  
  return text;
}

export function HandAnalysisAIPanel({
  analysis,
  isLoading,
  error,
  onRequestAnalysis,
  canAnalyze,
}: HandAnalysisAIPanelProps) {
  const sections = analysis ? parseAnalysis(analysis) : [];

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(220,15%,15%)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-gold/20">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Análise GTO com IA</h3>
            <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>
        
        {analysis && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestAnalysis}
            className="h-8 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Atualizar
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Empty State */}
        {!analysis && !isLoading && !error && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium text-foreground mb-1">Análise Inteligente</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px] mx-auto">
              A IA analisará sua mão e identificará erros, sugerindo melhorias baseadas em GTO.
            </p>
            <Button
              variant="gold"
              size="sm"
              onClick={onRequestAnalysis}
              disabled={!canAnalyze}
              className="w-full max-w-[180px]"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analisar Mão
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Analisando sua mão...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Isso pode levar alguns segundos</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Erro na análise</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRequestAnalysis}
                  className="mt-3 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Content */}
        {analysis && !isLoading && !error && (
          <ScrollArea className="max-h-[400px] pr-2">
            {sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      section.colorClass === "text-success" && "bg-success/5 border-success/20",
                      section.colorClass === "text-warning" && "bg-warning/5 border-warning/20",
                      section.colorClass === "text-gold" && "bg-gold/5 border-gold/20",
                      section.colorClass === "text-primary" && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className={cn("flex items-center gap-2 mb-2", section.colorClass)}>
                      {section.icon}
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {formatContent(section.content)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {analysis}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
