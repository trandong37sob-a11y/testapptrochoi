import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Server,
  Play,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import {
  fetchServerConfig,
  updateServerConfig,
  testServerSheetConnection,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '../services/sheetsService';
import { sound } from '../utils/sound';

interface ServerSheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const ServerSheetConfigModal: React.FC<ServerSheetConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetchServerConfig().then((cfg) => {
      if (cfg) {
        setWebhookUrl(cfg.googleSheetWebhookUrl || '');
        setSheetUrl(cfg.googleSheetUrl || '');
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng dán Webhook URL trước khi kiểm tra.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testServerSheetConnection(webhookUrl.trim());
      sound.playLevelUp();
      setTestResult({
        success: true,
        message: res.message || 'Kết nối thành công! Đã gửi 1 dòng test vào Google Sheet của bạn.',
      });
    } catch (err: any) {
      sound.playWrong();
      setTestResult({
        success: false,
        message: err.message || 'Không thể kết nối. Vui lòng kiểm tra lại Webhook URL và quyền "Bất kỳ ai (Anyone)".',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateServerConfig({
        googleSheetWebhookUrl: webhookUrl.trim(),
        googleSheetUrl: sheetUrl.trim(),
        autoSyncEnabled: true,
      });
      sound.playCorrect();
      setSavedSuccess(true);
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-4 border-emerald-400 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl tracking-tight">
                Cấu Hình Google Sheet Trên Máy Chủ
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Tự động lưu điểm của mọi học sinh khi chơi vào Google Sheet của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Highlight explain */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs sm:text-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-emerald-900">
                Cơ chế cập nhật tự động qua máy chủ (Không cần học sinh đăng nhập Google):
              </div>
              <p className="text-emerald-800 leading-relaxed text-xs">
                Khi học sinh làm xong bài toán trên điện thoại/máy tính, máy chủ sẽ tự động nhận kết quả và đẩy trực tiếp vào Google Sheet của thầy cô trong 1 giây. Học sinh không cần tài khoản Google!
              </p>
            </div>
          </div>

          {/* 4 simple steps */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Hướng dẫn kết nối Google Sheet chỉ trong 4 bước:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Bước 1:</span> Mở một file Google Sheet mới hoặc có sẵn của bạn.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Bước 2:</span> Chọn menu <b>Tiện ích mở rộng</b> &gt; <b>Apps Script</b>.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Bước 3:</span> Xóa hết code cũ, dán đoạn mã bên dưới và bấm <b>Triển khai (Deploy)</b> &gt; <b>Ứng dụng web</b>.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Bước 4:</span> Đặt quyền truy cập là <b>Bất kỳ ai (Anyone)</b>, sao chép URL dán vào ô bên dưới.
              </div>
            </div>
          </div>

          {/* Code snippet block with copy button */}
          <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-xs relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Mã Google Apps Script tự động:
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã'}
              </button>
            </div>
            <pre className="max-h-36 overflow-y-auto text-[11px] leading-relaxed text-emerald-300">
              {GOOGLE_APPS_SCRIPT_TEMPLATE}
            </pre>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Input Webhook URL */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                URL Ứng Dụng Web Google Apps Script (Webhook) <span className="text-rose-500">*</span>:
              </label>
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Link có dạng kết thúc bằng <code>/exec</code> sau khi bạn bấm Triển khai (Deploy).
              </p>
            </div>

            {/* Input direct sheet URL (for quick opening) */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Đường dẫn liên kết Google Sheet (Tùy chọn - để mở nhanh):
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu cấu hình máy chủ thành công!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !webhookUrl.trim()}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                {testing ? 'Đang gửi test...' : 'Kiểm tra gửi test lên Sheet'}
              </button>

              <div className="flex-1 flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Đang lưu...' : 'Lưu Cấu Hình Máy Chủ'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
