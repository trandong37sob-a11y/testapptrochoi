import React, { useState, useEffect } from 'react';
import { Clock, Radio } from 'lucide-react';

export const RealTimeClock: React.FC = () => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds}`);

      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[now.getDay()];
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      setDateStr(`${dayName}, ${day}/${month}/${year}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/5 hover:bg-slate-900/10 rounded-xl text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60 shadow-2xs">
      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-emerald-700 font-extrabold">
          Live
        </span>
      </div>
      <div className="flex items-center gap-1 text-slate-800 font-mono font-bold">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>{timeStr}</span>
      </div>
      <span className="text-slate-300 hidden md:inline">|</span>
      <span className="text-[11px] text-slate-500 font-medium hidden md:inline">{dateStr}</span>
    </div>
  );
};
