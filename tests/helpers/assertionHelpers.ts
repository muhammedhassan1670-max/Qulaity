/**
 * Domain-Specific Assertion Helpers
 * Provides verification helpers for SPC, Nelson rules, RPN, FMEA, and audit metrics.
 */

import { expect } from 'vitest';

export function assertCpkThreshold(
  cpk: number,
  minThreshold = 1.33,
  label = 'Process Capability Cpk'
): void {
  expect(Number.isFinite(cpk), `${label} must be a finite number, received ${cpk}`).toBe(true);
  expect(
    cpk,
    `${label} (${cpk.toFixed(3)}) does not meet industrial threshold (${minThreshold})`
  ).toBeGreaterThanOrEqual(minThreshold);
}

export function assertControlLimits(
  mean: number,
  ucl: number,
  lcl: number,
  label = 'Control Limits'
): void {
  expect(ucl, `${label}: UCL (${ucl}) must be greater than Mean (${mean})`).toBeGreaterThan(mean);
  expect(mean, `${label}: Mean (${mean}) must be greater than LCL (${lcl})`).toBeGreaterThan(lcl);
  const upperSpread = ucl - mean;
  const lowerSpread = mean - lcl;
  expect(
    Math.abs(upperSpread - lowerSpread),
    `${label}: UCL and LCL should be symmetric around Center Line`
  ).toBeLessThan(1e-4);
}

export function assertRpnCalculation(
  severity: number,
  occurrence: number,
  detection: number,
  expectedRpn?: number
): number {
  expect(severity).toBeGreaterThanOrEqual(1);
  expect(severity).toBeLessThanOrEqual(10);
  expect(occurrence).toBeGreaterThanOrEqual(1);
  expect(occurrence).toBeLessThanOrEqual(10);
  expect(detection).toBeGreaterThanOrEqual(1);
  expect(detection).toBeLessThanOrEqual(10);

  const calculated = severity * occurrence * detection;
  if (expectedRpn !== undefined) {
    expect(calculated, `RPN calculation mismatch`).toBe(expectedRpn);
  }
  return calculated;
}

export function assertNelsonRuleViolation(
  violations: Array<{ rule: number; index: number; description?: string }>,
  targetRule: number
): void {
  const found = violations.some((v) => v.rule === targetRule);
  expect(
    found,
    `Expected Nelson Rule ${targetRule} to be violated, but violations were: ${JSON.stringify(
      violations.map((v) => v.rule)
    )}`
  ).toBe(true);
}

export function assertLotGenealogyNode(
  tree: { lotNumber: string; parents?: string[]; children?: string[] }[],
  parentLot: string,
  childLot: string
): void {
  const parentNode = tree.find((node) => node.lotNumber === parentLot);
  expect(parentNode, `Parent lot ${parentLot} not found in genealogy tree`).toBeDefined();
  const hasChild = parentNode?.children?.includes(childLot);
  expect(hasChild, `Child lot ${childLot} not linked under parent ${parentLot}`).toBe(true);
}

export function assertIsoAuditScore(
  totalQuestions: number,
  passedQuestions: number,
  minPassingPercentage = 80
): number {
  expect(totalQuestions).toBeGreaterThan(0);
  expect(passedQuestions).toBeLessThanOrEqual(totalQuestions);
  const scorePercentage = (passedQuestions / totalQuestions) * 100;
  expect(
    scorePercentage,
    `Audit score ${scorePercentage.toFixed(1)}% is below passing requirement ${minPassingPercentage}%`
  ).toBeGreaterThanOrEqual(minPassingPercentage);
  return scorePercentage;
}
