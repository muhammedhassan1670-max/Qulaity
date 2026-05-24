import { Injectable } from '@nestjs/common';

@Injectable()
export class SpcService {
  async getAll() {
    const data = [
      { id: '1', chartType: 'X-bar', characteristic: 'Part Diameter', partNumber: 'PRT-001', processName: 'Turning Operation', ucl: 25.05, lcl: 24.95, cpk: 1.25, status: 'Active' },
      { id: '2', chartType: 'R', characteristic: 'Surface Roughness', partNumber: 'PRT-002', processName: 'Milling Operation', ucl: 0.08, lcl: 0, cpk: 1.4, status: 'Active' },
      { id: '3', chartType: 'p', characteristic: 'Defect Rate', partNumber: 'PRT-003', processName: 'Assembly', ucl: 0.05, lcl: 0, cpk: 1.15, status: 'Warning' },
    ];
    return { success: true, data, total: data.length };
  }

  async getById(id: string) {
    const data = { id, chartType: 'X-bar', characteristic: 'Part Diameter', partNumber: 'PRT-001', processName: 'Turning Operation', ucl: 25.05, lcl: 24.95, cpk: 1.25, status: 'Active' };
    return { success: true, data };
  }

  async getDataPoints(id: string) {
    const points: { sampleNumber: string; sampleDate: string; value: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      points.push({
        sampleNumber: `S${String(i + 1).padStart(3, '0')}`,
        sampleDate: new Date(now.getTime() - (29 - i) * 60 * 60 * 1000).toISOString(),
        value: 25 + (Math.random() - 0.5) * 0.08,
      });
    }
    return { success: true, data: points };
  }
}
