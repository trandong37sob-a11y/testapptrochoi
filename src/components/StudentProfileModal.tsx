import React, { useState } from 'react';
import { X, User, School, Sparkles, Check } from 'lucide-react';
import { StudentProfile } from '../types/math';

interface StudentProfileModalProps {
  isOpen: boolean;
  profile: StudentProfile;
  onSave: (profile: StudentProfile) => void;
  onClose: () => void;
}

const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🦄', '🦖', '🚀', '⭐'];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(profile.name);
  const [gradeClass, setGradeClass] = useState(profile.gradeClass);
  const [avatar, setAvatar] = useState(profile.avatar);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name: name.trim() || 'Học sinh lớp 3',
      gradeClass: gradeClass.trim() || 'Lớp 3A',
      avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-4 border-amber-300 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <h3 className="font-extrabold text-lg text-slate-800">Thông Tin Học Sinh</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Chọn hình đại diện yêu thích:
            </label>
            <div className="flex justify-between gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                    avatar === emoji
                      ? 'bg-amber-400 scale-110 shadow-sm ring-2 ring-amber-500'
                      : 'hover:bg-white'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Student name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Họ và tên học sinh:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Khang"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Lớp / Trường:
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                placeholder="Ví dụ: Lớp 3A1 - Tiểu học Lê Quý Đôn"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            💡 Tên và lớp sẽ được ghi lại tự động trên Google Sheets để thầy cô và phụ huynh dễ dàng kiểm tra kết quả bài làm.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
