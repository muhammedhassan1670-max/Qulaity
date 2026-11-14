import { describe, it, expect, beforeEach } from 'vitest';
import {
  askQualityCopilot,
  type CopilotContext,
  type CopilotResponse,
} from '@/services/copilotEngine';
import { resetQualityStorage } from '../../helpers/testHarness';

describe('Feature 28 Boundary: QualityOps Pro 5.0 Floating Widget', () => {
  beforeEach(() => {
    resetQualityStorage();
    localStorage.removeItem('qms_gemini_api_key');
  });

  it('handles empty string and whitespace-only query safely with prompt guidance', async () => {
    const emptyRes = await askQualityCopilot('', { pathname: '/quality/ncr' });
    expect(emptyRes).toBeDefined();
    expect(emptyRes.content.length).toBeGreaterThan(0);

    const spaceRes = await askQualityCopilot('     ', { pathname: '/' });
    expect(spaceRes).toBeDefined();
    expect(spaceRes.content.length).toBeGreaterThan(0);
  });

  it('safely processes massive prompt text (>4000 chars) without buffer overflow', async () => {
    const massivePrompt = 'أريد تحليل وتفسير هذه البيانات: ' + 'بيانات الفحص الدوري: القراءة 45.02 مم، الانحراف 0.01 مم. '.repeat(100);
    const res = await askQualityCopilot(massivePrompt, { pathname: '/quality/spc' });

    expect(res).toBeDefined();
    expect(res.metadata.source).toBe('industrial-neural-brain');
    expect(res.content.length).toBeGreaterThan(0);
  });

  it('provides graceful fallback when user query matches no known industrial intent (gibberish string)', async () => {
    const gibberishQuery = 'xyz12345qwerty!@#$%^&*()_+~`|}{[]:;?><,./';
    const res = await askQualityCopilot(gibberishQuery, { pathname: '/dashboard' });

    expect(res).toBeDefined();
    expect(res.content).toBeDefined();
    expect(Array.isArray(res.suggestions)).toBe(true);
    expect(res.suggestions.length).toBeGreaterThan(0);
  });

  it('handles missing or malformed CopilotContext (empty object or undefined pathname)', async () => {
    const res = await askQualityCopilot('أين أجد تقارير الجودة؟', {} as CopilotContext);
    expect(res).toBeDefined();
    expect(res.content.length).toBeGreaterThan(0);
  });

  it('operates deterministically offline without active internet or Gemini API key', async () => {
    localStorage.removeItem('qms_gemini_api_key');
    const res = await askQualityCopilot('Explain 8D Problem Solving Methodology', { pathname: '/8d' });

    expect(res.metadata.source).toBe('industrial-neural-brain');
    expect(res.content).toMatch(/8d|d0|d1|root cause|d8/i);
  });
});
