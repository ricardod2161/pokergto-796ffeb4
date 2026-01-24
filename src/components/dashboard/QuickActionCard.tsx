import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient?: string;
}

export function QuickActionCard({ title, description, href, icon: Icon, gradient }: QuickActionCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300",
        "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
      )}
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
          gradient || "bg-primary/10"
        )}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
      </div>
      
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  );
}
