import React from 'react';

interface ClockVisualProps {
  hours: number;
  minutes: number;
  size?: number;
}

export const ClockVisual: React.FC<ClockVisualProps> = ({ hours, minutes, size = 180 }) => {
  const center = size / 2;
  const radius = center - 12;

  // Angles: 360 deg in circle
  // Minute hand: 6 deg per minute
  const minuteAngle = minutes * 6;
  // Hour hand: 30 deg per hour + 0.5 deg per minute
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 shadow-inner">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
        {/* Outer Ring */}
        <circle cx={center} cy={center} r={radius} fill="#ffffff" stroke="#3b82f6" strokeWidth="6" />
        <circle cx={center} cy={center} r={radius - 4} fill="#f8fafc" stroke="#93c5fd" strokeWidth="1.5" />

        {/* 60 Minute Ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 6 * Math.PI) / 180;
          const isHour = i % 5 === 0;
          const tickLen = isHour ? 8 : 4;
          const x1 = center + (radius - 8) * Math.sin(angle);
          const y1 = center - (radius - 8) * Math.cos(angle);
          const x2 = center + (radius - 8 - tickLen) * Math.sin(angle);
          const y2 = center - (radius - 8 - tickLen) * Math.cos(angle);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isHour ? '#1e3a8a' : '#94a3b8'}
              strokeWidth={isHour ? 2.5 : 1}
            />
          );
        })}

        {/* Numbers 1 - 12 */}
        {Array.from({ length: 12 }).map((_, i) => {
          const num = i + 1;
          const angle = (num * 30 * Math.PI) / 180;
          const dist = radius - 24;
          const x = center + dist * Math.sin(angle);
          const y = center - dist * Math.cos(angle) + 5;

          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-xs font-bold fill-slate-800 select-none"
              style={{ fontSize: '13px', fontWeight: 700 }}
            >
              {num}
            </text>
          );
        })}

        {/* Hour Hand (Kim ngắn - màu đỏ) */}
        <g transform={`rotate(${hourAngle} ${center} ${center})`}>
          <line
            x1={center}
            y1={center + 8}
            x2={center}
            y2={center - (radius * 0.52)}
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Arrow top */}
          <polygon
            points={`${center},${center - (radius * 0.58)} ${center - 4},${center - (radius * 0.48)} ${center + 4},${center - (radius * 0.48)}`}
            fill="#ef4444"
          />
        </g>

        {/* Minute Hand (Kim dài - màu xanh dương) */}
        <g transform={`rotate(${minuteAngle} ${center} ${center})`}>
          <line
            x1={center}
            y1={center + 10}
            x2={center}
            y2={center - (radius * 0.76)}
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Arrow top */}
          <polygon
            points={`${center},${center - (radius * 0.82)} ${center - 3.5},${center - (radius * 0.72)} ${center + 3.5},${center - (radius * 0.72)}`}
            fill="#2563eb"
          />
        </g>

        {/* Center Pivot */}
        <circle cx={center} cy={center} r="6" fill="#1e293b" />
        <circle cx={center} cy={center} r="2.5" fill="#facc15" />
      </svg>
      <div className="flex gap-4 mt-2 text-xs font-medium">
        <span className="flex items-center gap-1 text-red-600">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Kim ngắn: Giờ
        </span>
        <span className="flex items-center gap-1 text-blue-600">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Kim dài: Phút
        </span>
      </div>
    </div>
  );
};
