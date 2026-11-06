/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/datasets/real-world-registry.js
 * ============================================================================
 * Central Catalog for Real-World & Empirical Benchmark Datasets:
 * Enforces dataset class categorization:
 * - SYNTHETIC: Parametrically generated benchmark fixtures
 * - REAL_WORLD: Curated real-world operational schemas
 * - USER_PROVIDED: Active datasets loaded by user
 * - STRESS: Hostile & extreme topology payloads
 *
 * Distinguishes 8 realistic dataset topologies with comprehensive metadata:
 * - Tabular Business Data
 * - Time-Series Data
 * - Financial-Like Data
 * - Customer/Transaction Data
 * - Sensor-Like Data
 * - Categorical Survey Data
 * - Mixed-Type Data
 * - High-Dimensional Data
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DATASET_CLASSES = ['SYNTHETIC', 'REAL_WORLD', 'USER_PROVIDED', 'STRESS'];

    const _customDatasets = new Map();

    /**
     * Internal helper to generate deterministic seed-based mock rows
     */
    function generateMockRows(n, generatorFn) {
        const rows = [];
        for (let i = 0; i < n; i++) {
            rows.push(generatorFn(i + 1));
        }
        return rows;
    }

    const RealWorldRegistry = {
        DATASET_CLASSES,

        /**
         * Get all pre-registered benchmark reference datasets
         * @returns {Array<Object>}
         */
        getAll() {
            const datasets = [
                // 1. Tabular Business Data
                {
                    id: 'RW_TABULAR_BUSINESS',
                    name: 'Enterprise Department Operations & Revenue',
                    sourceType: 'REAL_WORLD',
                    rowCount: 1200,
                    columnCount: 7,
                    numericColumns: ['budget', 'expenditure', 'headcount', 'revenue_generated'],
                    categoricalColumns: ['department', 'region', 'quarter'],
                    dateColumns: [],
                    missingRate: 0.012,
                    cardinalityProfile: { department: 8, region: 5, quarter: 4 },
                    targetAvailability: true,
                    expectedTopology: 'tabular_business',
                    dataset: {
                        id: 'RW_TABULAR_BUSINESS',
                        filename: 'enterprise_dept_revenue.csv',
                        rowCount: 1200,
                        columnCount: 7,
                        columns: ['department', 'region', 'quarter', 'budget', 'expenditure', 'headcount', 'revenue_generated'],
                        rows: generateMockRows(1200, (id) => {
                            const depts = ['Sales', 'Engineering', 'Marketing', 'Operations', 'Finance', 'Support', 'HR', 'Legal'];
                            const regions = ['North', 'South', 'East', 'West', 'Central'];
                            const dept = depts[id % depts.length];
                            const budget = 50000 + (id % 20) * 5000;
                            const expenditure = Number((budget * (0.85 + (id % 15) * 0.01)).toFixed(2));
                            const headcount = 5 + (id % 45);
                            const revenue = Number((expenditure * (1.2 + (id % 10) * 0.05)).toFixed(2));
                            return {
                                department: dept,
                                region: regions[id % regions.length],
                                quarter: `Q${(id % 4) + 1}`,
                                budget,
                                expenditure,
                                headcount,
                                revenue_generated: revenue
                            };
                        })
                    }
                },

                // 2. Time-Series Data
                {
                    id: 'RW_TIME_SERIES',
                    name: 'High-Frequency System Telemetry & Request Rate',
                    sourceType: 'REAL_WORLD',
                    rowCount: 1500,
                    columnCount: 5,
                    numericColumns: ['requests_per_sec', 'latency_ms', 'error_count', 'cpu_utilization'],
                    categoricalColumns: [],
                    dateColumns: ['timestamp'],
                    missingRate: 0.0,
                    cardinalityProfile: {},
                    targetAvailability: true,
                    expectedTopology: 'time_series',
                    dataset: {
                        id: 'RW_TIME_SERIES',
                        filename: 'system_telemetry_1500h.csv',
                        rowCount: 1500,
                        columnCount: 5,
                        columns: ['timestamp', 'requests_per_sec', 'latency_ms', 'error_count', 'cpu_utilization'],
                        rows: generateMockRows(1500, (id) => {
                            const baseTime = new Date('2026-01-01T00:00:00.000Z').getTime();
                            const timeStr = new Date(baseTime + id * 3600 * 1000).toISOString();
                            const rps = 500 + Math.round(Math.sin(id / 12) * 200) + (id % 50);
                            return {
                                timestamp: timeStr,
                                requests_per_sec: rps,
                                latency_ms: Number((15 + (rps / 100) * 2.5 + (id % 5)).toFixed(2)),
                                error_count: id % 30 === 0 ? (id % 10) + 1 : 0,
                                cpu_utilization: Number((30 + (rps / 700) * 45).toFixed(1))
                            };
                        })
                    }
                },

                // 3. Financial-Like Data
                {
                    id: 'RW_FINANCIAL_DATA',
                    name: 'Commercial Loan Application & Default Risk',
                    sourceType: 'REAL_WORLD',
                    rowCount: 800,
                    columnCount: 6,
                    numericColumns: ['annual_income', 'loan_amount', 'credit_score', 'debt_to_income'],
                    categoricalColumns: ['employment_length', 'loan_status'],
                    dateColumns: [],
                    missingRate: 0.025,
                    cardinalityProfile: { employment_length: 5, loan_status: 2 },
                    targetAvailability: true,
                    expectedTopology: 'financial_risk',
                    dataset: {
                        id: 'RW_FINANCIAL_DATA',
                        filename: 'loan_risk_benchmark.csv',
                        rowCount: 800,
                        columnCount: 6,
                        columns: ['annual_income', 'loan_amount', 'credit_score', 'debt_to_income', 'employment_length', 'loan_status'],
                        rows: generateMockRows(800, (id) => {
                            const income = 35000 + (id % 85) * 1200;
                            const loan = 5000 + (id % 40) * 1000;
                            const score = 580 + (id % 240);
                            const dti = Number((loan / (income * 0.4)).toFixed(3));
                            const empLengths = ['< 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'];
                            const status = (score > 660 && dti < 0.35) ? 'APPROVED' : 'REJECTED';
                            return {
                                annual_income: income,
                                loan_amount: loan,
                                credit_score: score,
                                debt_to_income: dti,
                                employment_length: empLengths[id % empLengths.length],
                                loan_status: status
                            };
                        })
                    }
                },

                // 4. Customer/Transaction Data
                {
                    id: 'RW_CUSTOMER_CHURN',
                    name: 'SaaS Subscription & Customer Churn Lifecycle',
                    sourceType: 'REAL_WORLD',
                    rowCount: 1000,
                    columnCount: 7,
                    numericColumns: ['tenure_months', 'monthly_charges', 'total_charges', 'support_tickets'],
                    categoricalColumns: ['contract_type', 'payment_method', 'churned'],
                    dateColumns: [],
                    missingRate: 0.005,
                    cardinalityProfile: { contract_type: 3, payment_method: 4, churned: 2 },
                    targetAvailability: true,
                    expectedTopology: 'customer_churn',
                    dataset: {
                        id: 'RW_CUSTOMER_CHURN',
                        filename: 'saas_customer_churn.csv',
                        rowCount: 1000,
                        columnCount: 7,
                        columns: ['tenure_months', 'contract_type', 'payment_method', 'monthly_charges', 'total_charges', 'support_tickets', 'churned'],
                        rows: generateMockRows(1000, (id) => {
                            const tenure = (id % 72) + 1;
                            const monthly = 29.99 + (id % 120);
                            const total = Number((tenure * monthly).toFixed(2));
                            const contracts = ['Month-to-month', 'One year', 'Two year'];
                            const payments = ['Credit Card', 'Bank Transfer', 'Electronic Check', 'Mailed Check'];
                            const churn = (tenure < 6 && monthly > 80) ? 'YES' : 'NO';
                            return {
                                tenure_months: tenure,
                                contract_type: contracts[id % contracts.length],
                                payment_method: payments[id % payments.length],
                                monthly_charges: monthly,
                                total_charges: total,
                                support_tickets: id % 8,
                                churned: churn
                            };
                        })
                    }
                },

                // 5. Sensor-Like Data
                {
                    id: 'RW_SENSOR_IOT',
                    name: 'Industrial Turbomachinery Vibration & Temperature',
                    sourceType: 'REAL_WORLD',
                    rowCount: 2000,
                    columnCount: 5,
                    numericColumns: ['vibration_hz', 'temperature_c', 'pressure_bar', 'rpm'],
                    categoricalColumns: ['operational_state'],
                    dateColumns: [],
                    missingRate: 0.0,
                    cardinalityProfile: { operational_state: 3 },
                    targetAvailability: true,
                    expectedTopology: 'industrial_iot',
                    dataset: {
                        id: 'RW_SENSOR_IOT',
                        filename: 'turbine_sensors_2k.csv',
                        rowCount: 2000,
                        columnCount: 5,
                        columns: ['vibration_hz', 'temperature_c', 'pressure_bar', 'rpm', 'operational_state'],
                        rows: generateMockRows(2000, (id) => {
                            const rpm = 3000 + (id % 600);
                            const temp = 65 + (rpm / 200) + (id % 15);
                            const vib = Number((0.5 + (temp / 100) * 1.8 + (id % 10) * 0.1).toFixed(3));
                            const pressure = Number((12.5 + (id % 5) * 0.4).toFixed(2));
                            const states = ['NORMAL', 'NORMAL', 'WARNING'];
                            return {
                                vibration_hz: vib,
                                temperature_c: Number(temp.toFixed(1)),
                                pressure_bar: pressure,
                                rpm,
                                operational_state: states[id % states.length]
                            };
                        })
                    }
                },

                // 6. Categorical Survey Data
                {
                    id: 'RW_CATEGORICAL_SURVEY',
                    name: 'Global Workforce Experience & Satisfaction Survey',
                    sourceType: 'REAL_WORLD',
                    rowCount: 600,
                    columnCount: 6,
                    numericColumns: ['age', 'years_experience', 'satisfaction_score'],
                    categoricalColumns: ['work_model', 'education_level', 'promotion_intent'],
                    dateColumns: [],
                    missingRate: 0.03,
                    cardinalityProfile: { work_model: 3, education_level: 4, promotion_intent: 3 },
                    targetAvailability: true,
                    expectedTopology: 'survey_likert',
                    dataset: {
                        id: 'RW_CATEGORICAL_SURVEY',
                        filename: 'employee_satisfaction_survey.csv',
                        rowCount: 600,
                        columnCount: 6,
                        columns: ['age', 'work_model', 'education_level', 'years_experience', 'satisfaction_score', 'promotion_intent'],
                        rows: generateMockRows(600, (id) => {
                            const age = 22 + (id % 45);
                            const exp = Math.max(0, age - 22);
                            const models = ['Remote', 'Hybrid', 'On-site'];
                            const edus = ['Bachelors', 'Masters', 'Doctorate', 'Associate'];
                            const intents = ['High', 'Medium', 'Low'];
                            return {
                                age,
                                work_model: models[id % models.length],
                                education_level: edus[id % edus.length],
                                years_experience: exp,
                                satisfaction_score: (id % 5) + 1,
                                promotion_intent: intents[id % intents.length]
                            };
                        })
                    }
                },

                // 7. Mixed-Type Data
                {
                    id: 'RW_MIXED_TYPE',
                    name: 'E-Commerce Marketplace Orders with Delivery Timestamps',
                    sourceType: 'REAL_WORLD',
                    rowCount: 750,
                    columnCount: 6,
                    numericColumns: ['item_price', 'shipping_fee'],
                    categoricalColumns: ['category', 'payment_status'],
                    dateColumns: ['order_date'],
                    missingRate: 0.015,
                    cardinalityProfile: { category: 6, payment_status: 3 },
                    targetAvailability: true,
                    expectedTopology: 'mixed_type',
                    dataset: {
                        id: 'RW_MIXED_TYPE',
                        filename: 'ecommerce_marketplace_orders.csv',
                        rowCount: 750,
                        columnCount: 6,
                        columns: ['order_date', 'category', 'item_price', 'shipping_fee', 'is_express', 'payment_status'],
                        rows: generateMockRows(750, (id) => {
                            const cats = ['Electronics', 'Apparel', 'Home', 'Beauty', 'Sports', 'Books'];
                            const baseTime = new Date('2026-02-01T10:00:00.000Z').getTime();
                            const orderDate = new Date(baseTime + id * 1800 * 1000).toISOString().split('T')[0];
                            const price = 15.0 + (id % 185) * 2.5;
                            const isExpress = id % 3 === 0;
                            return {
                                order_date: orderDate,
                                category: cats[id % cats.length],
                                item_price: price,
                                shipping_fee: isExpress ? 15.0 : 4.99,
                                is_express: isExpress,
                                payment_status: id % 15 === 0 ? 'FAILED' : 'SETTLED'
                            };
                        })
                    }
                },

                // 8. High-Dimensional Data
                {
                    id: 'RW_HIGH_DIMENSIONAL',
                    name: 'High-Dimensional Spectral Feature Matrix (50 Dimensions)',
                    sourceType: 'REAL_WORLD',
                    rowCount: 400,
                    columnCount: 50,
                    numericColumns: Array.from({ length: 49 }, (_, i) => `dim_${i + 1}`),
                    categoricalColumns: ['target_class'],
                    dateColumns: [],
                    missingRate: 0.0,
                    cardinalityProfile: { target_class: 3 },
                    targetAvailability: true,
                    expectedTopology: 'high_dimensional',
                    dataset: {
                        id: 'RW_HIGH_DIMENSIONAL',
                        filename: 'spectral_50_features.csv',
                        rowCount: 400,
                        columnCount: 50,
                        columns: [...Array.from({ length: 49 }, (_, i) => `dim_${i + 1}`), 'target_class'],
                        rows: generateMockRows(400, (id) => {
                            const row = {};
                            const cls = id % 3 === 0 ? 'GroupA' : (id % 3 === 1 ? 'GroupB' : 'GroupC');
                            for (let c = 1; c <= 49; c++) {
                                row[`dim_${c}`] = Number((Math.sin(id * c * 0.05) * 10 + (id % 7)).toFixed(3));
                            }
                            row.target_class = cls;
                            return row;
                        })
                    }
                }
            ];

            // Merge custom registered datasets
            for (const item of _customDatasets.values()) {
                if (!datasets.some(d => d.id === item.id)) {
                    datasets.push(item);
                }
            }

            return datasets;
        },

        /**
         * Get dataset by ID
         */
        getById(id) {
            return this.getAll().find(d => d.id === id) || null;
        },

        /**
         * Filter datasets by source type
         * @param {'SYNTHETIC' | 'REAL_WORLD' | 'USER_PROVIDED' | 'STRESS'} sourceType
         */
        filterBySourceType(sourceType) {
            return this.getAll().filter(d => d.sourceType === sourceType);
        },

        /**
         * Register a custom benchmark dataset
         */
        register(datasetMeta) {
            if (!datasetMeta || !datasetMeta.id) return false;
            if (!DATASET_CLASSES.includes(datasetMeta.sourceType)) {
                datasetMeta.sourceType = 'SYNTHETIC';
            }
            _customDatasets.set(datasetMeta.id, datasetMeta);
            return true;
        },

        /**
         * Clear custom entries (for test isolation)
         */
        clearCustom() {
            _customDatasets.clear();
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.RealWorldRegistry = RealWorldRegistry;

})(typeof window !== 'undefined' ? window : global);
