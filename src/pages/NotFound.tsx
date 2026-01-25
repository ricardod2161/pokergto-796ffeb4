import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div 
        className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, 40, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-destructive/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -30, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link to="/">
            <Logo variant="icon" size="lg" className="mx-auto w-16 h-16 rounded-xl opacity-50 hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>

        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/5 leading-none select-none">
            404
          </h1>
          
          {/* Floating Cards Animation */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ 
              rotate: [0, 10, -10, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex gap-2">
              {['♠', '♥', '♣', '♦'].map((suit, i) => (
                <motion.div
                  key={suit}
                  className={`w-12 h-16 md:w-16 md:h-20 rounded-lg bg-card border border-border/50 flex items-center justify-center text-2xl md:text-3xl font-bold shadow-xl ${
                    suit === '♥' || suit === '♦' ? 'text-destructive' : 'text-foreground'
                  }`}
                  initial={{ opacity: 0, y: 20, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: (i - 1.5) * 8 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  whileHover={{ y: -5, scale: 1.1 }}
                >
                  {suit}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Mão Perdida!
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Parece que você fez um fold errado. Esta página não existe no nosso range.
          </p>
          <p className="text-sm text-muted-foreground/60 mt-2 font-mono">
            {location.pathname}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/20">
              <Link to="/">
                <Home className="w-4 h-4" />
                Voltar ao Início
              </Link>
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4" />
                Ir para Dashboard
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Help Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground"
        >
          <Link 
            to="/ranges" 
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
            Ver Ranges
          </Link>
          <Link 
            to="/training" 
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Treinamento
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
