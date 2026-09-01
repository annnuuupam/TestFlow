import React, { useMemo } from 'react';

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LEVELS = [
  { min: 0, cls: 'bg-secondary' },
  { min: 1, cls: 'bg-indigo-500/30' },
  { min: 3, cls: 'bg-indigo-500/50' },
  { min: 6, cls: 'bg-indigo-500/80' },
  { min: 10, cls: 'bg-indigo-500' },
];

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const today = new Date();
  const days = 365;

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.date, d.count));
    return map;
  }, [data]);

  const getColor = (count: number) => {
    let cls = LEVELS[0].cls;
    for (const level of LEVELS) {
      if (count >= level.min) cls = level.cls;
    }
    return cls;
  };

  const calendarDays = useMemo(() => {
    const arr: { date: string; count: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      arr.push({ date: iso, count: activityMap.get(iso) || 0 });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityMap]);

  const monthLabels = useMemo(() => {
    if (calendarDays.length === 0) return [];
    const totalCols = Math.ceil(calendarDays.length / 7);
    const denom = totalCols > 1 ? totalCols - 1 : 1;
    const out: { text: string; left: number }[] = [];
    let current = calendarDays[0].date.slice(0, 7);
    out.push({ text: MONTH_NAMES[parseInt(current.slice(5), 10) - 1], left: 0 });
    calendarDays.forEach((d, i) => {
      const m = d.date.slice(0, 7);
      if (m !== current) {
        current = m;
        out.push({ text: MONTH_NAMES[parseInt(m.slice(5), 10) - 1], left: (Math.floor(i / 7) / denom) * 100 });
      }
    });
    return out;
  }, [calendarDays]);

  return (
    <div className="flex flex-col space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
          Submission Activity
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {LEVELS.map((level, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${level.cls}`}></div>
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto custom-scrollbar">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
          {calendarDays.map((day, idx) => (
            <div
              key={day.date}
              style={{ animationDelay: `${idx * 1}ms` }}
              className={`animate-fade-in w-3.5 h-3.5 rounded-[3px] cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-indigo-400/50 hover:scale-125 ${getColor(day.count)}`}
              title={`${day.date}: ${day.count} solved`}
            />
          ))}
        </div>

        <div className="relative h-5 mt-4 text-[10px] uppercase tracking-wider text-muted-foreground font-medium select-none">
          {monthLabels.map((m, i) => (
            <span key={i} className="absolute -translate-x-1/2" style={{ left: `${m.left}%` }}>
              {m.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;