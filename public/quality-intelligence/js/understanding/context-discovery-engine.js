/**
 * UDIP Context Discovery Engine
 * 
 * Evaluates dataset evidence to discover deep semantic context,
 * variable roles, temporal dynamics, entity hierarchies, leakage risks,
 * and builds the initial Evidence Graph.
 * 
 * @module ContextDiscoveryEngine
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ContextDiscoveryEngine = factory();
        root.UDIPContextDiscovery = root.ContextDiscoveryEngine;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    class ContextDiscoveryEngine {
        /**
         * Perform comprehensive context discovery on raw tabular data
         * @param {Array<Object>} data
         * @param {Array<string>} [columns]
         * @param {Object} [options]
         * @returns {Object} Context discovery profile with Evidence Graph
         */
        static discoverContext(data, columns, options = {}) {
            const rawData = Array.isArray(data) ? data : (data && data.data ? data.data : []);
            const rowCount = rawData.length;
            const cols = columns || (rowCount > 0 ? Object.keys(rawData[0]) : []);
            const colCount = cols.length;

            if (rowCount === 0 || colCount === 0) {
                return this._emptyContext();
            }

            // 1. Evidence Graph Container
            const graph = {
                nodes: [
                    { id: 'dataset_root', type: 'DATASET', label: options.datasetName || 'Primary Dataset', metadata: { rowCount, colCount } }
                ],
                edges: []
            };

            // 2. Discover Entities & Variable Roles
            const variables = {};
            const potentialTargets = [];
            const potentialTimeVars = [];
            const potentialLeakages = [];
            const potentialEntities = [];

            cols.forEach(col => {
                const values = rawData.map(r => r[col]);
                const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
                const distinctSet = new Set(nonNullValues);
                const distinctCount = distinctSet.size;
                const cardinalityRatio = distinctCount / rowCount;

                const isNumeric = nonNullValues.length > 0 && nonNullValues.every(v => !isNaN(Number(v)) && v !== true && v !== false);
                const lowerCol = col.toLowerCase();

                // Target checks
                const isTargetWord = /fail|defect|churn|target|label|status|outcome|result|class|anomaly|fraud|default/i.test(lowerCol);
                const isIdWord = /id|uuid|key|code|index|sn|serial/i.test(lowerCol);
                const isTimeWord = /date|time|timestamp|hour|day|month|year|epoch/i.test(lowerCol);

                let primaryRole = 'FEATURE';
                let confidence = 0.70;
                let evidence = 'Observational feature';

                if (isTimeWord || (!isNumeric && nonNullValues.slice(0, 10).every(v => !isNaN(Date.parse(v)) && String(v).length >= 4))) {
                    primaryRole = 'TIME';
                    confidence = 0.94;
                    evidence = 'Sequential time/date format';
                    potentialTimeVars.push({ column: col, confidence });
                } else if (isIdWord || (cardinalityRatio >= 0.95 && rowCount > 10)) {
                    primaryRole = 'ID';
                    confidence = 0.95;
                    evidence = 'High-cardinality unique entity identifier';
                    potentialEntities.push({ column: col, distinctCount });
                } else if (distinctCount === 1) {
                    primaryRole = 'CONSTANT';
                    confidence = 1.0;
                    evidence = 'Constant invariant column';
                } else if (isTargetWord || (distinctCount === 2 && (lowerCol.includes('is_') || lowerCol.includes('has_')))) {
                    primaryRole = 'TARGET';
                    confidence = 0.88;
                    evidence = `Outcome event pattern in column name "${col}" with ${distinctCount} distinct states`;
                    potentialTargets.push({ column: col, distinctCount, confidence });
                } else if (isNumeric) {
                    primaryRole = 'MEASUREMENT';
                    confidence = 0.85;
                    evidence = 'Continuous numeric measurement';
                } else if (distinctCount <= 20) {
                    primaryRole = 'CATEGORY';
                    confidence = 0.80;
                    evidence = `Discrete factor (${distinctCount} levels)`;
                }

                variables[col] = {
                    name: col,
                    primaryRole,
                    confidence,
                    evidence,
                    distinctCount,
                    nullRatio: rowCount > 0 ? (rowCount - nonNullValues.length) / rowCount : 0,
                    isNumeric
                };

                // Add Node & Edge to Graph
                const nodeId = `var_${col}`;
                graph.nodes.push({
                    id: nodeId,
                    type: 'VARIABLE',
                    label: col,
                    role: primaryRole,
                    confidence
                });
                graph.edges.push({
                    source: 'dataset_root',
                    target: nodeId,
                    relation: 'CONTAINS_VARIABLE',
                    weight: 1.0
                });
            });

            // 3. Discover Pairwise Relationships & Leakage Detection
            const relationships = [];
            const numericCols = cols.filter(c => variables[c].isNumeric);

            if (numericCols.length >= 2 && rowCount >= 5) {
                for (let i = 0; i < numericCols.length; i++) {
                    for (let j = i + 1; j < numericCols.length; j++) {
                        const colA = numericCols[i];
                        const colB = numericCols[j];
                        const pairs = rawData.map(r => [Number(r[colA]), Number(r[colB])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));

                        if (pairs.length >= 5) {
                            const meanA = pairs.reduce((acc, p) => acc + p[0], 0) / pairs.length;
                            const meanB = pairs.reduce((acc, p) => acc + p[1], 0) / pairs.length;
                            let num = 0, denA = 0, denB = 0;
                            pairs.forEach(([a, b]) => {
                                const diffA = a - meanA;
                                const diffB = b - meanB;
                                num += diffA * diffA;
                                denA += diffA * diffA;
                                denB += diffB * diffB;
                            });
                            const r = (denA > 0 && denB > 0) ? (num / (Math.sqrt(denA) * Math.sqrt(denB))) : 0;
                            
                            if (Math.abs(r) >= 0.35) {
                                relationships.push({
                                    source: colA,
                                    target: colB,
                                    correlation: Math.round(r * 1000) / 1000,
                                    type: Math.abs(r) >= 0.8 ? 'STRONG_ASSOCIATION' : 'MODERATE_ASSOCIATION'
                                });

                                // Leakage check: if one is target and correlation > 0.98, flag leakage risk
                                const isTargetA = variables[colA].primaryRole === 'TARGET';
                                const isTargetB = variables[colB].primaryRole === 'TARGET';
                                if ((isTargetA || isTargetB) && Math.abs(r) > 0.98) {
                                    const leakFeature = isTargetA ? colB : colA;
                                    potentialLeakages.push({
                                        feature: leakFeature,
                                        target: isTargetA ? colA : colB,
                                        correlation: r,
                                        risk: 'CRITICAL',
                                        reason: `Suspiciously perfect correlation (r = ${r.toFixed(3)}) indicates potential data leakage.`
                                    });
                                }

                                graph.edges.push({
                                    source: `var_${colA}`,
                                    target: `var_${colB}`,
                                    relation: 'STATISTICAL_ASSOCIATION',
                                    weight: Math.abs(r),
                                    evidence: `Correlation r = ${r.toFixed(3)}`
                                });
                            }
                        }
                    }
                }
            }

            // 4. Inferred Domain
            const domain = this._deduceDomain(cols);

            return {
                domain: domain.name,
                domainConfidence: domain.confidence,
                domainReason: domain.reason,
                variables,
                potentialTargets,
                potentialTimeVars,
                potentialEntities,
                potentialLeakages,
                relationships,
                evidenceGraph: graph,
                isTimeSeries: potentialTimeVars.length > 0,
                rowCount,
                colCount
            };
        }

        static _deduceDomain(cols) {
            const str = cols.join(' ').toLowerCase();
            if (/temp|vibration|pressure|rpm|torque|sensor|spindle|voltage/i.test(str)) {
                return { name: 'Industrial IoT & Manufacturing', confidence: 0.90, reason: 'High frequency of sensor/mechanical metrics' };
            }
            if (/defect|reject|yield|tolerance|cavity|rework/i.test(str)) {
                return { name: 'Quality Engineering & Process Control', confidence: 0.88, reason: 'Defect inspection and quality parameters detected' };
            }
            if (/revenue|price|cost|sales|churn|customer|account/i.test(str)) {
                return { name: 'Sales & Customer Analytics', confidence: 0.85, reason: 'Commercial and transactional features detected' };
            }
            return { name: 'General Tabular Analytics', confidence: 0.60, reason: 'Standard numerical/categorical features' };
        }

        static _emptyContext() {
            return {
                domain: 'Unknown',
                domainConfidence: 0,
                domainReason: 'Empty dataset',
                variables: {},
                potentialTargets: [],
                potentialTimeVars: [],
                potentialEntities: [],
                potentialLeakages: [],
                relationships: [],
                evidenceGraph: { nodes: [], edges: [] },
                isTimeSeries: false,
                rowCount: 0,
                colCount: 0
            };
        }
    }

    return ContextDiscoveryEngine;
}));
