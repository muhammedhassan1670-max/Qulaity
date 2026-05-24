/**
 * QMS Enterprise 4.0 - AI/ML Service Foundation
 * Professional Quality 4.0 Intelligence Layer
 * 
 * Features:
 * - Predictive Quality Analytics
 * - Defect Prediction Models
 * - Root Cause Analysis AI
 * - CAPA Recommendation Engine
 * - Natural Language Query Interface
 * - Automated Report Generation
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';

// ============================================================================
// TYPES - AI/ML System
// ============================================================================

export type ModelType = 
  | 'defect-prediction' 
  | 'anomaly-detection' 
  | 'root-cause-analysis'
  | 'capa-recommendation'
  | 'trend-forecasting'
  | 'supplier-risk'
  | 'demand-forecasting';

export type ModelStatus = 'training' | 'ready' | 'deployed' | 'error' | 'disabled';

export interface AIModel {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  version: string;
  status: ModelStatus;
  accuracy: number; // 0-100
  lastTrained: string;
  trainingDataSize: number;
  features: string[];
  target: string;
  configuration: {
    algorithm: string;
    hyperparameters: Record<string, number | string>;
    threshold?: number;
  };
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
  };
  isActive: boolean;
}

export interface PredictionResult {
  id: string;
  modelId: string;
  timestamp: string;
  input: Record<string, unknown>;
  prediction: unknown;
  confidence: number; // 0-100
  probabilities?: Record<string, number>;
  explanation?: {
    featureImportance: Record<string, number>;
    topFeatures: string[];
    reasoning: string;
  };
  recommendedActions?: string[];
  similarCases?: string[]; // Reference to historical NCRs/CAPAs
}

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  pattern: {
    type: 'statistical' | 'ml' | 'rule-based';
    conditions: Array<{
      feature: string;
      operator: '>' | '<' | '=' | '!=' | 'in' | 'not_in';
      value: unknown;
    }>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoAction?: {
    enabled: boolean;
    action: 'alert' | 'create-ncr' | 'create-capa' | 'stop-line' | 'notify';
    recipients?: string[];
  };
  detectionCount: number;
  lastDetected: string;
  isActive: boolean;
}

export interface RootCauseAnalysis {
  id: string;
  ncrId?: string;
  capaId?: string;
  timestamp: string;
  problemDescription: string;
  analysis: {
    potentialCauses: Array<{
      category: 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'environment';
      cause: string;
      probability: number;
      evidence: string[];
    }>;
    topCause: string;
    confidence: number;
  };
  recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
    estimatedCost?: string;
    timeline?: string;
  }>;
  historicalSimilarCases: string[];
  aiReasoning: string;
}

export interface CAPARecommendation {
  id: string;
  sourceNCRId: string;
  timestamp: string;
  problemType: string;
  rootCause: string;
  recommendations: {
    corrective: Array<{
      action: string;
      responsible: string;
      dueDate: string;
      verificationMethod: string;
      confidence: number;
    }>;
    preventive: Array<{
      action: string;
      responsible: string;
      dueDate: string;
      riskReduction: number; // percentage
      confidence: number;
    }>;
  };
  effectivenessPrediction: {
    probability: number;
    timeline: string;
    expectedOutcome: string;
  };
  similarSuccessfulCAPAs: string[];
}

export interface TrendForecast {
  id: string;
  metric: string;
  timestamp: string;
  historicalData: Array<{
    date: string;
    value: number;
  }>;
  forecast: Array<{
    date: string;
    value: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;
  insights: string[];
  risks: string[];
  recommendations: string[];
  seasonalityDetected?: boolean;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface NLQueryResult {
  id: string;
  query: string;
  timestamp: string;
  intent: string;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  sql?: string;
  results?: unknown;
  summary: string;
  visualization?: 'chart' | 'table' | 'gauge' | 'map';
  followUpQuestions?: string[];
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'prediction' | 'anomaly' | 'recommendation' | 'risk';
  category: 'quality' | 'efficiency' | 'compliance' | 'cost';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  relatedData: {
    ncrIds?: string[];
    capaIds?: string[];
    sensorIds?: string[];
    metrics?: string[];
  };
  impact: {
    metric: string;
    currentValue: number;
    predictedValue: number;
    change: number; // percentage
  };
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AIState {
  // Models
  models: AIModel[];
  activeModel: AIModel | null;
  
  // Predictions & Analysis
  predictions: PredictionResult[];
  rootCauseAnalyses: RootCauseAnalysis[];
  capaRecommendations: CAPARecommendation[];
  trendForecasts: TrendForecast[];
  
  // Patterns & Insights
  anomalyPatterns: AnomalyPattern[];
  insights: AIInsight[];
  unacknowledgedInsights: number;
  
  // NLP
  queryHistory: NLQueryResult[];
  
  // System State
  isProcessing: boolean;
  apiEndpoint: string;
  apiKey?: string;
  
  // Actions - Models
  registerModel: (model: Omit<AIModel, 'id' | 'status'>) => void;
  updateModel: (id: string, updates: Partial<AIModel>) => void;
  trainModel: (id: string, trainingData: unknown[]) => Promise<void>;
  deployModel: (id: string) => void;
  disableModel: (id: string) => void;
  
  // Actions - Predictions
  makePrediction: (modelId: string, input: Record<string, unknown>) => Promise<PredictionResult>;
  batchPredict: (modelId: string, inputs: Record<string, unknown>[]) => Promise<PredictionResult[]>;
  
  // Actions - Analysis
  analyzeRootCause: (ncrId: string, problemDescription: string) => Promise<RootCauseAnalysis>;
  recommendCAPA: (ncrId: string, rootCause: string) => Promise<CAPARecommendation>;
  forecastTrend: (metric: string, months: number) => Promise<TrendForecast>;
  
  // Actions - Patterns
  createPattern: (pattern: Omit<AnomalyPattern, 'id' | 'detectionCount' | 'lastDetected'>) => void;
  updatePattern: (id: string, updates: Partial<AnomalyPattern>) => void;
  deletePattern: (id: string) => void;
  detectPatterns: (data: unknown[]) => AnomalyPattern[];
  
  // Actions - Insights
  generateInsights: () => void;
  acknowledgeInsight: (id: string, userId: string) => void;
  
  // Actions - NLP
  processQuery: (query: string) => Promise<NLQueryResult>;
  
  // Actions - Utility
  exportModel: (id: string) => string;
  importModel: (json: string) => void;
  getModelPerformance: (id: string) => AIModel['performance'] | null;
}

// ============================================================================
// MOCK AI ALGORITHMS (Replace with real ML models in production)
// ============================================================================

// Simple rule-based defect prediction
function mockDefectPrediction(input: Record<string, unknown>): PredictionResult {
  const temperature = input.temperature as number || 25;
  const pressure = input.pressure as number || 100;
  const humidity = input.humidity as number || 50;
  const operatorExperience = input.operatorExperience as number || 5;
  
  // Risk scoring
  let riskScore = 0;
  if (temperature > 30 || temperature < 20) riskScore += 20;
  if (pressure > 110 || pressure < 90) riskScore += 25;
  if (humidity > 70) riskScore += 15;
  if (operatorExperience < 2) riskScore += 30;
  
  // Random variation
  riskScore += (Math.random() - 0.5) * 20;
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  const prediction = riskScore > 60 ? 'high-risk' : riskScore > 30 ? 'medium-risk' : 'low-risk';
  const confidence = 70 + Math.random() * 25;
  
  return {
    id: `pred-${Date.now()}`,
    modelId: 'defect-prediction',
    timestamp: new Date().toISOString(),
    input,
    prediction,
    confidence,
    probabilities: {
      'low-risk': Math.max(0, 100 - riskScore - 10),
      'medium-risk': Math.max(0, 40 - Math.abs(riskScore - 45)),
      'high-risk': Math.max(0, riskScore)
    },
    explanation: {
      featureImportance: {
        temperature: 0.25,
        pressure: 0.30,
        humidity: 0.15,
        operatorExperience: 0.30
      },
      topFeatures: ['pressure', 'operatorExperience', 'temperature'],
      reasoning: `High risk detected due to ${riskScore > 50 ? 'unfavorable' : 'marginal'} process conditions and operator experience level.`
    },
    recommendedActions: riskScore > 60 
      ? ['Adjust process parameters', 'Assign senior operator', 'Increase inspection frequency']
      : riskScore > 30
        ? ['Monitor closely', 'Review process settings']
        : ['Continue normal operations']
  };
}

// Mock root cause analysis
function mockRootCauseAnalysis(problemDescription: string): RootCauseAnalysis['analysis'] {
  const categories = ['man', 'machine', 'material', 'method', 'measurement', 'environment'] as const;
  
  // Extract keywords (simplified)
  const keywordMap: Record<string, string[]> = {
    'dimension': ['machine', 'method'],
    'scratch': ['material', 'machine'],
    'operator': ['man'],
    'temperature': ['environment', 'machine'],
    'pressure': ['machine', 'method'],
    'calibration': ['measurement', 'machine']
  };
  
  const relevantCategories = new Set<string>();
  Object.entries(keywordMap).forEach(([keyword, cats]) => {
    if (problemDescription.toLowerCase().includes(keyword)) {
      cats.forEach(c => relevantCategories.add(c));
    }
  });
  
  // Generate potential causes
  const potentialCauses = Array.from(relevantCategories).map(category => ({
    category: category as typeof categories[number],
    cause: generateMockCause(category),
    probability: 50 + Math.random() * 40,
    evidence: [
      'Historical data analysis',
      'Similar case patterns',
      'Process parameter correlation'
    ]
  }));
  
  // Sort by probability
  const sortedCauses = [...potentialCauses].sort((a, b) => b.probability - a.probability);
  
  return {
    potentialCauses: sortedCauses,
    topCause: sortedCauses[0]?.cause || 'Unknown - requires investigation',
    confidence: sortedCauses[0]?.probability || 50
  };
}

function generateMockCause(category: string): string {
  const causes: Record<string, string[]> = {
    man: ['Insufficient training', 'Operator fatigue', 'Lack of standard work instructions', 'High turnover'],
    machine: ['Equipment wear', 'Incorrect settings', 'Lack of preventive maintenance', 'Tool degradation'],
    material: ['Supplier quality variation', 'Improper storage', 'Mix-up in material grades', 'Contamination'],
    method: ['Process deviation', 'Missing work instruction step', 'Uncontrolled process change', 'Inadequate supervision'],
    measurement: ['Calibration expired', 'Measurement system error', 'Inspector bias', 'Inadequate gauge R&R'],
    environment: ['Temperature fluctuation', 'Humidity out of spec', 'Dust contamination', 'Lighting issues']
  };
  
  const categoryCauses = causes[category] || ['Unknown cause'];
  return categoryCauses[Math.floor(Math.random() * categoryCauses.length)];
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAIStore = create<AIState>()(
  immer(
    (set, get) => ({
      // Initial State
      models: [],
      activeModel: null,
      predictions: [],
      rootCauseAnalyses: [],
      capaRecommendations: [],
      trendForecasts: [],
      anomalyPatterns: [],
      insights: [],
      unacknowledgedInsights: 0,
      queryHistory: [],
      isProcessing: false,
      apiEndpoint: '',
      apiKey: undefined,

      // Model Actions
      registerModel: (model) => {
        const id = `model-${Date.now()}`;
        const newModel: AIModel = {
          ...model,
          id,
          status: 'training',
          lastTrained: new Date().toISOString()
        };
        set((state) => {
          state.models.push(newModel);
        });
        
        // Simulate training
        setTimeout(() => {
          set((state) => {
            const m = state.models.find((x: AIModel) => x.id === id);
            if (m) {
              m.status = 'ready';
              m.accuracy = 75 + Math.random() * 20;
              m.performance = {
                precision: 0.82 + Math.random() * 0.15,
                recall: 0.78 + Math.random() * 0.18,
                f1Score: 0.80 + Math.random() * 0.16,
                falsePositiveRate: 0.05 + Math.random() * 0.10
              };
            }
          });
          toast.success(`Model "${model.name}" training completed`);
        }, 3000);
      },

      updateModel: (id, updates) => {
        set((state) => {
          const model = state.models.find((m: AIModel) => m.id === id);
          if (model) {
            Object.assign(model, updates);
          }
        });
      },

      trainModel: async (id, trainingData) => {
        set((state) => {
          const model = state.models.find((m: AIModel) => m.id === id);
          if (model) {
            model.status = 'training';
            model.trainingDataSize = trainingData.length;
          }
        });
        
        // Simulate training time based on data size
        const trainingTime = Math.min(5000, trainingData.length * 10);
        await new Promise(resolve => setTimeout(resolve, trainingTime));
        
        set((state) => {
          const model = state.models.find((m: AIModel) => m.id === id);
          if (model) {
            model.status = 'ready';
            model.lastTrained = new Date().toISOString();
            model.accuracy = 70 + Math.random() * 25;
          }
        });
        
        toast.success('Model training completed');
      },

      deployModel: (id) => {
        set((state) => {
          const model = state.models.find((m: AIModel) => m.id === id);
          if (model && model.status === 'ready') {
            model.status = 'deployed';
            model.isActive = true;
          }
        });
        toast.success('Model deployed successfully');
      },

      disableModel: (id) => {
        set((state) => {
          const model = state.models.find((m: AIModel) => m.id === id);
          if (model) {
            model.isActive = false;
            model.status = 'disabled';
          }
        });
      },

      // Prediction Actions
      makePrediction: async (modelId, input) => {
        set((state) => { state.isProcessing = true; });
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const model = get().models.find((m: AIModel) => m.id === modelId);
        let result: PredictionResult;
        
        switch (model?.type) {
          case 'defect-prediction':
            result = mockDefectPrediction(input);
            break;
          default:
            result = {
              id: `pred-${Date.now()}`,
              modelId,
              timestamp: new Date().toISOString(),
              input,
              prediction: 'unknown',
              confidence: 50,
              explanation: {
                featureImportance: {},
                topFeatures: [],
                reasoning: 'Model not yet trained with sufficient data'
              }
            };
        }
        
        set((state) => {
          state.predictions.unshift(result);
          state.isProcessing = false;
        });
        
        return result;
      },

      batchPredict: async (modelId, inputs) => {
        const results: PredictionResult[] = [];
        for (const input of inputs) {
          const result = await get().makePrediction(modelId, input);
          results.push(result);
        }
        return results;
      },

      // Analysis Actions
      analyzeRootCause: async (ncrId, problemDescription) => {
        set((state) => { state.isProcessing = true; });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const analysis = mockRootCauseAnalysis(problemDescription);
        
        const rca: RootCauseAnalysis = {
          id: `rca-${Date.now()}`,
          ncrId,
          timestamp: new Date().toISOString(),
          problemDescription,
          analysis,
          recommendedActions: analysis.potentialCauses.slice(0, 2).map((cause, i) => ({
            action: `Address ${cause.category} issue: ${cause.cause}`,
            priority: i === 0 ? 'high' : 'medium',
            expectedImpact: 'Reduce defect rate by 40-60%',
            estimatedCost: i === 0 ? '$5,000-10,000' : '$2,000-5,000',
            timeline: i === 0 ? '2-4 weeks' : '1-2 weeks'
          })),
          historicalSimilarCases: [],
          aiReasoning: `Analysis based on ${analysis.potentialCauses.length} potential causes identified from historical patterns and process correlations.`
        };
        
        set((state) => {
          state.rootCauseAnalyses.unshift(rca);
          state.isProcessing = false;
        });
        
        return rca;
      },

      recommendCAPA: async (ncrId, rootCause) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const recommendation: CAPARecommendation = {
          id: `capa-rec-${Date.now()}`,
          sourceNCRId: ncrId,
          timestamp: new Date().toISOString(),
          problemType: rootCause.split(':')[0] || 'Process Issue',
          rootCause,
          recommendations: {
            corrective: [
              {
                action: `Immediate containment: Quarantine affected product batch`,
                responsible: 'Quality Inspector',
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                verificationMethod: '100% inspection of quarantined batch',
                confidence: 95
              },
              {
                action: `Correct the identified ${rootCause}`,
                responsible: 'Process Engineer',
                dueDate: new Date(Date.now() + 604800000).toISOString(),
                verificationMethod: 'Process audit and measurement study',
                confidence: 85
              }
            ],
            preventive: [
              {
                action: 'Implement statistical process control (SPC) monitoring',
                responsible: 'Quality Manager',
                dueDate: new Date(Date.now() + 2592000000).toISOString(),
                riskReduction: 70,
                confidence: 90
              },
              {
                action: 'Enhance operator training program',
                responsible: 'HR & Production Manager',
                dueDate: new Date(Date.now() + 5184000000).toISOString(),
                riskReduction: 40,
                confidence: 80
              }
            ]
          },
          effectivenessPrediction: {
            probability: 88,
            timeline: '3-6 months for full effectiveness',
            expectedOutcome: 'Pending validation against real records'
          },
          similarSuccessfulCAPAs: []
        };
        
        set((state) => {
          state.capaRecommendations.unshift(recommendation);
        });
        
        return recommendation;
      },

      forecastTrend: async (metric, _months) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const historicalData: TrendForecast['historicalData'] = [];
        const forecast: TrendForecast['forecast'] = [];
        const trend = 'stable';
        
        const trendForecast: TrendForecast = {
          id: `forecast-${Date.now()}`,
          metric,
          timestamp: new Date().toISOString(),
          historicalData,
          forecast,
          insights: [`No historical ${metric} records are available yet.`],
          risks: [],
          recommendations: [],
          seasonalityDetected: false,
          trendDirection: trend
        };
        
        set((state) => {
          state.trendForecasts.unshift(trendForecast);
        });
        
        return trendForecast;
      },

      // Pattern Actions
      createPattern: (pattern) => {
        const id = `pattern-${Date.now()}`;
        set((state) => {
          state.anomalyPatterns.push({
            ...pattern,
            id,
            detectionCount: 0,
            lastDetected: new Date().toISOString()
          });
        });
      },

      updatePattern: (id, updates) => {
        set((state) => {
          const pattern = state.anomalyPatterns.find((p: AnomalyPattern) => p.id === id);
          if (pattern) {
            Object.assign(pattern, updates);
          }
        });
      },

      deletePattern: (id) => {
        set((state) => {
          state.anomalyPatterns = state.anomalyPatterns.filter((p: AnomalyPattern) => p.id !== id);
        });
      },

      detectPatterns: (data) => {
        const detected: AnomalyPattern[] = [];
        const patterns = get().anomalyPatterns.filter((p: AnomalyPattern) => p.isActive);
        
        patterns.forEach(pattern => {
          // Simple pattern matching logic
          const matches = data.some((item) => {
            const record = item as Record<string, unknown>;
            return pattern.pattern.conditions.every(condition => {
              const value = record[condition.feature];
              switch (condition.operator) {
                case '>': return (value as number) > (condition.value as number);
                case '<': return (value as number) < (condition.value as number);
                case '=': return value === condition.value;
                case '!=': return value !== condition.value;
                case 'in': return (condition.value as unknown[]).includes(value);
                case 'not_in': return !(condition.value as unknown[]).includes(value);
                default: return false;
              }
            });
          });
          
          if (matches) {
            detected.push(pattern);
            set((state) => {
              const p = state.anomalyPatterns.find((x: AnomalyPattern) => x.id === pattern.id);
              if (p) {
                p.detectionCount++;
                p.lastDetected = new Date().toISOString();
              }
            });
          }
        });
        
        return detected;
      },

      // Insight Actions
      generateInsights: () => {
        set((state) => {
          state.unacknowledgedInsights = state.insights.filter((insight) => !insight.acknowledged).length;
        });
      },

      acknowledgeInsight: (id, userId) => {
        set((state) => {
          const insight = state.insights.find((i: AIInsight) => i.id === id);
          if (insight && !insight.acknowledged) {
            insight.acknowledged = true;
            insight.acknowledgedBy = userId;
            insight.acknowledgedAt = new Date().toISOString();
            state.unacknowledgedInsights--;
          }
        });
      },

      // NLP Actions
      processQuery: async (query) => {
        set((state) => { state.isProcessing = true; });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple intent recognition
        const intents: Record<string, string> = {
          'show': 'visualization',
          'what is': 'information',
          'how many': 'aggregation',
          'compare': 'comparison',
          'trend': 'trend',
          'predict': 'prediction'
        };
        
        const detectedIntent = Object.entries(intents).find(([key]) => 
          query.toLowerCase().includes(key)
        )?.[1] || 'unknown';
        
        const entities: NLQueryResult['entities'] = [
          { type: 'metric', value: 'defect-rate', confidence: 0.85 },
          { type: 'timeframe', value: 'last-30-days', confidence: 0.90 }
        ];
        
        const result: NLQueryResult = {
          id: `query-${Date.now()}`,
          query,
          timestamp: new Date().toISOString(),
          intent: detectedIntent,
          entities,
          sql: `SELECT * FROM ncr WHERE created_at >= NOW() - INTERVAL '30 days'`,
          summary: 'No records are available yet for this query. Add real quality data to enable analysis.',
          visualization: 'chart',
          followUpQuestions: [
            'Show me the top 3 defect types',
            'What is the root cause analysis for these NCRs?',
            'Compare with previous quarter'
          ]
        };
        
        set((state) => {
          state.queryHistory.unshift(result);
          state.isProcessing = false;
        });
        
        return result;
      },

      // Utility Actions
      exportModel: (id) => {
        const model = get().models.find((m: AIModel) => m.id === id);
        return JSON.stringify(model, null, 2);
      },

      importModel: (json) => {
        try {
          const model = JSON.parse(json) as AIModel;
          model.id = `model-imported-${Date.now()}`;
          model.status = 'ready';
          set((state) => {
            state.models.push(model);
          });
          toast.success('Model imported successfully');
        } catch (e) {
          toast.error('Failed to import model');
        }
      },

      getModelPerformance: (id) => {
        const model = get().models.find((m: AIModel) => m.id === id);
        return model?.performance || null;
      }
    })
  )
);

// ============================================================================
// HOOKS FOR REACT COMPONENTS
// ============================================================================

export function useAIModels(type?: ModelType) {
  return useAIStore(state => 
    type 
      ? state.models.filter((m: AIModel) => m.type === type)
      : state.models
  );
}

export function useActivePredictions(limit = 10) {
  return useAIStore(state => state.predictions.slice(0, limit));
}

export function useAIInsights(unacknowledgedOnly = false) {
  return useAIStore(state => 
    unacknowledgedOnly 
      ? state.insights.filter((i: AIInsight) => !i.acknowledged)
      : state.insights
  );
}

export function useAIProcessing() {
  return useAIStore(state => state.isProcessing);
}

export default useAIStore;
