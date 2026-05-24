import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Lightbulb, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  applyQualityKnowledgeItem,
  blockedQualityKnowledgeAudit,
  markKnowledgeSuggested,
  recordQualityKnowledgeFeedback,
  suggestQualityKnowledge,
  type QualityKnowledgeContext,
} from '@/services/qualityKnowledgeBase';

interface QualityKnowledgeSuggestionsProps {
  context: QualityKnowledgeContext;
  title?: string;
  canApply?: boolean;
  onChanged?: () => void | Promise<void>;
}

function confidenceClass(confidence: string): string {
  if (confidence === 'Strong Signal') return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/20';
  if (confidence === 'Moderate Signal') return 'bg-[#00A3E0]/15 text-[#8be3ff] border-[#00A3E0]/20';
  if (confidence === 'Weak Signal') return 'bg-amber-400/15 text-amber-200 border-amber-400/20';
  return 'bg-white/5 text-white/45 border-white/10';
}

export function QualityKnowledgeSuggestions({
  context,
  title = 'Knowledge Suggestions',
  canApply = true,
  onChanged,
}: QualityKnowledgeSuggestionsProps) {
  const [version, setVersion] = useState(0);
  const markedSignature = useRef('');
  const suggestions = useMemo(() => suggestQualityKnowledge(context, 4), [context, version]);
  const signature = suggestions.map((suggestion) => suggestion.item.id).join('|');

  useEffect(() => {
    if (!signature || signature === markedSignature.current) return;
    markedSignature.current = signature;
    markKnowledgeSuggested(suggestions.map((suggestion) => suggestion.item.id));
  }, [signature, suggestions]);

  const refresh = async () => {
    setVersion((value) => value + 1);
    await onChanged?.();
  };

  const applyItem = async (id: string) => {
    if (!canApply) {
      blockedQualityKnowledgeAudit('apply knowledge', 'Current role cannot apply knowledge references.', id);
      toast.error('Knowledge action blocked', { description: 'Your current role cannot apply knowledge references.' });
      return;
    }
    applyQualityKnowledgeItem(id);
    await refresh();
    toast.success('Knowledge reference applied', {
      description: 'This records usage only. Historical defect data was not changed.',
    });
  };

  const feedback = async (id: string, value: 'useful' | 'not-useful' | 'needs-update') => {
    if (!canApply) {
      blockedQualityKnowledgeAudit('feedback knowledge', 'Current role cannot submit knowledge feedback.', id);
      toast.error('Knowledge feedback blocked');
      return;
    }
    recordQualityKnowledgeFeedback(id, value);
    await refresh();
    toast.success('Knowledge feedback saved');
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-5 h-5 text-[#00A3E0]" />
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="text-xs text-white/40">Similar historical cases may help verification. They are not guaranteed solutions.</p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/10 p-5 text-sm text-white/35">
          No active knowledge items match this record yet. Create lessons from verified closed-loop actions when available.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.item.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{suggestion.item.title}</p>
                  <p className="text-xs text-white/40 mt-1">{suggestion.item.type} | {suggestion.item.defectType || suggestion.item.defectCategory || 'general'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-black ${confidenceClass(suggestion.confidence)}`}>
                  {suggestion.confidence}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {suggestion.matchReasons.slice(0, 3).map((reason) => (
                  <p key={reason} className="text-xs text-white/45">Match: {reason}</p>
                ))}
                <p className="text-xs text-[#8be3ff] flex gap-2 mt-2">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>{suggestion.suggestedFocus}</span>
                </p>
                {suggestion.relatedEffectiveAction && (
                  <p className="text-xs text-emerald-200">Previously effective action: {suggestion.relatedEffectiveAction}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button type="button" onClick={() => applyItem(suggestion.item.id)} className="px-3 py-2 rounded-lg bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-xs font-black">
                  Apply Reference
                </button>
                <button type="button" onClick={() => feedback(suggestion.item.id, 'useful')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-emerald-200" title="Useful">
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => feedback(suggestion.item.id, 'not-useful')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-red-200" title="Not useful">
                  <ThumbsDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => feedback(suggestion.item.id, 'needs-update')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-amber-200" title="Needs update">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QualityKnowledgeSuggestions;
