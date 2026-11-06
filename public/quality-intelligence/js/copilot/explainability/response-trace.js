/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/explainability/response-trace.js
 * ============================================================================
 * Provides an inspectable, transparent record of how every Copilot answer
 * was generated:
 * User Question -> Detected Intent -> Entities -> Plan -> Modules Used
 * -> Evidence Retrieved -> Actions Executed -> Validation -> Final Answer
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ResponseTrace = {
        /**
         * Create a new blank trace session
         * @param {string} userQuestion
         * @returns {Object}
         */
        createTrace(userQuestion = '') {
            return {
                id: 'trc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                timestamp: new Date().toISOString(),
                userQuestion: String(userQuestion || ''),
                detectedIntent: null,
                intentConfidence: 0,
                entities: [],
                plan: null,
                modulesUsed: [],
                evidenceRetrieved: [],
                actionsExecuted: [],
                validation: {
                    passed: true,
                    flags: [],
                    causalSanitized: false
                },
                executionTimeMs: 0,
                startTime: Date.now(),
                completed: false
            };
        },

        /**
         * Record intent and entities in trace
         */
        recordIntent(trace, intentObj, entities = []) {
            if (!trace) return;
            trace.detectedIntent = intentObj ? (intentObj.intent || intentObj.name || intentObj) : 'UNKNOWN';
            trace.intentConfidence = intentObj && typeof intentObj.confidence === 'number' ? intentObj.confidence : 1.0;
            trace.entities = Array.isArray(entities) ? [...entities] : [];
        },

        /**
         * Record query plan in trace
         */
        recordPlan(trace, plan) {
            if (!trace) return;
            trace.plan = plan ? { ...plan } : null;
            if (plan && Array.isArray(plan.steps)) {
                plan.steps.forEach(step => {
                    if (step.module && !trace.modulesUsed.includes(step.module)) {
                        trace.modulesUsed.push(step.module);
                    }
                });
            }
        },

        /**
         * Record evidence retrieved
         */
        recordEvidence(trace, evidenceList) {
            if (!trace) return;
            if (Array.isArray(evidenceList)) {
                trace.evidenceRetrieved = evidenceList.map(e => ({
                    id: e.id || e.type || 'ev',
                    type: e.type || 'metric',
                    metric: e.metric || e.title || '',
                    source: e.source || 'udip_engine',
                    value: e.value !== undefined ? e.value : null,
                    strength: typeof e.strength === 'number' ? e.strength : 80
                }));
            }
        },

        /**
         * Record an executed action
         */
        recordAction(trace, action) {
            if (!trace || !action) return;
            trace.actionsExecuted.push({
                type: action.type || 'ACTION',
                target: action.target || '',
                label: action.label || '',
                executedAt: new Date().toISOString()
            });
        },

        /**
         * Record validation outcome
         */
        recordValidation(trace, validationResult) {
            if (!trace || !validationResult) return;
            trace.validation = {
                passed: Boolean(validationResult.passed),
                flags: Array.isArray(validationResult.flags) ? [...validationResult.flags] : [],
                causalSanitized: Boolean(validationResult.causalSanitized)
            };
        },

        /**
         * Finalize the trace
         */
        finalize(trace) {
            if (!trace) return null;
            trace.executionTimeMs = Math.max(0, Date.now() - (trace.startTime || Date.now()));
            trace.completed = true;
            return trace;
        },

        /**
         * Format inspectable markdown/plain explanation for UI modal
         */
        formatInspectableTrace(trace) {
            if (!trace) return 'No trace available.';
            const lines = [];
            lines.push(`### 🔍 How was this answer generated?`);
            lines.push(`* **User Query:** "${trace.userQuestion}"`);
            lines.push(`* **Detected Intent:** \`${trace.detectedIntent || 'N/A'}\` (Confidence: ${Math.round((trace.intentConfidence || 0) * 100)}%)`);
            
            if (trace.entities && trace.entities.length > 0) {
                const entStr = trace.entities.map(e => `${e.type}: \`${e.value}\``).join(', ');
                lines.push(`* **Extracted Entities:** ${entStr}`);
            }

            if (trace.modulesUsed && trace.modulesUsed.length > 0) {
                lines.push(`* **Engines Consulted:** ${trace.modulesUsed.join(', ')}`);
            }

            if (trace.evidenceRetrieved && trace.evidenceRetrieved.length > 0) {
                lines.push(`* **Evidence Used:** ${trace.evidenceRetrieved.length} empirical item(s)`);
                trace.evidenceRetrieved.slice(0, 5).forEach(e => {
                    lines.push(`  - [${e.source}] ${e.metric}: ${e.value !== null ? e.value : 'N/A'}`);
                });
            }

            lines.push(`* **Validation Status:** ${trace.validation.passed ? '✅ Passed all checks' : '⚠️ Verified with caveats'}`);
            if (trace.validation.causalSanitized) {
                lines.push(`  - *Note:* Causal claims were automatically converted to observational associations.`);
            }

            lines.push(`* **Execution Time:** ${trace.executionTimeMs} ms`);

            return lines.join('\n');
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ResponseTrace = ResponseTrace;

})(typeof window !== 'undefined' ? window : global);
