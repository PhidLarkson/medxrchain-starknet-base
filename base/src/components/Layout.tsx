
import { ReactNode, useEffect } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAppStore } from '@/stores/appStore';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  hideFooter?: boolean;
}

const Layout = ({ children, className, fullWidth = false, hideFooter = false }: LayoutProps) => {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <SidebarProvider defaultOpen={!window.matchMedia('(max-width: 768px)').matches}>
      <div className={cn(
        "min-h-screen w-full bg-background flex flex-col overflow-hidden font-sans",
        theme === 'dark' ? 'dark' : ''
      )}>
        <div className="flex-1 flex overflow-hidden">
          <NavBar />
          <main 
            className={cn(
              "flex-1 flex flex-col px-6 md:px-8 pb-0 pt-4 animate-fade-in overflow-y-auto",
              fullWidth ? "w-full" : "container mx-auto max-w-7xl",
              className
            )}
          >
            <div className="flex-1 mb-6">
              {children}
            </div>
            {!hideFooter && <Footer />}
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
