
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { NoiseRecord, AIInsight } from '../types';
import { getUrbanInsights } from '../services/geminiService';
import { Sparkles, Activity, ShieldAlert, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface DashboardProps {
  records: NoiseRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (records.length === 0) return;
      setIsLoading(true);
      const data = await getUrbanInsights(records);
      setInsight(data);
      setIsLoading(false);
    };
    fetchInsights();
  }, [records]);

  const stats = {
    avg: records.length ? Math.round(records.reduce((acc, curr) => acc + curr.decibels, 0) / records.length) : 0,
    max: records.length ? Math.max(...records.map(r => r.decibels)) : 0,
    quietCount: records.filter(r => r.decibels < 50).length,
    noisyCount: records.filter(r => r.decibels > 75).length
  };

  const chartData = [
    { name: 'Quiet', value: stats.quietCount, color: '#22c55e' },
    { name: 'Moderate', value: records.length - stats.quietCount - stats.noisyCount, color: '#f97316' },
    { name: 'Noisy', value: stats.noisyCount, color: '#ef4444' }
  ];

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
        <Activity size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-medium">No data points yet</h3>
        <p className="text-sm">Submit noise records to unlock AI urban insights.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Average Noise</p>
          <p className="text-3xl font-black text-slate-800">{stats.avg} <span className="text-sm font-normal">dB</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Peak Noise</p>
          <p className="text-3xl font-black text-red-500">{stats.max} <span className="text-sm font-normal">dB</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Quiet Zones</p>
          <p className="text-3xl font-black text-green-500">{stats.quietCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Critical Zones</p>
          <p className="text-3xl font-black text-orange-500">{stats.noisyCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Noise Distribution
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gemini AI Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles size={80} />
          </div>
          
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-300" />
            AI Urban Planner
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-indigo-200">Analyzing acoustic data patterns...</p>
            </div>
          ) : insight ? (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                 <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">Acoustic Health Score</p>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{insight.urbanPlanningScore}</span>
                    <span className="text-sm text-indigo-300 pb-1">/ 100</span>
                 </div>
              </div>

              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase mb-2">Analysis Summary</p>
                <p className="text-sm leading-relaxed text-slate-50">{insight.summary}</p>
              </div>

              <div className="space-y-3">
                <p className="text-indigo-200 text-xs font-bold uppercase">Recommendations</p>
                {insight.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/5">
                    <Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-50">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-indigo-300 italic">No insights available.</p>
          )}
        </div>
      </div>
      
      {/* Recent Records List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
           <Activity size={20} className="text-indigo-600" />
           Raw Telemetry Data
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                <th className="pb-4 px-2">Timestamp</th>
                <th className="pb-4 px-2">Coordinates</th>
                <th className="pb-4 px-2">Label</th>
                <th className="pb-4 px-2 text-right">Intensity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.slice(-10).reverse().map((record) => (
                <tr key={record.id} className="text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-2 whitespace-nowrap text-xs">
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-2 font-mono text-xs">
                    {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                  </td>
                  <td className="py-4 px-2 italic text-slate-400">
                    {record.locationName || 'N/A'}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      record.decibels < 50 ? 'bg-green-100 text-green-700' :
                      record.decibels < 75 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {record.decibels} dB
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
