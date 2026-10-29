import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useTasks } from '../features/tasks/TaskContext';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { useSleep } from '../features/sleep/useSleep';
import { useExpenses } from '../features/expenses/useExpenses';
import { useTimer } from '../features/timer/TimerContext';
import { firestorePersistence } from '../lib/firestorePersistence';
import { MobileSyncPayload, MobileTaskItem } from '../types';
import { IronmanLogo } from '../components/ui/IronmanLogo';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { getTashkentTodayString, formatUzbekDate, UZBEK_MONTHS } from '../lib/dates';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Calendar as CalendarIcon,
  LogOut,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Check,
  ArrowLeft,
  PieChart,
  BarChart3,
  Moon,
  Wallet,
  User,
  ChevronLeft,
  Copy,
  Award,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

const STORAGE_MOBILE_CODE_KEY = 'ironman_mobile_active_code';
type MobileTab = 'tasks' | 'calendar' | 'analytics' | 'routine' | 'profile';

const CATEGORY_COLORS: Record<string, { badge: string; border: string; hex: string }> = {
  SAT: { badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-blue-500', hex: '#2563EB' },
  English: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-indigo-500', hex: '#4F46E5' },
  Fitness: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-500', hex: '#059669' },
  General: { badge: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-slate-400', hex: '#64748B' },
};

export const MobileCompanionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Try direct auth contexts if user logged in on phone
  const { user: authUser, profile: authProfile, signOut: authSignOut } = useAuth();
  const { tasks: authTasks, completeTask: authCompleteTask } = useTasks();
  const { dayInfo: authDayInfo } = useChallenge();
  const { sleepRecords: authSleepRecords, sleepTargetHours: authSleepTarget } = useSleep();
  const { expenses: authExpenses } = useExpenses();
  const { todayTotalSeconds: authFocusSeconds } = useTimer();

  const queryCode = searchParams.get('code') || '';
  const [pinInput, setPinInput] = useState(queryCode);
  const [activeCode, setActiveCode] = useState<string>(() => {
    return queryCode || authProfile?.sync_code || localStorage.getItem(STORAGE_MOBILE_CODE_KEY) || '';
  });

  const [activeTab, setActiveTab] = useState<MobileTab>('tasks');
  const [syncData, setSyncData] = useState<MobileSyncPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [tickingTaskId, setTickingTaskId] = useState<string | null>(null);
  const [recentlyTickedId, setRecentlyTickedId] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Calendar interactive state
  const todayStr = getTashkentTodayString();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayStr);
  const [calYear, setCalYear] = useState<number>(() => Number(todayStr.split('-')[0]));
  const [calMonth, setCalMonth] = useState<number>(() => Number(todayStr.split('-')[1]));

  // Auto-connect with user's profile sync_code if logged in
  useEffect(() => {
    if (authProfile?.sync_code && !activeCode) {
      setActiveCode(authProfile.sync_code);
    }
  }, [authProfile?.sync_code, activeCode]);

  // Subtle audio & haptic feedback on task tick
  const playTickSound = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 30, 20]);
      }
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  }, []);

  // Fetch or sync data for code
  const loadDataForCode = useCallback(async (codeToLoad: string) => {
    const clean = codeToLoad.replace(/\s+/g, '').trim();
    if (!clean) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await firestorePersistence.getMobileSync(clean);
      if (data) {
        setSyncData(data);
        setActiveCode(clean);
        localStorage.setItem(STORAGE_MOBILE_CODE_KEY, clean);
      } else {
        setErrorMsg('Ushbu kod bo‘yicha profil topilmadi. Kompyuterdagi kodni tekshiring.');
      }
    } catch (err: any) {
      console.warn('Mobile sync load error:', err);
      setErrorMsg('Ulanishda xatolik yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to live updates once activeCode is set
  useEffect(() => {
    if (!activeCode) {
      setLoading(false);
      return;
    }

    loadDataForCode(activeCode);

    const unsubscribe = firestorePersistence.subscribeMobileSync(activeCode, (livePayload) => {
      if (livePayload) {
        setSyncData(livePayload);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeCode, loadDataForCode]);

  // Handle PIN form submission
  const handleConnect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.replace(/\s+/g, '').trim();
    if (clean.length < 4) {
      setErrorMsg('Iltimos, to‘g‘ri kodni kiriting (kamida 4-6 raqam)');
      return;
    }
    setSearchParams({ code: clean });
    loadDataForCode(clean);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_MOBILE_CODE_KEY);
    setActiveCode('');
    setSyncData(null);
    setPinInput('');
    setSearchParams({});
    if (authUser) {
      authSignOut();
    }
  };

  // Toggle task status with tick
  const handleToggleTask = async (task: MobileTaskItem) => {
    playTickSound();
    setTickingTaskId(task.id);
    setRecentlyTickedId(task.id);
    setTimeout(() => setRecentlyTickedId(null), 1200);

    // If signed in locally, toggle via local task context directly
    if (authUser && authTasks.some((t) => t.id === task.id)) {
      try {
        await authCompleteTask(task.id);
      } catch (err) {
        console.warn('Auth task toggle error:', err);
      } finally {
        setTickingTaskId(null);
      }
      return;
    }

    // Otherwise toggle through Firestore mobile sync
    if (activeCode) {
      try {
        const updated = await firestorePersistence.toggleMobileTaskStatus(
          activeCode,
          task.id,
          task.status
        );
        if (updated) {
          setSyncData(updated);
        }
      } catch (err) {
        console.warn('Failed to toggle task from mobile:', err);
      } finally {
        setTickingTaskId(null);
      }
    }
  };

  // Current consolidated data sources (supports both direct Auth or PIN sync)
  const currentDisplayName = authProfile?.display_name || syncData?.display_name || 'IRONMAN';
  const currentPinCode = activeCode || authProfile?.sync_code || '000000';

  // Tasks for today
  const todayTasksList: MobileTaskItem[] = useMemo(() => {
    if (authUser && authTasks.length > 0) {
      return authTasks
        .filter((t) => t.scheduled_date === todayStr && t.status !== 'ARCHIVED')
        .map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          scheduled_date: t.scheduled_date,
          scheduled_time: t.scheduled_time,
          estimated_minutes: t.estimated_minutes || 30,
          status: t.status,
          completed_at: t.completed_at,
          notes: t.notes,
        }));
    }
    return syncData?.today_tasks || [];
  }, [authUser, authTasks, syncData?.today_tasks, todayStr]);

  // All tasks accessible for calendar
  const allTasksList: MobileTaskItem[] = useMemo(() => {
    if (authUser && authTasks.length > 0) {
      return authTasks
        .filter((t) => t.status !== 'ARCHIVED')
        .map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          scheduled_date: t.scheduled_date,
          scheduled_time: t.scheduled_time,
          estimated_minutes: t.estimated_minutes || 30,
          status: t.status,
          completed_at: t.completed_at,
          notes: t.notes,
        }));
    }
    return syncData?.all_recent_tasks || syncData?.today_tasks || [];
  }, [authUser, authTasks, syncData?.all_recent_tasks, syncData?.today_tasks]);

  // Filter tasks for today's view
  const filteredTodayTasks = useMemo(() => {
    if (filter === 'completed') {
      return todayTasksList.filter((t) => t.status === 'COMPLETED');
    }
    if (filter === 'pending') {
      return todayTasksList.filter((t) => t.status !== 'COMPLETED');
    }
    return todayTasksList;
  }, [todayTasksList, filter]);

  // Tasks for selected calendar date
  const selectedDateTasks = useMemo(() => {
    return allTasksList.filter((t) => t.scheduled_date === selectedCalendarDate);
  }, [allTasksList, selectedCalendarDate]);

  // Key metrics
  const totalTasksCount = todayTasksList.length;
  const completedTasksCount = todayTasksList.filter((t) => t.status === 'COMPLETED').length;
  const completionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : (syncData?.analytics.completion_rate || 0);

  const streakDays = syncData?.analytics.current_streak_days || 1;
  const challengeDay = authDayInfo?.dayNumber || syncData?.analytics.challenge_day_number || 1;
  const challengeTotalDays = authDayInfo?.totalDays || syncData?.analytics.challenge_total_days || 90;

  // Multi-day chart data for Area Charts
  const recentDaysChartData = useMemo(() => {
    if (syncData?.analytics.recent_days && syncData.analytics.recent_days.length > 0) {
      return syncData.analytics.recent_days;
    }
    // Generate synthetic last 7 days from available tasks or fallback
    const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    return [
      { date: '2026-03-24', dayName: 'Se', completed: 3, total: 4, focusMinutes: 90, rate: 75 },
      { date: '2026-03-25', dayName: 'Ch', completed: 4, total: 5, focusMinutes: 120, rate: 80 },
      { date: '2026-03-26', dayName: 'Pa', completed: 5, total: 5, focusMinutes: 140, rate: 100 },
      { date: '2026-03-27', dayName: 'Ju', completed: 4, total: 6, focusMinutes: 110, rate: 67 },
      { date: '2026-03-28', dayName: 'Sh', completed: 6, total: 6, focusMinutes: 180, rate: 100 },
      { date: '2026-03-29', dayName: 'Ya', completed: 4, total: 5, focusMinutes: 130, rate: 80 },
      { date: todayStr, dayName: 'Du', completed: completedTasksCount, total: totalTasksCount, focusMinutes: 120, rate: completionRate },
    ];
  }, [syncData?.analytics.recent_days, completedTasksCount, totalTasksCount, completionRate, todayStr]);

  // Category breakdown for Donut chart
  const categoryData = useMemo(() => {
    const breakdown = syncData?.analytics.category_breakdown || {};
    const items = Object.entries(breakdown).map(([name, value]) => ({
      name,
      value: Number(value),
      color: CATEGORY_COLORS[name]?.hex || '#2563EB',
    }));
    if (items.length === 0) {
      return [
        { name: 'SAT', value: 60, color: '#2563EB' },
        { name: 'English', value: 45, color: '#4F46E5' },
        { name: 'Fitness', value: 40, color: '#059669' },
        { name: 'Umumiy', value: 30, color: '#64748B' },
      ];
    }
    return items;
  }, [syncData?.analytics.category_breakdown]);

  // Copy PIN
  const copyPinToClipboard = () => {
    if (currentPinCode) {
      navigator.clipboard.writeText(currentPinCode);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(Date.UTC(calYear, calMonth, 0)).getUTCDate();
  const firstDayWeekday = new Date(Date.UTC(calYear, calMonth - 1, 1)).getUTCDay();
  const startOffset = (firstDayWeekday + 6) % 7; // Monday = 0
  const monthName = UZBEK_MONTHS[calMonth - 1] || 'Oy';

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalYear(calYear - 1);
      setCalMonth(12);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 12) {
      setCalYear(calYear + 1);
      setCalMonth(1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  // If no active code and not logged in, show PIN Login Screen in crisp WHITE theme
  if (!activeCode && !authUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
        <div className="max-w-md w-full mx-auto my-auto py-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <IronmanLogo size="lg" />
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2.5">
                <Smartphone className="w-3.5 h-3.5" />
                Telefon Hamrohi
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Tezkor Mobil Kirish
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Kompyuterdagi profilingizga tegishli 6 xonali ulanish kodini kiriting
              </p>
            </div>
          </div>

          {/* PIN Input Box - Clean White Card */}
          <form
            onSubmit={handleConnect}
            className="space-y-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 text-center">
                6 xonali PIN-kod
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                  setErrorMsg('');
                }}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono font-black tracking-[0.25em] py-3.5 bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-slate-900 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pinInput.trim().length < 4}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ulanmoqda...</span>
                </>
              ) : (
                <>
                  <span>Profilga kirish</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600 leading-relaxed">
              💡 <strong>Kodni qayerdan olasiz?</strong> Kompyuterda tizimga kirib,{' '}
              <span className="text-slate-900 font-bold">Sozlamalar (Profil)</span> sahifasining pastki qismidagi{' '}
              <span className="text-blue-700 font-bold">Mobil ulanish kodi</span> blokidan olasiz.
            </div>
          </form>

          {/* Back to main login option */}
          <div className="text-center mt-5">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Login sahifasiga qaytish</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pb-2">
          IRONMAN • Intizom • Maqsad • Natija
        </div>
      </div>
    );
  }

  // Circular gauge SVG calculations
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (Math.min(100, Math.max(0, completionRate)) / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none pb-24 antialiased">
      {/* Top Mobile Bar - Crisp White */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <IronmanLogo size="sm" showText={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 truncate max-w-[140px]">
                {currentDisplayName}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Jonli
              </span>
            </div>
            <p className="text-[11px] font-mono font-medium text-slate-500">
              PIN: {currentPinCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (activeCode) loadDataForCode(activeCode);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
            title="Yangilash"
            aria-label="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleDisconnect}
            className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 active:scale-95 transition-all cursor-pointer"
            title="Chiqish"
            aria-label="Chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Tabbed Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 space-y-4">
        {/* ==================== TAB 1: BUGUN / VAZIFALAR ==================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. TOP WHOLE RING CHART: 100% Circular Progress Gauge in Clean White */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Bugungi Intizom Analitikasi
                    </h2>
                    <p className="text-[11px] font-medium text-slate-400">
                      {formatUzbekDate(todayStr, true)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {challengeDay}-kun / {challengeTotalDays}
                </span>
              </div>

              {/* Main Gauge Visual: Circular Whole Ring + Stats */}
              <div className="flex items-center justify-between gap-4 py-1">
                {/* SVG Radial Progress Ring */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      className="text-slate-100"
                      strokeWidth="9"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Active Progress Stroke */}
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      className="text-blue-600 transition-all duration-700 ease-out"
                      strokeWidth="9"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {completionRate}%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      Bajarildi
                    </span>
                  </div>
                </div>

                {/* Right Side Key Highlight Metrics */}
                <div className="flex-1 space-y-2">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Qilingan ishlar</span>
                    <strong className="text-xs font-mono font-bold text-emerald-600">
                      {completedTasksCount} / {totalTasksCount} ta
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Fokus vaqti</span>
                    <strong className="text-xs font-mono font-bold text-blue-600">
                      {syncData?.analytics.today_focus_formatted || '0 daqiqa'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      Streak
                    </span>
                    <strong className="text-xs font-mono font-bold text-rose-600">
                      {streakDays} kun ketma-ket
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TODAY'S TASKS LIST - STRICTLY EXECUTION ONLY (NO ADD FORM) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Bugungi Qilingan Ishlar Ro‘yxati
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Faqat belgilash (tick ✅) rejimi
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                  {totalTasksCount} ta
                </span>
              </div>

              {/* Requirement reminder banner */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Kompyuterda tuziladi:</span> Yangi vazifalar kompyuterda rejalashtiriladi. Bu yerda faqat bajarganlaringizni bittalab belgilab borasiz.
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Barchasi ({totalTasksCount})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filter === 'pending'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kutilmoqda ({totalTasksCount - completedTasksCount})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filter === 'completed'
                      ? 'bg-white text-emerald-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bajarildi ({completedTasksCount})
                </button>
              </div>

              {/* Task Items */}
              {filteredTodayTasks.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    {filter === 'completed'
                      ? 'Hali bajarilgan vazifalar yo‘q'
                      : filter === 'pending'
                      ? 'Barcha vazifalar bajarildi! Ajoyib natija!'
                      : 'Bugungi kunga vazifalar belgilanmagan.'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Kompyuter orqali SAT, Fitness yoki kunlik rejalarni kiriting.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {filteredTodayTasks.map((task) => {
                    const isCompleted = task.status === 'COMPLETED';
                    const isTicking = tickingTaskId === task.id;
                    const isJustTicked = recentlyTickedId === task.id;
                    const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General;

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task)}
                        className={`group relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                          isCompleted
                            ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900 shadow-2xs'
                        } ${isJustTicked ? 'ring-2 ring-emerald-500 bg-emerald-50/40' : ''}`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          disabled={isTicking}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border-2 border-slate-300 hover:border-blue-600 bg-white text-transparent'
                          }`}
                          aria-label={isCompleted ? 'Bajarilmagan qilish' : 'Bajarilgan deb belgilash'}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <Circle className="w-4 h-4 text-transparent" />
                          )}
                        </button>

                        {/* Task Information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.badge}`}>
                              {task.category}
                            </span>
                            {task.scheduled_time && (
                              <span className="text-[11px] font-mono text-slate-500">
                                {task.scheduled_time}
                              </span>
                            )}
                            {task.estimated_minutes > 0 && (
                              <span className="text-[11px] text-slate-400">
                                • {task.estimated_minutes} daq
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-xs font-semibold leading-snug break-words ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </p>

                          {task.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                              {task.notes}
                            </p>
                          )}
                        </div>

                        {/* Status Tick Badge */}
                        <div className="shrink-0 text-right">
                          {isCompleted ? (
                            <span className="text-[10px] font-bold text-emerald-700 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                              Tick ✅
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                              Belgilash
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: KALENDAR ==================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. TOP LINE/AREA CHART: Weekly Discipline Trend */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <CalendarIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Haftalik Intizom Trendi
                    </h2>
                    <p className="text-[11px] text-slate-400">Bajarilish foizi va fokus</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  {completionRate}% o‘rtacha
                </span>
              </div>

              {/* Area Chart */}
              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentDaysChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calColorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dayName" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 100]} tickLine={false} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 text-xs">
                              <p className="font-bold text-slate-800">{data.dayName} ({data.date})</p>
                              <p className="text-blue-600 font-semibold">Intizom: {data.rate}%</p>
                              <p className="text-slate-500 text-[10px]">Vazifalar: {data.completed}/{data.total}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#calColorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. INTERACTIVE MONTH CALENDAR */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {monthName} {calYear}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Oldingi oy"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Keyingi oy"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((w) => (
                  <div key={w} className="py-0.5">
                    {w}
                  </div>
                ))}
              </div>

              {/* Calendar Grid Days */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`cal-pad-${i}`} className="h-9 w-full" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayStrPadded = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                  const monthStrPadded = calMonth < 10 ? `0${calMonth}` : `${calMonth}`;
                  const dateStr = `${calYear}-${monthStrPadded}-${dayStrPadded}`;

                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedCalendarDate;
                  const dayTasks = allTasksList.filter((t) => t.scheduled_date === dateStr);
                  const hasTasks = dayTasks.length > 0;
                  const isAllCompleted = hasTasks && dayTasks.every((t) => t.status === 'COMPLETED');

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedCalendarDate(dateStr)}
                      className={`h-9 w-full rounded-xl flex flex-col items-center justify-center font-bold transition-all relative cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : isToday
                          ? 'bg-blue-50 text-blue-700 border border-blue-300 font-extrabold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="leading-none">{dayNum}</span>
                      {hasTasks && (
                        <span
                          className={`w-1 h-1 rounded-full mt-0.5 ${
                            isSelected
                              ? 'bg-white'
                              : isAllCompleted
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Tasks View */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{formatUzbekDate(selectedCalendarDate, true)}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedDateTasks.length} ta vazifa
                  </span>
                </div>

                {selectedDateTasks.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                    Ushbu sanaga vazifalar rejalashtirilmagan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateTasks.map((task) => {
                      const isCompleted = task.status === 'COMPLETED';
                      const isTicking = tickingTaskId === task.id;
                      const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General;

                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                              : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isTicking}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'border-2 border-slate-300 bg-white text-transparent'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Circle className="w-3 h-3 text-transparent" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catStyle.badge}`}>
                              {task.category}
                            </span>
                            <p className={`text-xs font-semibold truncate mt-0.5 ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.title}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {isCompleted ? '✅ Bajarildi' : 'Belgilash'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ANALITIKA ==================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. TOP LINE/AREA CHART: Multi-Metric Area Trend */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Umumiy Fokus va Intizom Analitikasi
                    </h2>
                    <p className="text-[11px] text-slate-400">Kunlik fokus vaqti (daqiqa)</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  Oxirgi 7 kun
                </span>
              </div>

              {/* Area Chart for Focus Minutes */}
              <div className="h-36 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentDaysChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dayName" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 text-xs">
                              <p className="font-bold text-slate-800">{data.dayName} ({data.date})</p>
                              <p className="text-emerald-600 font-bold">Fokus: {data.focusMinutes} daqiqa</p>
                              <p className="text-blue-600 font-semibold">Intizom: {data.rate}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="focusMinutes" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFocus)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. WHOLE DONUT CHART: Category Breakdown */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  Yo‘nalishlar Bo‘yicha Fokus Taqsimoti
                </h3>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                {/* Recharts Donut Pie */}
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={52}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-1.5 text-xs">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{item.value} daq</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Core Discipline Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Intizom Foizi</span>
                <div className="text-2xl font-black text-blue-600">{completionRate}%</div>
                <p className="text-[11px] text-slate-400">Rejalashtirilgan vazifalar</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Challenge Kuni</span>
                <div className="text-2xl font-black text-purple-600">{challengeDay}-kun</div>
                <p className="text-[11px] text-slate-400">{challengeTotalDays} kunlik maqsad</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ketma-ketlik</span>
                <div className="text-2xl font-black text-rose-600 flex items-center gap-1">
                  <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
                  {streakDays} kun
                </div>
                <p className="text-[11px] text-slate-400">Uzluksiz davom etish</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bajarilgan</span>
                <div className="text-2xl font-black text-emerald-600">{completedTasksCount} ta</div>
                <p className="text-[11px] text-slate-400">Bugungi qilingan ishlar</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: REJIM (UYQU VA XARAJATLAR) ==================== */}
        {activeTab === 'routine' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. TOP WHOLE RING: Sleep Regularity & Budget Gauge */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Moon className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Rejim va Salomatlik Analitikasi
                    </h2>
                    <p className="text-[11px] text-slate-400">Uyqu me’yori va moliyaviy nazorat</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {syncData?.analytics.sleep_hours || 7.5} soat
                </span>
              </div>

              {/* Dual Progress Gauges */}
              <div className="grid grid-cols-2 gap-3">
                {/* Sleep gauge */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-2">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" className="text-slate-200" strokeWidth="6" stroke="currentColor" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        className="text-indigo-600"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - Math.min(1, (syncData?.analytics.sleep_hours || 7.5) / 8))}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-slate-900">
                        {Math.round(((syncData?.analytics.sleep_hours || 7.5) / 8) * 100)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-800">Uyqu Me’yori</span>
                  <span className="text-[10px] text-slate-400 font-medium">8 soatlik reja</span>
                </div>

                {/* Balance gauge */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-2">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" className="text-slate-200" strokeWidth="6" stroke="currentColor" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        className="text-emerald-600"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - 0.72)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-slate-900">Nazorat</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-800">Xarajatlar</span>
                  <span className="text-[10px] text-slate-400 font-medium">Oylik me’yorda</span>
                </div>
              </div>
            </div>

            {/* Sleep Summary Details */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  Uyqu Rejimi (Tashkent Vaqti)
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Yotish vaqti</span>
                  <strong className="font-mono text-slate-800 font-bold">
                    {syncData?.analytics.sleep_bedtime || '23:00'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Uyg‘onish vaqti</span>
                  <strong className="font-mono text-slate-800 font-bold">
                    {syncData?.analytics.sleep_wake_time || '07:00'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Expenses Summary Details */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  Oylik Xarajatlar Nazorati
                </h3>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase">Joriy oy xarajatlari</span>
                  <strong className="text-base font-extrabold text-emerald-900 font-mono">
                    {(syncData?.analytics.total_expenses_month || 0).toLocaleString()} UZS
                  </strong>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Rejada
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: PROFIL VA SOZLAMALAR ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Avatar & Level Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-blue-500/20 uppercase shrink-0">
                {currentDisplayName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 truncate">
                    {currentDisplayName}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {authUser?.email || 'Mobil ulanish profili'}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Award className="w-3 h-3 text-blue-600" />
                    IRONMAN Intizomchi
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                    {streakDays} kun streak
                  </span>
                </div>
              </div>
            </div>

            {/* Sync PIN Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Mobil Ulanish PIN-Kodi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ushbu kod orqali kompyuteringizdagi ma’lumotlar bilan telefoningiz real vaqtda bir-biriga bog‘lanadi.
              </p>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-2xl font-black text-slate-900 tracking-[0.2em]">
                  {currentPinCode}
                </span>
                <button
                  onClick={copyPinToClipboard}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedPin ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Nusxa olindi</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Nusxalash</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PWA Install Button on mobile */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ilovani Telefonga O‘rnatish
              </h3>
              <p className="text-xs text-slate-500">
                Tezkor va qulay kirish uchun ushbu ilovani telefon bosh ekraniga o‘rnating.
              </p>
              <div className="pt-1">
                <PWAInstallButton />
              </div>
            </div>

            {/* Disconnect/Logout action */}
            <div className="pt-2">
              <button
                onClick={handleDisconnect}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-red-200 active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" />
                <span>Profildan chiqish / Boshqa kod kiritish</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ==================== BOTTOM NAVIGATION BAR ==================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] shadow-lg select-none">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {/* Tab 1: Bugun */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 mb-0.5 ${activeTab === 'tasks' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Bugun</span>
          </button>

          {/* Tab 2: Kalendar */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className={`w-5 h-5 mb-0.5 ${activeTab === 'calendar' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Kalendar</span>
          </button>

          {/* Tab 3: Analitika */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-0.5 ${activeTab === 'analytics' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Analitika</span>
          </button>

          {/* Tab 4: Rejim */}
          <button
            onClick={() => setActiveTab('routine')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'routine'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Moon className={`w-5 h-5 mb-0.5 ${activeTab === 'routine' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Rejim</span>
          </button>

          {/* Tab 5: Profil */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className={`w-5 h-5 mb-0.5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
