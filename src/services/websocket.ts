// QMS Enterprise 4.0 - WebSocket Service
// Real-time data streaming with an optional local simulation fallback

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'simulated';

export interface WebSocketMessage {
  type: 'iot_data' | 'notification' | 'alert' | 'system' | 'ping';
  payload: unknown;
  timestamp: string;
  deviceId?: string;
}

export interface IoTDataPayload {
  deviceId: string;
  deviceName: string;
  metrics: {
    temperature?: number;
    pressure?: number;
    humidity?: number;
    vibration?: number;
    flow?: number;
    power?: number;
    status: 'online' | 'offline' | 'warning' | 'error';
  };
  timestamp: string;
  location: string;
}

export interface AlertPayload {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

// Optional local simulation.

const ENABLE_SIMULATED_STREAM = import.meta.env.VITE_ENABLE_SIMULATED_STREAM === 'true';

const SIMULATED_DEVICES: Omit<IoTDataPayload, 'metrics' | 'timestamp'>[] = [];

function generateSimulatedIoTData(): IoTDataPayload | null {
  const device = SIMULATED_DEVICES[Math.floor(Math.random() * SIMULATED_DEVICES.length)];
  if (!device) return null;
  const temp = 45 + Math.random() * 30;
  const statuses: Array<'online' | 'warning'> = ['online', 'online', 'online', 'warning'];
  return {
    ...device,
    metrics: {
      temperature: parseFloat(temp.toFixed(1)),
      pressure: parseFloat((2 + Math.random() * 4).toFixed(2)),
      humidity: parseFloat((40 + Math.random() * 30).toFixed(1)),
      vibration: parseFloat((0.1 + Math.random() * 0.9).toFixed(3)),
      flow: parseFloat((10 + Math.random() * 40).toFixed(1)),
      power: parseFloat((50 + Math.random() * 200).toFixed(1)),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    },
    timestamp: new Date().toISOString(),
  };
}

const SIMULATED_ALERTS: Omit<AlertPayload, 'id' | 'timestamp' | 'acknowledged'>[] = [];

// ─── Main Service Class ───────────────────────────────────────────────────────

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private reconnectDelay = 2000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private currentStatus: WebSocketStatus = 'disconnected';
  private isSimulationMode = false;

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  }

  // ── Connection ──

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isSimulationMode) return;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch {
      this.handleReconnect();
    }
  }

  disconnect(): void {
    this.clearPingInterval();
    this.clearReconnectTimeout();
    this.stopSimulationMode();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.isSimulationMode = false;
    this.setStatus('disconnected');
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.startPingInterval();
      toast.success('Real-time connection established', {
        description: 'Live data streaming active'
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch { /* ignore malformed */ }
    };

    this.ws.onclose = (event) => {
      this.clearPingInterval();
      if (!event.wasClean) {
        this.handleReconnect();
      } else {
        this.setStatus('disconnected');
      }
    };

    // Suppress the noisy browser error, just log quietly
    this.ws.onerror = () => {
      console.debug('[WS] Connection attempt failed — will retry');
    };
  }

  // Reconnect handling

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Backend unavailable; use an optional silent simulation only when configured.
      this.enterSimulationMode();
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Optional simulation mode

  private enterSimulationMode(): void {
    if (this.isSimulationMode) return;
    if (!ENABLE_SIMULATED_STREAM || SIMULATED_DEVICES.length === 0) {
      this.setStatus('disconnected');
      toast.warning('Real-time backend unavailable', {
        description: 'No simulated data will be loaded',
        duration: 4000,
      });
      return;
    }

    this.isSimulationMode = true;
    this.setStatus('simulated');

    // Single subtle toast — no error, just informational
    toast.info('Running in local simulation', {
      description: 'Backend unavailable — using simulated live data',
      duration: 4000,
    });

    // Stream simulated IoT data every 3 seconds
    this.simulationInterval = setInterval(() => {
      const data = generateSimulatedIoTData();
      if (!data) return;
      this.emitToListeners('iot_data', data);
      this.handleIoTData(data);

      // Occasionally emit a simulated alert.
      if (SIMULATED_ALERTS.length > 0 && Math.random() < 0.08) {
        const template = SIMULATED_ALERTS[Math.floor(Math.random() * SIMULATED_ALERTS.length)];
        const alert: AlertPayload = {
          ...template,
          id: `sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        };
        this.emitToListeners('alert', alert);
        this.handleAlert(alert);
      }
    }, 3000);
  }

  private stopSimulationMode(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulationMode = false;
  }

  // Call this to leave simulation mode and try reconnecting.
  retryConnection(): void {
    this.stopSimulationMode();
    this.reconnectAttempts = 0;
    this.connect();
  }

  // ── Message handling ──

  private emitToListeners(type: string, payload: unknown): void {
    const listeners = this.listeners.get(type);
    if (listeners) listeners.forEach(cb => cb(payload));
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emitToListeners(message.type, message.payload);

    switch (message.type) {
      case 'iot_data':
        this.handleIoTData(message.payload as IoTDataPayload);
        break;
      case 'alert':
        this.handleAlert(message.payload as AlertPayload);
        break;
    }
  }

  private handleIoTData(data: IoTDataPayload): void {
    const { metrics } = data;
    if (metrics.temperature && metrics.temperature > 78) {
      toast.warning(`High Temperature: ${data.deviceName}`, {
        description: `${metrics.temperature}°C — approaching limit`,
        duration: 5000,
      });
    }
    if (metrics.status === 'error') {
      toast.error(`Device Error: ${data.deviceName}`, {
        description: 'Device reported an error condition',
      });
    }
  }

  private handleAlert(alert: AlertPayload): void {
    if (alert.acknowledged) return;
    switch (alert.severity) {
      case 'critical': toast.error(alert.title, { description: alert.message }); break;
      case 'warning':  toast.warning(alert.title, { description: alert.message }); break;
      default:         toast.info(alert.title, { description: alert.message }); break;
    }
  }

  // ── Public API ──

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
    // When disconnected, outbound messages are discarded silently.
  }

  subscribe<T>(type: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    const listeners = this.listeners.get(type)!;
    const wrapped = (data: unknown) => callback(data as T);
    listeners.add(wrapped);
    return () => {
      listeners.delete(wrapped);
      if (listeners.size === 0) this.listeners.delete(type);
    };
  }

  onStatusChange(callback: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.statusListeners.delete(callback);
  }

  private setStatus(status: WebSocketStatus): void {
    this.currentStatus = status;
    this.statusListeners.forEach(cb => cb(status));
  }

  getStatus(): WebSocketStatus { return this.currentStatus; }
  isConnected(): boolean { return this.ws?.readyState === WebSocket.OPEN || this.isSimulationMode; }
  isSimulationActive(): boolean { return this.isSimulationMode; }

  // Subscription helpers
  subscribeToIoT(callback: (data: IoTDataPayload) => void): () => void {
    return this.subscribe<IoTDataPayload>('iot_data', callback);
  }

  subscribeToAlerts(callback: (alert: AlertPayload) => void): () => void {
    return this.subscribe<AlertPayload>('alert', callback);
  }

  sendDeviceCommand(deviceId: string, command: string, params?: Record<string, unknown>): void {
    this.send({
      type: 'system',
      payload: { action: 'device_command', deviceId, command, params },
      timestamp: new Date().toISOString(),
    });
  }

  acknowledgeAlert(alertId: string): void {
    this.send({
      type: 'system',
      payload: { action: 'acknowledge_alert', alertId },
      timestamp: new Date().toISOString(),
    });
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null; }
  }

  private clearPingInterval(): void {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', payload: {}, timestamp: new Date().toISOString() });
    }, 30000);
  }
}

// Singleton
export const wsService = new WebSocketService();

// ─── React Hooks ────────────────────────────────────────────────────────────

export function useWebSocketStatus(): WebSocketStatus {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  useEffect(() => wsService.onStatusChange(setStatus), []);
  return status;
}

export function useIoTData(deviceId?: string): IoTDataPayload | null {
  const [data, setData] = useState<IoTDataPayload | null>(null);
  useEffect(() => {
    return wsService.subscribeToIoT((iotData) => {
      if (!deviceId || iotData.deviceId === deviceId) setData(iotData);
    });
  }, [deviceId]);
  return data;
}

export function useAlerts(): AlertPayload[] {
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  useEffect(() => {
    return wsService.subscribeToAlerts((alert) => {
      setAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)].slice(0, 50));
    });
  }, []);
  return alerts;
}

export function useWebSocketAutoConnect(): void {
  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);
}

export default WebSocketService;
