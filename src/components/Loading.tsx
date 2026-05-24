// QMS Enterprise 4.0 - Loading Components
// Professional loading states and skeleton screens

import { Loader2, Zap, Activity, Factory } from 'lucide-react';

// Full Page Loading Screen
export function FullPageLoader({ 
  message = 'Loading...',
  submessage = 'QMS Enterprise 4.0'
}: { 
  message?: string;
  submessage?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-2xl shadow-[#0066CC]/30">
            <Zap className="w-10 h-10 text-white animate-pulse" />
          </div>
          {/* Rotating rings */}
          <div className="absolute inset-0 -m-2">
            <div className="w-24 h-24 rounded-full border-2 border-[#0066CC]/30 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute inset-0 -m-4">
            <div className="w-28 h-28 rounded-full border border-[#00A3E0]/20 animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{submessage}</h2>
        <p className="text-gray-400">{message}</p>
        
        {/* Progress bar */}
        <div className="mt-6 w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

// Section Loading
export function SectionLoader({ 
  message = 'Loading...',
  height = '400px'
}: { 
  message?: string;
  height?: string;
}) {
  return (
    <div 
      className="glass-panel rounded-xl flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#00A3E0] animate-spin mx-auto mb-3" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white/10" />
          <div>
            <div className="w-32 h-4 bg-white/10 rounded mb-2" />
            <div className="w-20 h-3 bg-white/5 rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-2 bg-white/5 rounded" />
        <div className="w-3/4 h-2 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ height = '300px' }: { height?: string }) {
  return (
    <div className="glass-panel rounded-xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="w-40 h-5 bg-white/10 rounded" />
        <div className="w-24 h-4 bg-white/5 rounded" />
      </div>
      <div className="flex items-end gap-2" style={{ height }}>
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="flex-1 bg-white/10 rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-white/10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-white/10 rounded" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-white/5">
          {[...Array(5)].map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="flex-1 h-3 bg-white/5 rounded"
              style={{ opacity: 1 - colIndex * 0.15 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Stats Grid Skeleton
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Dashboard Skeleton - Full layout
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <StatsSkeleton count={4} />
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height="300px" />
        <ChartSkeleton height="300px" />
      </div>
      
      {/* Table Row */}
      <TableSkeleton rows={5} />
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="glass-panel rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="w-48 h-4 bg-white/10 rounded mb-2" />
            <div className="w-32 h-3 bg-white/5 rounded" />
          </div>
          <div className="w-20 h-6 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="glass-panel rounded-xl p-6 space-y-6 animate-pulse">
      {[...Array(fields)].map((_, i) => (
        <div key={i}>
          <div className="w-32 h-4 bg-white/10 rounded mb-2" />
          <div className="w-full h-12 bg-white/5 rounded-lg" />
        </div>
      ))}
      <div className="w-full h-12 bg-white/10 rounded-lg" />
    </div>
  );
}

// Kanban Skeleton
export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 animate-pulse">
      {[...Array(4)].map((_, colIndex) => (
        <div key={colIndex} className="flex-shrink-0 w-80">
          <div className="glass-panel rounded-xl p-4 mb-4">
            <div className="w-24 h-5 bg-white/10 rounded" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, cardIndex) => (
              <div key={cardIndex} className="glass-panel rounded-lg p-4">
                <div className="w-full h-4 bg-white/10 rounded mb-3" />
                <div className="w-3/4 h-3 bg-white/5 rounded mb-3" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10" />
                  <div className="w-20 h-3 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Data Grid Skeleton
export function DataGridSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="glass-panel rounded-xl p-4 aspect-square flex flex-col">
          <div className="w-full h-32 bg-white/5 rounded-lg mb-4" />
          <div className="w-3/4 h-4 bg-white/10 rounded mb-2" />
          <div className="w-1/2 h-3 bg-white/5 rounded" />
          <div className="mt-auto flex items-center justify-between">
            <div className="w-16 h-6 bg-white/10 rounded-full" />
            <div className="w-8 h-8 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline Skeleton
export function TimelineSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="relative animate-pulse">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
      <div className="space-y-6">
        {[...Array(items)].map((_, i) => (
          <div key={i} className="relative flex gap-4 pl-12">
            <div className="absolute left-0 w-8 h-8 rounded-full bg-white/10 border-4 border-[#0a0a0f]" />
            <div className="flex-1">
              <div className="w-32 h-3 bg-white/5 rounded mb-2" />
              <div className="w-48 h-4 bg-white/10 rounded mb-2" />
              <div className="w-full h-3 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3D Scene Loading
export function SceneLoader({ message = 'Loading 3D Scene...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <Activity className="w-full h-full text-[#00A3E0] animate-pulse" />
          <div className="absolute inset-0 border-2 border-[#0066CC]/30 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
        </div>
        <p className="text-white font-medium">{message}</p>
        <p className="text-sm text-gray-400 mt-1">Optimizing for your device...</p>
      </div>
    </div>
  );
}

// Inline Loader - Small inline loading indicator
export function InlineLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <Loader2 className={`${sizeClasses} text-[#00A3E0] animate-spin inline`} />
  );
}

// Button Loader
export function ButtonLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{text}</span>
    </>
  );
}

// Empty State with Loading option
export function EmptyOrLoading({ 
  isLoading, 
  emptyMessage = 'No data available',
  loadingMessage = 'Loading data...'
}: { 
  isLoading: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-10 h-10 text-[#00A3E0] animate-spin mx-auto mb-3" />
        <p className="text-gray-400">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Factory className="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <p className="text-gray-400">{emptyMessage}</p>
    </div>
  );
}

export default FullPageLoader;
