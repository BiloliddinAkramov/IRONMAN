import React, { useState } from 'react';
import { useTimer } from '../features/timer/TimerContext';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { FocusCategory, FocusSession } from '../types';
import { getTashkentTodayString, formatUzbekDate } from '../lib/dates';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  BookOpen,
  Target,
  Award,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const CATEGORIES: FocusCategory[] = [
  'SAT Math',
  'SAT Reading & Writing',
  'English',
  'Vocabulary',
  'Grammar',
  'Practice Test',
  'Umumiy',
];

export const TimerPage: React.FC = () => {
  const {
    isActive,
    isPaused,
    elapsedSeconds,
    currentTaskName,
    currentCategory,
    currentTasksCount,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    cancelTimer,
    updateActiveSessionDetails,
    todaySessions,
    todayTotalSeconds,
    todayTasksCompleted,
    getDailySummaries,
    getChartData,
    addManualSession,
    deleteSession,
  } = useTimer();

  const { dayInfo } = useChallenge();
  const todayStr = getTashkentTodayString();

  // Chart range filter
  const [chartRange, setChartRange] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const chartData = getChartData(chartRange);

  // Expanded flashcards tracking
  const [expandedDate, setExpandedDate] = useState<string | null>(todayStr);

  // Manual session modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState(todayStr);
  const [manualCategory, setManualCategory] = useState<FocusCategory>('SAT Math');
  const [manualTaskName, setManualTaskName] = useState('');
  const [manualMinutes, setManualMinutes] = useState(45);
  const [manualTasksCount, setManualTasksCount] = useState(15);
  const [manualNotes, setManualNotes] = useState('');

  // Stop & Save modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTaskName, setSaveTaskName] = useState(currentTaskName);
  const [saveCategory, setSaveCategory] = useState<FocusCategory>(currentCategory);
  const [saveTasksCount, setSaveTasksCount] = useState(currentTasksCount);
  const [saveNotes, setSaveNotes] = useState('');

  // Format digital stopwatch 00:00:00
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Format friendly duration (e.g. 3 soat 25 daqiqa)
  const formatDurationFriendly = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    if (h === 0 && m === 0) {
      return `${s} soniya`;
    }
    if (h === 0) {
      return `${m} daqiqa`;
    }
    return `${h} soat ${m > 0 ? `${m} daq` : ''}`;
  };

  const handleOpenStopModal = () => {
    setSaveTaskName(currentTaskName);
    setSaveCategory(currentCategory);
    setSaveTasksCount(currentTasksCount || 1);
    setSaveNotes('');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    stopAndSaveTimer(saveTaskName, saveCategory, saveTasksCount, saveNotes);
    setIsSaveModalOpen(false);
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTaskName.trim()) return;

    addManualSession({
      date: manualDate,
      start_time: '12:00',
      end_time: '13:00',
      duration_seconds: manualMinutes * 60,
      task_name: manualTaskName.trim(),
      category: manualCategory,
      tasks_completed: Number(manualTasksCount) || 1,
      notes: manualNotes.trim() || undefined,
    });

    setIsManualModalOpen(false);
    setManualTaskName('');
    setManualNotes('');
  };

  const dailySummaries = getDailySummaries();

  // Summary statistics calculation
  const totalChartHours = chartData.reduce((acc, d) => acc + d.hours, 0).toFixed(1);
  const totalChartTasks = chartData.reduce((acc, d) => acc + d.tasksCount, 0);
  const activeDaysCount = chartData.filter((d) => d.hours > 0).length || 1;
  const avgDailyHours = (Number(totalChartHours) / activeDaysCount).toFixed(1);
  const maxDay = [...chartData].sort((a, b) => b.hours - a.hours)[0];

  const getCategoryColor = (cat: FocusCategory) => {
    switch (cat) {
      case 'SAT Math':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SAT Reading & Writing':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Vocabulary':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Practice Test':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'English':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Grammar':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER - DARK BLUE MOUNTAIN HERO (Matches screenshot) */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 rounded-2xl sm:rounded-3xl border border-blue-800/60 p-6 sm:p-8 shadow-lg overflow-hidden text-white">
        {/* Mountain Silhouette Background */}
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
          alt="Mountain Horizon"
          className="absolute inset-0 w-full h-full object-cover object-right opacity-25 mix-blend-overlay filter contrast-125 brightness-110 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/60 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-3 border border-white/15">
              <Calendar className="w-3.5 h-3.5 text-cyan-300" />
              <span>{formatUzbekDate(todayStr, true)}</span>
              {dayInfo && (
                <>
                  <span className="text-blue-400">•</span>
                  <span className="font-bold text-white">{dayInfo.dayNumber}-kun</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Dars & Fokus Taymeri
            </h1>
          </div>

          {/* Bugungi Jami Dars Vaqti Karta */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-lg flex items-center gap-4 shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-colors ${
              isActive && !isPaused ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/15 text-blue-300'
            }`}>
              <Clock className="w-7 h-7 text-white" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider text-blue-200 uppercase block">
                BUGUNGI DARS VAQTI
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
                {formatDurationFriendly(todayTotalSeconds)}
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-200 font-medium mt-0.5">
                <span>{todaySessions.length} ta seans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ASOSIY TAYMER KONSOLI (2-USTUNLI TARKIB: TAYMER + MOTIVATSIYA KARTASI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Timer Console (Col 7/12) */}
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          {/* Ambient background glow when running */}
          {isActive && !isPaused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          )}

          <div className="relative z-10 flex flex-col items-center text-center space-y-6 my-auto py-2">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all bg-slate-900 border border-slate-800">
              {isActive ? (
                isPaused ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-amber-300">Pauzada turibdi</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-400 font-bold">Fokus jarayoni faol</span>
                  </>
                )
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-300">TAYYOR: YANGI SEANS BOSHLANG</span>
                </>
              )}
            </div>

            {/* Big Digital Stopwatch Display */}
            <div className="py-2">
              <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tighter text-white tabular-nums drop-shadow-md select-none">
                {formatTime(elapsedSeconds)}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono tracking-wider">
                SOAT : DAQIQA : SONIYA
              </p>
            </div>

            {/* Action Control Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
              {!isActive ? (
                <button
                  onClick={() => startTimer(currentCategory, currentTaskName, 1)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>FOKUSNI BOSHLASH (START)</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeTimer}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>DAVOM ETTIRISH</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      <span>PAUZA</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenStopModal}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>YAKUNLASH VA SAQLASH</span>
                  </button>

                  <button
                    onClick={cancelTimer}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Taymerni tozalash"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>O‘chirish</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsManualModalOpen(true)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Qo‘lda seans kiritish</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Motivational Quote Card (Col 5/12 - Matches Screenshot) */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 shadow-md border border-slate-800 text-white overflow-hidden flex flex-col justify-between">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
            alt="Discipline Horizon"
            className="absolute inset-0 w-full h-full object-cover object-right opacity-30 mix-blend-overlay filter contrast-125 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none" />

          {/* Top Target Icon */}
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-md">
              <Target className="w-6 h-6 text-cyan-300" />
            </div>
          </div>

          {/* Central Quote Text */}
          <div className="relative z-10 my-auto py-8 space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              “Kichik qadamlar katta natijalarga olib keladi.”
            </h3>
            <span className="text-xs text-blue-300 font-bold uppercase tracking-wider block">
              — IRONMAN
            </span>
          </div>

          {/* Bottom Pagination Dots */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="w-6 h-1.5 rounded-full bg-blue-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          </div>
        </div>
      </div>

      {/* 3. GRAFIK BO'LIMI (CHART): HAFTALIK, OYLIK, SHU KUNGACHA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Dars Vaqti va Natijalar Grafigi
              </h2>
            </div>
          </div>

          {/* Filter Range Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setChartRange('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartRange === 'weekly'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Haftalik (7 kun)
            </button>
            <button
              onClick={() => setChartRange('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartRange === 'monthly'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Oylik (30 kun)
            </button>
            <button
              onClick={() => setChartRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartRange === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shu kungacha
            </button>
          </div>
        </div>

        {/* 3 Summary Stat Mini-Cards (Ortiqcha kartalar va tag-yozuvlar olib tashlandi) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                JAMI DARS VAQTI
              </span>
              <div className="text-2xl font-black text-blue-950 font-mono mt-0.5">
                {totalChartHours} <span className="text-xs font-sans text-blue-700">soat</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
                O‘RTACHA KUNLIK DARS
              </span>
              <div className="text-2xl font-black text-purple-950 font-mono mt-0.5">
                {avgDailyHours} <span className="text-xs font-sans text-purple-700">soat/kun</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                ENG YUQORI KUN
              </span>
              <div className="text-2xl font-black text-amber-950 font-mono mt-0.5">
                {maxDay ? `${maxDay.hours}` : '0'} <span className="text-xs font-sans text-amber-700">soat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Chart - Toza va ravon faqat soat bo'yicha bar chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="hours"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit="s"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-lg border border-slate-800 text-xs space-y-1">
                        <p className="font-bold text-slate-200">{data.displayDate} ({data.date})</p>
                        <p className="text-blue-400 font-semibold flex items-center justify-between gap-4">
                          <span>⏱️ O‘qilgan vaqt:</span>
                          <span className="font-mono">{data.formattedTime} ({data.hours} soat)</span>
                        </p>
                        <p className="text-slate-400 flex items-center justify-between gap-4">
                          <span>🎯 Seanslar soni:</span>
                          <span className="font-mono">{data.sessionsCount} ta</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                yAxisId="hours"
                dataKey="hours"
                name="Dars vaqti (soat)"
                fill="#2563EB"
                radius={[6, 6, 0, 0]}
                barSize={chartRange === 'weekly' ? 32 : chartRange === 'monthly' ? 12 : 8}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
            <span>Dars vaqti (Soat)</span>
          </div>
        </div>
      </div>

      {/* 4. FLASHCARD USLUBIDAGI OLDINGI KUNLAR TARIXI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Flashcard Uslubida Kunlik Seanslar Tarixi
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Seans qo‘shish
          </button>
        </div>

        {dailySummaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            Hali dars seanslari mavjud emas. Yuqoridagi taymer orqali darsni boshlang!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dailySummaries.map((summary) => {
              const isToday = summary.date === todayStr;
              const isExpanded = expandedDate === summary.date;
              const totalHours = (summary.total_duration_seconds / 3600).toFixed(1);

              return (
                <div
                  key={summary.date}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                    isToday
                      ? 'border-blue-400 border-l-[6px] border-l-blue-600 ring-2 ring-blue-500/10'
                      : 'border-slate-200 border-l-4 border-l-indigo-500'
                  }`}
                >
                  {/* Flashcard Header Banner */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {formatUzbekDate(summary.date, true)}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-600 text-white rounded-md tracking-wider">
                              BUGUN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {summary.session_count} ta dars seansi
                        </p>
                      </div>

                      {/* Achievement pill */}
                      {summary.total_duration_seconds >= 14400 ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Yuqori intizom</span>
                        </div>
                      ) : summary.total_duration_seconds >= 7200 ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Yaxshi fokus</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <span>Oddiy</span>
                        </div>
                      )}
                    </div>

                    {/* Flashcard Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Jami vaqt
                        </span>
                        <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                          {formatDurationFriendly(summary.total_duration_seconds)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Vazifalar / Misol
                        </span>
                        <div className="text-lg font-black font-mono text-emerald-600 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{summary.total_tasks_completed} ta</span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Expand Card Button */}
                    <button
                      onClick={() => setExpandedDate(isExpanded ? null : summary.date)}
                      className="w-full mt-3 pt-2 border-t border-dashed border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? 'Seanslarni yashirish' : 'Seanslar tafsilotini ko‘rish'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Session Details */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/50 divide-y divide-slate-100 space-y-3">
                      {summary.sessions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">
                          Bu kunda saqlangan seanslar yo‘q.
                        </p>
                      ) : (
                        summary.sessions.map((session) => (
                          <div key={session.id} className="pt-3 first:pt-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(
                                  session.category
                                )}`}
                              >
                                {session.category}
                              </span>

                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  {formatDurationFriendly(session.duration_seconds)}
                                </span>
                                <button
                                  onClick={() => deleteSession(session.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer transition-colors"
                                  title="Seansni o‘chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {session.task_name}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>
                                {session.start_time} - {session.end_time}
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {session.tasks_completed} ta vazifa
                              </span>
                            </div>

                            {session.notes && (
                              <p className="text-[11px] text-slate-400 italic bg-white p-2 rounded-lg border border-slate-100">
                                "{session.notes}"
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STOP & SAVE MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Dars Seansini Yakunlash va Saqlash
                </h3>
                <p className="text-xs text-slate-500">
                  Fokus vaqti: <strong className="text-blue-600">{formatTime(elapsedSeconds)}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mavzu / Vazifa nomi
                </label>
                <input
                  type="text"
                  value={saveTaskName}
                  onChange={(e) => setSaveTaskName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Yo‘nalishi
                  </label>
                  <select
                    value={saveCategory}
                    onChange={(e) => setSaveCategory(e.target.value as FocusCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Yechilgan vazifalar soni
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={saveTasksCount}
                    onChange={(e) => setSaveTasksCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Qisqacha izoh (Ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Misollar qiyinligi, xatolar yoki eslatmalar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Saqlash va Tarixga qo‘shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL SESSION CREATION MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateManual}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Qo‘lda Dars Seansini Kiritish
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sana
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mavzu / Vazifa nomi *
                </label>
                <input
                  type="text"
                  required
                  value={manualTaskName}
                  onChange={(e) => setManualTaskName(e.target.value)}
                  placeholder="Masalan: SAT Reading Module 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Yo‘nalishi
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as FocusCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Davomiyligi (Daqiqa)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Yechilgan vazifalar / misollar soni
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualTasksCount}
                  onChange={(e) => setManualTasksCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Izoh (Ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Xulosalar yoki qaydlar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Qo‘shish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
