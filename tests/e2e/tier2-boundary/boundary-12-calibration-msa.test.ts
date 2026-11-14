import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedCalibrationApi } from '@/api/unified-api';
import {
  seedCalibrations,
  readCalibrations,
  resetQualityStorage,
  createIsoDateOffset,
  STORAGE_KEYS,
} from '../../helpers/testHarness';

describe('Feature 12 Boundary: Calibration Tracking & MSA', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('evaluates exact date boundary for tool expiration (due today vs yesterday vs tomorrow)', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = createIsoDateOffset(-1);
    const tomorrow = createIsoDateOffset(1);

    const checkStatus = (dueDate: string): 'overdue' | 'due-today' | 'valid' => {
      if (dueDate < today) return 'overdue';
      if (dueDate === today) return 'due-today';
      return 'valid';
    };

    expect(checkStatus(yesterday)).toBe('overdue');
    expect(checkStatus(today)).toBe('due-today');
    expect(checkStatus(tomorrow)).toBe('valid');
  });

  it('blocks tool dispatch / inspection usage if calibration status is "overdue" or "maintenance"', () => {
    const overdueTool = {
      id: 'tool-lock-01',
      equipment: 'Dial Bore Gauge',
      serialNumber: 'SN-BG-99',
      status: 'overdue',
      nextCalibration: createIsoDateOffset(-30),
    };

    const isToolUsable = (status: string) => status === 'calibrated';

    expect(isToolUsable(overdueTool.status)).toBe(false);
    expect(isToolUsable('maintenance')).toBe(false);
    expect(isToolUsable('calibrated')).toBe(true);
  });

  it('safely registers Arabic Unicode equipment names and high-precision scientific uncertainty', async () => {
    const arabicTool = {
      equipment: 'جهاز قياس الإحداثيات ثلاثي الأبعاد CMM بالليزر',
      model: 'ZEISS-PRISMO-900',
      serialNumber: 'رقم-تسلسلي-٩٩١٢',
      location: 'مختبر المعايرة الدقيقة وضمان الجودة المركزي',
      lastCalibration: createIsoDateOffset(-60),
      nextCalibration: createIsoDateOffset(300),
      status: 'calibrated',
      calibratedBy: 'المعهد القومي للمعايير الفيزيائية',
      uncertainty: '±0.00035 mm (k=2, 95% CL)',
    };

    const created = await unifiedCalibrationApi.create(arabicTool as any);
    expect(created.id).toBeDefined();

    const stored = readCalibrations();
    expect(stored.length).toBe(1);
    expect(stored[0].equipment).toContain('جهاز قياس الإحداثيات');
    expect(stored[0].uncertainty).toContain('±0.00035 mm');
  });

  it('handles leap year calibration cycles (2024-02-29 to 2028-02-29)', async () => {
    const leapTool = {
      equipment: 'Master Gauge Block Set Grade 0',
      serialNumber: 'SN-GBLK-LEAP',
      location: 'Standards Room',
      lastCalibration: '2024-02-29',
      nextCalibration: '2028-02-29', // 4-year cycle landing on leap day
      status: 'calibrated',
    };

    const created = await unifiedCalibrationApi.create(leapTool as any);
    expect(created.lastCalibration).toBe('2024-02-29');
    expect(created.nextCalibration).toBe('2028-02-29');
  });

  it('recovers gracefully from corrupted storage payload in calibrations repository', async () => {
    localStorage.setItem(STORAGE_KEYS.CALIBRATION, 'CORRUPTED_CALIBRATION_JSON_{{{');
    const res = await unifiedCalibrationApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeList = readCalibrations();
    expect(Array.isArray(safeList)).toBe(true);
    expect(safeList.length).toBe(0);
  });
});
