
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Assistant from "./pages/Assistant";
import Records from "./pages/Records";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import Models from "./pages/Models";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { loadSettings } from "./utils/localStorage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  }
});

const App = () => {
  // Initialize application settings and preferences
  useEffect(() => {
    // Load user settings
    const settings = loadSettings();
    
    // Apply theme preference if exists
    if (settings.theme) {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    
    // Apply other global settings as needed
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/records" element={<Records />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/models" element={<Models />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
