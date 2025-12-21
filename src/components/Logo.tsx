import { BookOpen, ShoppingBag } from "lucide-react";

interface LogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
}

const Logo = ({ variant = "default", size = "md", showSlogan = false }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
  };

  const sloganSizes = {
    sm: "text-[7px]",
    md: "text-[8px]",
    lg: "text-[10px]",
  };

  const colorClasses = {
    default: "text-primary",
    white: "text-primary-foreground",
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {/* Logo Icon - Modern Book + Shopping design */}
        <div className="relative">
          <div className={`relative flex items-center justify-center rounded-xl bg-gradient-primary shadow-glow ${size === "lg" ? "p-2.5" : size === "sm" ? "p-1.5" : "p-2"}`}>
            <BookOpen 
              size={iconSizes[size]} 
              className="text-primary-foreground" 
              strokeWidth={2.5}
            />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-secondary flex items-center justify-center shadow-sm ${size === "lg" ? "w-4 h-4" : size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"}`}>
            <ShoppingBag 
              size={size === "lg" ? 10 : size === "sm" ? 7 : 8} 
              className="text-secondary-foreground" 
              strokeWidth={2.5}
            />
          </div>
        </div>
        
        {/* Logo Text */}
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold ${sizeClasses[size]} ${colorClasses[variant]}`}>
            Scoly
          </span>
        </div>
      </div>
      
      {/* Slogan below logo - compact and aligned */}
      {showSlogan && (
        <span className={`${sloganSizes[size]} ${variant === "white" ? "text-primary-foreground/80" : "text-muted-foreground"} mt-0.5 font-medium tracking-tight whitespace-nowrap`}>
          Fournitures scolaires et bureautiques en un clic
        </span>
      )}
    </div>
  );
};

export default Logo;
