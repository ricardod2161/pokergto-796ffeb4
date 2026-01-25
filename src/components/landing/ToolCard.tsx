import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  name: string;
  description: string;
  path: string;
  icon: LucideIcon;
  imageUrl?: string;
  gradient: string;
}

const ToolCard = ({ name, description, path, icon: Icon, imageUrl, gradient }: ToolCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative group h-full"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="relative h-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
        {/* Image Section */}
        <div className={`relative aspect-video w-full overflow-hidden ${gradient}`}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`${name} mockup`}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-16 h-16 text-white/60 group-hover:text-white/80 transition-colors" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${gradient}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">{name}</h3>
          </div>
          
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>

          <Button 
            onClick={() => navigate(path)}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all"
            variant="outline"
          >
            Experimentar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ToolCard;
