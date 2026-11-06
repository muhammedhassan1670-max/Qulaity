/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/monitoring/schema-monitor.js
 * ============================================================================
 * Audits schema evolution and semantic role stability between dataset versions.
 * 
 * Detects:
 * - Added column
 * - Removed column
 * - Potential renamed column
 * - Type changed
 * - Semantic role changed
 * - Identifier behavior changed
 * - Target suitability changed
 * 
 * Every change includes formal empirical evidence and confidence.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SchemaMonitor = {
        /**
         * Compare schemas across dataset versions
         * 
         * @param {Object} params
         * @param {Object} params.currentProfile
         * @param {Object} params.previousProfile
         * @param {Object} params.currentPlan
         * @param {Object} params.previousPlan
         * @returns {Object} Schema Audit Report
         */
        monitor({
            currentProfile = {},
            previousProfile = null,
            currentPlan = null,
            previousPlan = null
        } = {}) {
            if (!previousProfile || !Array.isArray(previousProfile.columns)) {
                return {
                    status: 'baseline',
                    hasSchemaChange: false,
                    changes: [],
                    addedColumns: [],
                    removedColumns: [],
                    renamedCandidates: [],
                    typeChanges: [],
                    roleChanges: [],
                    targetChanges: [],
                    message: 'Schema baseline established — no previous schema for comparison.'
                };
            }

            const currCols = currentProfile.columns || [];
            const prevCols = previousProfile.columns || [];
            const currNames = currCols.map(c => c.name);
            const prevNames = prevCols.map(c => c.name);

            const changes = [];
            const addedColumns = [];
            const removedColumns = [];
            const renamedCandidates = [];
            const typeChanges = [];
            const roleChanges = [];
            const targetChanges = [];

            // 1. Added & Removed Columns
            currNames.forEach(name => {
                if (!prevNames.includes(name)) {
                    const colProf = currCols.find(c => c.name === name);
                    const item = {
                        column: name,
                        type: 'added_column',
                        detectedType: colProf?.detectedType || 'unknown',
                        semanticRole: colProf?.semanticRole || 'unassigned',
                        evidence: `Column "${name}" exists in current schema but was absent in previous version.`
                    };
                    addedColumns.push(item);
                    changes.push(item);
                }
            });

            prevNames.forEach(name => {
                if (!currNames.includes(name)) {
                    const colProf = prevCols.find(c => c.name === name);
                    const item = {
                        column: name,
                        type: 'removed_column',
                        detectedType: colProf?.detectedType || 'unknown',
                        semanticRole: colProf?.semanticRole || 'unassigned',
                        evidence: `Column "${name}" was present in previous version but is absent in current schema.`
                    };
                    removedColumns.push(item);
                    changes.push(item);
                }
            });

            // 2. Potential Renamed Columns (Evidence-based heuristic)
            if (addedColumns.length > 0 && removedColumns.length > 0) {
                addedColumns.forEach(add => {
                    const addProf = currCols.find(c => c.name === add.column);
                    removedColumns.forEach(rem => {
                        const remProf = prevCols.find(c => c.name === rem.column);
                        if (addProf && remProf && addProf.detectedType === remProf.detectedType) {
                            // Check similarity of names (e.g. casing, prefix, or edit distance)
                            const s1 = add.column.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const s2 = rem.column.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const isSub = s1.includes(s2) || s2.includes(s1);

                            if (isSub || (addProf.stats?.cardinality != null && addProf.stats?.cardinality === remProf.stats?.cardinality)) {
                                const renameItem = {
                                    type: 'potential_renamed_column',
                                    from: rem.column,
                                    to: add.column,
                                    confidence: isSub ? 75 : 55,
                                    evidence: `Type match (${addProf.detectedType}) and structural correspondence between removed "${rem.column}" and added "${add.column}". Explicitly designated as potential schema change.`
                                };
                                renamedCandidates.push(renameItem);
                                changes.push(renameItem);
                            }
                        }
                    });
                });
            }

            // 3. Shared Columns: Type & Semantic Role & Identifier Behavior
            const sharedNames = currNames.filter(n => prevNames.includes(n));
            sharedNames.forEach(name => {
                const cCurr = currCols.find(c => c.name === name);
                const cPrev = prevCols.find(c => c.name === name);

                if (cCurr && cPrev) {
                    // Type Changed
                    if (cCurr.detectedType !== cPrev.detectedType) {
                        const item = {
                            column: name,
                            type: 'type_changed',
                            previousType: cPrev.detectedType,
                            currentType: cCurr.detectedType,
                            evidence: `Type inference transitioned from "${cPrev.detectedType}" to "${cCurr.detectedType}".`
                        };
                        typeChanges.push(item);
                        changes.push(item);
                    }

                    // Semantic Role Changed
                    if (cCurr.semanticRole !== cPrev.semanticRole) {
                        const item = {
                            column: name,
                            type: 'semantic_role_changed',
                            previousRole: cPrev.semanticRole,
                            currentRole: cCurr.semanticRole,
                            evidence: `Semantic classification shifted from "${cPrev.semanticRole}" to "${cCurr.semanticRole}".`
                        };
                        roleChanges.push(item);
                        changes.push(item);
                    }

                    // Identifier Behavior Changed
                    const wasId = cPrev.semanticRole === 'identifier' || (cPrev.stats?.uniqueRatio >= 0.98);
                    const isId = cCurr.semanticRole === 'identifier' || (cCurr.stats?.uniqueRatio >= 0.98);
                    if (wasId !== isId) {
                        const item = {
                            column: name,
                            type: 'identifier_behavior_changed',
                            previousIsId: wasId,
                            currentIsId: isId,
                            evidence: `Uniqueness / identifier behavior changed (previous unique ratio: ${cPrev.stats?.uniqueRatio}, current: ${cCurr.stats?.uniqueRatio}).`
                        };
                        changes.push(item);
                    }
                }
            });

            // 4. Target Suitability Changed (Step 2.5 Planning integration)
            if (currentPlan && previousPlan) {
                const prevTarget = previousPlan.primaryTarget?.column || null;
                const currTarget = currentPlan.primaryTarget?.column || null;

                if (prevTarget && currTarget && prevTarget !== currTarget) {
                    const item = {
                        type: 'target_suitability_changed',
                        column: `${prevTarget} -> ${currTarget}`,
                        previousTarget: prevTarget,
                        currentTarget: currTarget,
                        evidence: `Primary predictive target recommendation switched from "${prevTarget}" (suitability: ${previousPlan.primaryTarget?.score}%) to "${currTarget}" (suitability: ${currentPlan.primaryTarget?.score}%).`
                    };
                    targetChanges.push(item);
                    changes.push(item);
                }
            }

            return {
                status: 'audited',
                hasSchemaChange: changes.length > 0,
                changes,
                addedColumns,
                removedColumns,
                renamedCandidates,
                typeChanges,
                roleChanges,
                targetChanges,
                summary: {
                    totalChanges: changes.length,
                    addedCount: addedColumns.length,
                    removedCount: removedColumns.length,
                    typeChangeCount: typeChanges.length,
                    roleChangeCount: roleChanges.length
                },
                message: changes.length > 0 ? `Identified ${changes.length} schema changes across versions.` : 'Schema is completely stable across versions.'
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.SchemaMonitor = SchemaMonitor;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SchemaMonitor;
    }
})(typeof window !== 'undefined' ? window : global);
