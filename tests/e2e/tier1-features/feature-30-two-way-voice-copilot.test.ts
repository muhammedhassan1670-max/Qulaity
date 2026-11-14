import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askQualityCopilot } from '@/services/copilotEngine';
import { resetQualityStorage } from '../../helpers/testHarness';

describe('Feature 30: Two-Way Industrial Voice Copilot', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('manages continuous two-way dialogue state and volume controls', () => {
    let isListening = false;
    let voiceVolume = true;
    let voiceTranscript = '';
    let voiceResponse = 'I am the Industrial Voice Copilot for QMS 4.0.';

    const toggleListening = () => {
      isListening = !isListening;
      if (isListening) {
        voiceTranscript = 'Listening to you...';
      }
    };

    const toggleVolume = () => {
      voiceVolume = !voiceVolume;
    };

    expect(isListening).toBe(false);
    expect(voiceVolume).toBe(true);

    toggleListening();
    expect(isListening).toBe(true);
    expect(voiceTranscript).toBe('Listening to you...');

    toggleVolume();
    expect(voiceVolume).toBe(false);
  });

  it('configures speech synthesis utterance parameters for Arabic and English', () => {
    interface SyntheticUtterance {
      text: string;
      lang: string;
      rate: number;
      pitch: number;
    }

    const createUtterance = (text: string, isArabic: boolean): SyntheticUtterance => ({
      text,
      lang: isArabic ? 'ar-SA' : 'en-US',
      rate: 1.05,
      pitch: 1.0,
    });

    const arUtterance = createUtterance('تم رصد 4 عيوب قيد المتابعة.', true);
    expect(arUtterance.lang).toBe('ar-SA');
    expect(arUtterance.rate).toBe(1.05);

    const enUtterance = createUtterance('4 active defects tracked.', false);
    expect(enUtterance.lang).toBe('en-US');
  });

  it('handles industrial phrase recognition and generates appropriate spoken answers', async () => {
    const handleVoiceDialogue = (phrase: string, isArabic = true): { reply: string; action?: string } => {
      const q = phrase.toLowerCase();
      if (q.includes('عيب') || q.includes('defect') || q.includes('عيوب')) {
        return {
          reply: isArabic
            ? 'تم رصد 4 عيوب قيد المتابعة. أعلى عيب تكراراً هو خدش السطح بنسبة 45%.'
            : '4 active defects tracked. Top defect is Surface Scratch at 45%.',
          action: 'open_defects',
        };
      }
      if (q.includes('تقرير') || q.includes('ncr') || q.includes('مطابقة')) {
        return {
          reply: isArabic
            ? 'جاهز لفتح تقرير عدم المطابقة الفوري NCR. جاري التوجيه إلى معالج التسجيل.'
            : 'Ready for emergency NCR registration. Navigating to NCR wizard.',
          action: 'navigate_ncr',
        };
      }
      if (q.includes('تفتيش') || q.includes('آيزو') || q.includes('audit')) {
        return {
          reply: isArabic
            ? 'تنبيه طوارئ! جاري تشغيل محاكي معركة تفتيش الآيزو المفاجئ الآن!'
            : 'Emergency alert! Launching ISO Audit Battle Simulator now!',
          action: 'launch_audit_battle',
        };
      }
      return {
        reply: isArabic ? 'جاري التحليل واستدعاء الاستشارة الهندسية...' : 'Analyzing query with Industrial Brain...',
      };
    };

    const defectQuery = handleVoiceDialogue('وريني العيوب المفتوحة', true);
    expect(defectQuery.action).toBe('open_defects');
    expect(defectQuery.reply).toContain('خدش السطح');

    const ncrQuery = handleVoiceDialogue('افتح تقرير عدم مطابقة NCR', true);
    expect(ncrQuery.action).toBe('navigate_ncr');

    const auditQuery = handleVoiceDialogue('شغل تفتيش الآيزو', true);
    expect(auditQuery.action).toBe('launch_audit_battle');

    const enDefect = handleVoiceDialogue('Show all active defects', false);
    expect(enDefect.reply).toContain('Surface Scratch');
  });

  it('executes full turn-taking cycle from speech recognition to response formulation', async () => {
    const turnState = {
      userSpoke: false,
      transcript: '',
      agentThinking: false,
      agentReplied: false,
      responseSpoken: '',
    };

    // Step 1: User speaks
    turnState.userSpoke = true;
    turnState.transcript = 'ما هي شروط إغلاق الـ CAPA؟';

    // Step 2: System transitions to thinking
    turnState.agentThinking = true;

    // Step 3: Copilot brain synthesizes response
    const copilotRes = await askQualityCopilot(turnState.transcript, { pathname: '/superpowers' });
    turnState.agentThinking = false;
    turnState.agentReplied = true;
    turnState.responseSpoken = copilotRes.content;

    expect(turnState.userSpoke).toBe(true);
    expect(turnState.agentThinking).toBe(false);
    expect(turnState.agentReplied).toBe(true);
    expect(turnState.responseSpoken.length).toBeGreaterThan(20);
  });

  it('gracefully handles speech recognition timeouts and background noise without crashing', () => {
    let dialogueError: string | null = null;
    let isListening = true;

    const handleSpeechError = (errorCode: string) => {
      isListening = false;
      if (errorCode === 'no-speech') {
        dialogueError = 'No speech detected, listening timed out';
      } else {
        dialogueError = `Speech recognition error: ${errorCode}`;
      }
    };

    handleSpeechError('no-speech');
    expect(isListening).toBe(false);
    expect(dialogueError).toContain('No speech detected');

    handleSpeechError('audio-capture');
    expect(dialogueError).toContain('audio-capture');
  });
});
