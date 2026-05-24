/**
 * QMS Enterprise 4.0 - IoT Real-Time Service
 * Professional Quality 4.0 Architecture
 * 
 * Features:
 * - WebSocket/MQTT connection management
 * - Real-time sensor data streaming
 * - Anomaly detection & alerts
 * - SPC (Statistical Process Control) integration
 * - Digital Twin data sync
 * - Historical data storage
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';

// ============================================================================
// TYPES - IoT System
// ============================================================================

export type SensorType = 
  | 'temperature' 
  | 'pressure' 
  | 'humidity' 
  | 'vibration' 
  | 'flow'
  | 'level'
  | 'ph'
  | 'conductivity'
  | 'turbidity'
  | 'weight'
  | 'dimension'
  | 'vision'
  | 'counter';

export type SensorStatus = 'online' | 'offline' | 'warning' | 'error' | 'calibrating';

export interface SensorConfig {
  id: string;
  name: string;
  type: SensorType;
  unit: string;
  location: {
    plantId: string;
    departmentId: string;
    stationId: string;
    coordinates?: { x: number; y: number; z?: number };
  };
  connection: {
    protocol: 'websocket' | 'mqtt' | 'http' | 'opcua' | 'modbus';
    endpoint: string;
    topic?: string;
    pollingInterval?: number; // ms for HTTP polling
  };
  thresholds: {
    criticalMin?: number;
    warningMin?: number;
    target: number;
    warningMax?: number;
    criticalMax?: number;
  };
  spcConfig?: {
    enabled: boolean;
    sampleSize: number;
    controlLimits: {
      ucl: number; // Upper Control Limit
      lcl: number; // Lower Control Limit
      usl?: number; // Upper Specification Limit
      lsl?: number; // Lower Specification Limit
    };
    rules: ('rule1' | 'rule2' | 'rule3' | 'rule4' | 'rule5' | 'rule6' | 'rule7' | 'rule8')[];
    // Western Electric Rules
    // rule1: 1 point beyond 3σ
    // rule2: 9 points same side of center
    // rule3: 6 points trending up/down
    // rule4: 14 points alternating up/down
    // rule5: 2 of 3 points beyond 2σ
    // rule6: 4 of 5 points beyond 1σ
    // rule7: 15 points within 1σ
    // rule8: 8 points beyond 1σ (both sides)
  };
  calibration: {
    lastCalibrated: string;
    nextCalibration: string;
    calibrationCertificate?: string;
    offset: number;
    gain: number;
  };
  status: SensorStatus;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface SensorReading {
  sensorId: string;
  timestamp: string;
  value: number;
  rawValue: number;
  unit: string;
  quality: 'good' | 'bad' | 'uncertain';
  status: SensorStatus;
  anomaly?: {
    detected: boolean;
    type: 'threshold' | 'spc' | 'ml';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    rule?: string;
  };
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'gateway' | 'plc' | 'edge' | 'camera';
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmware: string;
  sensors: string[]; // Sensor IDs
  location: {
    plantId: string;
    departmentId: string;
    stationId: string;
  };
  network: {
    ip?: string;
    mac?: string;
    protocol: 'ethernet' | 'wifi' | 'cellular' | 'lora' | 'zigbee';
    connected: boolean;
    lastSeen: string;
    latency?: number;
  };
  status: 'online' | 'offline' | 'maintenance';
  isActive: boolean;
}

export interface SPCDataPoint {
  sensorId: string;
  timestamp: string;
  value: number;
  sampleSize: number;
  mean: number;
  range?: number;
  stdDev?: number;
  ucl: number;
  lcl: number;
  usl?: number;
  lsl?: number;
  cp?: number; // Process capability
  cpk?: number; // Process capability index
  violations: string[];
}

export interface AnomalyEvent {
  id: string;
  sensorId: string;
  timestamp: string;
  type: 'threshold' | 'spc' | 'ml';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  expectedRange?: { min: number; max: number };
  rule?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  autoResponse?: {
    action: 'alert' | 'stop' | 'adjust' | 'notify';
    executed: boolean;
    result?: string;
  };
}

export interface RealTimeMetrics {
  totalSensors: number;
  onlineSensors: number;
  activeAlerts: number;
  dataPointsPerMinute: number;
  averageLatency: number;
  anomalyRate: number; // per hour
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface IoTState {
  // Devices & Sensors
  devices: IoTDevice[];
  sensors: SensorConfig[];
  
  // Real-time Data
  readings: Map<string, SensorReading>; // Latest reading per sensor
  readingHistory: Map<string, SensorReading[]>; // Last 1000 readings per sensor
  
  // SPC Data
  spcData: Map<string, SPCDataPoint[]>; // SPC calculations per sensor
  
  // Anomalies
  anomalies: AnomalyEvent[];
  unacknowledgedCount: number;
  
  // Connection State
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnectionTime: string | null;
  reconnectAttempts: number;
  
  // Metrics
  metrics: RealTimeMetrics;
  
  // WebSocket Reference (not persisted)
  wsConnection: WebSocket | null;
  
  // Actions - Connection
  connect: (endpoint: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Actions - Sensors
  registerSensor: (sensor: Omit<SensorConfig, 'id' | 'status'>) => void;
  updateSensor: (id: string, updates: Partial<SensorConfig>) => void;
  removeSensor: (id: string) => void;
  calibrateSensor: (id: string, offset: number, gain: number) => void;
  
  // Actions - Devices
  registerDevice: (device: Omit<IoTDevice, 'id' | 'status'>) => void;
  updateDevice: (id: string, updates: Partial<IoTDevice>) => void;
  removeDevice: (id: string) => void;
  
  // Actions - Data
  processReading: (reading: Omit<SensorReading, 'anomaly'>) => void;
  batchProcessReadings: (readings: Omit<SensorReading, 'anomaly'>[]) => void;
  
  // Actions - SPC
  calculateSPC: (sensorId: string, readings: SensorReading[]) => SPCDataPoint | null;
  
  // Actions - Anomalies
  acknowledgeAnomaly: (id: string, userId: string) => void;
  clearAnomalies: () => void;
  
  // Actions - Utility
  getSensorReadings: (sensorId: string, limit?: number) => SensorReading[];
  getActiveAnomalies: () => AnomalyEvent[];
  exportData: (sensorIds: string[], startTime: string, endTime: string) => string;
}

// ============================================================================
// SPC CALCULATION UTILITIES
// ============================================================================

function calculateMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateRange(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function calculateCp(usl: number, lsl: number, stdDev: number): number {
  return (usl - lsl) / (6 * stdDev);
}

function calculateCpk(usl: number, lsl: number, mean: number, stdDev: number): number {
  const cpu = (usl - mean) / (3 * stdDev);
  const cpl = (mean - lsl) / (3 * stdDev);
  return Math.min(cpu, cpl);
}

// Western Electric SPC Rules
function checkSPCRules(
  values: number[],
  mean: number,
  stdDev: number,
  rules: string[]
): string[] {
  const violations: string[] = [];
  
  // Rule 1: 1 point beyond 3σ
  if (rules.includes('rule1')) {
    const lastValue = values[values.length - 1];
    if (Math.abs(lastValue - mean) > 3 * stdDev) {
      violations.push('rule1');
    }
  }
  
  // Rule 2: 9 points same side of center
  if (rules.includes('rule2') && values.length >= 9) {
    const last9 = values.slice(-9);
    const allAbove = last9.every(v => v > mean);
    const allBelow = last9.every(v => v < mean);
    if (allAbove || allBelow) {
      violations.push('rule2');
    }
  }
  
  // Rule 3: 6 points trending up/down
  if (rules.includes('rule3') && values.length >= 6) {
    const last6 = values.slice(-6);
    const trendingUp = last6.every((v, i) => i === 0 || v > last6[i - 1]);
    const trendingDown = last6.every((v, i) => i === 0 || v < last6[i - 1]);
    if (trendingUp || trendingDown) {
      violations.push('rule3');
    }
  }
  
  // Rule 5: 2 of 3 points beyond 2σ
  if (rules.includes('rule5') && values.length >= 3) {
    const last3 = values.slice(-3);
    const beyond2Sigma = last3.filter(v => Math.abs(v - mean) > 2 * stdDev).length;
    if (beyond2Sigma >= 2) {
      violations.push('rule5');
    }
  }
  
  return violations;
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

function detectAnomaly(
  reading: SensorReading,
  sensor: SensorConfig,
  recentReadings: SensorReading[]
): SensorReading['anomaly'] | undefined {
  const { thresholds, spcConfig } = sensor;
  const { value } = reading;
  
  // Check threshold violations
  if (thresholds.criticalMax !== undefined && value > thresholds.criticalMax) {
    return {
      detected: true,
      type: 'threshold',
      severity: 'critical',
      message: `Critical: Value ${value.toFixed(2)} exceeds maximum threshold ${thresholds.criticalMax}`
    };
  }
  
  if (thresholds.criticalMin !== undefined && value < thresholds.criticalMin) {
    return {
      detected: true,
      type: 'threshold',
      severity: 'critical',
      message: `Critical: Value ${value.toFixed(2)} below minimum threshold ${thresholds.criticalMin}`
    };
  }
  
  if (thresholds.warningMax !== undefined && value > thresholds.warningMax) {
    return {
      detected: true,
      type: 'threshold',
      severity: 'medium',
      message: `Warning: Value ${value.toFixed(2)} exceeds warning threshold ${thresholds.warningMax}`
    };
  }
  
  if (thresholds.warningMin !== undefined && value < thresholds.warningMin) {
    return {
      detected: true,
      type: 'threshold',
      severity: 'medium',
      message: `Warning: Value ${value.toFixed(2)} below warning threshold ${thresholds.warningMin}`
    };
  }
  
  // Check SPC rules if enabled
  if (spcConfig?.enabled && recentReadings.length >= spcConfig.sampleSize) {
    const values = recentReadings.slice(-spcConfig.sampleSize).map(r => r.value);
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values, mean);
    const violations = checkSPCRules(values, mean, stdDev, spcConfig.rules);
    
    if (violations.length > 0) {
      return {
        detected: true,
        type: 'spc',
        severity: 'high',
        message: `SPC violation: ${violations.join(', ')}`,
        rule: violations[0]
      };
    }
  }
  
  return undefined;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useIoTStore = create<IoTState>()(
  immer(
    (set, get) => ({
      // Initial State
      devices: [],
      sensors: [],
      readings: new Map(),
      readingHistory: new Map(),
      spcData: new Map(),
      anomalies: [],
      unacknowledgedCount: 0,
      isConnected: false,
      connectionStatus: 'disconnected',
      lastConnectionTime: null,
      reconnectAttempts: 0,
      metrics: {
        totalSensors: 0,
        onlineSensors: 0,
        activeAlerts: 0,
        dataPointsPerMinute: 0,
        averageLatency: 0,
        anomalyRate: 0
      },
      wsConnection: null,

      // Connection Actions
      connect: (endpoint: string) => {
        const ws = new WebSocket(endpoint);
        
        ws.onopen = () => {
          set((state) => {
            state.isConnected = true;
            state.connectionStatus = 'connected';
            state.lastConnectionTime = new Date().toISOString();
            state.reconnectAttempts = 0;
            state.wsConnection = ws;
          });
          toast.success('IoT connection established');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'reading') {
              get().processReading(data.payload);
            } else if (data.type === 'batch') {
              get().batchProcessReadings(data.payload);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          set((state) => {
            state.isConnected = false;
            state.connectionStatus = 'disconnected';
            state.wsConnection = null;
          });
          
          // Auto-reconnect
          const attempts = get().reconnectAttempts;
          if (attempts < 5) {
            setTimeout(() => {
              set((state) => { state.reconnectAttempts = attempts + 1; });
              get().reconnect();
            }, Math.min(1000 * Math.pow(2, attempts), 30000));
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          set((state) => { state.connectionStatus = 'error'; });
        };
      },

      disconnect: () => {
        const ws = get().wsConnection;
        if (ws) {
          ws.close();
        }
        set((state) => {
          state.isConnected = false;
          state.connectionStatus = 'disconnected';
          state.wsConnection = null;
        });
      },

      reconnect: () => {
        const endpoint = get().wsConnection?.url || 'ws://localhost:8080/ws';
        get().connect(endpoint);
      },

      // Sensor Actions
      registerSensor: (sensor) => {
        const id = `sensor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSensor: SensorConfig = {
          ...sensor,
          id,
          status: 'offline'
        };
        set((state) => {
          state.sensors.push(newSensor);
          state.metrics.totalSensors = state.sensors.length;
        });
      },

      updateSensor: (id, updates) => {
        set((state) => {
          const sensor = state.sensors.find((s: SensorConfig) => s.id === id);
          if (sensor) {
            Object.assign(sensor, updates);
          }
        });
      },

      removeSensor: (id) => {
        set((state) => {
          state.sensors = state.sensors.filter((s: SensorConfig) => s.id !== id);
          state.readings.delete(id);
          state.readingHistory.delete(id);
          state.spcData.delete(id);
          state.metrics.totalSensors = state.sensors.length;
        });
      },

      calibrateSensor: (id, offset, gain) => {
        set((state) => {
          const sensor = state.sensors.find((s: SensorConfig) => s.id === id);
          if (sensor) {
            sensor.calibration.offset = offset;
            sensor.calibration.gain = gain;
            sensor.calibration.lastCalibrated = new Date().toISOString();
            sensor.status = 'calibrating';
          }
        });
      },

      // Device Actions
      registerDevice: (device) => {
        const id = `device-${Date.now()}`;
        const newDevice: IoTDevice = {
          ...device,
          id,
          status: 'offline'
        };
        set((state) => {
          state.devices.push(newDevice);
        });
      },

      updateDevice: (id, updates) => {
        set((state) => {
          const device = state.devices.find((d: IoTDevice) => d.id === id);
          if (device) {
            Object.assign(device, updates);
          }
        });
      },

      removeDevice: (id) => {
        set((state) => {
          state.devices = state.devices.filter((d: IoTDevice) => d.id !== id);
        });
      },

      // Data Processing
      processReading: (reading) => {
        const sensor = get().sensors.find((s: SensorConfig) => s.id === reading.sensorId);
        if (!sensor) return;

        // Apply calibration
        const calibratedValue = (reading.rawValue * sensor.calibration.gain) + sensor.calibration.offset;
        const processedReading: SensorReading = {
          ...reading,
          value: calibratedValue
        };

        // Get recent readings for SPC/Anomaly detection
        const history = get().readingHistory.get(reading.sensorId) || [];
        const recentReadings = history.slice(-100);

        // Detect anomalies
        const anomaly = detectAnomaly(processedReading, sensor, recentReadings);
        processedReading.anomaly = anomaly;

        // Update state
        set((state) => {
          // Update latest reading
          state.readings.set(reading.sensorId, processedReading);
          
          // Update history
          const currentHistory = state.readingHistory.get(reading.sensorId) || [];
          currentHistory.push(processedReading);
          if (currentHistory.length > 1000) {
            currentHistory.shift(); // Keep only last 1000 readings
          }
          state.readingHistory.set(reading.sensorId, currentHistory);
          
          // Update sensor status
          sensor.status = reading.status;
          
          // Create anomaly event if detected
          if (anomaly?.detected) {
            const event: AnomalyEvent = {
              id: `anomaly-${Date.now()}`,
              sensorId: reading.sensorId,
              timestamp: reading.timestamp,
              type: anomaly.type,
              severity: anomaly.severity,
              message: anomaly.message,
              value: reading.value,
              acknowledged: false,
              autoResponse: {
                action: anomaly.severity === 'critical' ? 'stop' : 'alert',
                executed: false
              }
            };
            state.anomalies.unshift(event);
            state.unacknowledgedCount++;
            
            // Show toast for high/critical anomalies
            if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
              toast.error(anomaly.message, {
                description: `Sensor: ${sensor.name}`,
                duration: 10000
              });
            }
          }
          
          // Update metrics
          state.metrics.onlineSensors = state.sensors.filter(
            (s: SensorConfig) => s.status === 'online'
          ).length;
          state.metrics.activeAlerts = state.unacknowledgedCount;
        });

        // Calculate SPC if enabled
        if (sensor.spcConfig?.enabled) {
          const spcPoint = get().calculateSPC(reading.sensorId, recentReadings);
          if (spcPoint) {
            set((state) => {
              const currentSPC = state.spcData.get(reading.sensorId) || [];
              currentSPC.push(spcPoint);
              if (currentSPC.length > 500) {
                currentSPC.shift();
              }
              state.spcData.set(reading.sensorId, currentSPC);
            });
          }
        }
      },

      batchProcessReadings: (readings) => {
        readings.forEach(reading => get().processReading(reading));
      },

      // SPC Calculation
      calculateSPC: (sensorId, readings) => {
        const sensor = get().sensors.find((s: SensorConfig) => s.id === sensorId);
        if (!sensor?.spcConfig || readings.length < sensor.spcConfig.sampleSize) {
          return null;
        }

        const sample = readings.slice(-sensor.spcConfig.sampleSize);
        const values = sample.map(r => r.value);
        const mean = calculateMean(values);
        const stdDev = calculateStdDev(values, mean);
        const range = calculateRange(values);

        const { ucl, lcl, usl, lsl } = sensor.spcConfig.controlLimits;
        const violations = checkSPCRules(values, mean, stdDev, sensor.spcConfig.rules);

        let cp: number | undefined;
        let cpk: number | undefined;
        if (usl !== undefined && lsl !== undefined && stdDev > 0) {
          cp = calculateCp(usl, lsl, stdDev);
          cpk = calculateCpk(usl, lsl, mean, stdDev);
        }

        return {
          sensorId,
          timestamp: new Date().toISOString(),
          value: readings[readings.length - 1].value,
          sampleSize: sensor.spcConfig.sampleSize,
          mean,
          range,
          stdDev,
          ucl,
          lcl,
          usl,
          lsl,
          cp,
          cpk,
          violations
        };
      },

      // Anomaly Actions
      acknowledgeAnomaly: (id, userId) => {
        set((state) => {
          const anomaly = state.anomalies.find((a: AnomalyEvent) => a.id === id);
          if (anomaly && !anomaly.acknowledged) {
            anomaly.acknowledged = true;
            anomaly.acknowledgedBy = userId;
            anomaly.acknowledgedAt = new Date().toISOString();
            state.unacknowledgedCount--;
            state.metrics.activeAlerts = state.unacknowledgedCount;
          }
        });
      },

      clearAnomalies: () => {
        set((state) => {
          state.anomalies = [];
          state.unacknowledgedCount = 0;
          state.metrics.activeAlerts = 0;
        });
      },

      // Utility Actions
      getSensorReadings: (sensorId, limit = 100) => {
        const history = get().readingHistory.get(sensorId) || [];
        return history.slice(-limit);
      },

      getActiveAnomalies: () => {
        return get().anomalies.filter((a: AnomalyEvent) => !a.acknowledged);
      },

      exportData: (sensorIds, startTime, endTime) => {
        const exportData: Record<string, SensorReading[]> = {};
        
        sensorIds.forEach(sensorId => {
          const history = get().readingHistory.get(sensorId) || [];
          exportData[sensorId] = history.filter(
            (r: SensorReading) => r.timestamp >= startTime && r.timestamp <= endTime
          );
        });
        
        return JSON.stringify(exportData, null, 2);
      }
    })
  )
);

// ============================================================================
// HOOKS FOR REACT COMPONENTS
// ============================================================================

export function useSensorData(sensorId: string, maxHistory = 100) {
  const sensor = useIoTStore(state => 
    state.sensors.find((s: SensorConfig) => s.id === sensorId)
  );
  const latestReading = useIoTStore(state => state.readings.get(sensorId));
  const readings = useIoTStore(state => 
    (state.readingHistory.get(sensorId) || []).slice(-maxHistory)
  );
  
  return { sensor, latestReading, readings };
}

export function useRealTimeMetrics() {
  return useIoTStore(state => state.metrics);
}

export function useConnectionStatus() {
  return useIoTStore(state => ({
    isConnected: state.isConnected,
    status: state.connectionStatus,
    reconnectAttempts: state.reconnectAttempts
  }));
}

export function useAnomalies(sensorId?: string) {
  return useIoTStore(state => {
    if (sensorId) {
      return state.anomalies.filter((a: AnomalyEvent) => a.sensorId === sensorId);
    }
    return state.anomalies;
  });
}

export function useSPCData(sensorId: string) {
  return useIoTStore(state => state.spcData.get(sensorId) || []);
}

// ============================================================================
// MOCK DATA GENERATOR (for testing)
// ============================================================================

export function generateMockSensorReading(
  sensor: SensorConfig,
  baseValue?: number
): Omit<SensorReading, 'anomaly'> {
  const now = new Date().toISOString();
  const target = sensor.thresholds.target;
  const noise = (Math.random() - 0.5) * (target * 0.05); // 5% noise
  const drift = Math.sin(Date.now() / 60000) * (target * 0.02); // Slow drift
  
  const rawValue = baseValue !== undefined ? baseValue : target + noise + drift;
  const calibratedValue = (rawValue * sensor.calibration.gain) + sensor.calibration.offset;
  
  return {
    sensorId: sensor.id,
    timestamp: now,
    value: calibratedValue,
    rawValue,
    unit: sensor.unit,
    quality: Math.random() > 0.95 ? 'uncertain' : 'good',
    status: Math.random() > 0.98 ? 'warning' : 'online'
  };
}

export function startMockDataStream(sensors: SensorConfig[], interval = 1000) {
  const intervalId = setInterval(() => {
    sensors.forEach(sensor => {
      const reading = generateMockSensorReading(sensor);
      useIoTStore.getState().processReading(reading);
    });
  }, interval);
  
  return () => clearInterval(intervalId);
}

export default useIoTStore;
