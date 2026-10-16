import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Download,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  UserCheck,
  LogOut,
  HelpCircle,
  Copy,
  Radio,
  BellRing,
  Server,
  Settings,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  StudentResult,
  findOrCreateMathSpreadsheet,
  fetchResultsFromSheet,
  getLocalResults,
  getSavedSpreadsheetId,
  setSavedSpreadsheetId,
  appendResultToSheet,
  fetchServerResults,
  fetchServerConfig,
} from '../services/sheetsService';
import { googleSignIn, logout, getAccessToken } from '../services/firebase';
import { ServerSheetConfigModal } from './ServerSheetConfigModal';

interface SheetsDashboardProps {
  user: User | null;
  accessToken: string | null;
  onAuthChange: (user: User | null, token: string | null) => void;
}

// Helper to format relative time for real-time display
const formatRelativeTime = (timestamp: string): string => {
  if (!timestamp) return 'Gần đây';
  try {
    const parts = timestamp.split(' ');
    if (parts.length >= 2) {
      const [d, m, y] = parts[0].split('/').map(Number);
      const [hh, mm] = parts[1].split(':').map(Number);
      const date = new Date(y, m - 1, d, hh, mm);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60 && diffSec >= 0) return 'Vừa xong';
      if (diffSec < 3600 && diffSec >= 0) return `${Math.floor(diffSec / 60)} phút trước`;
      if (diffSec < 86400 && diffSec >= 0) return `${Math.floor(diffSec / 3600)} giờ trước`;
    }
  } catch {
    // ignore
  }
  return timestamp;
};

export const SheetsDashboard: React.FC<SheetsDashboardProps> = ({
  user,
  accessToken,
  onAuthChange,
}) => {
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<{ id: string; name: string; url: string } | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Server Google Sheet configuration state
  const [serverConfig, setServerConfig] = useState<{
    googleSheetWebhookUrl: string;
    googleSheetUrl: string;
    autoSyncEnabled: boolean;
  } | null>(null);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);

  // Real-time synchronization
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [newResultToast, setNewResultToast] = useState<string | null>(null);
  const prevCountRef = useRef<number>(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  // Load results from server + Google Sheets + local cache
  const loadData = async (token: string | null, isSilent = false) => {
    if (!isSilent) {
      setErrorMsg(null);
      setLoading(true);
    }

    try {
      // 1. Fetch server configuration
      const cfg = await fetchServerConfig();
      if (cfg) {
        setServerConfig(cfg);
      }

      // 2. Fetch server-recorded results from all students
      const serverList = await fetchServerResults();

      // 3. If teacher is logged in via OAuth, query direct Google Sheet
      let directSheetResults: StudentResult[] = [];
      if (token) {
        try {
          const sheet = await findOrCreateMathSpreadsheet(token);
          setSpreadsheetInfo(sheet);
          directSheetResults = await fetchResultsFromSheet(token, sheet.id);
        } catch (err: any) {
          if (!isSilent) console.warn('Could not fetch direct sheet:', err);
        }
      }

      const localList = getLocalResults();

      // Merge and deduplicate records by ID or composite key
      const pool = [...serverList, ...directSheetResults, ...localList];
      const uniqueMap = new Map<string, StudentResult>();
      pool.forEach((r) => {
        const key = r.id || `${r.timestamp}-${r.studentName}-${r.score}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, r);
        }
      });

      const merged = Array.from(uniqueMap.values());

      if (prevCountRef.current > 0 && merged.length > prevCountRef.current) {
        const newest = merged[0];
        setNewResultToast(`🎉 ${newest.studentName} vừa hoàn thành: ${newest.score}đ (${newest.topicName})`);
        setTimeout(() => setNewResultToast(null), 5000);
      }
      prevCountRef.current = merged.length;
      setResults(merged);
    } catch (err: any) {
      if (!isSilent) {
        console.error('Error loading data:', err);
        setErrorMsg(err.message || 'Không thể đồng bộ dữ liệu');
      }
      setResults(getLocalResults());
    }

    setLastSyncTime(new Date());
    if (!isSilent) {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData(accessToken);
  }, [accessToken]);

  // Real-time live polling interval (every 10 seconds)
  useEffect(() => {
    if (!isLiveSync) return;

    const interval = setInterval(() => {
      loadData(accessToken, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLiveSync, accessToken]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const authRes = await googleSignIn();
      if (authRes) {
        onAuthChange(authRes.user, authRes.accessToken);
        await loadData(authRes.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onAuthChange(null, null);
    setSpreadsheetInfo(null);
    setResults(getLocalResults());
  };

  const handleSyncOfflineData = async () => {
    if (!accessToken || !spreadsheetInfo) return;
    setSyncing(true);
    try {
      const localResults = getLocalResults();
      for (const res of localResults) {
        await appendResultToSheet(accessToken, spreadsheetInfo.id, res);
      }
      await loadData(accessToken, true);
    } catch (err: any) {
      setErrorMsg('Đồng bộ thất bại: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyLink = () => {
    const url = serverConfig?.googleSheetUrl || spreadsheetInfo?.url;
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = [
      'Thời Gian',
      'Họ Và Tên',
      'Lớp',
      'Chủ Đề',
      'Chế Độ',
      'Điểm',
      'Số Câu Đúng',
      'Tổng Số Câu',
      'Tỷ Lệ',
      'Thời Gian (s)',
      'Xếp Loại',
      'Ghi Chú',
    ];
    const rows = results.map((r) => [
      r.timestamp,
      `"${r.studentName}"`,
      `"${r.gradeClass}"`,
      `"${r.topicName}"`,
      `"${r.gameMode}"`,
      r.score,
      r.correctCount,
      r.totalQuestions,
      `${r.accuracy}%`,
      r.timeSpentSeconds,
      `"${r.rating}"`,
      `"${r.weakPoints || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Diem_Toan_Lop_3_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered results
  const filtered = results.filter((item) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.gradeClass.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTopic = selectedTopic === 'all' || item.topicName.includes(selectedTopic);
    const matchRating = selectedRating === 'all' || item.rating.includes(selectedRating);
    return matchSearch && matchTopic && matchRating;
  });

  // Analytics calculation
  const totalSubmissions = results.length;
  const avgScore = totalSubmissions > 0 ? Math.round(results.reduce((acc, c) => acc + c.score, 0) / totalSubmissions) : 0;
  const highScorers = results.filter((r) => r.accuracy >= 90).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-2">
      {/* Real-time Toast Banner when new result arrives */}
      {newResultToast && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <BellRing className="w-5 h-5 text-emerald-200 animate-bounce" />
            <span>{newResultToast}</span>
          </div>
          <button
            onClick={() => setNewResultToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-white/20 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Top Banner: Google Sheets Server & Real-time Live Sync */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <FileSpreadsheet className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Kiểm Tra Kết Quả Học Sinh
                </h2>
                {/* Live Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-xs font-extrabold border border-emerald-300/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>Cập nhật thời gian thực</span>
                </div>
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl font-medium">
                Tự động lưu điểm, xếp loại và thời gian làm bài của học sinh trực tiếp vào Google Sheet trên máy chủ của bạn.
              </p>
            </div>
          </div>

          {/* Teacher Server Settings Button & Auth */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsServerConfigOpen(true)}
              className="py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer border border-white/40 transform hover:scale-102"
            >
              <Server className="w-4 h-4 text-emerald-700" />
              <span>Cấu Hình Google Sheet Máy Chủ</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-xs">
                <span className="font-bold truncate max-w-[120px]">{user.displayName || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
                  title="Đăng xuất Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Server Google Sheet Status Strip */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-300 font-bold">📡 Máy chủ Google Sheet:</span>
            {serverConfig?.googleSheetWebhookUrl ? (
              <span className="font-extrabold bg-emerald-500/40 text-white px-3 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 border border-emerald-300/40">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Đang tự động cập nhật vào Google Sheet
              </span>
            ) : (
              <span className="font-semibold bg-amber-500/30 text-amber-100 px-3 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 border border-amber-300/30">
                <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                Chưa gắn Google Sheet máy chủ (Bấm "Cấu hình" ở trên để gắn trong 1 phút)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(serverConfig?.googleSheetUrl || spreadsheetInfo?.url) && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors cursor-pointer"
                  title="Sao chép liên kết bảng tính"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedUrl ? 'Đã chép link!' : 'Chép link Sheet'}
                </button>
                <a
                  href={serverConfig?.googleSheetUrl || spreadsheetInfo?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở Google Sheets
                </a>
              </>
            )}
            <button
              onClick={() => loadData(accessToken, false)}
              className="p-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors cursor-pointer"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Thông báo: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalSubmissions}</div>
            <div className="text-xs font-semibold text-slate-500">Lượt nộp bài</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{avgScore}đ</div>
            <div className="text-xs font-semibold text-slate-500">Điểm trung bình</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{highScorers}</div>
            <div className="text-xs font-semibold text-slate-500">Điểm giỏi (≥90%)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {results.length > 0 ? Array.from(new Set(results.map((r) => r.studentName))).length : 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Học sinh tham gia</div>
          </div>
        </div>
      </div>

      {/* Filter and Real-Time Sync Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search by name/class */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, lớp (ví dụ: Bảo An, 3A2)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Real-time sync toggle & export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLiveSync(!isLiveSync)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isLiveSync
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Tự động đồng bộ kết quả mới mỗi 10 giây"
            >
              <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{isLiveSync ? 'Live Sync (10s)' : 'Tự động sync: Tắt'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={results.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Xuất file CSV
            </button>
            {user && (
              <button
                onClick={handleSyncOfflineData}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors border border-emerald-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Đồng bộ vào Sheet
              </button>
            )}
          </div>
        </div>

        {/* Dropdown filters & sync status info */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc theo:
          </span>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">Tất cả chủ đề</option>
            <option value="Bảng Nhân">Bảng Nhân - Bảng Chia</option>
            <option value="100.000">Số trong phạm vi 100.000</option>
            <option value="Hình Học">Hình học & Đo lường</option>
            <option value="Thời Gian">Thời gian & Lịch</option>
            <option value="Lời Văn">Toán có lời văn</option>
            <option value="Thống Kê">Thống kê & Xác suất</option>
          </select>

          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">Tất cả xếp loại</option>
            <option value="Xuất Sắc">Xuất Sắc ⭐⭐⭐</option>
            <option value="Giỏi">Giỏi ⭐⭐</option>
            <option value="Đạt">Đạt ⭐</option>
            <option value="Cần Cố Gắng">Cần Cố Gắng</option>
          </select>

          <div className="ml-auto flex items-center gap-3 text-slate-500 font-bold">
            <span>Hiển thị: {filtered.length} kết quả</span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              (Lần kiểm tra gần nhất: {lastSyncTime.toLocaleTimeString('vi-VN')})
            </span>
          </div>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Học sinh & Lớp</th>
                <th className="py-3 px-4">Chủ đề & Chế độ</th>
                <th className="py-3 px-4 text-center">Điểm số</th>
                <th className="py-3 px-4 text-center">Tỷ lệ đúng</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4">Xếp loại</th>
                <th className="py-3 px-4">Lưu ý / Cần ôn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Chưa có kết quả làm bài nào</p>
                      <p className="text-xs text-slate-400">
                        Khi học sinh tham gia chơi trò chơi toán học, kết quả sẽ tự động gửi lên máy chủ và cập nhật vào Google Sheet của bạn!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-xs font-mono">
                      <div className="font-bold text-slate-700">{formatRelativeTime(item.timestamp)}</div>
                      <div className="text-[10px] text-slate-400">{item.timestamp}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900">{item.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{item.gradeClass}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 line-clamp-1">{item.topicName}</div>
                      <div className="text-[11px] text-indigo-600 font-bold">{item.gameMode}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 text-base">
                      {item.score}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          item.accuracy >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.accuracy >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.correctCount}/{item.totalQuestions} ({item.accuracy}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-medium text-xs whitespace-nowrap">
                      {item.timeSpentSeconds}s
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-xs">
                      {item.rating}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      {item.weakPoints ? (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {item.weakPoints}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Hoàn thành tốt!</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server Google Sheet Configuration Modal */}
      <ServerSheetConfigModal
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        onConfigSaved={() => loadData(accessToken, false)}
      />
    </div>
  );
};
