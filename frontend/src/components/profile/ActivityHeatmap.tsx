import React, { useMemo } from 'react';

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const today = new Date();
  const days = 365;
  
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.date, d.count));
    return map;
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/40';
    if (count < 3) return 'bg-indigo-900/60';
    if (count < 6) return 'bg-indigo-700/80';
    if (count < 10) return 'bg-indigo-500';
    return 'bg-indigo-400';
  };

  const calendarDays = useMemo(() => {
    const arr = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      arr.push({ date: iso, count: activityMap.get(iso) || 0 });
    }
    return arr;
  }, [activityMap]);

  return (
    <div className="flex flex-col space-y-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .heatmap-cell {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
          Submission Activity
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-800/40"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-900/60"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-700/80"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-2xl overflow-x-auto custom-scrollbar">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
          {calendarDays.map((day, idx) => (
            <div
              key={day.date}
              style={{ animationDelay: `${idx * 1}ms` }}
              className={`heatmap-cell w-3.5 h-3.5 rounded-[3px] cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-indigo-400/50 hover:scale-125 ${getColor(day.count)}`}
              title={`${day.date}: ${day.count} solved`}
            />
          ))}
        </div>
        
        <div className="flex justify-between mt-4 text-[10px] uppercase tracking-wider text-slate-500 font-medium px-1">
          {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(m => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
