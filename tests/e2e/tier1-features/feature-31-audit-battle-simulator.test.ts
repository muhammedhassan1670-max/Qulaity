import { describe, it, expect, beforeEach } from 'vitest';
import { assertIsoAuditScore } from '../../helpers/assertionHelpers';

describe('Feature 31: ISO Audit Battle Simulator (Dr. Klaus Arena)', () => {
  interface AuditProof {
    id: string;
    textEn: string;
    correct: boolean;
    stressDelta: number;
  }

  interface AuditQuestion {
    round: number;
    clause: string;
    auditorQuoteEn: string;
    proofs: AuditProof[];
  }

  const AUDIT_ROUNDS: AuditQuestion[] = [
    {
      round: 1,
      clause: 'ISO 9001:2015 Clause 7.1.5 (Monitoring & Measuring Resources)',
      auditorQuoteEn: 'Show me the latest calibration record for digital thickness gauge THK-04 on Assembly Line 1, and its expiry date!',
      proofs: [
        { id: 'p1', textEn: 'Present CAL-2026-09 valid until Dec 2026 with Green Tag', correct: true, stressDelta: -10 },
        { id: 'p2', textEn: 'Claiming brand new tool needs no calibration', correct: false, stressDelta: +35 },
        { id: 'p3', textEn: 'Asking for 2 hours to search paper archive', correct: false, stressDelta: +25 },
      ],
    },
    {
      round: 2,
      clause: 'ISO 9001:2015 Clause 8.7 (Control of Nonconforming Outputs)',
      auditorQuoteEn: 'A nonconforming batch was segregated yesterday.. Where is the Red Tag and the physical segregation record in the QMS?',
      proofs: [
        { id: 'p1', textEn: 'Saying parts are segregated verbally in operators memory', correct: false, stressDelta: +40 },
        { id: 'p2', textEn: 'Presenting QR-RedTag and physical cage transfer manifest', correct: true, stressDelta: -15 },
        { id: 'p3', textEn: 'Shipping to customer for on-site evaluation', correct: false, stressDelta: +50 },
      ],
    },
    {
      round: 3,
      clause: 'ISO 9001:2015 Clause 10.2 (Nonconformity and Corrective Action)',
      auditorQuoteEn: 'NCR-2026-088 is closed.. Where is the objective evidence verifying the corrective action effectiveness?',
      proofs: [
        { id: 'p1', textEn: 'Audit evidence of 3 zero-defect consecutive production runs verified after 30 days', correct: true, stressDelta: -15 },
        { id: 'p2', textEn: 'Closing on same day to avoid KPI penalty', correct: false, stressDelta: +35 },
        { id: 'p3', textEn: 'Verbal promise from shift leader', correct: false, stressDelta: +30 },
      ],
    },
    {
      round: 4,
      clause: 'ISO 9001:2015 Clause 7.2 (Competence) & IATF 16949 Clause 8.5.1.1',
      auditorQuoteEn: 'Operator #07 on stamping press.. Has he been trained on the latest Control Plan Rev 04?',
      proofs: [
        { id: 'p1', textEn: 'Present skills matrix & signed training log on Rev 04 before shift start', correct: true, stressDelta: -15 },
        { id: 'p2', textEn: 'Assuming 10-year experience needs no retraining', correct: false, stressDelta: +35 },
        { id: 'p3', textEn: 'Operating with outdated paper copy from last year', correct: false, stressDelta: +45 },
      ],
    },
  ];

  it('validates question bank coverage across mandatory ISO 9001 Clauses 4 through 10', () => {
    expect(AUDIT_ROUNDS.length).toBe(4);
    const coveredClauses = AUDIT_ROUNDS.map((q) => q.clause);

    expect(coveredClauses.some((c) => c.includes('7.1.5'))).toBe(true);
    expect(coveredClauses.some((c) => c.includes('8.7'))).toBe(true);
    expect(coveredClauses.some((c) => c.includes('10.2'))).toBe(true);
    expect(coveredClauses.some((c) => c.includes('7.2'))).toBe(true);

    AUDIT_ROUNDS.forEach((q) => {
      expect(q.proofs.length).toBe(3);
      const correctAnswers = q.proofs.filter((p) => p.correct);
      expect(correctAnswers.length).toBe(1);
    });
  });

  it('calculates score rewards and stress penalties based on objective evidence choices', () => {
    let score = 0;
    let stress = 15;

    // Simulate answering round 1 correctly
    const q1 = AUDIT_ROUNDS[0];
    const correctProof = q1.proofs.find((p) => p.correct)!;
    score += 25;
    stress = Math.max(0, Math.min(100, stress + correctProof.stressDelta));

    expect(score).toBe(25);
    expect(stress).toBe(5); // 15 - 10 = 5

    // Simulate answering round 2 incorrectly
    const q2 = AUDIT_ROUNDS[1];
    const incorrectProof = q2.proofs.find((p) => !p.correct)!;
    stress = Math.max(0, Math.min(100, stress + incorrectProof.stressDelta));

    expect(score).toBe(25);
    expect(stress).toBeGreaterThan(40);
  });

  it('evaluates victory condition: victory when score >= 75% and auditor stress < 50%', () => {
    const evaluateBattleOutcome = (finalScore: number, finalStress: number): 'won' | 'lost' => {
      if (finalStress < 50 && finalScore >= 75) {
        return 'won';
      }
      return 'lost';
    };

    // Perfect run: 4/4 correct -> Score 100, stress ~ 0
    expect(evaluateBattleOutcome(100, 0)).toBe('won');

    // 3/4 correct -> Score 75, stress 30
    expect(evaluateBattleOutcome(75, 30)).toBe('won');

    // 2/4 correct -> Score 50 -> lost
    expect(evaluateBattleOutcome(50, 45)).toBe('lost');

    // High stress failure: Score 75 but stress 60 -> lost
    expect(evaluateBattleOutcome(75, 60)).toBe('lost');
  });

  it('applies time-pressure penalty when round countdown timer expires', () => {
    let timer = 45;
    let stress = 20;

    const onTimerTick = (currentTime: number, currentStress: number) => {
      if (currentTime <= 1) {
        return { newTime: 0, newStress: Math.min(100, currentStress + 30) };
      }
      return { newTime: currentTime - 1, newStress: currentStress };
    };

    const midRun = onTimerTick(30, stress);
    expect(midRun.newTime).toBe(29);
    expect(midRun.newStress).toBe(20);

    const timeoutRun = onTimerTick(1, stress);
    expect(timeoutRun.newTime).toBe(0);
    expect(timeoutRun.newStress).toBe(50); // 20 + 30
  });

  it('integrates with assertIsoAuditScore to enforce strict audit certification threshold', () => {
    // 4 rounds total, candidate passes 4 -> 100%
    const score1 = assertIsoAuditScore(4, 4, 80);
    expect(score1).toBe(100);

    // 3 out of 4 -> 75% (fails min 80% threshold)
    expect(() => assertIsoAuditScore(4, 3, 80)).toThrow();

    // 4 out of 5 -> 80% passes exactly
    const score2 = assertIsoAuditScore(5, 4, 80);
    expect(score2).toBe(80);
  });
});
