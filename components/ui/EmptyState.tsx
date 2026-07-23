'use client';

import React from 'react';
import { SearchX, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-border bg-card/60 shadow-sm space-y-4 my-4">
      <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
        <Icon className="h-10 w-10 animate-pulse" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-extrabold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-11 min-h-[48px] px-6 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95 cursor-pointer mt-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
