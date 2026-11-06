/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/leakage-detector.js
 * ============================================================================
 * Critical Data Leakage Detection:
 * Identifies potential predictive contamination before modeling.
 * Evaluates:
 * 1. Post-outcome generic name heuristics (e.g. outcome, result, final, status...)
 * 2. Statistical signals: near-perfect correlation (|r| >= 0.98), duplicate values
 * 3. Identity mapping / identical target replicas (e.g. TargetCopy)
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const LeakageDetector = {
        /**
         * Detect potential data leakage risks relative to the target
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object|null} target - Selected target object or null
         * @param {Object} rawDataset - Original dataset with rows
         * @returns {Object} { riskLevel: "none"|"low"|"medium"|"high", findings: Array }
         */
        detectLeakage(profile, target = null, rawDataset = null) {
            if (!profile || !profile.columns || profile.columns.length < 2) {
                return { riskLevel: 'none', findings: [] };
            }

            const findings = [];
            const cols = profile.columns;
            const targetName = target ? target.column : null;
            const corrs = (profile.relationships && profile.relationships.correlations) ? profile.relationships.correlations : [];
            const rows = (rawDataset && Array.isArray(rawDataset.rows)) ? rawDataset.rows : [];

            // Generic post-outcome name tokens (domain-agnostic)
            const LEAKAGE_NAME_PATTERNS = [
                /\btarget\b/i,
                /\bresult\b/i,
                /\boutcome\b/i,
                /\bfinal\b/i,
                /\bstatus\b/i,
                /\blabel\b/i,
                /\bprediction\b/i,
                /\bscore\b/i,
                /\bapproved\b/i,
                /\brejected\b/i,
                /\bcompleted\b/i,
                /\bclosed\b/i,
                /\bdecision\b/i,
                /\bchurned\b/i,
                /\bconverted\b/i,
                /\bpost[-_]?event\b/i,
                /\bcopy\b/i
            ];

            // 1. Check correlations with target
            if (targetName) {
                for (let i = 0; i < corrs.length; i++) {
                    const c = corrs[i];
                    if (c.colA === targetName || c.colB === targetName) {
                        const otherCol = c.colA === targetName ? c.colB : c.colA;
                        const absR = Math.abs(c.pearson);

                        if (absR >= 0.98) {
                            findings.push({
                                column: otherCol,
                                risk: 95,
                                reason: `Extreme correlation (|r| = ${absR.toFixed(3)}) with target "${targetName}" indicates near-deterministic data leakage or duplicated outcome information.`
                            });
                        } else if (absR >= 0.92) {
                            findings.push({
                                column: otherCol,
                                risk: 75,
                                reason: `Suspiciously strong correlation (|r| = ${absR.toFixed(3)}) with target "${targetName}". Requires review to ensure values are known prior to the event.`
                            });
                        }
                    }
                }
            }

            // 2. Check for duplicate columns or direct copies with target
            if (targetName && rows.length > 0) {
                const sampleLimit = Math.min(rows.length, 500);
                for (let i = 0; i < cols.length; i++) {
                    const c = cols[i];
                    if (c.name === targetName) continue;

                    // Already flagged with extreme risk?
                    if (findings.some(f => f.column === c.name && f.risk >= 90)) continue;

                    // Test value identity
                    let identicalCount = 0;
                    for (let r = 0; r < sampleLimit; r++) {
                        const v1 = rows[r] ? String(rows[r][targetName]).trim() : '';
                        const v2 = rows[r] ? String(rows[r][c.name]).trim() : '';
                        if (v1 === v2 && v1 !== '') {
                            identicalCount++;
                        }
                    }

                    if (sampleLimit > 0 && (identicalCount / sampleLimit) >= 0.98) {
                        findings.push({
                            column: c.name,
                            risk: 98,
                            reason: `Values in "${c.name}" are identical to target "${targetName}" in ${(identicalCount / sampleLimit * 100).toFixed(1)}% of rows. Direct target duplicate / leakage.`
                        });
                    }
                }
            }

            // 3. Name heuristic analysis (especially when target is selected or names match target stems)
            for (let i = 0; i < cols.length; i++) {
                const c = cols[i];
                const colName = c.name;

                if (targetName && colName === targetName) continue;
                if (findings.some(f => f.column === colName)) continue;

                // Check if column name contains target name stem (e.g. TargetCopy, Outcome_v2)
                if (targetName && colName.toLowerCase().includes(targetName.toLowerCase())) {
                    findings.push({
                        column: colName,
                        risk: 88,
                        reason: `Column name "${colName}" directly derives from target name "${targetName}", suggesting redundant or leaked post-target recording.`
                    });
                    continue;
                }

                // Generic post-outcome name check if a target is chosen
                if (targetName) {
                    const matchedPattern = LEAKAGE_NAME_PATTERNS.find(p => p.test(colName));
                    if (matchedPattern && (c.semanticRole === 'category_dimension' || c.semanticRole === 'binary_flag' || c.semanticRole === 'measure')) {
                        findings.push({
                            column: colName,
                            risk: 65,
                            reason: `Column name "${colName}" matches post-event vocabulary ("${matchedPattern.source.replace(/[\\^$b]/g, '')}"). Verify that this metric is available strictly before prediction time.`
                        });
                    }
                }
            }

            // Determine overall risk level
            let maxRisk = 0;
            for (let i = 0; i < findings.length; i++) {
                if (findings[i].risk > maxRisk) maxRisk = findings[i].risk;
            }

            let riskLevel = 'none';
            if (maxRisk >= 80) riskLevel = 'high';
            else if (maxRisk >= 60) riskLevel = 'medium';
            else if (maxRisk >= 40) riskLevel = 'low';

            return {
                riskLevel: riskLevel,
                findings: findings.sort((a, b) => b.risk - a.risk)
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.LeakageDetector = LeakageDetector;

})(window);
