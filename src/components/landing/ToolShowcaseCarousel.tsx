import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid3X3, GraduationCap, Calculator, BarChart3, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolCard from "./ToolCard";

const tools = [
  {
    name: "Range Analyzer",
    description: "Visualize ranges GTO em formato profissional. Matriz 13x13 com análise de posição e recomendações de IA.",
    path: "/ranges",
    icon: Grid3X3,
    gradient: "bg-gradient-to-br from-emerald-600 to-emerald-800",
  },
  {
    name: "GTO Training",
    description: "Pratique decisões pré-flop com feedback em tempo real. Cenários gerados por IA para acelerar seu aprendizado.",
    path: "/training",
    icon: GraduationCap,
    gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
  },
  {
    name: "EV Calculator",
    description: "Calcule o valor esperado de suas jogadas com precisão. Sliders interativos e visualização clara dos resultados.",
    path: "/ev-calculator",
    icon: Calculator,
    gradient: "bg-gradient-to-br from-purple-600 to-purple-800",
  },
  {
    name: "Equity Calculator",
    description: "Compare sua mão contra ranges oponentes. Análise de equity instantânea para melhores decisões.",
    path: "/equity-calculator",
    icon: Target,
    gradient: "bg-gradient-to-br from-orange-600 to-orange-800",
  },
  {
    name: "Betting Assistant",
    description: "Planeje sua estratégia multi-street com assistência de IA. Recomendações de sizing baseadas no board.",
    path: "/betting-assistant",
    icon: TrendingUp,
    gradient: "bg-gradient-to-br from-rose-600 to-rose-800",
  },
  {
    name: "Statistics",
    description: "Acompanhe sua evolução com métricas detalhadas. Gráficos de performance e análise de tendências.",
    path: "/statistics",
    icon: BarChart3,
    gradient: "bg-gradient-to-br from-cyan-600 to-cyan-800",
  },
];

const ToolShowcaseCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Ferramentas Profissionais
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Conheça Nossas Ferramentas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Suite completa de ferramentas GTO para elevar seu jogo de poker ao próximo nível
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-border shadow-lg hover:bg-primary/10 hidden md:flex"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-border shadow-lg hover:bg-primary/10 hidden md:flex"
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Carousel Container */}
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex -ml-4">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.name}
                  className="flex-none w-full sm:w-1/2 lg:w-1/3 pl-4"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ToolCard {...tool} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {tools.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  selectedIndex === index 
                    ? "bg-primary w-8" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolShowcaseCarousel;
