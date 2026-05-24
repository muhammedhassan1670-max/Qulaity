import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';

interface QualityGuidedEmptyStateProps {
  title: string;
  purpose: string;
  firstAction: string;
  actionHref: string;
  actionLabel: string;
  guidanceHref?: string;
}

export function QualityGuidedEmptyState({
  title,
  purpose,
  firstAction,
  actionHref,
  actionLabel,
  guidanceHref = '/quality-home',
}: QualityGuidedEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00A3E0]/20 bg-[#00A3E0]/10">
            <Compass className="h-5 w-5 text-[#8be3ff]" />
          </div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">{purpose}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">First step: {firstAction}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to={actionHref} className="inline-flex items-center gap-2 rounded-xl bg-[#0066CC] px-4 py-3 text-sm font-black text-white hover:bg-[#005BB8]">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={guidanceHref} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white/70 hover:bg-white/10">
            Guided Setup
          </Link>
        </div>
      </div>
    </div>
  );
}

