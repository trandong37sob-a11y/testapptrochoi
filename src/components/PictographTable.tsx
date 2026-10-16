import React from 'react';

interface PictographTableProps {
  headers: string[];
  rows: (string | number)[][];
}

export const PictographTable: React.FC<PictographTableProps> = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto w-full max-w-md mx-auto my-2 rounded-xl border border-sky-200 bg-sky-50/50 shadow-xs">
      <table className="w-full text-center text-sm">
        <thead className="bg-sky-500 text-white font-semibold">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 border-r last:border-none border-sky-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-100 bg-white/80">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-sky-50/80 transition-colors">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-3 py-2.5 font-medium ${
                    cIdx === 0 ? 'text-slate-700 font-bold' : 'text-sky-700'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
