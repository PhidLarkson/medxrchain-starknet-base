
import { cn } from "@/lib/utils";
import { Activity, Github, Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("py-6 md:px-8 border-t", className)}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-pink-600" />
          <span className="text-sm font-medium">MedXRchain</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/records" className="hover:text-foreground hover:underline underline-offset-4">
            Records
          </Link>
          <Link to="/models" className="hover:text-foreground hover:underline underline-offset-4">
            Models
          </Link>
          <Link to="/assistant" className="hover:text-foreground hover:underline underline-offset-4">
            AI Assistant
          </Link>
          <Link to="/settings" className="hover:text-foreground hover:underline underline-offset-4">
            Settings
          </Link>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            yeah, cooked with <Heart className="h-3 w-3 text-pink-600" /> 
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
