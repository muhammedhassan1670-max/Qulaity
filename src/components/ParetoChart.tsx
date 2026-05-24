import React, { useMemo } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Cell,
  ComposedChart
} from 'recharts';

interface ParetoChartProps {
  data: any[];
  categoryField: string;
  title: string;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ data, categoryField, title }) => {
  const processedData = useMemo(() => {
    // 1. Count occurrences of each category
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const val = item[categoryField] || 'Unknown';
      counts[val] = (counts[val] || 0) + (item.quantity || 1);
    });

    // 2. Sort categories by count descending
    const sortedCategories = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Calculate cumulative percentages
    const total = sortedCategories.reduce((sum, item) => sum + item.count, 0);
    let cumulativeSum = 0;

    return sortedCategories.map(item => {
      cumulativeSum += item.count;
      return {
        ...item,
        cumulativePercentage: total > 0 ? Math.round((cumulativeSum / total) * 100) : 0
      };
    });
  }, [data, categoryField]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
        <p className="text-white/20 font-black uppercase tracking-widest text-xs">No data for analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#0066CC]" />
            <span className="text-[10px] text-white/40 font-bold uppercase">Frequency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#FF6B35]" />
            <span className="text-[10px] text-white/40 font-bold uppercase">Cumulative %</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Frequency', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 'bold' } }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              label={{ value: '%', angle: 90, position: 'insideRight', style: { fill: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 'bold' } }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="count" 
              fill="#0066CC" 
              radius={[6, 6, 0, 0]} 
              barSize={30}
            >
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? '#0066CC' : '#0066CC80'} />
              ))}
            </Bar>
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumulativePercentage" 
              stroke="#FF6B35" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#FF6B35', strokeWidth: 2, stroke: '#1a1a25' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
