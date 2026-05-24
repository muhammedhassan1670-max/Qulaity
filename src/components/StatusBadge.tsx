/**
 * QMS Enterprise 4.0 - Status & Priority Badge Components
 * Professional status indicators with icons and colors
 */

import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Shield,
  X,
  AlertTriangle,
  Timer,
  PauseCircle
} from 'lucide-react';

export type StatusType = 
  | 'open' 
  | 'draft'
  | 'logged'
  | 'reviewed'
  | 'approved'
  | 'investigating'
  | 'escalated'
  | 'rejected'
  | 'in-progress' 
  | 'pending-approval' 
  | 'closed'
  | 'reopened'
  | 'identified'
  | 'analysis'
  | 'action'
  | 'verification'
  | 'scheduled'
  | 'completed'
  | 'cancelled';

export type PriorityType = 'critical' | 'high' | 'medium' | 'low';

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  'open': {
    label: 'Open',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: AlertCircle
  },
  'draft': {
    label: 'Draft',
    color: '#94A3B8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    icon: FileText
  },
  'logged': {
    label: 'Logged',
    color: '#00A3E0',
    bgColor: 'rgba(0, 163, 224, 0.15)',
    icon: CheckCircle2
  },
  'reviewed': {
    label: 'Reviewed',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    icon: Shield
  },
  'approved': {
    label: 'Approved',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: CheckCircle2
  },
  'investigating': {
    label: 'Investigating',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: AlertTriangle
  },
  'escalated': {
    label: 'Escalated',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: AlertTriangle
  },
  'rejected': {
    label: 'Rejected',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    icon: X
  },
  'in-progress': {
    label: 'In Progress',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    icon: Clock
  },
  'pending-approval': {
    label: 'Pending',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    icon: PauseCircle
  },
  'closed': {
    label: 'Closed',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: CheckCircle2
  },
  'reopened': {
    label: 'Reopened',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    icon: Clock
  },
  'identified': {
    label: 'Identified',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    icon: AlertTriangle
  },
  'analysis': {
    label: 'Analysis',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    icon: FileText
  },
  'action': {
    label: 'Action',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: Timer
  },
  'verification': {
    label: 'Verification',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    icon: Shield
  },
  'scheduled': {
    label: 'Scheduled',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    icon: Clock
  },
  'completed': {
    label: 'Completed',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: CheckCircle2
  },
  'cancelled': {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    icon: X
  }
};

const priorityConfigs: Record<PriorityType, StatusConfig> = {
  'critical': {
    label: 'CRITICAL',
    color: '#FFFFFF',
    bgColor: '#DC2626',
    icon: AlertCircle
  },
  'high': {
    label: 'High',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: AlertTriangle
  },
  'medium': {
    label: 'Medium',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    icon: Clock
  },
  'low': {
    label: 'Low',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    icon: Shield
  }
};

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfigs[status as StatusType] || statusConfigs['open'];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-[11px] gap-1.5',
    lg: 'px-4 py-1.5 text-xs gap-2'
  };
  
  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  return (
    <span
      className={`
        inline-flex items-center font-black uppercase tracking-widest rounded-lg border border-white/5 shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
      style={{ 
        color: config.color, 
        backgroundColor: config.bgColor 
      }}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: PriorityType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PriorityBadge({ 
  priority, 
  size = 'md', 
  showIcon = true,
  className = '' 
}: PriorityBadgeProps) {
  const config = priorityConfigs[priority as PriorityType] || priorityConfigs['medium'];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-[11px] gap-1.5',
    lg: 'px-4 py-1.5 text-xs gap-2'
  };
  
  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  const isCritical = String(priority || '').toLowerCase() === 'critical';

  return (
    <span
      className={`
        inline-flex items-center font-black uppercase tracking-widest rounded-lg border border-white/5 shadow-md
        ${sizeClasses[size]}
        ${className}
        ${isCritical ? 'animate-pulse' : ''}
      `}
      style={{ 
        color: config.color, 
        backgroundColor: config.bgColor 
      }}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

export default StatusBadge;
