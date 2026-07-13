import React from 'react';
import { ConnectionStatus, PaymentStatus } from '@/types';

interface StatusBadgeProps {
  status: ConnectionStatus | PaymentStatus | 'Pending' | 'Assigned' | 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      // Connection Status
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Inactive':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      
      // Payment Status
      case 'Paid':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Unpaid':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      
      // Ticket Status
      case 'Assigned':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'Open':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Closed':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';

      // Priorities
      case 'Low':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';

      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {status}
    </span>
  );
}
