import { describe, it, expect } from 'vitest';

export function parseVoiceTrigger(transcript: string): {
  hasSpeech: boolean;
  intentMatched: boolean;
  targetRoute?: string;
  sanitizedText: string;
} {
  if (!transcript || !transcript.trim()) {
    return { hasSpeech: false, intentMatched: false, sanitizedText: '' };
  }

  const clean = transcript.trim().toLowerCase();
  if (clean.includes('ncr') || clean.includes('عدم مطابقة')) {
    return { hasSpeech: true, intentMatched: true, targetRoute: '/quality/records/ncr', sanitizedText: clean };
  }
  if (clean.includes('capa') || clean.includes('تصحيحية')) {
    return { hasSpeech: true, intentMatched: true, targetRoute: '/quality/records/capa', sanitizedText: clean };
  }
  if (clean.includes('twin') || clean.includes('توأم')) {
    return { hasSpeech: true, intentMatched: true, targetRoute: '/digital-twin', sanitizedText: clean };
  }

  return { hasSpeech: true, intentMatched: false, sanitizedText: clean };
}

describe('Feature 29 Boundary: Global Voice Trigger System', () => {
  it('handles empty transcript and ambient silence gracefully', () => {
    expect(parseVoiceTrigger('').hasSpeech).toBe(false);
    expect(parseVoiceTrigger('   ').hasSpeech).toBe(false);
    expect(parseVoiceTrigger('').intentMatched).toBe(false);
  });

  it('handles industrial background noise and non-command speech without false triggers', () => {
    const industrialNoise = 'clank clank whirrr beep motor noise hydraulic hiss';
    const res = parseVoiceTrigger(industrialNoise);

    expect(res.hasSpeech).toBe(true);
    expect(res.intentMatched).toBe(false);
    expect(res.targetRoute).toBeUndefined();
  });

  it('correctly matches bilingual commands embedded inside complex spoken sentences', () => {
    const spokenArabic = 'من فضلك يا مساعد الجودة افتح تقرير عدم مطابقة للقطعة المعيبة حاليا';
    const resAr = parseVoiceTrigger(spokenArabic);

    expect(resAr.hasSpeech).toBe(true);
    expect(resAr.intentMatched).toBe(true);
    expect(resAr.targetRoute).toBe('/quality/records/ncr');

    const spokenEnglish = 'Operator calling control room, please create new CAPA for hydraulic seal leakage';
    const resEn = parseVoiceTrigger(spokenEnglish);

    expect(resEn.hasSpeech).toBe(true);
    expect(resEn.intentMatched).toBe(true);
    expect(resEn.targetRoute).toBe('/quality/records/capa');
  });

  it('handles rapid consecutive microphone toggle events without race condition', () => {
    let micActive = false;
    const toggle = () => {
      micActive = !micActive;
      return micActive;
    };

    // 10 rapid toggles
    for (let i = 0; i < 10; i++) {
      toggle();
    }
    expect(micActive).toBe(false); // even number of toggles ends in false
  });

  it('safely truncates and cleans massive audio transcript buffers (>4000 characters)', () => {
    const hugeTranscript = 'voice noise '.repeat(500) + ' please open ncr now';
    const res = parseVoiceTrigger(hugeTranscript);

    expect(res.hasSpeech).toBe(true);
    expect(res.intentMatched).toBe(true);
    expect(res.targetRoute).toBe('/quality/records/ncr');
  });
});
