
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Activity, Bot, FileText, Cog, Binary, FileStack, Glasses, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";

const NavBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const { open, setOpen } = useSidebar();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // If not client-side yet, render nothing to prevent hydration mismatch
  if (!isClient) return null;

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-pink-600" />
          <h1 className={cn("text-xl font-bold", isMobile && !open && "sr-only")}>MedXRchain</h1>
        </div>
        {isMobile ? (
          <SidebarTrigger className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        ) : (
          <SidebarTrigger className="h-8 w-8">
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </SidebarTrigger>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4 px-2 py-4">
        <NavLink to="/" active={location.pathname === "/"} isMobile={isMobile}>
          <Activity className="h-4 w-4 lg:mr-2" />
          {(open || isMobile) && "Telemetry"}
        </NavLink>
        <NavLink
          to="/assistant"
          active={location.pathname === "/assistant"}
          isMobile={isMobile}
        >
          <Bot className="h-4 w-4 lg:mr-2" />
          {(open || isMobile) && "Assistant"}
        </NavLink>
        <NavLink
          to="/records"
          active={location.pathname === "/records"}
          isMobile={isMobile}
        >
          <FileStack className="h-4 w-4 lg:mr-2" />
          {(open || isMobile) && "Records"}
        </NavLink>
        <NavLink
          to="/models"
          active={location.pathname === "/models"}
          isMobile={isMobile}
        >
          <Glasses className="h-4 w-4 lg:mr-2" />
          {(open || isMobile) && "Models"}
        </NavLink>
        <NavLink
          to="/notes"
          active={location.pathname === "/notes"}
          isMobile={isMobile}
        >
          <FileText className="h-4 w-4 lg:mr-2" />
          {(open || isMobile) && "Notes"}
        </NavLink>
        <NavLink
          to="/settings"
          active={location.pathname === "/settings"}
          isMobile={isMobile}
        >
          <Cog className="h-4 w-4 lg:mr-2" />
          {(open || isMobile) && "Settings"}
        </NavLink>
      </SidebarContent>

      {!isMobile && (
        <SidebarFooter className={cn("mt-auto p-4 border-t", !open && "hidden")}>
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">AI Status</div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">XR Status</div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="text-xs text-muted-foreground">Ready</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Blockchain</div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="text-xs text-muted-foreground">Local</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Binary className="h-4 w-4 text-pink-600" />
            <div className="flex flex-col">
              <div className="text-xs text-muted-foreground">
                Starknet Hackathon
              </div>
              <div className="text-xs font-medium">MedXRchain v1.0</div>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

interface NavLinkProps {
  to: string;
  active: boolean;
  isMobile: boolean;
  children: React.ReactNode;
}

const NavLink = ({ to, active, isMobile, children }: NavLinkProps) => {
  const { open } = useSidebar();
  
  return (
    <Link
      to={to}
      className={cn(
        "flex h-10 items-center rounded-md px-4 text-sm font-medium",
        {
          "bg-pink-50 text-pink-600": active,
          "text-muted-foreground hover:bg-muted hover:text-foreground": !active,
          "justify-center w-12 flex-col gap-1 text-[10px]": isMobile && !open,
          "w-full justify-start": open || isMobile
        }
      )}
    >
      {children}
    </Link>
  );
};

export default NavBar;
