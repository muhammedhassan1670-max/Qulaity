/**
 * QMS Enterprise 4.0 - Real-Time Chart Component
 * Professional Quality 4.0 IoT Visualization
 * 
 * Features:
 * - Real-time data streaming
 * - SPC Control Charts (X-bar, R-chart, p-chart)
 * - Anomaly highlighting
 * - Zoom/pan capabilities
 * - Export to CSV/PNG
 */

import { useEffect, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Scatter
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Download,
  RefreshCw,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useSensorData, useSPCData, type SPCDataPoint } from '../stores/iotStore';
import { useConfigStore } from '../stores/configStore';

// ============================================================================
// CHART TYPES
// ============================================================================

type ChartType = 'line' | 'spc' | 'area' | 'scatter' | 'gauge';

interface ChartProps {
  sensorId: string;
  type: ChartType;
  height?: number;
  showSPC?: boolean;
  showAnomalies?: boolean;
  maxDataPoints?: number;
  refreshInterval?: number;
  onAnomalyClick?: (timestamp: string) => void;
}

// ============================================================================
// REAL-TIME LINE CHART
// ============================================================================

export function RealTimeChart({
  sensorId,
  type: _type = 'line',
  height = 300,
  showSPC,
  showAnomalies,
  maxDataPoints,
  refreshInterval,
  onAnomalyClick: _onAnomalyClick
}: ChartProps) {
  const { chartSettings } = useConfigStore();

  const effectiveMaxDataPoints = maxDataPoints ?? chartSettings?.iot?.maxDataPoints ?? 100;
  const effectiveRefreshInterval = refreshInterval ?? chartSettings?.iot?.refreshInterval ?? 1000;
  const effectiveShowSPC = showSPC ?? chartSettings?.iot?.showSPC ?? false;
  const effectiveShowAnomalies = showAnomalies ?? chartSettings?.iot?.showAnomalies ?? true;

  const { sensor, latestReading, readings } = useSensorData(sensorId, effectiveMaxDataPoints);
  const [isPaused, setIsPaused] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => setTick((t) => t + 1), effectiveRefreshInterval);
    return () => window.clearInterval(id);
  }, [effectiveRefreshInterval, isPaused]);

  if (!sensor) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
        <Activity className="w-8 h-8 mr-2" />
        Sensor not found
      </div>
    );
  }

  // Prepare chart data
  const chartData = readings.map((reading, index) => ({
    index,
    timestamp: reading.timestamp,
    value: reading.value,
    formattedTime: format(new Date(reading.timestamp), 'HH:mm:ss'),
    isAnomaly: !!reading.anomaly,
    anomalySeverity: reading.anomaly?.severity,
    quality: reading.quality
  }));

  const anomalyData = chartData.filter((d) => d.isAnomaly);

  // SPC reference lines
  const spcLines = effectiveShowSPC && sensor.spcConfig ? [
    { y: sensor.spcConfig.controlLimits.ucl, label: 'UCL', color: '#EF4444' },
    { y: sensor.spcConfig.controlLimits.lcl, label: 'LCL', color: '#EF4444' },
    { y: sensor.thresholds.target, label: 'Target', color: '#00A3E0' }
  ] : [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{value: number; payload: typeof chartData[0]}> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-gray-400 mb-1">{data.formattedTime}</p>
          <p className="text-lg font-bold text-white">
            {data.value.toFixed(3)} {sensor.unit}
          </p>
          {data.isAnomaly && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {data.anomalySeverity?.toUpperCase()}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Quality: {data.quality}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Value', 'Unit', 'Quality', 'Anomaly'].join(','),
      ...readings.map(r => [
        r.timestamp,
        r.value,
        sensor.unit,
        r.quality,
        r.anomaly ? r.anomaly.message : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sensor.name}_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div>
            <h4 className="font-semibold text-white">{sensor.name}</h4>
            <p className="text-xs text-gray-400">
              {latestReading ? (
                <>
                  Latest: <span className="text-[#00A3E0] font-mono">{latestReading.value.toFixed(3)}</span> {sensor.unit}
                </>
              ) : 'No data'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg ${isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            <RefreshCw className={`w-4 h-4 ${isPaused ? '' : 'animate-spin'}`} style={{ animationDuration: '3s' }} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A3E0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00A3E0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="index"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickFormatter={(index) => chartData[index]?.formattedTime || ''}
              stroke="#ffffff20"
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              domain={['auto', 'auto']}
              stroke="#ffffff20"
              label={{ value: sensor.unit, angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* SPC Reference Lines */}
            {spcLines.map((line) => (
              <ReferenceLine
                key={line.label}
                y={line.y}
                stroke={line.color}
                strokeDasharray="5 5"
                label={{ value: line.label, fill: line.color, fontSize: 10 }}
              />
            ))}

            {/* Main Line */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00A3E0"
              strokeWidth={2}
              fill="url(#valueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#00A3E0' }}
              name={sensor.name}
            />

            {/* Anomaly Points */}
            {effectiveShowAnomalies && (
              <Scatter
                data={anomalyData}
                dataKey="value"
                fill="#EF4444"
                shape="circle"
                name="Anomalies"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {readings.length > 0 && (
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-2 bg-white/5 rounded">
            <p className="text-xs text-gray-400">Mean</p>
            <p className="font-mono text-sm text-white">
              {(readings.reduce((a, r) => a + r.value, 0) / readings.length).toFixed(3)}
            </p>
          </div>
          <div className="p-2 bg-white/5 rounded">
            <p className="text-xs text-gray-400">Min</p>
            <p className="font-mono text-sm text-white">
              {Math.min(...readings.map(r => r.value)).toFixed(3)}
            </p>
          </div>
          <div className="p-2 bg-white/5 rounded">
            <p className="text-xs text-gray-400">Max</p>
            <p className="font-mono text-sm text-white">
              {Math.max(...readings.map(r => r.value)).toFixed(3)}
            </p>
          </div>
          <div className="p-2 bg-white/5 rounded">
            <p className="text-xs text-gray-400">Anomalies</p>
            <p className="font-mono text-sm text-red-400">
              {readings.filter(r => r.anomaly).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SPC CONTROL CHART
// ============================================================================

interface SPCChartProps {
  sensorId: string;
  height?: number;
  chartType?: 'xbar' | 'r' | 's';
}

export function SPCControlChart({ sensorId, height = 350, chartType = 'xbar' }: SPCChartProps) {
  const { sensor } = useSensorData(sensorId);
  const spcData = useSPCData(sensorId);

  if (!sensor?.spcConfig) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
        SPC not configured for this sensor
      </div>
    );
  }

  const chartData = spcData.map((point: SPCDataPoint, index: number) => ({
    index,
    timestamp: point.timestamp,
    value: chartType === 'xbar' ? point.mean : chartType === 'r' ? point.range : point.stdDev,
    ucl: point.ucl,
    lcl: point.lcl,
    target: sensor.thresholds.target,
    violations: point.violations,
    cp: point.cp,
    cpk: point.cpk
  }));

  const latest = spcData[spcData.length - 1];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">
            SPC Control Chart ({chartType.toUpperCase()})
          </h4>
          <p className="text-xs text-gray-400">
            Sample Size: {sensor.spcConfig.sampleSize} | Rules: {sensor.spcConfig.rules.length}
          </p>
        </div>
        {latest && (
          <div className="flex items-center gap-4 text-sm">
            {latest.cp !== undefined && (
              <span className="text-gray-400">
                Cp: <span className={latest.cp >= 1.33 ? 'text-green-400' : latest.cp >= 1.0 ? 'text-yellow-400' : 'text-red-400'}>{latest.cp.toFixed(2)}</span>
              </span>
            )}
            {latest.cpk !== undefined && (
              <span className="text-gray-400">
                Cpk: <span className={latest.cpk >= 1.33 ? 'text-green-400' : latest.cpk >= 1.0 ? 'text-yellow-400' : 'text-red-400'}>{latest.cpk.toFixed(2)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="index"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              stroke="#ffffff20"
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              domain={['auto', 'auto']}
              stroke="#ffffff20"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-gray-400">{format(new Date(data.timestamp), 'HH:mm:ss')}</p>
                      <p className="text-sm text-white font-mono">{data.value.toFixed(4)}</p>
                      {data.violations.length > 0 && (
                        <p className="text-xs text-red-400 mt-1">
                          Violations: {data.violations.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Control Limits */}
            <ReferenceLine y={sensor.spcConfig.controlLimits.ucl} stroke="#EF4444" strokeDasharray="5 5" label="UCL" />
            <ReferenceLine y={sensor.spcConfig.controlLimits.lcl} stroke="#EF4444" strokeDasharray="5 5" label="LCL" />
            <ReferenceLine y={sensor.thresholds.target} stroke="#00A3E0" strokeDasharray="3 3" label="Target" />

            {/* Data Line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00A3E0"
              strokeWidth={2}
              dot={(props: { cx?: number; cy?: number; payload?: { violations: string[] } }) => {
                const hasViolations = props.payload && props.payload.violations.length > 0;
                return hasViolations ? (
                  <circle cx={props.cx} cy={props.cy} r={5} fill="#EF4444" stroke="#fff" strokeWidth={2} />
                ) : (
                  <circle cx={props.cx} cy={props.cy} r={3} fill="#00A3E0" />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Capability Indices */}
      {latest && (
        <div className="grid grid-cols-4 gap-4 p-3 bg-white/5 rounded-lg">
          <div>
            <p className="text-xs text-gray-400">Process Capability (Cp)</p>
            <p className={`font-mono text-lg font-bold ${latest.cp && latest.cp >= 1.33 ? 'text-green-400' : latest.cp && latest.cp >= 1.0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {latest.cp?.toFixed(3) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Capability Index (Cpk)</p>
            <p className={`font-mono text-lg font-bold ${latest.cpk && latest.cpk >= 1.33 ? 'text-green-400' : latest.cpk && latest.cpk >= 1.0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {latest.cpk?.toFixed(3) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Standard Deviation</p>
            <p className="font-mono text-lg text-white">{latest.stdDev?.toFixed(4) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Violations</p>
            <p className="font-mono text-lg text-red-400">
              {spcData.reduce((acc, p) => acc + p.violations.length, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REAL-TIME GAUGE
// ============================================================================

interface GaugeProps {
  sensorId: string;
  size?: number;
}

export function RealTimeGauge({ sensorId, size = 200 }: GaugeProps) {
  const { sensor, latestReading } = useSensorData(sensorId);

  if (!sensor || !latestReading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-gray-500">No data</span>
      </div>
    );
  }

  const { value } = latestReading;
  const { thresholds, unit } = sensor;
  
  // Calculate percentage for gauge
  const range = (thresholds.criticalMax || thresholds.target * 1.5) - (thresholds.criticalMin || 0);
  const percentage = Math.min(Math.max(((value - (thresholds.criticalMin || 0)) / range) * 100, 0), 100);
  
  // Determine color based on thresholds
  let color = '#00A3E0';
  if (thresholds.criticalMax !== undefined && value > thresholds.criticalMax) color = '#DC2626';
  else if (thresholds.criticalMin !== undefined && value < thresholds.criticalMin) color = '#DC2626';
  else if (thresholds.warningMax !== undefined && value > thresholds.warningMax) color = '#F59E0B';
  else if (thresholds.warningMin !== undefined && value < thresholds.warningMin) color = '#F59E0B';

  // SVG gauge
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75; // 270 degrees

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-135">
          {/* Background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ffffff10"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference * 0.75}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white font-mono">{value.toFixed(1)}</span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{sensor.name}</p>
      {latestReading.anomaly && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {latestReading.anomaly.severity}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// MULTI-SENSOR DASHBOARD
// ============================================================================

interface DashboardProps {
  sensorIds: string[];
  layout?: 'grid' | 'list';
}

export function RealTimeDashboard({ sensorIds, layout = 'grid' }: DashboardProps) {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const { chartSettings } = useConfigStore();

  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
      {sensorIds.map(sensorId => (
        <div
          key={sensorId}
          className="glass-card p-4 rounded-xl hover:ring-1 hover:ring-[#00A3E0]/50 transition-all cursor-pointer"
          onClick={() => setSelectedSensor(selectedSensor === sensorId ? null : sensorId)}
        >
          {selectedSensor === sensorId ? (
            <RealTimeChart
              sensorId={sensorId}
              type="line"
              height={300}
              showSPC={chartSettings?.iot?.showSPC ?? true}
              showAnomalies={chartSettings?.iot?.showAnomalies ?? true}
              maxDataPoints={chartSettings?.iot?.maxDataPoints}
              refreshInterval={chartSettings?.iot?.refreshInterval}
            />
          ) : (
            <div className="flex items-center justify-between">
              <RealTimeGauge sensorId={sensorId} size={150} />
              <div className="text-right">
                <p className="text-xs text-gray-400">Click to expand</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default RealTimeChart;
