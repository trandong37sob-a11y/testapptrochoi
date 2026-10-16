import React from 'react';

interface BillItem {
  value: number;
  count: number;
}

interface MoneyVisualProps {
  bills: BillItem[];
}

export const MoneyVisual: React.FC<MoneyVisualProps> = ({ bills }) => {
  const getBillColor = (val: number) => {
    switch (val) {
      case 5000:
        return 'from-blue-600 to-indigo-700 text-white border-blue-400';
      case 10000:
        return 'from-amber-600 to-yellow-700 text-white border-amber-400';
      case 20000:
        return 'from-cyan-600 to-teal-700 text-white border-cyan-400';
      case 50000:
        return 'from-rose-500 to-pink-600 text-white border-rose-300';
      default:
        return 'from-emerald-600 to-green-700 text-white border-green-400';
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-amber-50/40 rounded-2xl border border-amber-200/60">
      {bills.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div
            className={`w-24 h-14 rounded-lg bg-gradient-to-r ${getBillColor(
              item.value
            )} shadow-md border flex flex-col justify-between p-1.5 transform hover:scale-105 transition-transform`}
          >
            <div className="text-[10px] tracking-wider uppercase opacity-90 font-bold">
              VIỆT NAM
            </div>
            <div className="text-center font-black text-sm tracking-tight drop-shadow-sm">
              {item.value.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[9px] text-right opacity-80 font-mono">NGÂN HÀNG</div>
          </div>
          <span className="mt-1 text-xs font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
            × {item.count} tờ
          </span>
        </div>
      ))}
    </div>
  );
};
