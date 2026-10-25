import React, { useState, useMemo } from 'react';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { useTasks } from '../features/tasks/TaskContext';
import { useMocks } from '../features/study/useMocks';
import { useFitness } from '../features/fitness/useFitness';
import { useSleep } from '../features/sleep/useSleep';
import { useExpenses } from '../features/expenses/useExpenses';
import { StatCard } from '../components/ui/StatCard';
import {
  getTashkentTodayString,
  formatUzbekDate,
  formatMinutes,
  getDateRange,
} from '../lib/dates';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  BookOpen,
  Dumbbell,
  Moon,
  Wallet,
  Award,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

type DateFilterType = 'today' | '7days' | '30days' | 'challenge';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

export const AnalyticsPage: React.FC = () => {
  const { activeChallenge, dayInfo } = useChallenge();
  const { tasks } = useTasks();
  const { mocks } = useMocks();
  const { sleepRecords, sleepTargetHours } = useSleep();
  const { expenses } = useExpenses();

  const todayStr = getTashkentTodayString();
  const [dateFilter, setDateFilter] = useState<DateFilterType>('7days');

  // Compute active date boundaries based on filter
  const { startDateStr, endDateStr, datesList } = useMemo(() => {
    let start = todayStr;
    const end = todayStr;

    if (dateFilter === 'today') {
      start = todayStr;
    } else if (dateFilter === '7days') {
      const d = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      start = d.toISOString().split('T')[0];
    } else if (dateFilter === '30days') {
      const d = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
      start = d.toISOString().split('T')[0];
    } else if (dateFilter === 'challenge') {
      start = activeChallenge?.start_date || todayStr;
    }

    const list = getDateRange(start, end);
    return { startDateStr: start, endDateStr: end, datesList: list };
  }, [dateFilter, todayStr, activeChallenge]);

  // Filter tasks in range
  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.scheduled_date >= startDateStr &&
        t.scheduled_date <= endDateStr &&
        t.status !== 'ARCHIVED'
    );
  }, [tasks, startDateStr, endDateStr]);

  const completedTasks = filteredTasks.filter((t) => t.status === 'COMPLETED');
  const missedTasks = filteredTasks.filter(
    (t) => t.status === 'LOCKED' || t.status === 'MISSED'
  );
  const completionPercent =
    filteredTasks.length > 0
      ? Math.round((completedTasks.length / filteredTasks.length) * 100)
      : 0;

  // SAT tasks in range
  const satTasks = filteredTasks.filter(
    (t) => t.category === 'SAT' || t.category === 'English'
  );
  const completedSatTasks = satTasks.filter((t) => t.status === 'COMPLETED');
  const satStudyMinutes = completedSatTasks.reduce(
    (acc, t) => acc + (t.estimated_minutes || 0),
    0
  );

  // Fitness tasks in range
  const fitnessTasks = filteredTasks.filter((t) => t.category === 'Fitness');
  const completedFitnessTasks = fitnessTasks.filter((t) => t.status === 'COMPLETED');
  const fitnessWorkoutMinutes = completedFitnessTasks.reduce(
    (acc, t) => acc + (t.estimated_minutes || 0),
    0
  );

  // Sleep records in range
  const filteredSleep = useMemo(() => {
    return sleepRecords.filter(
      (r) => r.sleep_date >= startDateStr && r.sleep_date <= endDateStr
    );
  }, [sleepRecords, startDateStr, endDateStr]);

  const avgSleepMinutes =
    filteredSleep.length > 0
      ? Math.round(
          filteredSleep.reduce((acc, r) => acc + r.duration_minutes, 0) /
            filteredSleep.length
        )
      : 0;

  // Expenses in range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.expense_date >= startDateStr && e.expense_date <= endDateStr
    );
  }, [expenses, startDateStr, endDateStr]);

  const totalExpenseSum = filteredExpenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0
  );

  // Daily Trend Chart Data
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; total: number; completed: number; missed: number }>();

    datesList.forEach((d) => {
      const parts = d.split('-');
      map.set(d, {
        date: d,
        displayDate: `${parts[1]}.${parts[2]}`,
        total: 0,
        completed: 0,
        missed: 0,
      });
    });

    filteredTasks.forEach((t) => {
      const item = map.get(t.scheduled_date);
      if (item) {
        item.total += 1;
        if (t.status === 'COMPLETED') item.completed += 1;
        if (t.status === 'LOCKED' || t.status === 'MISSED') item.missed += 1;
      }
    });

    return Array.from(map.values());
  }, [datesList, filteredTasks]);

  // Sleep Trend Chart Data
  const sleepTrendData = useMemo(() => {
    return datesList.map((d) => {
      const parts = d.split('-');
      const record = filteredSleep.find((r) => r.sleep_date === d);
      return {
        date: d,
        displayDate: `${parts[1]}.${parts[2]}`,
        hours: record ? Number((record.duration_minutes / 60).toFixed(1)) : null,
        target: sleepTargetHours,
      };
    });
  }, [datesList, filteredSleep, sleepTargetHours]);

  // Mock Tests Score Progression Chart Data
  const mockChartData = useMemo(() => {
    return mocks
      .filter((m) => m.status === 'COMPLETED' && m.total_score)
      .map((m) => ({
        name: `Mock ${m.mock_number}`,
        total: m.total_score,
        rw: m.reading_writing_score || 0,
        math: m.math_score || 0,
      }));
  }, [mocks]);

  // Expenses Category Breakdown Data
  const expensePieData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const cur = map.get(e.category) || 0;
      map.set(e.category, cur + Number(e.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>ANALITIKA MODULI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Shaxsiy Natijalar va Rivojlanish
            </h2>
          </div>

          {/* Date Filter Bar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            {(
              [
                { key: 'today', label: 'Bugun' },
                { key: '7days', label: '7 kun' },
                { key: '30days', label: '30 kun' },
                { key: 'challenge', label: '3 oylik' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  dateFilter === f.key
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Level Goal Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Umumiy bajarilish"
          value={filteredTasks.length === 0 ? '—' : `${completionPercent}%`}
          tone={filteredTasks.length > 0 && completionPercent >= 80 ? 'success' : 'default'}
          icon={CheckCircle2}
        />
        <StatCard
          label="SAT o‘rganish vaqti"
          value={formatMinutes(satStudyMinutes)}
          icon={BookOpen}
        />
        <StatCard
          label="Trening mashg‘ulotlari"
          value={formatMinutes(fitnessWorkoutMinutes)}
          icon={Dumbbell}
        />
        <StatCard
          label="Jami xarajat"
          value={`${totalExpenseSum.toLocaleString()} UZS`}
          icon={Wallet}
        />
      </div>

      {/* Chart A: Daily Tasks Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Kunlik vazifalar bajarilish dinamikasi
            </h3>
          </div>
        </div>

        {dailyTrendData.every((d) => d.total === 0) ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tanlangan vaqt oralig‘ida vazifalar topilmadi.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="displayDate" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="Bajarildi" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Qulflangan (bajarilmadi)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Split Section: SAT Mock Scores Progression + Sleep Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SAT Mock Test Scores */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              SAT Mock Test ballari o‘sishi
            </h3>
          </div>

          {mockChartData.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Hali birorta mock test bali kiritilmagan.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis domain={[400, 1600]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Umumiy ball"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rw"
                    name="Reading & Writing"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="math"
                    name="Math"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sleep Tracker Consistency Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Uyqu davomiyligi va maqsad bilan taqqoslash
            </h3>
            <p className="text-xs text-slate-500">
              O‘rtacha: {formatMinutes(avgSleepMinutes)} (Maqsad: {sleepTargetHours} soat)
            </p>
          </div>

          {filteredSleep.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Tanlangan muddatda uyqu qaydlari mavjud emas.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="displayDate" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 12]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    name="Uyqu (soat)"
                    stroke="#6366F1"
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Maqsad"
                    stroke="#CBD5E1"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Xarajatlar toifalar taqsimoti
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
            Jami: {totalExpenseSum.toLocaleString()} UZS
          </span>
        </div>

        {expensePieData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Tanlangan vaqt oralig‘ida xarajatlar mavjud emas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `${Number(value).toLocaleString()} UZS`}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {expensePieData.map((item, idx) => {
                const percent = totalExpenseSum > 0 ? Math.round((item.value / totalExpenseSum) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-slate-500">{percent}%</span>
                      <strong className="text-slate-900">{item.value.toLocaleString()} UZS</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
