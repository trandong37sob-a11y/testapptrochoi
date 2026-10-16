import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Zap,
  Clock,
  Pencil,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  FileSpreadsheet,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Question, TopicId, StudentProfile } from '../types/math';
import { generateGameRound } from '../utils/questionGenerator';
import { ClockVisual } from './ClockVisual';
import { GeometryVisual } from './GeometryVisual';
import { MoneyVisual } from './MoneyVisual';
import { PictographTable } from './PictographTable';
import { ScratchpadModal } from './ScratchpadModal';
import { sound } from '../utils/sound';
import {
  StudentResult,
  appendResultToSheet,
  saveLocalResult,
} from '../services/sheetsService';

interface GameArenaProps {
  topicId: TopicId;
  topicName: string;
  gameMode: 'arena' | 'practice' | 'speed';
  profile: StudentProfile;
  accessToken: string | null;
  spreadsheetId: string | null;
  onExit: () => void;
  onViewSheet: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  topicId,
  topicName,
  gameMode,
  profile,
  accessToken,
  spreadsheetId,
  onExit,
  onViewSheet,
}) => {
  const TOTAL_QUESTIONS = gameMode === 'speed' ? 15 : 10;
  const SPEED_TIME_LIMIT = 60; // 60s for speed rush

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'saving' | 'synced' | 'local_only' | 'error'>('saving');
  const [isMuted, setIsMuted] = useState(false);

  // Timers
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [speedSecondsLeft, setSpeedSecondsLeft] = useState(SPEED_TIME_LIMIT);

  // Initialize questions
  useEffect(() => {
    const list = generateGameRound(TOTAL_QUESTIONS, topicId);
    setQuestions(list);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setWeakTopics([]);
    setIsGameOver(false);
    setSecondsElapsed(0);
    setSpeedSecondsLeft(SPEED_TIME_LIMIT);
  }, [topicId, gameMode]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || questions.length === 0) return;

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);

      if (gameMode === 'speed') {
        setSpeedSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, questions.length, gameMode]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      sound.playCorrect();
      const points = 10 + streak * 2;
      setScore((s) => s + points);
      setStreak((st) => st + 1);
      setCorrectCount((c) => c + 1);

      if (streak >= 3) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } else {
      sound.playWrong();
      setStreak(0);
      setWeakTopics((w) => {
        if (!w.includes(currentQ.topicName)) {
          return [...w, currentQ.topicName];
        }
        return w;
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
      sound.playClick();
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    setIsGameOver(true);
    sound.playLevelUp();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });

    const total = currentIndex + 1;
    const accuracy = Math.round((correctCount / total) * 100);

    let rating = 'Cần Cố Gắng 💪';
    if (accuracy >= 90) rating = 'Xuất Sắc ⭐⭐⭐';
    else if (accuracy >= 75) rating = 'Giỏi ⭐⭐';
    else if (accuracy >= 50) rating = 'Đạt ⭐';

    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const modeLabel =
      gameMode === 'arena'
        ? 'Đấu Trường 10 Câu'
        : gameMode === 'speed'
        ? 'Đua Tốc Độ 60s'
        : 'Luyện Tập Tự Do';

    const resultRecord: StudentResult = {
      id: `res-${Date.now()}`,
      timestamp: dateFormatted,
      studentName: profile.name || 'Học sinh lớp 3',
      gradeClass: profile.gradeClass || 'Lớp 3',
      topicId,
      topicName: topicName,
      gameMode: modeLabel,
      score,
      correctCount,
      totalQuestions: total,
      accuracy,
      timeSpentSeconds: secondsElapsed,
      rating,
      weakPoints: weakTopics.join(', ') || 'Nắm chắc kiến thức!',
    };

    // Save locally
    saveLocalResult(resultRecord);

    // Save to Google Sheets if token & sheet available
    if (accessToken && spreadsheetId) {
      setSyncStatus('saving');
      try {
        const ok = await appendResultToSheet(accessToken, spreadsheetId, resultRecord);
        if (ok) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.error('Error saving to sheet:', err);
        setSyncStatus('error');
      }
    } else {
      setSyncStatus('local_only');
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  if (!currentQ && !isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-bold">
        <Sparkles className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        Đang chuẩn bị đề bài toán lớp 3...
      </div>
    );
  }

  // GAME OVER SUMMARY SCREEN
  if (isGameOver) {
    const total = currentIndex + 1;
    const accuracy = Math.round((correctCount / total) * 100);

    return (
      <div className="max-w-xl mx-auto px-4 py-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center relative overflow-hidden">
          {/* Confetti ambient */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-5xl mb-4 shadow-inner">
            {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🌟' : '🎉'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {accuracy >= 90
              ? 'Chiến Thắng Xuất Sắc!'
              : accuracy >= 70
              ? 'Làm Tốt Lắm!'
              : 'Hoàn Thành Thử Thách!'}
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {profile.name} - {profile.gradeClass}
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-2 my-4">
            <span className={`text-4xl ${accuracy >= 50 ? 'animate-bounce' : 'opacity-30'}`}>⭐</span>
            <span className={`text-4xl ${accuracy >= 75 ? 'animate-bounce delay-100' : 'opacity-30'}`}>⭐</span>
            <span className={`text-4xl ${accuracy >= 90 ? 'animate-bounce delay-200' : 'opacity-30'}`}>⭐</span>
          </div>

          {/* Score breakdown grid */}
          <div className="grid grid-cols-3 gap-3 my-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="text-2xl font-black text-indigo-600">{score}</div>
              <div className="text-xs font-bold text-slate-500">Điểm Số</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600">
                {correctCount}/{total}
              </div>
              <div className="text-xs font-bold text-slate-500">Đúng ({accuracy}%)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-600">{secondsElapsed}s</div>
              <div className="text-xs font-bold text-slate-500">Thời Gian</div>
            </div>
          </div>

          {/* Weak points alert */}
          {weakTopics.length > 0 && (
            <div className="mb-6 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs">
              <span className="font-bold text-amber-900">💡 Gợi ý ôn tập cho bạn:</span>
              <ul className="list-disc list-inside mt-1 text-amber-800 space-y-0.5">
                {weakTopics.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Google Sheets Sync Indicator */}
          <div className="mb-6 p-3 rounded-2xl text-xs flex items-center justify-between border">
            {syncStatus === 'synced' ? (
              <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 w-full p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã đồng bộ kết quả lên Google Sheets của bạn!</span>
              </div>
            ) : syncStatus === 'saving' ? (
              <div className="flex items-center gap-2 text-blue-800 font-medium bg-blue-50 w-full p-2 rounded-xl">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                <span>Đang lưu vào Google Sheets...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full bg-slate-50 p-2 rounded-xl text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Đã lưu tạm trên máy (Chưa nối Google Sheet)</span>
                </div>
                <button
                  onClick={onViewSheet}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Kết nối ngay
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                const list = generateGameRound(TOTAL_QUESTIONS, topicId);
                setQuestions(list);
                setCurrentIndex(0);
                setSelectedOption(null);
                setIsAnswered(false);
                setScore(0);
                setStreak(0);
                setCorrectCount(0);
                setWeakTopics([]);
                setIsGameOver(false);
                setSecondsElapsed(0);
                setSpeedSecondsLeft(SPEED_TIME_LIMIT);
              }}
              className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Chơi Lại Vòng Này
            </button>
            <button
              onClick={onViewSheet}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xem Bảng Điểm Sheet
            </button>
            <button
              onClick={onExit}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
            >
              Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION SCREEN
  return (
    <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
      {/* Top Header Status */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-xl cursor-pointer"
          >
            ← Thoát
          </button>
          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 truncate max-w-[140px] sm:max-w-none">
            {currentQ.topicName}
          </span>
        </div>

        {/* Middle: Progress / Timer */}
        <div className="flex items-center gap-3">
          {gameMode === 'speed' ? (
            <div className="flex items-center gap-1 font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> {speedSecondsLeft}s
            </div>
          ) : (
            <div className="text-xs font-black text-slate-700">
              Câu <span className="text-indigo-600">{currentIndex + 1}</span> / {questions.length}
            </div>
          )}

          {/* Streak Combo */}
          {streak >= 2 && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-900 font-black text-xs px-2 py-0.5 rounded-full animate-bounce">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" /> {streak} combo!
            </div>
          )}

          {/* Current Score */}
          <div className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <Trophy className="w-3.5 h-3.5" /> {score}đ
          </div>
        </div>

        {/* Audio mute & Scratchpad toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={() => setIsScratchpadOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-amber-300"
            title="Mở giấy nháp để tính toán"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Bảng nháp</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md relative">
        {/* Mascot cheer bubble */}
        <div className="flex items-center gap-3 mb-4 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
          <div className="text-3xl shrink-0 select-none animate-bounce">
            {isAnswered
              ? selectedOption === currentQ.correctIndex
                ? '🎉'
                : '🤔'
              : '🦖'}
          </div>
          <div className="text-xs text-indigo-950 font-semibold">
            {isAnswered ? (
              selectedOption === currentQ.correctIndex ? (
                <span className="text-emerald-700 font-extrabold">
                  Xuất sắc! Bạn trả lời hoàn toàn chính xác! (+10đ)
                </span>
              ) : (
                <span className="text-rose-700 font-bold">
                  Chưa chính xác rồi. Xem hướng dẫn giải phía dưới nhé!
                </span>
              )
            ) : (
              <span>Bé Rồng cổ vũ: Hãy đọc kỹ đề và tính cẩn thận nhé!</span>
            )}
          </div>
        </div>

        {/* Prompt */}
        <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
          {currentQ.prompt}
        </h3>
        {currentQ.subPrompt && (
          <p className="text-xs text-slate-500 font-medium mt-1">{currentQ.subPrompt}</p>
        )}

        {/* Visual Element (Clock, Geometry, Money, Table) */}
        {currentQ.visual && (
          <div className="my-4 flex justify-center">
            {currentQ.visual.type === 'clock' && currentQ.visual.clock && (
              <ClockVisual hours={currentQ.visual.clock.hours} minutes={currentQ.visual.clock.minutes} />
            )}
            {currentQ.visual.type === 'geometry' && currentQ.visual.geometry && (
              <GeometryVisual
                shape={currentQ.visual.geometry.shape}
                width={currentQ.visual.geometry.width}
                height={currentQ.visual.geometry.height}
                side={currentQ.visual.geometry.side}
                unit={currentQ.visual.geometry.unit}
                showAreaFormula={currentQ.visual.geometry.showAreaFormula}
                showPerimeterFormula={currentQ.visual.geometry.showPerimeterFormula}
              />
            )}
            {currentQ.visual.type === 'money' && currentQ.visual.money && (
              <MoneyVisual bills={currentQ.visual.money.bills} />
            )}
            {currentQ.visual.type === 'pictograph' && currentQ.visual.tableData && (
              <PictographTable
                headers={currentQ.visual.tableData.headers}
                rows={currentQ.visual.tableData.rows}
              />
            )}
          </div>
        )}

        {/* Options list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {currentQ.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200';
            let badgeStyle = 'bg-white text-slate-600 border-slate-300';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black shadow-sm ring-2 ring-emerald-400';
                badgeStyle = 'bg-emerald-500 text-white border-emerald-600';
              } else if (isSelected) {
                btnStyle = 'bg-rose-100 border-rose-300 text-rose-950 font-bold';
                badgeStyle = 'bg-rose-500 text-white border-rose-600';
              } else {
                btnStyle = 'bg-slate-50 opacity-40 border-slate-200';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition-all transform active:scale-98 cursor-pointer ${btnStyle}`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs shrink-0 ${badgeStyle}`}
                >
                  {letter}
                </span>
                <span className="flex-1 break-words">{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Hint toggle & Explanation bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
          {!isAnswered ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý bài toán'}
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-left text-xs sm:text-sm text-emerald-950 space-y-1.5">
              <div className="font-black text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Giải thích chi tiết:
              </div>
              <p className="whitespace-pre-line font-medium leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {showHint && !isAnswered && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
              💡 {currentQ.hint}
            </div>
          )}
        </div>

        {/* Next Question Button */}
        {isAnswered && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center gap-2 text-sm cursor-pointer animate-pulse"
            >
              {currentIndex + 1 < questions.length ? (
                <>
                  Câu tiếp theo <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Xem Kết Quả & Nộp Bài <Trophy className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Scratchpad */}
      <ScratchpadModal isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />
    </div>
  );
};
