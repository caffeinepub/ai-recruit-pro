import React from 'react';
import { cn } from '@/lib/utils';

interface AIScoreBadgeProps {
  score: number;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AIScoreBadge({ score, showBar = false, size = 'md', className }: AIScoreBadgeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-teal-light';
    if (s >= 60) return 'text-amber-light';
    if (s >= 40) return 'text-amber';
    return 'text-destructive';
  };

  const getBarColor = (s: number) => {
    if (s >= 80) return 'from-teal to-teal-light';
    if (s >= 60) return 'from-amber to-amber-light';
    if (s >= 40) return 'from-amber-dark to-amber';
    return 'from-destructive to-destructive';
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className={cn(
        'inline-flex items-center gap-1 rounded font-semibold font-display',
        'bg-gradient-to-r from-teal/10 to-amber/10 border border-teal/20',
        sizeClasses[size],
        getScoreColor(score)
      )}>
        <span className="text-[10px] opacity-70">AI</span>
        <span>{score}%</span>
      </div>
      {showBar && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', getBarColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
