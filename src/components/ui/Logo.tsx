import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  icon: {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  },
  full: {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
  },
};

export function Logo({ variant = "icon", size = "md", className }: LogoProps) {
  const src = variant === "icon" ? logoIcon : logoFull;
  const sizeClass = sizeClasses[variant][size];

  return (
    <img
      src={src}
      alt="PokerGTO Logo"
      className={cn(
        sizeClass,
        variant === "full" ? "w-auto" : "",
        "object-contain",
        className
      )}
    />
  );
}
