import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

export function KPICard({ title, value, icon, trend, trendValue, color = 'default' }: KPICardProps) {
  const colorClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className="min-w-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold font-heading mt-2 tabular-nums break-words">{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                {trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span className={`text-xs ${
                  trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`ml-2 shrink-0 p-1.5 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
