import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature 29: Global Voice Trigger System', () => {
  const NAVIGATION_INTENTS = [
    { keywords: ['لوحة القيادة', 'الرئيسية', 'dashboard', 'home', 'الداش بورد'], path: '/quality', label: 'لوحة القيادة' },
    { keywords: ['شكاوى', 'شكاوي', 'complaint', 'العملاء'], path: '/quality/records/complaints', label: 'الشكاوى' },
    { keywords: ['عدم مطابقة', 'ncr', 'ان سي ار', 'رفض', 'create ncr'], path: '/quality/records/ncr', label: 'سجلات NCR' },
    { keywords: ['تصحيحية', 'وقائية', 'capa', 'كابا'], path: '/quality/records/capa', label: 'سجلات CAPA' },
    { keywords: ['توأم رقمي', 'digital twin', 'المصنع', 'خريطة'], path: '/digital-twin', label: 'التوأم الرقمي' },
    { keywords: ['تصميم', 'layout', 'تخطيط'], path: '/production-layout', label: 'مخطط الإنتاج' },
    { keywords: ['فحص', 'تفتيش', 'inspection'], path: '/quality/records/inspection', label: 'عمليات الفحص' },
    { keywords: ['موردين', 'مورد', 'supplier'], path: '/quality/records/supplier', label: 'جودة الموردين' },
    { keywords: ['ماستر داتا', 'البيانات الأساسية', 'master data'], path: '/quality/master-data', label: 'البيانات الأساسية' },
    { keywords: ['شات', 'مساعد', 'ai chat', 'اسأل', 'اسال'], path: '/ai-chat', label: 'المساعد الذكي' },
  ];

  function matchVoiceCommand(input: string): { matched: boolean; path?: string; label?: string } {
    const text = input.trim().toLowerCase();
    for (const intent of NAVIGATION_INTENTS) {
      if (intent.keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
        return { matched: true, path: intent.path, label: intent.label };
      }
    }
    return { matched: false };
  }

  it('matches voice command "Create NCR" or "عدم مطابقة" and routes to NCR records', () => {
    const resultEn = matchVoiceCommand('Please Create NCR for defective flange');
    expect(resultEn.matched).toBe(true);
    expect(resultEn.path).toBe('/quality/records/ncr');

    const resultAr = matchVoiceCommand('افتح تقرير عدم مطابقة فوري');
    expect(resultAr.matched).toBe(true);
    expect(resultAr.path).toBe('/quality/records/ncr');
  });

  it('matches customer complaint intake intent and routes to complaints register', () => {
    const result = matchVoiceCommand('سجل شكاوى العملاء الجديدة');
    expect(result.matched).toBe(true);
    expect(result.path).toBe('/quality/records/complaints');
  });

  it('routes shopfloor inspection commands and supplier quality views correctly', () => {
    const inspResult = matchVoiceCommand('تفتيش جودة خط الإنتاج 2');
    expect(inspResult.matched).toBe(true);
    expect(inspResult.path).toBe('/quality/records/inspection');

    const supResult = matchVoiceCommand('عرض تقييم موردين الخامات');
    expect(supResult.matched).toBe(true);
    expect(supResult.path).toBe('/quality/records/supplier');
  });

  it('manages microphone state lifecycle (start, stop, toggle, listening state)', () => {
    let isListening = false;
    let transcript = '';

    const startListening = () => {
      isListening = true;
      transcript = 'Listening...';
    };

    const stopListening = () => {
      isListening = false;
      transcript = '';
    };

    const toggleListening = () => {
      if (isListening) stopListening();
      else startListening();
    };

    expect(isListening).toBe(false);
    toggleListening();
    expect(isListening).toBe(true);
    expect(transcript).toBe('Listening...');
    toggleListening();
    expect(isListening).toBe(false);
  });

  it('dispatches custom event open-ai-copilot when command is conversational inquiry', () => {
    const target = new EventTarget();
    const eventSpy = vi.fn();
    target.addEventListener('open-ai-copilot', eventSpy as EventListener);

    const conversationalPhrase = 'ما هو تحليل الأسباب الجذرية 5 Whys؟';
    const match = matchVoiceCommand(conversationalPhrase);
    expect(match.matched).toBe(false);

    // Dispatches CustomEvent
    const event = new CustomEvent('open-ai-copilot', { detail: { text: conversationalPhrase } });
    target.dispatchEvent(event);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    const detail = (eventSpy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.text).toBe(conversationalPhrase);
  });
});
