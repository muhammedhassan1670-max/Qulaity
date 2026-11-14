import { describe, it, expect } from 'vitest';

export interface AuditBattleState {
  currentRound: number;
  stressLevel: number; // 0 to 100
  lifelinesRemaining: number;
  score: number;
  isGameOver: boolean;
  verdict?: 'PASSED' | 'FAILED';
}

export function applyAuditProof(
  state: AuditBattleState,
  proof: { correct: boolean; stressDelta: number },
  isTimeout = false
): AuditBattleState {
  if (state.isGameOver) return state;

  if (isTimeout) {
    const newStress = Math.min(100, state.stressLevel + 40);
    return {
      ...state,
      currentRound: state.currentRound + 1,
      stressLevel: newStress,
      isGameOver: newStress >= 100,
      verdict: newStress >= 100 ? 'FAILED' : undefined,
    };
  }

  const rawStress = state.stressLevel + proof.stressDelta;
  const clampedStress = Math.max(0, Math.min(100, rawStress));
  const newScore = proof.correct ? state.score + 100 : state.score;
  const isOver = clampedStress >= 100;

  return {
    ...state,
    currentRound: state.currentRound + 1,
    stressLevel: clampedStress,
    score: newScore,
    isGameOver: isOver,
    verdict: isOver ? 'FAILED' : undefined,
  };
}

describe('Feature 31 Boundary: ISO Audit Battle Simulator', () => {
  it('triggers immediate game over when stress level breaches 100% (Major Non-Conformance)', () => {
    let state: AuditBattleState = {
      currentRound: 1,
      stressLevel: 80,
      lifelinesRemaining: 1,
      score: 0,
      isGameOver: false,
    };

    // Failed response with +35 stress -> 115 clamped to 100
    state = applyAuditProof(state, { correct: false, stressDelta: 35 });
    expect(state.stressLevel).toBe(100);
    expect(state.isGameOver).toBe(true);
    expect(state.verdict).toBe('FAILED');
  });

  it('clamps stress level at minimum boundary (cannot go below 0% stress)', () => {
    let state: AuditBattleState = {
      currentRound: 1,
      stressLevel: 5,
      lifelinesRemaining: 2,
      score: 100,
      isGameOver: false,
    };

    // Perfect proof with -20 stress -> clamped to 0
    state = applyAuditProof(state, { correct: true, stressDelta: -20 });
    expect(state.stressLevel).toBe(0);
    expect(state.isGameOver).toBe(false);
  });

  it('handles timer expiration (timeout 0s) as penalty stress escalation', () => {
    let state: AuditBattleState = {
      currentRound: 2,
      stressLevel: 30,
      lifelinesRemaining: 0,
      score: 100,
      isGameOver: false,
    };

    state = applyAuditProof(state, { correct: false, stressDelta: 0 }, true);
    expect(state.stressLevel).toBe(70); // 30 + 40
    expect(state.currentRound).toBe(3);
  });

  it('enforces lifeline boundary when zero lifelines remain (cannot decrement below 0)', () => {
    let lifelines = 0;
    const useLifeline = () => {
      if (lifelines <= 0) return false;
      lifelines -= 1;
      return true;
    };

    expect(useLifeline()).toBe(false);
    expect(lifelines).toBe(0);
  });

  it('handles flawless perfect run: 5 rounds correct with maximum score and 0% stress', () => {
    let state: AuditBattleState = {
      currentRound: 1,
      stressLevel: 20,
      lifelinesRemaining: 3,
      score: 0,
      isGameOver: false,
    };

    for (let r = 0; r < 5; r++) {
      state = applyAuditProof(state, { correct: true, stressDelta: -10 });
    }

    expect(state.score).toBe(500);
    expect(state.stressLevel).toBe(0);
    expect(state.isGameOver).toBe(false);
  });
});
