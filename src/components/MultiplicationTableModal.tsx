import React, { useState } from 'react';
import { X, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { sound } from '../utils/sound';

interface MultiplicationTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiplicationTableModal: React.FC<MultiplicationTableModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTable, setSelectedTable] = useState<number>(7);
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border-4 border-indigo-400 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔢</span>
            <div>
              <h3 className="font-extrabold text-lg">Bảng Cửu Chương Lớp 3 (2 đến 9)</h3>
              <p className="text-xs text-indigo-100 font-medium">Bí kíp tính nhanh nhân chia cho các bạn nhỏ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick select tabs 2 - 9 */}
        <div className="bg-indigo-50 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-indigo-100">
          <span className="text-xs font-bold text-indigo-900 shrink-0 mr-1">Chọn bảng:</span>
          {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => {
                setSelectedTable(num);
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedTable === num
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              Bảng {num}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Detailed table view for selected number */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
            <h4 className="text-base font-extrabold text-indigo-950 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm">
                {selectedTable}
              </span>
              Bảng nhân {selectedTable} và Bảng chia {selectedTable}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Multiplication column */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Phép Nhân
                </div>
                <div className="space-y-1.5">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const m = i + 1;
                    const res = selectedTable * m;
                    return (
                      <div
                        key={m}
                        className="flex justify-between items-center text-sm font-semibold p-1 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <span className="text-slate-700">
                          {selectedTable} × {m}
                        </span>
                        <span className="text-indigo-600 font-extrabold">= {res}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Division column */}
              <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs">
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Phép Chia Tương Ứng
                </div>
                <div className="space-y-1.5">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const m = i + 1;
                    const prod = selectedTable * m;
                    return (
                      <div
                        key={m}
                        className="flex justify-between items-center text-sm font-semibold p-1 px-2.5 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <span className="text-slate-700">
                          {prod} : {selectedTable}
                        </span>
                        <span className="text-purple-600 font-extrabold">= {m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 10x10 Matrix grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800">
                Ma trận Cửu chương tương tác (Chạm ô bất kỳ để xem phép tính):
              </h4>
              {activeCell && (
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  {activeCell.r} × {activeCell.c} = {activeCell.r * activeCell.c}
                </span>
              )}
            </div>
            <div className="overflow-x-auto pb-2">
              <table className="w-full border-collapse text-center text-xs font-semibold">
                <thead>
                  <tr>
                    <th className="p-1.5 bg-slate-200 text-slate-700 rounded-tl-lg font-bold">×</th>
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((c) => (
                      <th
                        key={c}
                        className={`p-1.5 font-bold ${
                          activeCell?.c === c ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((r) => (
                    <tr key={r}>
                      <th
                        className={`p-1.5 font-bold ${
                          activeCell?.r === r ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r}
                      </th>
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((c) => {
                        const isMatch = activeCell?.r === r && activeCell?.c === c;
                        const isCross = activeCell?.r === r || activeCell?.c === c;
                        return (
                          <td
                            key={c}
                            onClick={() => {
                              setActiveCell({ r, c });
                              sound.playClick();
                            }}
                            className={`p-1.5 border border-slate-200 transition-colors cursor-pointer ${
                              isMatch
                                ? 'bg-indigo-600 text-white font-extrabold scale-110 shadow-sm'
                                : isCross
                                ? 'bg-indigo-50 text-indigo-900 font-bold'
                                : 'bg-white text-slate-700 hover:bg-indigo-50/50'
                            }`}
                          >
                            {r * c}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
