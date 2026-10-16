/**
 * Đấu Trường Toán Lớp 3 - Grade 3 Math Learning Game with Google Sheets Integration
 */
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Trophy,
  BookOpen,
  Zap,
  Grid,
  FileSpreadsheet,
  Award,
  ChevronRight,
  Sparkles,
  Users,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  UserCheck,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { MATH_TOPICS, TopicId, StudentProfile } from './types/math';
import { initAuth, getAccessToken, googleSignIn } from './services/firebase';
import { findOrCreateMathSpreadsheet, getSavedSpreadsheetId } from './services/sheetsService';
import { GameArena } from './components/GameArena';
import { SheetsDashboard } from './components/SheetsDashboard';
import { MultiplicationTableModal } from './components/MultiplicationTableModal';
import { PlayerLoginModal } from './components/PlayerLoginModal';
import { RealTimeClock } from './components/RealTimeClock';

type NavTab = 'home' | 'topics' | 'speed' | 'sheets';

const INITIAL_PROFILE: StudentProfile = {
  name: '',
  gradeClass: 'Lớp 3A1',
  schoolName: '',
  avatar: '🦖',
  totalScore: 0,
  gamesPlayed: 0,
  badges: ['Chiến Binh Toán Học'],
  isLoggedIn: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSpreadsheetId());

  // Player Profile
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('toan_lop3_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.name.trim().length > 0) {
          return { ...parsed, isLoggedIn: true };
        }
      }
      return INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForcedNotice, setLoginForcedNotice] = useState<string | undefined>(undefined);
  const [pendingGameToStart, setPendingGameToStart] = useState<{
    topicId: TopicId;
    topicName: string;
    mode: 'arena' | 'practice' | 'speed';
  } | null>(null);

  // Active Game State
  const [activeGame, setActiveGame] = useState<{
    topicId: TopicId;
    topicName: string;
    mode: 'arena' | 'practice' | 'speed';
  } | null>(null);

  // Multiplication table modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Init Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        // Find or create sheet
        findOrCreateMathSpreadsheet(token)
          .then((s) => setSpreadsheetId(s.id))
          .catch((err) => console.warn('Could not auto-fetch sheet:', err));
      },
      () => {
        // Not logged in or logged out
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSaveProfile = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('toan_lop3_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error(e);
    }

    // If there was a pending game waiting for login, start it!
    if (pendingGameToStart) {
      setActiveGame(pendingGameToStart);
      setPendingGameToStart(null);
    }
  };

  const handleStartGame = (topicId: TopicId, topicName: string, mode: 'arena' | 'practice' | 'speed') => {
    if (!profile.isLoggedIn || !profile.name.trim()) {
      setLoginForcedNotice('Vui lòng đăng nhập họ và tên của bạn để hệ thống ghi nhận điểm số lên Google Sheets nhé!');
      setPendingGameToStart({ topicId, topicName, mode });
      setIsLoginModalOpen(true);
      return;
    }

    setActiveGame({
      topicId,
      topicName,
      mode,
    });
  };

  const handleConnectSheet = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        const sheet = await findOrCreateMathSpreadsheet(res.accessToken);
        setSpreadsheetId(sheet.id);
        setActiveTab('sheets');
      }
    } catch (e: any) {
      if (
        e?.code !== 'auth/popup-closed-by-user' &&
        e?.code !== 'auth/cancelled-popup-request' &&
        !e?.message?.includes('popup-closed-by-user')
      ) {
        console.warn('Google connect failed:', e);
      }
    }
  };

  // If in game, render GameArena
  if (activeGame) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-amber-50/30 to-indigo-50/40 text-slate-800">
        <GameArena
          topicId={activeGame.topicId}
          topicName={activeGame.topicName}
          gameMode={activeGame.mode}
          profile={profile}
          accessToken={accessToken}
          spreadsheetId={spreadsheetId}
          onExit={() => setActiveGame(null)}
          onViewSheet={() => {
            setActiveGame(null);
            setActiveTab('sheets');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-amber-50/20 to-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-md border-2 border-amber-300">
              🦖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                  Đấu Trường Toán Lớp 3
                </h1>
                <span className="hidden lg:inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Tiểu học 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Học vui - Nhớ lâu - Điểm cao</p>
            </div>
          </div>

          {/* Real-Time Live Clock Widget */}
          <div className="hidden md:flex">
            <RealTimeClock />
          </div>

          {/* Quick Info: Player Login + Google Sheets status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Player Login / Profile Badge */}
            {profile.isLoggedIn ? (
              <button
                onClick={() => {
                  setLoginForcedNotice(undefined);
                  setIsLoginModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-2xl transition-all cursor-pointer shadow-xs group"
                title="Bấm để đổi học sinh hoặc sửa thông tin"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{profile.avatar}</span>
                <div className="text-left text-xs leading-tight">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    {profile.name}
                    <span className="text-[10px] text-amber-600 font-bold hidden sm:inline">(Đổi)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{profile.gradeClass}</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setLoginForcedNotice(undefined);
                  setIsLoginModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer transform hover:scale-102 ring-2 ring-amber-300"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập Họ Tên</span>
              </button>
            )}

            {/* Google Sheets Status chip */}
            {user ? (
              <button
                onClick={() => setActiveTab('sheets')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
                title="Bảng điểm Google Sheets đã kết nối"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Google Sheet: Đã nối</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>
            ) : (
              <button
                onClick={handleConnectSheet}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                title="Nối Google Sheet để lưu kết quả"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Nối Google Sheet</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Live Clock for Mobile */}
        <div className="md:hidden px-4 py-1 border-t border-slate-100 flex justify-center bg-slate-50/50">
          <RealTimeClock />
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs sm:text-sm font-bold border-t border-slate-100 py-1.5">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🏠</span> Trang Chủ
          </button>

          <button
            onClick={() => setActiveTab('topics')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'topics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> 6 Chủ Đề Lớp 3
          </button>

          <button
            onClick={() => setActiveTab('speed')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'speed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Đua Tốc Độ 60s
          </button>

          <button
            onClick={() => setIsTableModalOpen(true)}
            className="px-3 sm:px-4 py-2 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-500" /> Bảng Cửu Chương
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`ml-auto px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Kiểm Tra Điểm (Google Sheet)
          </button>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: HOME (Trang Chủ & Đấu Trường) */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Player Login Prompt Banner if not logged in */}
            {!profile.isLoggedIn && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-amber-300">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0">
                    👋
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg">
                      Chào bạn nhỏ! Hãy đăng nhập họ tên để bắt đầu lưu điểm số nhé!
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-100 font-medium">
                      Nhập họ và tên, chọn lớp để mọi kết quả bài làm tự động lưu thời gian thực vào Google Sheets.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLoginForcedNotice(undefined);
                    setIsLoginModalOpen(true);
                  }}
                  className="py-2.5 px-5 bg-white hover:bg-amber-50 text-slate-900 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
                >
                  Đăng Nhập Học Sinh Ngay
                </button>
              </div>
            )}

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xl relative overflow-hidden border-4 border-amber-200">
              <div className="max-w-xl relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black text-amber-950 border border-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Trò chơi học tập bổ trợ Toán lớp 3
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {profile.isLoggedIn
                    ? `Chào mừng ${profile.name} (${profile.gradeClass})! Cùng bứt phá điểm 10 nhé!`
                    : 'Đấu Trường Toán Học Lớp 3 - Chinh Phục Điểm 10!'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-800/90 leading-relaxed">
                  Trải nghiệm 10 câu hỏi thử thách đa dạng mọi chủ đề: Bảng nhân chia, số 100.000, chu vi - diện tích, xem giờ, giải toán có lời văn và thống kê!
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleStartGame('all', 'Đấu Trường Toán Học Tổng Hợp', 'arena')}
                    className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer transform hover:scale-102"
                  >
                    <Play className="w-5 h-5 fill-white" /> VÀO ĐẤU TRƯỜNG NGAY (10 CÂU)
                  </button>
                  <button
                    onClick={() => setActiveTab('sheets')}
                    className="py-3 px-4 bg-white/80 hover:bg-white text-slate-900 font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Bảng Điểm Học Sinh
                  </button>
                </div>
              </div>

              {/* Big Mascot Graphic */}
              <div className="absolute right-3 bottom-0 sm:bottom-2 select-none pointer-events-none opacity-90 sm:opacity-100">
                <span className="text-8xl sm:text-9xl drop-shadow-lg">{profile.avatar || '🦖'}</span>
              </div>
            </div>

            {/* Quick 3 Play Modes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Đấu trường */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl mb-3 shadow-inner">
                    🏆
                  </div>
                  <h3 className="font-black text-base text-slate-900">Đấu Trường 10 Câu</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Thử thách kết hợp ngẫu nhiên các chủ đề. Tích lũy combo chuỗi đúng để nhận huy hiệu sao vàng!
                  </p>
                </div>
                <button
                  onClick={() => handleStartGame('all', 'Đấu Trường 10 Câu', 'arena')}
                  className="mt-4 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Bắt đầu chơi <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 2: Luyện tập theo chủ đề */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-3 shadow-inner">
                    📚
                  </div>
                  <h3 className="font-black text-base text-slate-900">Luyện Tập Theo Chủ Đề</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Ôn sâu từng chuyên đề: Nhân chia, Số 100.000, Hình học, Đồng hồ, Lời văn 2 bước...
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('topics')}
                  className="mt-4 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Chọn chủ đề <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 3: Đua tốc độ 60s */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-3 shadow-inner">
                    ⚡
                  </div>
                  <h3 className="font-black text-base text-slate-900">Đua Tốc Độ 60 Giây</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Đồng hồ đếm ngược 60 giây! Trả lời nhanh nhiều câu hỏi nhất để rèn phản xạ tính nhẩm.
                  </p>
                </div>
                <button
                  onClick={() => handleStartGame('all', 'Đua Tốc Độ 60s', 'speed')}
                  className="mt-4 w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Thách đấu 60s <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Preview of 6 Topics */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900">Tất Cả Chủ Đề Toán Lớp 3</h3>
                  <p className="text-xs text-slate-500 font-medium">Bám sát chương trình Giáo dục Tiểu học mới</p>
                </div>
                <button
                  onClick={() => setActiveTab('topics')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Xem tất cả →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MATH_TOPICS.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleStartGame(topic.id, topic.name, 'practice')}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="text-3xl shrink-0 p-2 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                      {topic.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {topic.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{topic.shortDesc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Sheets Integration Highlights */}
            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base text-emerald-950">
                    Kiểm Tra & Theo Dõi Kết Quả Học Sinh Qua Google Sheets
                  </h4>
                  <p className="text-xs text-emerald-800 font-medium mt-0.5">
                    Thầy cô và phụ huynh có thể xem điểm số thời gian thực ngay trong ứng dụng hoặc mở trực tiếp trên Google Sheets để lưu trữ lâu dài.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('sheets')}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Mở Bảng Kiểm Tra Kết Quả
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TOPICS (6 Chủ Đề Lớp 3) */}
        {activeTab === 'topics' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Chọn Chủ Đề Luyện Tập
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Chọn một trong 6 chủ đề toán lớp 3 dưới đây để bắt đầu bài luyện tập tương ứng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MATH_TOPICS.map((topic, idx) => (
                <div
                  key={topic.id}
                  className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">{topic.icon}</span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        Chủ đề {idx + 1}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mb-1">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {topic.shortDesc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleStartGame(topic.id, topic.name, 'practice')}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" /> Luyện tập 10 câu
                    </button>
                    <button
                      onClick={() => handleStartGame(topic.id, topic.name, 'speed')}
                      className="py-2.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      title="Đua tốc độ 60 giây chủ đề này"
                    >
                      ⚡ 60s
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SPEED RUSH (Đua Tốc Độ 60s) */}
        {activeTab === 'speed' && (
          <div className="max-w-xl mx-auto py-6 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 text-white flex items-center justify-center text-4xl shadow-xl border-4 border-amber-200">
              ⚡
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Thử Thách Đua Tốc Độ 60 Giây!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Đồng hồ sẽ đếm ngược từ 60 giây. Bạn có 60 giây để trả lời đúng càng nhiều câu toán lớp 3 càng tốt. Điểm số sẽ được ghi danh vào Google Sheets!
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 text-sm">Luật chơi:</div>
              <p>• Mỗi câu trả lời đúng được cộng 10 điểm.</p>
              <p>• Trả lời đúng liên tiếp tạo Combo x1.2 - x1.5 điểm thưởng!</p>
              <p>• Có bảng nháp thông minh khi cần tính toán phép nhân, phép chia.</p>
            </div>

            <button
              onClick={() => handleStartGame('all', 'Đua Tốc Độ 60s', 'speed')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl shadow-xl transition-all text-base flex items-center justify-center gap-2 cursor-pointer transform hover:scale-102"
            >
              <Zap className="w-5 h-5 fill-white" /> BẮT ĐẦU ĐUA TỐC ĐỘ NGAY
            </button>
          </div>
        )}

        {/* TAB 4: SHEETS DASHBOARD (Kiểm Tra Kết Quả Học Sinh) */}
        {activeTab === 'sheets' && (
          <SheetsDashboard
            user={user}
            accessToken={accessToken}
            onAuthChange={(newUser, newToken) => {
              setUser(newUser);
              setAccessToken(newToken);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🎮 Đấu Trường Toán Lớp 3 • Chương trình Tiểu học Việt Nam</span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Đồng bộ & kiểm tra điểm thời gian thực trên Google Sheets
          </span>
        </div>
      </footer>

      {/* Multiplication Table Modal */}
      <MultiplicationTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      {/* Player Login / Profile Modal */}
      <PlayerLoginModal
        isOpen={isLoginModalOpen}
        currentProfile={profile}
        onLogin={handleSaveProfile}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginForcedNotice(undefined);
          setPendingGameToStart(null);
        }}
        forcedNotice={loginForcedNotice}
      />
    </div>
  );
}
