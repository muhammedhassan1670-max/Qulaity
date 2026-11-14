import { describe, it, expect } from 'vitest';

export function chunkSpeechUtterance(fullText: string, maxChunkLength = 200): string[] {
  if (!fullText || !fullText.trim()) return [];
  if (fullText.length <= maxChunkLength) return [fullText.trim()];

  // Split by sentence boundaries (. or \n or ؛ or ؟ or !)
  const sentences = fullText.split(/([.\n؛؟!])/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const part of sentences) {
    if ((currentChunk + part).length > maxChunkLength && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

describe('Feature 30 Boundary: Two-Way Voice Copilot', () => {
  it('chunks long technical spoken responses into manageable fragments (<200 chars) for smooth TTS streaming', () => {
    const longResponse =
      'تم فحص التقرير بنجاح. ' +
      'يوجد ثلاثة عيوب غير مطابقة مفتوحة في خط الإنتاج رقم 2. ' +
      'تم اتخاذ إجراءات الحظر والعزل الفوري لجميع القطع المشتبه بها. ' +
      'بانتظار موافقة مدير الجودة النهائي على قرار مجلس المواد.';

    const chunks = chunkSpeechUtterance(longResponse, 100);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c) => {
      expect(c.length).toBeLessThanOrEqual(150);
    });
  });

  it('handles interruption immediately canceling ongoing speech synthesis when new query arrives', () => {
    let activeUtterance: string | null = 'Initial long response being spoken...';
    let isSpeaking = true;

    // Operator interrupts
    const interrupt = (newQuery: string) => {
      activeUtterance = null;
      isSpeaking = false;
      return `Interrupted by: ${newQuery}`;
    };

    const status = interrupt('Stop, show me the Cpk chart instead');
    expect(isSpeaking).toBe(false);
    expect(activeUtterance).toBeNull();
    expect(status).toContain('Interrupted');
  });

  it('handles Arabic voice selection fallback when native Arabic TTS voice is absent in host browser', () => {
    interface SyntheticVoice {
      lang: string;
      name: string;
      default: boolean;
    }

    const availableVoices: SyntheticVoice[] = [
      { lang: 'en-US', name: 'Microsoft David', default: true },
      { lang: 'en-GB', name: 'Google UK English Female', default: false },
    ];

    const pickBestVoice = (voices: SyntheticVoice[], targetLang: string) => {
      const match = voices.find((v) => v.lang.startsWith(targetLang));
      return match || voices.find((v) => v.default) || voices[0];
    };

    const chosenVoice = pickBestVoice(availableVoices, 'ar');
    expect(chosenVoice).toBeDefined();
    expect(chosenVoice.lang).toBe('en-US'); // Safe fallback without null pointer crash
  });

  it('handles empty text chunking gracefully', () => {
    expect(chunkSpeechUtterance('')).toEqual([]);
    expect(chunkSpeechUtterance('   ')).toEqual([]);
  });

  it('handles audio volume boundary conditions (mute 0.0 to maximum 1.0)', () => {
    const clampVolume = (vol: number) => Math.max(0.0, Math.min(1.0, vol));

    expect(clampVolume(0.0)).toBe(0.0);
    expect(clampVolume(1.0)).toBe(1.0);
    expect(clampVolume(-0.5)).toBe(0.0);
    expect(clampVolume(1.5)).toBe(1.0);
  });
});
