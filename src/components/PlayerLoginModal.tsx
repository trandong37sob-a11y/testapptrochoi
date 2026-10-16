import React, { useState, useEffect } from 'react';
import { User, School, Sparkles, Check, X, Users, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { StudentProfile } from '../types/math';
import { sound } from '../utils/sound';

interface PlayerLoginModalProps {
  isOpen: boolean;
  currentProfile: StudentProfile;
  onLogin: (profile: StudentProfile) => void;
  onClose: () => void;
  forcedNotice?: string;
}

const AVATARS = [
  { emoji: '🦖', name: 'Bé Rồng Rexy' },
  { emoji: '🦁', name: 'Sư Tử Simba' },
  { emoji: '🐼', name: 'Gấu Trúc Panda' },
  { emoji: '🦊', name: 'Cáo Thông Thái' },
  { emoji: '🦄', name: 'Kỳ Lân Phép Thuật' },
  { emoji: '🐯', name: 'Hổ Con Dũng Mãnh' },
  { emoji: '🚀', name: 'Phi Hành Gia' },
  { emoji: '⭐', name: 'Ngôi Sao Sáng' },
];

const QUICK_CLASSES = ['Lớp 3A1', 'Lớp 3A2', 'Lớp 3A3', 'Lớp 3B', 'Lớp 3C'];

const SAVED_PLAYERS_KEY = 'toan_lop3_saved_players';

export const PlayerLoginModal: React.FC<PlayerLoginModalProps> = ({
  isOpen,
  currentProfile,
  onLogin,
  onClose,
  forcedNotice,
}) => {
  const [name, setName] = useState(currentProfile.isLoggedIn ? currentProfile.name : '');
  const [gradeClass, setGradeClass] = useState(currentProfile.isLoggedIn ? currentProfile.gradeClass : 'Lớp 3A1');
  const [schoolName, setSchoolName] = useState(currentProfile.schoolName || '');
  const [avatar, setAvatar] = useState(currentProfile.avatar || '🦖');
  const [savedPlayers, setSavedPlayers] = useState<StudentProfile[]>([]);
  const [viewMode, setViewMode] = useState<'login' | 'saved_list'>('login');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_PLAYERS_KEY);
      if (stored) {
        setSavedPlayers(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.isLoggedIn ? currentProfile.name : '');
      setGradeClass(currentProfile.isLoggedIn ? currentProfile.gradeClass : 'Lớp 3A1');
      setSchoolName(currentProfile.schoolName || '');
      setAvatar(currentProfile.avatar || '🦖');
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const newProfile: StudentProfile = {
      name: cleanName,
      gradeClass: gradeClass.trim() || 'Lớp 3A1',
      schoolName: schoolName.trim() || 'Trường Tiểu Học',
      avatar,
      totalScore: currentProfile.totalScore || 0,
      gamesPlayed: currentProfile.gamesPlayed || 0,
      badges: currentProfile.badges || ['Chiến Binh Toán Học'],
      isLoggedIn: true,
    };

    // Save to saved players list
    try {
      const existing = savedPlayers.filter((p) => p.name.toLowerCase() !== cleanName.toLowerCase());
      const updatedList = [newProfile, ...existing].slice(0, 8);
      localStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(updatedList));
      setSavedPlayers(updatedList);
    } catch (err) {
      console.error(err);
    }

    sound.playLevelUp();
    onLogin(newProfile);
    onClose();
  };

  const handleSelectSavedPlayer = (player: StudentProfile) => {
    sound.playClick();
    onLogin({
      ...player,
      isLoggedIn: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border-4 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-6 py-4 flex items-center justify-between text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/80 shadow-md flex items-center justify-center text-2xl border border-white">
              🎒
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl tracking-tight">
                Đăng Nhập Người Chơi
              </h3>
              <p className="text-xs text-amber-900 font-semibold">
                Ghi danh học sinh & tự động lưu điểm Google Sheets
              </p>
            </div>
          </div>
          {currentProfile.isLoggedIn && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-amber-500/40 text-amber-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notice banner if forced to login before starting game */}
        {forcedNotice && (
          <div className="bg-amber-100 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span>{forcedNotice}</span>
          </div>
        )}

        {/* Quick Switch Tab: Nhập mới vs Danh sách học sinh cũ */}
        {savedPlayers.length > 0 && (
          <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'login'
                  ? 'border-amber-500 text-amber-950 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Nhập thông tin học sinh
            </button>
            <button
              type="button"
              onClick={() => setViewMode('saved_list')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'saved_list'
                  ? 'border-amber-500 text-amber-950 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Chọn nhanh học sinh ({savedPlayers.length})
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {viewMode === 'saved_list' && savedPlayers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold">
                Bấm vào tên học sinh bên dưới để đăng nhập ngay mà không cần nhập lại:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {savedPlayers.map((player, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSavedPlayer(player)}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-amber-50 rounded-2xl border border-slate-200 hover:border-amber-400 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-3xl p-1 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      {player.avatar}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 truncate">
                        {player.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {player.gradeClass} {player.schoolName ? `• ${player.schoolName}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                + Nhập học sinh mới
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Choose Mascot / Avatar */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">
                  1. Chọn linh vật đại diện:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-amber-50/60 rounded-2xl border border-amber-200">
                  {AVATARS.map((av) => (
                    <button
                      key={av.emoji}
                      type="button"
                      onClick={() => {
                        setAvatar(av.emoji);
                        sound.playClick();
                      }}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center text-2xl transition-all cursor-pointer ${
                        avatar === av.emoji
                          ? 'bg-amber-400 scale-110 shadow-md ring-2 ring-amber-600'
                          : 'hover:bg-white'
                      }`}
                      title={av.name}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  2. Họ và tên học sinh <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Minh Khang, Trần Gia Bảo..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Class Selection & Custom Class */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  3. Lớp học:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setGradeClass(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        gradeClass === cls
                          ? 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    placeholder="Hoặc tự gõ tên lớp (ví dụ: Lớp 3A4, Lớp 3 Dolphin...)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* School (Optional) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  4. Trường tiểu học (tùy chọn):
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ví dụ: Tiểu học Lê Quý Đôn, Tiểu học Kim Đồng..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Google Sheets note */}
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Thông tin học sinh sẽ được tự động đồng bộ theo thời gian thực vào bảng điểm Google Sheets sau mỗi vòng thi!
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {currentProfile.isLoggedIn && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Xác Nhận & Vào Học Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
