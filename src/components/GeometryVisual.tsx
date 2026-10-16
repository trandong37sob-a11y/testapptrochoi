import React from 'react';

interface GeometryVisualProps {
  shape: 'rectangle' | 'square' | 'right_angle' | 'triangle';
  width?: number;
  height?: number;
  side?: number;
  unit?: string;
  showPerimeterFormula?: boolean;
  showAreaFormula?: boolean;
}

export const GeometryVisual: React.FC<GeometryVisualProps> = ({
  shape,
  width = 8,
  height = 5,
  side = 6,
  unit = 'cm',
  showPerimeterFormula,
  showAreaFormula,
}) => {
  if (shape === 'rectangle') {
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 rounded-2xl border border-blue-200/80">
        <svg width="240" height="150" viewBox="0 0 240 150" className="drop-shadow-sm">
          {/* Rectangle Body */}
          <rect
            x="35"
            y="25"
            width="170"
            height="95"
            rx="4"
            fill="#dbeafe"
            stroke="#2563eb"
            strokeWidth="3"
            strokeDasharray="none"
          />

          {/* Width label (top) */}
          <text x="120" y="18" textAnchor="middle" className="text-xs font-bold fill-blue-800">
            Chiều dài: {width} {unit}
          </text>

          {/* Height label (right) */}
          <text
            x="215"
            y="75"
            textAnchor="start"
            className="text-xs font-bold fill-blue-800"
            style={{ fontSize: '11px' }}
          >
            {height} {unit}
          </text>

          {/* Right Angle Markers at corners */}
          <path d="M 35 35 L 43 35 L 43 25" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M 197 25 L 197 35 L 205 35" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M 35 110 L 43 110 L 43 120" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M 197 120 L 197 110 L 205 110" fill="none" stroke="#3b82f6" strokeWidth="1.5" />

          {/* Center text hint */}
          <text x="120" y="75" textAnchor="middle" className="text-xs fill-blue-600 font-medium">
            Hình chữ nhật
          </text>
        </svg>

        {showAreaFormula && (
          <div className="mt-1 text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
            💡 Diện tích = Chiều dài × Chiều rộng
          </div>
        )}
        {showPerimeterFormula && (
          <div className="mt-1 text-xs px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
            💡 Chu vi = (Chiều dài + Chiều rộng) × 2
          </div>
        )}
      </div>
    );
  }

  if (shape === 'square') {
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/80">
        <svg width="180" height="150" viewBox="0 0 180 150" className="drop-shadow-sm">
          {/* Square */}
          <rect
            x="35"
            y="25"
            width="110"
            height="110"
            rx="4"
            fill="#d1fae5"
            stroke="#059669"
            strokeWidth="3"
          />

          {/* Side label */}
          <text x="90" y="18" textAnchor="middle" className="text-xs font-bold fill-emerald-800">
            Cạnh = {side} {unit}
          </text>
          <text x="155" y="82" textAnchor="start" className="text-xs font-bold fill-emerald-800">
            {side} {unit}
          </text>

          {/* Center text */}
          <text x="90" y="82" textAnchor="middle" className="text-xs fill-emerald-700 font-medium">
            Hình vuông (4 cạnh bằng nhau)
          </text>
        </svg>
        <div className="mt-1 text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">
          💡 Chu vi = Cạnh × 4 | Diện tích = Cạnh × Cạnh
        </div>
      </div>
    );
  }

  return null;
};
