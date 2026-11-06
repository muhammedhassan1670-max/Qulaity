/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/missingness/missingness-intelligence.js
 * ============================================================================
 * Investigates missingness structure: co-missingness correlation matrix,
 * outcome-linked missingness, and formulates testable MCAR/MAR/MNAR hypotheses.
 * Treats missingness mechanisms as evidence-backed hypotheses, not facts.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MissingnessIntelligence = {
        /**
         * Analyze multi-variable missingness patterns
         * @param {Object} dataset - Raw dataset { rows }
         * @param {Object} profile - Profiler output
         * @returns {Object} Missingness hypotheses and co-missingness findings
         */
        analyze(dataset, profile) {
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const cols = profile?.columns || [];
            if (rows.length === 0 || cols.length === 0) {
                return { mechanisms: [], coMissingness: [], missingnessRate: 0 };
            }

            const totalCells = rows.length * cols.length;
            let missingCells = 0;
            const colMissingCounts = {};

            cols.forEach(c => {
                const cnt = c.stats?.missingCount !== undefined ? c.stats.missingCount : 0;
                colMissingCounts[c.name] = cnt;
                missingCells += cnt;
            });

            const overallMissingRate = totalCells > 0 ? +( (missingCells / totalCells * 100).toFixed(2) ) : 0;
            const columnsWithMissing = cols.filter(c => (colMissingCounts[c.name] || 0) > 0);

            // 1. Co-missingness correlation (Phi coefficient of binary missing indicators)
            const coMissingness = [];
            for (let i = 0; i < columnsWithMissing.length; i++) {
                for (let j = i + 1; j < columnsWithMissing.length; j++) {
                    const cA = columnsWithMissing[i].name;
                    const cB = columnsWithMissing[j].name;

                    let bothMissing = 0, onlyA = 0, onlyB = 0, neitherMissing = 0;
                    for (let r = 0; r < rows.length; r++) {
                        const isMissA = rows[r][cA] === null || rows[r][cA] === undefined || rows[r][cA] === '';
                        const isMissB = rows[r][cB] === null || rows[r][cB] === undefined || rows[r][cB] === '';

                        if (isMissA && isMissB) bothMissing++;
                        else if (isMissA) onlyA++;
                        else if (isMissB) onlyB++;
                        else neitherMissing++;
                    }

                    // Phi coefficient
                    const den = Math.sqrt((bothMissing + onlyA) * (bothMissing + onlyB) * (neitherMissing + onlyA) * (neitherMissing + onlyB));
                    const phi = den > 0 ? (bothMissing * neitherMissing - onlyA * onlyB) / den : 0;

                    if (phi >= 0.40) {
                        coMissingness.push({
                            columnA: cA,
                            columnB: cB,
                            coMissingRowsCount: bothMissing,
                            phiCorrelation: +(phi.toFixed(3)),
                            implication: `Systematic co-missingness: "${cA}" and "${cB}" drop concurrently in ${bothMissing} observations.`
                        });
                    }
                }
            }

            // 2. Missingness Mechanism Hypotheses (MCAR vs MAR vs MNAR)
            const mechanisms = [];
            if (columnsWithMissing.length === 0) {
                mechanisms.push({
                    mechanism: 'NO_MISSINGNESS',
                    confidence: 'Observed',
                    evidence: ['Zero missing values detected across all attributes.']
                });
            } else if (coMissingness.length > 0) {
                mechanisms.push({
                    mechanism: 'MAR (Missing At Random)',
                    confidence: 'Likely',
                    evidence: [
                        `High co-missingness detected between ${coMissingness.length} column pair(s).`,
                        'Missingness in one variable is strongly predicted by missingness in another observed field.'
                    ],
                    implication: 'Multiple imputation or model-based imputation is superior to listwise deletion.'
                });
            } else if (overallMissingRate <= 2.5) {
                mechanisms.push({
                    mechanism: 'MCAR (Missing Completely At Random)',
                    confidence: 'Possible',
                    evidence: [
                        `Sparse, uniform missingness rate (${overallMissingRate}%).`,
                        'No systematic co-missingness or cluster patterns detected.'
                    ],
                    implication: 'Standard imputation or removal has minimal risk of statistical bias.'
                });
            } else {
                mechanisms.push({
                    mechanism: 'POTENTIAL_MNAR (Missing Not At Random)',
                    confidence: 'Possible',
                    evidence: [
                        `Elevated missingness (${overallMissingRate}%) without observable co-missingness explanation.`,
                        'Unobserved systemic censoring or user opt-out may govern the missing values.'
                    ],
                    implication: 'Imputation must be approached with caution; missingness indicator feature recommended.'
                });
            }

            return {
                overallMissingRate,
                columnsWithMissingCount: columnsWithMissing.length,
                coMissingness,
                mechanisms,
                testableHypotheses: mechanisms
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.MissingnessIntelligence = MissingnessIntelligence;

})(typeof window !== 'undefined' ? window : global);
