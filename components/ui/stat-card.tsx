import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'gold' | 'orange' | 'red';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'border-accent-primary/30 bg-accent-primary/5 shadow-[0_0_10px_rgba(0,212,255,0.1)]',
    gold: 'border-trophy-gold/30 bg-trophy-gold/10',
    orange: 'border-accent-primary/40 bg-accent-primary/10 shadow-[0_0_15px_rgba(0,212,255,0.15)]',
    red: 'border-trophy-red/30 bg-trophy-red/10',
  };

  const accentColors = {
    default: 'text-accent-primary',
    gold: 'text-trophy-gold',
    orange: 'text-accent-primary',
    red: 'text-trophy-red',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-all hover:border-accent-primary/50',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', accentColors[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn('opacity-40', accentColors[variant])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickStatsProps {
  stats: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    variant?: StatCardProps['variant'];
  }>;
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
