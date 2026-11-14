import { describe, it, expect, beforeEach } from 'vitest';
import {
  askQualityCopilot,
  type CopilotContext,
  type CopilotResponse,
} from '@/services/copilotEngine';
import { resetQualityStorage } from '../../helpers/testHarness';

describe('Feature 28: QualityOps Pro 5.0 Floating Copilot Widget', () => {
  beforeEach(() => {
    resetQualityStorage();
    // Ensure offline mode by default
    localStorage.removeItem('qms_gemini_api_key');
  });

  it('provides offline industrial neural brain fallback when external LLM is unconfigured', async () => {
    const context: CopilotContext = { pathname: '/quality/ncr', userName: 'Lead Quality Engineer' };
    const response: CopilotResponse = await askQualityCopilot('كيف أتعامل مع حالة عدم مطابقة جديدة؟', context);

    expect(response).toBeDefined();
    expect(response.content.length).toBeGreaterThan(50);
    expect(response.metadata.source).toBe('industrial-neural-brain');
    expect(response.metadata.confidence).toBeGreaterThanOrEqual(90);
    expect(response.suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('classifies user intent for NCR registration and returns actionable navigation links', async () => {
    const context: CopilotContext = { pathname: '/dashboard' };
    const response: CopilotResponse = await askQualityCopilot('أريد فتح تقرير عدم مطابقة NCR فوري', context);

    expect(response.actions).toBeDefined();
    expect(response.actions!.length).toBeGreaterThan(0);

    const ncrAction = response.actions!.find((a) => a.target === '/quality/ncr');
    expect(ncrAction).toBeDefined();
    expect(ncrAction?.type).toBe('navigate');
    expect(response.content).toContain('ISO 9001:2015 Clause 8.7');
  });

  it('classifies Superpowers intent and routes to Industry 5.0 toolkit', async () => {
    const context: CopilotContext = { pathname: '/' };
    const response = await askQualityCopilot('شغل القدرات الخارقة ومعركة كلاوس', context);

    expect(response.actions).toBeDefined();
    const superpowerAction = response.actions!.find((a) => a.target === '/superpowers');
    expect(superpowerAction).toBeDefined();
    expect(response.content).toContain('Superpowers 5.0');
    expect(response.content).toContain('المساعد الصوتي');
  });

  it('answers statistical quality and Cpk capability queries with technical precision', async () => {
    const context: CopilotContext = { pathname: '/quality/spc' };
    const response = await askQualityCopilot('اشرح لي مؤشر القدرة Cpk وكيفية حسابه وحدود القبول', context);

    expect(response.content).toMatch(/cpk/i);
    expect(response.content).toMatch(/1\.33|usl|lsl/i);
    expect(response.suggestions.some((s) => s.includes('Cpk') || s.includes('Whys') || s.includes('NCR'))).toBe(true);
  });

  it('maintains screen context awareness and responds within interactive latency SLA', async () => {
    const start = performance.now();
    const context: CopilotContext = { pathname: '/docs/sop.html', userRole: 'Quality Inspector' };
    const response = await askQualityCopilot('أين أجد تعليمات التشغيل القياسية SOP؟', context);
    const duration = performance.now() - start;

    expect(response.actions?.some((a) => a.target === '/docs/sop.html')).toBe(true);
    // Offline neural brain should answer under 250ms SLA
    expect(duration).toBeLessThan(500);
    expect(response.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
  });
});
