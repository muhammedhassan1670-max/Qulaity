/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: data/sample-datasets.js
 * ============================================================================
 * Curated real-world benchmark datasets for 1-click platform exploration:
 * 1. Clinical Healthcare Trial & Biomarkers
 * 2. High-Velocity Financial Fraud & Risk
 * 3. Enterprise B2B SaaS Customer Churn
 * 4. Industrial IoT Turbomachine Telemetry
 * ============================================================================
 */

(function (root) {
    'use strict';

    const SampleDatasets = {
        /**
         * Metadata for sample datasets displayed in UI
         */
        catalog: [
            {
                id: 'clinical_trial',
                title: 'Clinical Trial & Biomarkers',
                category: 'Healthcare & Life Sciences',
                badge: 'Clinical / Biostatistics',
                badgeColor: '#ec4899',
                icon: 'fa-heart-pulse',
                filename: 'clinical_trial_telemetry.csv',
                description: 'Patient cohort telemetry tracking active therapeutic compound vs placebo, biomarker alpha concentrations, vitals, and therapeutic outcome response.',
                rowCount: 60,
                colCount: 9,
                targetCandidate: 'clinical_response',
                task: 'Classification & Biostatistics'
            },
            {
                id: 'financial_fraud',
                title: 'High-Velocity Fraud Audit',
                category: 'Financial Risk & Banking',
                badge: 'Risk / Anomaly',
                badgeColor: '#f59e0b',
                icon: 'fa-shield-halved',
                filename: 'financial_fraud_audit.csv',
                description: 'Global electronic banking transactions with velocity rate, merchant risk score, foreign exchange indicators, and anomalous transaction flags.',
                rowCount: 60,
                colCount: 9,
                targetCandidate: 'is_fraud',
                task: 'Anomaly Detection & Binary Classification'
            },
            {
                id: 'saas_churn',
                title: 'B2B SaaS Retention & Churn',
                category: 'Product & Customer Intelligence',
                badge: 'SaaS / Revenue',
                badgeColor: '#38bdf8',
                icon: 'fa-users-gear',
                filename: 'saas_customer_retention.csv',
                description: 'Account-level telemetry tracking Monthly Recurring Revenue (MRR), seat utilization, support ticket volume, Net Promoter Score (NPS), and churn status.',
                rowCount: 60,
                colCount: 8,
                targetCandidate: 'churned',
                task: 'Classification & Churn Prevention'
            },
            {
                id: 'iot_sensors',
                title: 'Turbomachine IoT Telemetry',
                category: 'Industry 4.0 & Sensor Grid',
                badge: 'IoT / Predictive Maintenance',
                badgeColor: '#10b981',
                icon: 'fa-bolt-lightning',
                filename: 'turbomachine_sensors.csv',
                description: 'High-frequency telemetry from industrial gas turbines measuring rotation RPM, bearing vibration velocity, thermal gradient, and predictive failure state.',
                rowCount: 60,
                colCount: 9,
                targetCandidate: 'fault_status',
                task: 'Multi-Class & Anomaly Detection'
            }
        ],

        /**
         * Get full dataset object by catalog ID
         * @param {string} id
         * @returns {{ filename: string, fileSize: number, fileType: string, columns: string[], rows: Object[] }}
         */
        getDataset(id) {
            switch (id) {
                case 'clinical_trial':
                    return this._buildClinicalDataset();
                case 'financial_fraud':
                    return this._buildFraudDataset();
                case 'saas_churn':
                    return this._buildSaaSDataset();
                case 'iot_sensors':
                    return this._buildIoTDataset();
                default:
                    return this._buildClinicalDataset();
            }
        },

        // --- 1. Clinical Healthcare Trial Dataset Generator ---
        _buildClinicalDataset() {
            const columns = [
                'patient_id', 'age', 'gender', 'treatment_group',
                'baseline_bp', 'glucose_mg_dl', 'biomarker_alpha',
                'adverse_events', 'clinical_response'
            ];
            const rows = [];
            const genders = ['Male', 'Female'];

            for (let i = 1; i <= 60; i++) {
                const isDrug = i % 2 === 1;
                const group = isDrug ? 'Active_Drug' : 'Placebo';
                const gender = genders[i % 2];
                const age = 30 + Math.floor(((i * 17) % 45));
                const baselineBp = 110 + Math.floor(((i * 23) % 40));
                const glucose = 85 + Math.floor(((i * 31) % 65));
                // Biomarker alpha higher in responding patients
                const biomarker = isDrug 
                    ? +(3.5 + ((i * 1.37) % 4.8)).toFixed(2) 
                    : +(1.1 + ((i * 0.93) % 2.5)).toFixed(2);
                const adverseEvents = (i % 7 === 0) ? 'Mild_Nausea' : (i % 13 === 0 ? 'Headache' : 'None');
                // Probability of response: 80% if drug, 25% if placebo
                const isResponse = isDrug ? (i % 5 !== 0) : (i % 4 === 0);
                const clinicalResponse = isResponse ? 'Positive' : 'No_Response';

                rows.push({
                    patient_id: `PT-${String(1000 + i)}`,
                    age,
                    gender,
                    treatment_group: group,
                    baseline_bp: baselineBp,
                    glucose_mg_dl: glucose,
                    biomarker_alpha: biomarker,
                    adverse_events: adverseEvents,
                    clinical_response: clinicalResponse
                });
            }

            const jsonStr = JSON.stringify(rows);
            return {
                filename: 'clinical_trial_telemetry.csv',
                fileSize: jsonStr.length,
                fileType: 'csv',
                columns,
                rows
            };
        },

        // --- 2. High-Velocity Financial Fraud Dataset Generator ---
        _buildFraudDataset() {
            const columns = [
                'tx_id', 'amount_usd', 'merchant_category', 'card_present',
                'is_foreign', 'velocity_1h', 'device_risk_score',
                'customer_age_days', 'is_fraud'
            ];
            const categories = ['Electronics', 'Grocery', 'Travel', 'Jewelry', 'Digital_Services', 'Fuel'];
            const rows = [];

            for (let i = 1; i <= 60; i++) {
                // Fraud spiked at specific indices
                const isFraudCase = (i === 7 || i === 18 || i === 29 || i === 42 || i === 53 || i === 59);
                const amount = isFraudCase 
                    ? +(1250 + ((i * 173) % 3800)).toFixed(2)
                    : +(15 + ((i * 37) % 280)).toFixed(2);
                const cat = isFraudCase 
                    ? (i % 2 === 0 ? 'Electronics' : 'Jewelry')
                    : categories[i % categories.length];
                const cardPresent = isFraudCase ? 'No' : (i % 3 === 0 ? 'No' : 'Yes');
                const isForeign = isFraudCase ? 'Yes' : (i % 5 === 0 ? 'Yes' : 'No');
                const velocity = isFraudCase ? (6 + (i % 7)) : (1 + (i % 3));
                const deviceRisk = isFraudCase ? +(0.78 + ((i * 0.03) % 0.21)).toFixed(3) : +(0.05 + ((i * 0.04) % 0.35)).toFixed(3);
                const custAgeDays = isFraudCase ? (2 + (i % 20)) : (120 + (i * 18));

                rows.push({
                    tx_id: `TX-${String(900000 + i)}`,
                    amount_usd: amount,
                    merchant_category: cat,
                    card_present: cardPresent,
                    is_foreign: isForeign,
                    velocity_1h: velocity,
                    device_risk_score: deviceRisk,
                    customer_age_days: custAgeDays,
                    is_fraud: isFraudCase ? 'Fraudulent' : 'Legitimate'
                });
            }

            const jsonStr = JSON.stringify(rows);
            return {
                filename: 'financial_fraud_audit.csv',
                fileSize: jsonStr.length,
                fileType: 'csv',
                columns,
                rows
            };
        },

        // --- 3. B2B SaaS Customer Churn Dataset Generator ---
        _buildSaaSDataset() {
            const columns = [
                'account_id', 'plan_tier', 'mrr_usd', 'tenure_months',
                'active_seats', 'support_tickets_30d', 'nps_score', 'churned'
            ];
            const tiers = ['Starter', 'Growth', 'Enterprise'];
            const rows = [];

            for (let i = 1; i <= 60; i++) {
                const tier = tiers[i % tiers.length];
                const tenure = 2 + ((i * 7) % 34);
                const mrr = tier === 'Enterprise' ? (2400 + (i * 35)) : (tier === 'Growth' ? (600 + (i * 15)) : 99);
                const seats = tier === 'Enterprise' ? (45 + (i % 50)) : (tier === 'Growth' ? (10 + (i % 15)) : (2 + (i % 4)));
                
                // Churn rule
                const isChurn = (i % 6 === 0 || (i % 7 === 0 && tenure < 6));
                const supportTickets = isChurn ? (4 + (i % 5)) : (i % 3);
                const nps = isChurn ? Math.max(1, 6 - (i % 4)) : Math.min(10, 7 + (i % 4));

                rows.push({
                    account_id: `ACC-${String(100 + i)}`,
                    plan_tier: tier,
                    mrr_usd: mrr,
                    tenure_months: tenure,
                    active_seats: seats,
                    support_tickets_30d: supportTickets,
                    nps_score: nps,
                    churned: isChurn ? 'Churned' : 'Retained'
                });
            }

            const jsonStr = JSON.stringify(rows);
            return {
                filename: 'saas_customer_retention.csv',
                fileSize: jsonStr.length,
                fileType: 'csv',
                columns,
                rows
            };
        },

        // --- 4. Industrial IoT Turbomachine Telemetry Dataset Generator ---
        _buildIoTDataset() {
            const columns = [
                'reading_id', 'timestamp', 'machine_id', 'rpm',
                'vibration_mm_s', 'bearing_temp_c', 'oil_pressure_bar',
                'power_kw', 'fault_status'
            ];
            const rows = [];

            for (let i = 1; i <= 60; i++) {
                const baseTime = new Date('2026-09-01T08:00:00Z').getTime();
                const timeStr = new Date(baseTime + (i * 300000)).toISOString().replace('.000Z', 'Z');
                const machineId = (i % 2 === 0) ? 'TURBINE-01' : 'TURBINE-02';
                
                // Status progression
                let faultStatus = 'NORMAL';
                let vib = +(1.8 + ((i * 0.11) % 1.5)).toFixed(2);
                let temp = +(68.0 + ((i * 0.35) % 8.0)).toFixed(1);

                if (i >= 48 && i <= 55) {
                    faultStatus = 'WARNING';
                    vib = +(4.2 + ((i * 0.18) % 1.2)).toFixed(2);
                    temp = +(82.0 + ((i * 0.45) % 6.0)).toFixed(1);
                } else if (i > 55) {
                    faultStatus = 'CRITICAL';
                    vib = +(6.8 + ((i * 0.25) % 1.8)).toFixed(2);
                    temp = +(94.0 + ((i * 0.6) % 8.0)).toFixed(1);
                }

                const rpm = 3600 + Math.floor(((i * 19) % 80) - 40);
                const pressure = +(4.2 - ((vib * 0.15))).toFixed(2);
                const power = +(850.0 + ((rpm - 3600) * 1.5) + (vib * 8)).toFixed(1);

                rows.push({
                    reading_id: `RD-${String(10000 + i)}`,
                    timestamp: timeStr,
                    machine_id: machineId,
                    rpm,
                    vibration_mm_s: vib,
                    bearing_temp_c: temp,
                    oil_pressure_bar: pressure,
                    power_kw: power,
                    fault_status: faultStatus
                });
            }

            const jsonStr = JSON.stringify(rows);
            return {
                filename: 'turbomachine_sensors.csv',
                fileSize: jsonStr.length,
                fileType: 'csv',
                columns,
                rows
            };
        }
    };

    root.UDIP = root.UDIP || {};
    root.UDIP.SampleDatasets = SampleDatasets;

})(typeof window !== 'undefined' ? window : global);
