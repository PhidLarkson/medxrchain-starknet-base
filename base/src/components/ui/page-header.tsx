
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: string[];
  className?: string;
  status?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export const PageHeader = ({ 
  title, 
  description, 
  actions, 
  breadcrumb, 
  className,
  status 
}: PageHeaderProps) => {
  return (
    <div className={cn("mb-8 pb-4 border-b", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {item}
              {index < breadcrumb.length - 1 && <span>/</span>}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {status && (
              <Badge variant={status.variant}>{status.label}</Badge>
            )}
          </div>
          {description && (
            <p className="text-lg text-muted-foreground max-w-3xl">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
