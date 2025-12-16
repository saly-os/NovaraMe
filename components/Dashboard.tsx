'use client';

import React from 'react';
import { GeneratedSchedule } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from 'recharts';

interface DashboardProps {
  scheduleData: GeneratedSchedule;
}

const TYPE_COLORS: Record<string, string> = {
  Study: '#a78bfa',    // Lavender-500
  Work: '#38bdf8',     // Sky-400
  Personal: '#fb7185', // Coral-400
  Chore: '#2dd4bf',    // Brand-300 (Mint)
  Fixed: '#94a3b8',    // Slate-400
  Break: '#cbd5e1'     // Slate-300
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-lavender-200 shadow-lg rounded-lg text-sm z-50">
        <p className="font-bold text-slate-800 mb-1">{data.fullName || label}</p>
        <p className="text-slate-600 flex items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: TYPE_COLORS[data.type] || '#94a3b8' }}></span>
          <span className="capitalize">{data.type}</span>: <span className="font-semibold ml-1">{data.hours} hrs</span>
        </p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ scheduleData }) => {
  const activityDataMap = new Map<string, { hours: number, type: string }>();
  let priorityCounts = { High: 0, Medium: 0, Low: 0 };
  
  scheduleData.optimized_weekly_schedule.forEach(day => {
    day.tasks.forEach(task => {
      // Aggregate data for the chart
      // Include relevant activity types. 
      if (['Study', 'Personal', 'Chore', 'Work', 'Fixed'].includes(task.activity_type)) {
        const name = task.subject_or_task.trim();
        
        // Key by name to aggregate hours for the same task/subject across the week
        const current = activityDataMap.get(name) || { hours: 0, type: task.activity_type };
        current.hours += task.duration_minutes / 60;
        activityDataMap.set(name, current);

        if (task.priority_level !== 'N/A') {
          priorityCounts[task.priority_level as keyof typeof priorityCounts]++;
        }
      }
    });
  });

  const barData = Array.from(activityDataMap.entries())
    .map(([name, data]) => ({ 
      // Truncate name for axis label to prevent layout issues
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      hours: parseFloat(data.hours.toFixed(1)),
      type: data.type
    }))
    .sort((a, b) => b.hours - a.hours); // Sort by duration desc

  // Calculate dynamic height: Base space + space per item. 
  // This ensures bars don't get squashed if there are many items.
  const dynamicHeight = Math.max(450, barData.length * 50);

  const pieData = [
    { name: 'High', value: priorityCounts.High, color: '#a78bfa' }, // Lavender
    { name: 'Medium', value: priorityCounts.Medium, color: '#2dd4bf' }, // Mint
    { name: 'Low', value: priorityCounts.Low, color: '#cbd5e1' }, // Slate
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in mb-8">
      {/* Time Distribution Chart */}
      <div className="bg-white/80 backdrop-blur p-6 rounded-xl border border-lavender-100 shadow-sm shadow-lavender-100 flex flex-col h-[500px]">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Time Distribution (Hrs)</h3>
           <div className="flex gap-2 text-[10px] text-slate-500">
             {Object.entries(TYPE_COLORS).map(([type, color]) => {
                if (type === 'Break') return null;
                return (
                 <div key={type} className="flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full" style={{backgroundColor: color}}></span>
                   {type}
                 </div>
                );
             })}
           </div>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-lavender-200">
           <div style={{ height: dynamicHeight, minHeight: '100%' }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 'auto']} allowDecimals={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={130} 
                    tick={{fontSize: 11, fill: '#475569'}} 
                    interval={0} // Ensure all labels are shown
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9', radius: 4}} />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                    {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No tasks scheduled</div>
            )}
           </div>
        </div>
      </div>

      {/* Priority Chart */}
      <div className="bg-white/80 backdrop-blur p-6 rounded-xl border border-lavender-100 shadow-sm shadow-lavender-100 h-[500px] flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Priority Breakdown</h3>
         {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
         ) : (
           <div className="h-full flex items-center justify-center text-slate-400">No priority data available</div>
         )}
      </div>
    </div>
  );
};