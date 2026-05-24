import { Injectable } from '@nestjs/common';

@Injectable()
export class IoTService {
  async getAll() {
    const data = [
      { id: '1', deviceCode: 'IOT-TEMP-001', name: 'Temperature Sensor Line 1', type: 'Temperature', location: 'Line 1', status: 'Online', lastReading: 24.5, unit: '°C', batteryLevel: 85 },
      { id: '2', deviceCode: 'IOT-VIB-001', name: 'Vibration Sensor Line 1', type: 'Vibration', location: 'Line 1', status: 'Online', lastReading: 2.3, unit: 'mm/s', batteryLevel: 72 },
      { id: '3', deviceCode: 'IOT-PRES-001', name: 'Pressure Sensor Line 2', type: 'Pressure', location: 'Line 2', status: 'Online', lastReading: 6.8, unit: 'bar', batteryLevel: 90 },
      { id: '4', deviceCode: 'IOT-POW-001', name: 'Power Monitor Robot A', type: 'Power', location: 'Assembly A', status: 'Warning', lastReading: 16.2, unit: 'kW', batteryLevel: 100 },
      { id: '5', deviceCode: 'IOT-HUM-001', name: 'Humidity Sensor Lab', type: 'Humidity', location: 'Testing Lab', status: 'Offline', lastReading: null, unit: '%', batteryLevel: 15 },
    ];
    return { success: true, data, total: data.length };
  }

  async getById(id: string) {
    const data = { id, deviceCode: 'IOT-TEMP-001', name: 'Temperature Sensor Line 1', type: 'Temperature', location: 'Line 1', status: 'Online', lastReading: 24.5, unit: '°C', batteryLevel: 85 };
    return { success: true, data };
  }

  async getReadings(id: string, hours: number) {
    const readings: { timestamp: string; value: number; unit: string }[] = [];
    const now = new Date();
    for (let i = 0; i < hours; i++) {
      readings.push({
        timestamp: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
        value: 20 + Math.random() * 10,
        unit: '°C',
      });
    }
    return { success: true, data: readings };
  }

  async updateThresholds(id: string, thresholds: Record<string, number>) {
    return { success: true, message: 'Thresholds updated successfully' };
  }
}
