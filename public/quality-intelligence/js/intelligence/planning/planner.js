/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/planner.js
 * ============================================================================
 * Master Intelligence Planning Coordinator:
 * Executes the full analytical planning pipeline and synthesizes the unified Analysis Plan.
 * Calculates overall plan confidence across 6 statistical dimensions.
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Planner = {
        /**
         * Create complete Analysis Plan from profile and dataset
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object} rawDataset - Original dataset object
         * @returns {Object} Unified Analysis Plan
         */
        createPlan(profile, rawDataset) {
            // Guard: Handle empty or missing profile safely
            if (!profile || !profile.columns || profile.columns.length === 0) {
                return this._createEmptyPlan(profile, rawDataset);
            }

            const ds = profile.dataset || {};
            const q = profile.quality || {};
            const cols = profile.columns || [];

            // 1. Determine Dataset Type Topology
            const datasetType = this._determineDatasetType(profile);

            // 2. Detect Tasks & Predictive Readiness
            const taskDetector = window.UDIP.TaskDetector;
            const recommendedTasks = taskDetector ? taskDetector.detectTasks(profile, rawDataset) : [];
            const predictiveReadiness = taskDetector && typeof taskDetector.evaluatePredictiveReadiness === 'function'
                ? taskDetector.evaluatePredictiveReadiness(profile, rawDataset)
                : { status: 'READY', score: 85, blockers: [], warnings: [] };

            // 3. Select Target(s)
            const targetSelector = window.UDIP.TargetSelector;
            const targetResult = targetSelector ? targetSelector.selectTargets(profile) : { primaryTarget: null, alternativeTargets: [] };
            const primaryTarget = targetResult.primaryTarget || null;
            const alternativeTargets = targetResult.alternativeTargets || [];

            // 4. Detect Data Leakage Risks
            const leakageDetector = window.UDIP.LeakageDetector;
            const leakage = leakageDetector ? leakageDetector.detectLeakage(profile, primaryTarget, rawDataset) : { riskLevel: 'none', findings: [] };

            // 5. Select & Partition Features
            const featureSelector = window.UDIP.FeatureSelector;
            const features = featureSelector ? featureSelector.selectFeatures(profile, primaryTarget, leakage) : { recommended: [], potential: [], excluded: [] };

            // 6. Cross-Variable Relationships & Redundancy
            const relationshipEngine = window.UDIP.RelationshipEngine;
            const relationships = relationshipEngine ? relationshipEngine.analyzeRelationships(profile, rawDataset) : [];

            // 7. Missingness Intelligence
            const missingnessAnalyzer = window.UDIP.MissingnessAnalyzer;
            const missingness = missingnessAnalyzer ? missingnessAnalyzer.analyzeMissingness(profile, rawDataset) : { overallScore: 100, riskLevel: 'low', patterns: [], recommendations: [] };

            // 8. Recommendations & Preprocessing Pipeline
            const recommendationEngine = window.UDIP.RecommendationEngine;
            const context = { target: primaryTarget, features, tasks: recommendedTasks, leakage, missingness };
            const recResult = recommendationEngine ? recommendationEngine.generateRecommendations(profile, context) : { preprocessing: [], recommendations: [] };

            // 9. Overall Warnings List
            const warnings = [];
            if (predictiveReadiness.status === 'INSUFFICIENT') {
                warnings.push(`Predictive readiness insufficient: ${predictiveReadiness.blockers.join('; ')}`);
            } else if (predictiveReadiness.status === 'MARGINAL') {
                warnings.push(`Predictive readiness marginal: ${predictiveReadiness.warnings.join('; ')}`);
            }
            if (leakage.riskLevel === 'high') {
                warnings.push(`High data leakage risk identified in ${leakage.findings.length} column(s).`);
            }
            if (missingness.riskLevel === 'critical' || missingness.riskLevel === 'high') {
                warnings.push(`Elevated missingness risk (${missingness.riskLevel}): ${q.totalMissingCells || 0} missing values.`);
            }
            if (q.constantColsCount > 0) {
                warnings.push(`${q.constantColsCount} constant column(s) detected with zero variance.`);
            }
            if (q.duplicateRowsCount > 0) {
                warnings.push(`${q.duplicateRowsCount} duplicate rows detected (${q.duplicateRowsPct}%).`);
            }

            // Cognitive Deep Data Understanding Warnings & Enrichments
            const km = rawDataset ? rawDataset.knowledgeModel : null;
            if (km) {
                if (km.derivedVariables && km.derivedVariables.length > 0) {
                    warnings.push(`Mathematical equation redundancy: ${km.derivedVariables.length} variable(s) appear mechanically derived (${km.derivedVariables.map(d => d.formula).slice(0, 2).join(', ')}).`);
                }
                if (km.relationships) {
                    const nonLinearWithTarget = km.relationships.filter(r => 
                        r.isNonlinear && (r.colA === primaryTarget || r.colB === primaryTarget)
                    );
                    if (nonLinearWithTarget.length > 0) {
                        warnings.push(`Non-linear structure detected between target "${primaryTarget}" and [${nonLinearWithTarget.map(r => r.colA === primaryTarget ? r.colB : r.colA).join(', ')}]. Non-linear estimators recommended.`);
                    }
                }
            }

            // 10. Synthesize Global Strategic Reasoning
            const reasoning = this._synthesizeReasoning(datasetType, recommendedTasks, primaryTarget, features, leakage, missingness);

            // 11. Compute Overall Plan Confidence
            const confidence = this._computePlanConfidence(profile, datasetType, recommendedTasks, primaryTarget, relationships, q);

            return {
                version: '1.0',
                generatedAt: new Date().toISOString(),
                datasetType,
                primaryTarget,
                alternativeTargets,
                recommendedTasks,
                predictiveReadiness,
                features,
                relationships,
                leakage,
                missingness,
                preprocessing: recResult.preprocessing,
                recommendations: recResult.recommendations,
                warnings,
                reasoning,
                confidence,
                knowledgeModel: km,
                adaptiveStrategy: km ? km.adaptiveStrategy : null
            };
        },

        _determineDatasetType(profile) {
            const patterns = profile.datasetPatterns || [];
            const cols = profile.columns || [];
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');
            const numCols = cols.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric');
            const idCols = cols.filter(c => c.detectedType === 'identifier' || c.semanticRole === 'identifier');

            let type = 'cross_sectional';
            let confidence = 80;
            const reasoning = [];

            if (patterns.length > 0 && patterns[0].pattern) {
                const patName = patterns[0].pattern.toLowerCase();
                if (patName.includes('time-series')) {
                    type = 'time_series';
                    confidence = patterns[0].confidence || 90;
                    reasoning.push(`Identified explicit temporal index "${dateCols[0]?.name}" with sequential observations`);
                    reasoning.push(...(patterns[0].reasons || []));
                } else if (patName.includes('panel')) {
                    type = 'panel_data';
                    confidence = patterns[0].confidence || 85;
                    reasoning.push('Combination of entity identifier and repeated temporal index detected');
                } else if (patName.includes('supervised')) {
                    type = 'supervised_tabular';
                    confidence = patterns[0].confidence || 85;
                    reasoning.push('Distinct target candidate and predictor feature space present');
                } else {
                    type = 'cross_sectional';
                    confidence = patterns[0].confidence || 80;
                    reasoning.push('Independent single-timepoint observations across multiple attributes');
                }
            } else if (dateCols.length > 0 && numCols.length > 0) {
                type = 'time_series';
                confidence = 85;
                reasoning.push(`Contains temporal dimension ("${dateCols[0].name}") and ${numCols.length} numerical metric(s)`);
            } else {
                reasoning.push(`Structured tabular format with ${cols.length} variables and ${profile.dataset ? profile.dataset.rowCount : 0} rows`);
            }

            return {
                type,
                confidence: Math.max(0, Math.min(100, Math.round(confidence))),
                reasoning
            };
        },

        _synthesizeReasoning(datasetType, tasks, target, features, leakage, missingness) {
            const lines = [];

            lines.push(`Dataset is structured as ${datasetType.type.replace(/_/g, ' ').toUpperCase()} (${datasetType.confidence}% confidence).`);

            if (target) {
                lines.push(`Primary prediction target chosen as "${target.column}" (${target.suitability} suitability: ${target.score}/100) supporting ${target.taskHints.join(', ')}.`);
            } else {
                lines.push('No dominant target variable identified with high confidence; focusing on unsupervised exploration, clustering, and descriptive intelligence.');
            }

            if (tasks.length > 0) {
                const highTasks = tasks.filter(t => t.priority === 'high').map(t => t.task.replace(/_/g, ' '));
                if (highTasks.length > 0) {
                    lines.push(`Top recommended analytical pathways: ${highTasks.join(', ')}.`);
                }
            }

            lines.push(`Feature partitioning: ${features.recommended.length} recommended predictor(s), ${features.potential.length} potential feature(s), and ${features.excluded.length} excluded attribute(s).`);

            if (leakage.riskLevel === 'high') {
                lines.push(`CRITICAL: Data leakage risk flagged as HIGH across ${leakage.findings.length} variable(s). Pre-modeling exclusion required.`);
            }

            if (missingness.riskLevel !== 'low') {
                lines.push(`Missingness risk evaluated as ${missingness.riskLevel.toUpperCase()}; patterns require targeted remediation.`);
            }

            return lines;
        },

        _computePlanConfidence(profile, datasetType, tasks, target, relationships, q) {
            let score = 50; // Base score

            // 1. Quality score contribution (up to 25 pts)
            const qScore = q.qualityScore !== undefined ? q.qualityScore : 50;
            score += (qScore / 100) * 25;

            // 2. Dataset size & completeness contribution (up to 15 pts)
            const rowCount = profile.dataset ? profile.dataset.rowCount : 0;
            if (rowCount >= 50) score += 15;
            else if (rowCount >= 20) score += 10;
            else if (rowCount >= 5) score += 5;

            // 3. Task certainty contribution (up to 15 pts)
            if (tasks.length > 0 && tasks[0].suitability >= 80) score += 15;
            else if (tasks.length > 0 && tasks[0].suitability >= 60) score += 10;

            // 4. Target clarity contribution (up to 15 pts)
            if (target && target.score >= 80) score += 15;
            else if (target && target.score >= 60) score += 10;
            else if (!target) score += 5; // Unsupervised clarity

            // 5. Dataset type confidence (up to 15 pts)
            score += (datasetType.confidence / 100) * 15;

            // 6. Relationship evidence (up to 15 pts)
            if (relationships.length >= 3) score += 15;
            else if (relationships.length >= 1) score += 10;

            const finalScore = Math.max(0, Math.min(100, Math.round(score)));

            let level = 'moderate';
            if (finalScore >= 90) level = 'very_high';
            else if (finalScore >= 80) level = 'high';
            else if (finalScore >= 60) level = 'moderate';
            else if (finalScore >= 40) level = 'low';
            else level = 'very_low';

            return {
                score: finalScore,
                level: level
            };
        },

        _createEmptyPlan(profile, rawDataset) {
            return {
                version: '1.0',
                generatedAt: new Date().toISOString(),
                datasetType: {
                    type: 'insufficient_evidence',
                    confidence: 0,
                    reasoning: ['Empty or unprofiled dataset']
                },
                primaryTarget: null,
                alternativeTargets: [],
                recommendedTasks: [],
                features: { recommended: [], potential: [], excluded: [] },
                relationships: [],
                leakage: { riskLevel: 'none', findings: [] },
                missingness: { overallScore: 0, riskLevel: 'low', patterns: [], columnMissingness: [], recommendations: [] },
                preprocessing: [],
                recommendations: [],
                warnings: ['No data loaded or empty dataset'],
                reasoning: ['Dataset contains zero rows or columns. Upload a structured dataset to generate an Analysis Plan.'],
                confidence: {
                    score: 0,
                    level: 'very_low'
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Planner = Planner;

})(window);
