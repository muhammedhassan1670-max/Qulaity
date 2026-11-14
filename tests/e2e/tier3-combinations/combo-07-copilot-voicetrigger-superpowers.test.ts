import { describe, it, expect, beforeEach } from 'vitest';
import { askQualityCopilot } from '@/services/copilotEngine';
import { resetQualityStorage } from '../../helpers/testHarness';

describe('Combo 07: Voice Trigger Command, AI Copilot Intent Routing & Superpowers Hub Dispatch', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 7.1: Voice trigger command "افتح الترسانة الخارقة" routes to Superpowers Hub with action chips', async () => {
    const voiceSpokenCommand = 'افتح الترسانة الصناعية الفائقة والقدرات الخارقة';
    const response = await askQualityCopilot(voiceSpokenCommand, { pathname: '/dashboard' });

    expect(response.content).toContain('الترسانة الصناعية الفائقة');
    expect(response.actions).toBeDefined();
    expect(response.actions!.length).toBeGreaterThanOrEqual(1);

    const navAction = response.actions![0];
    expect(navAction.type).toBe('navigate');
    expect(navAction.target).toBe('/superpowers');
    expect(response.suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('Test 7.2: Voice trigger command for defect containment dispatches both NCR and Red Tag Studio actions', async () => {
    const spokenVoicePrompt = 'يوجد عيب غير مطابق على خط التجميع نريد تسجيل عدم مطابقة فورا';
    const response = await askQualityCopilot(spokenVoicePrompt, { pathname: '/shopfloor' });

    expect(response.content).toContain('بروتوكول التعامل الفوري مع حالة عدم المطابقة');
    expect(response.actions).toBeDefined();
    expect(response.actions!.length).toBeGreaterThanOrEqual(2);

    const ncrAction = response.actions!.find((a) => a.target === '/quality/ncr');
    expect(ncrAction).toBeDefined();

    const tagStudioAction = response.actions!.find((a) => a.target.includes('/superpowers?tab=print'));
    expect(tagStudioAction).toBeDefined();
    expect(tagStudioAction?.label).toContain('كارت حجر أحمر');
  });

  it('Test 7.3: English voice command "analyze root cause with 5 whys and CAPA" routes to CAPA workflow', async () => {
    const speechText = 'analyze root cause with 5 whys and trigger CAPA';
    const response = await askQualityCopilot(speechText, { pathname: '/quality/ncr' });

    expect(response.content).toContain('CAPA & 8D Framework');
    expect(response.content).toContain('5-Why');
    expect(response.actions).toBeDefined();

    const capaAction = response.actions!.find((a) => a.target === '/quality/capa');
    expect(capaAction).toBeDefined();
    expect(capaAction?.type).toBe('navigate');
  });

  it('Test 7.4: Voice query for SPC and Cpk capability routes to SPC system with formulas and evaluation rules', async () => {
    const speechCommand = 'ما هو مؤشر القدرة Cpk وما هي قواعد ويسترن إلكتريك للضبط الإحصائي؟';
    const response = await askQualityCopilot(speechCommand, { pathname: '/spc' });

    expect(response.content).toContain('Cpk');
    expect(response.content).toContain('Process Capability');
    expect(response.actions).toBeDefined();

    const spcAction = response.actions!.find((a) => a.target === '/spc');
    expect(spcAction).toBeDefined();
  });

  it('Test 7.5: Voice command requesting SOP master manual routes to external interactive documentation', async () => {
    const voicePrompt = 'أريد فتح دليل التشغيل المرجعي SOP manual لمعرفة شروط التدقيق';
    const response = await askQualityCopilot(voicePrompt, { pathname: '/audit' });

    expect(response.content).toContain('SOP Master Manual');
    expect(response.actions).toBeDefined();

    const docAction = response.actions!.find((a) => a.target === '/docs/sop.html');
    expect(docAction).toBeDefined();
    expect(docAction?.type).toBe('external');
  });

  it('Test 7.6: Multimodal intent dispatch tracks processing latency and neural model metadata', async () => {
    const query = 'معايرة أجهزة القياس والميكرومتر';
    const response = await askQualityCopilot(query, { pathname: '/superpowers' });

    expect(response.metadata).toBeDefined();
    expect(response.metadata.source).toBe('industrial-neural-brain');
    expect(response.metadata.confidence).toBeGreaterThan(90);
    expect(response.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(response.actions!.some((a) => a.target === '/calibration')).toBe(true);
  });
});
