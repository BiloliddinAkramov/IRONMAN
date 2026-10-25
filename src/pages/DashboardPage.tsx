import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { useTasks } from '../features/tasks/TaskContext';
import { useSleep } from '../features/sleep/useSleep';
import { useExpenses } from '../features/expenses/useExpenses';
import { useTimer } from '../features/timer/TimerContext';
import { TaskCard } from '../components/tasks/TaskCard';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { CalendarIllustration } from '../components/dashboard/CalendarIllustration';
import { DashboardMetricCard } from '../components/dashboard/DashboardMetricCard';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { QuoteWidget } from '../components/dashboard/QuoteWidget';
import { GoalsProgressWidget } from '../components/dashboard/GoalsProgressWidget';
import {
  getTashkentTodayString,
  formatUzbekDate,
} from '../lib/dates';
import { TaskCategory } from '../types';
import {
  Plus,
  BookOpen,
  Dumbbell,
  Moon,
  Music,
  Wallet,
  Calendar,
  Flame,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeChallenge, dayInfo } = useChallenge();
  const { tasks, completeTask, archiveTask, deleteTask, addTask } = useTasks();
  const { sleepRecords } = useSleep();
  const { expenses } = useExpenses();
  const { todayTotalSeconds, isActive: isTimerActive } = useTimer();

  const todayStr = getTashkentTodayString();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayStr);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('General');

  // Filter tasks for selected/today date
  const activeDateTasks = tasks.filter(
    (t) => t.scheduled_date === selectedCalendarDate && t.status !== 'ARCHIVED'
  );

  const satTasks = activeDateTasks.filter((t) => t.category === 'SAT' || t.category === 'English');
  const fitnessTasks = activeDateTasks.filter((t) => t.category === 'Fitness');
  const generalTasks = activeDateTasks.filter((t) => t.category === 'General');

  // Completion calculation
  const totalToday = activeDateTasks.length;
  const completedToday = activeDateTasks.filter((t) => t.status === 'COMPLETED').length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Sleep for active date
  const activeSleep = sleepRecords.find((r) => r.sleep_date === selectedCalendarDate);

  // Today's expenses
  const todayExpensesTotal = expenses
    .filter((e) => e.expense_date === todayStr)
    .reduce((acc, e) => acc + Number(e.amount), 0);

  // Goal Progress percentages for right widget
  const satCompleted = satTasks.filter((t) => t.status === 'COMPLETED').length;
  const satPercent = satTasks.length > 0 ? Math.round((satCompleted / satTasks.length) * 100) : 0;

  const englishTasks = activeDateTasks.filter((t) => t.category === 'English');
  const engCompleted = englishTasks.filter((t) => t.status === 'COMPLETED').length;
  const englishPercent = englishTasks.length > 0 ? Math.round((engCompleted / englishTasks.length) * 100) : 0;

  const fitCompleted = fitnessTasks.filter((t) => t.status === 'COMPLETED').length;
  const fitnessPercent = fitnessTasks.length > 0 ? Math.round((fitCompleted / fitnessTasks.length) * 100) : 0;

  const sleepPercent = activeSleep ? Math.min(100, Math.round((activeSleep.duration_minutes / 480) * 100)) : 0;

  const handleOpenAdd = (category: TaskCategory = 'General') => {
    setSelectedCategory(category);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full">
      {/* Left Main Dashboard Column */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Top Hero Welcome Banner with Light Bluish-White Background */}
        <div className="relative bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-indigo-50/60 border border-blue-100/90 border-l-[5px] border-l-blue-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs overflow-hidden text-slate-900">
          {/* Subtle ambient lighting decorations */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-300/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 right-1/4 w-48 h-48 rounded-full bg-indigo-300/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-100/70 px-3 py-1 rounded-full mb-3 border border-blue-200/80 border-l-4 border-l-purple-500">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatUzbekDate(todayStr, true)}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Assalomu alaykum, {profile?.display_name || 'Biloliddin'}!
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5 leading-relaxed">
                Bugungi vazifalarni intizom bilan yakunlang va maqsadingiz sari intiling.
              </p>
            </div>

            <div>
              <button
                onClick={() => handleOpenAdd('General')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Yangi vazifa</span>
              </button>
            </div>
          </div>

          {/* 3-Month Challenge Progress Slider Section */}
          <div className="relative z-10 mt-7 pt-5 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-medium mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-900 text-sm">
                  3 oylik chaqiriq: {dayInfo?.dayNumber || 1}-kun
                </span>
                <span className="text-slate-400 font-normal">
                  / {dayInfo?.totalDays || 93} kun
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-lg">
                <span className="font-mono tabular-nums text-blue-700 font-bold text-xs">
                  {dayInfo?.progressPercent || 0}% o‘tdi
                </span>
              </div>
            </div>

            {/* High-visibility Slider track with bright fill */}
            <div className="relative w-full bg-slate-200/90 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-xs relative"
                style={{ width: `${Math.max(2, dayInfo?.progressPercent || 0)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
              <span>Boshlanish: {formatUzbekDate(activeChallenge?.start_date || todayStr)}</span>
              <span>Qolgan: {dayInfo?.daysRemaining || 93} kun</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards Grid with Distinct Colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardMetricCard
            label="BUGUNGI BAJARILISH"
            value={totalToday === 0 ? '—' : `${completionRate}%`}
            subValue={totalToday === 0 ? 'reja kiritilmagan' : `${completedToday} / ${totalToday} ta`}
            icon={BookOpen}
            iconBgColor="bg-blue-600"
            iconTextColor="text-white"
            cardBgClass="bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white"
            borderClass="border-blue-200/90 hover:border-blue-400 border-l-4 border-l-blue-600"
            labelColorClass="text-blue-900"
            valueColorClass="text-blue-950"
            subValueColorClass="text-blue-700"
            waveColor="#60A5FA"
            onClick={() => handleOpenAdd('General')}
          />
          <DashboardMetricCard
            label="SAT & ENGLISH"
            value={satTasks.length}
            subValue={satTasks.length === 0 ? 'reja yo‘q' : `${satCompleted} bajarildi`}
            icon={BookOpen}
            iconBgColor="bg-emerald-600"
            iconTextColor="text-white"
            cardBgClass="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white"
            borderClass="border-emerald-200/90 hover:border-emerald-400 border-l-4 border-l-emerald-600"
            labelColorClass="text-emerald-900"
            valueColorClass="text-emerald-950"
            subValueColorClass="text-emerald-700"
            waveColor="#34D399"
            onClick={() => navigate('/study')}
          />
          <DashboardMetricCard
            label="FITNESS"
            value={fitnessTasks.length}
            subValue={fitnessTasks.length === 0 ? 'reja yo‘q' : `${fitCompleted} bajarildi`}
            icon={Dumbbell}
            iconBgColor="bg-amber-500"
            iconTextColor="text-white"
            cardBgClass="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white"
            borderClass="border-amber-200/90 hover:border-amber-400 border-l-4 border-l-amber-500"
            labelColorClass="text-amber-900"
            valueColorClass="text-amber-950"
            subValueColorClass="text-amber-700"
            waveColor="#FBBF24"
            onClick={() => navigate('/fitness')}
          />
          <DashboardMetricCard
            label="BUGUNGI UYQU"
            value={activeSleep ? `${(activeSleep.duration_minutes / 60).toFixed(1)}` : '—'}
            subValue={activeSleep ? `${(activeSleep.duration_minutes / 60).toFixed(1)} soat` : 'Kiritilmagan'}
            icon={Moon}
            iconBgColor="bg-purple-600"
            iconTextColor="text-white"
            cardBgClass="bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-white"
            borderClass="border-purple-200/90 hover:border-purple-400 border-l-4 border-l-purple-600"
            labelColorClass="text-purple-900"
            valueColorClass="text-purple-950"
            subValueColorClass="text-purple-700"
            waveColor="#C084FC"
            onClick={() => navigate('/sleep')}
          />
        </div>

        {/* Empty State / Task Planner Area */}
        {activeDateTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-blue-600 p-8 sm:p-12 shadow-xs flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Illustrated Calendar with clock and leaves */}
            <CalendarIllustration />

            <div className="space-y-3 text-center md:text-left max-w-md">
              <h3 className="text-lg font-bold text-slate-900">
                Bugungi rejang hali kiritilmagan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Intizomli kun ertalabki aniq rejalardan boshlanadi. Bugungi SAT, Fitness va umumiy vazifalaringizni belgilang.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => handleOpenAdd('SAT')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Bugun uchun reja qo‘shish</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-blue-600 p-6 shadow-xs space-y-6">
            {/* SAT & English Section */}
            {satTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      SAT va English ({satTasks.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => handleOpenAdd('SAT')}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Mavzu
                  </button>
                </div>
                <div className="space-y-2">
                  {satTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={completeTask}
                      onArchive={archiveTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fitness Section */}
            {fitnessTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Fitness ({fitnessTasks.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => handleOpenAdd('Fitness')}
                    className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Mashq
                  </button>
                </div>
                <div className="space-y-2">
                  {fitnessTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={completeTask}
                      onArchive={archiveTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* General Section */}
            {generalTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Umumiy vazifalar ({generalTasks.length})
                  </h3>
                  <button
                    onClick={() => handleOpenAdd('General')}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Qo‘shish
                  </button>
                </div>
                <div className="space-y-2">
                  {generalTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={completeTask}
                      onArchive={archiveTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom 3 Quick Access Cards Grid with Rich Color Accents and Left Edge Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Uyqu qaydi */}
          <div
            onClick={() => navigate('/sleep')}
            className="group relative bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 rounded-2xl border border-purple-200/80 border-l-4 border-l-purple-600 p-4.5 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-purple-300/20 blur-sm pointer-events-none" />
            <div className="flex items-center gap-3.5 min-w-0 z-10">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Moon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-purple-950 truncate">Uyqu qaydi</h4>
                <p className="text-[11px] text-purple-700/80 font-medium truncate">
                  {activeSleep
                    ? `${(activeSleep.duration_minutes / 60).toFixed(1)} soat qayd etilgan`
                    : 'Bugungi uyquni kiritish'}
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/90 border border-purple-100 shadow-xs flex items-center justify-center text-purple-400 group-hover:text-purple-700 transition-colors z-10">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Musiqa & Fokus */}
          <div
            onClick={() => navigate('/music')}
            className="group relative bg-gradient-to-br from-cyan-50/90 via-white to-blue-50/40 rounded-2xl border border-cyan-200/80 border-l-4 border-l-cyan-600 p-4.5 shadow-xs hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-cyan-300/20 blur-sm pointer-events-none" />
            <div className="flex items-center gap-3.5 min-w-0 z-10">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-cyan-950 truncate">Musiqa & Fokus</h4>
                <p className="text-[11px] text-cyan-700/80 font-medium truncate">
                  Mashg‘ulotlar musiqasi
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/90 border border-cyan-100 shadow-xs flex items-center justify-center text-cyan-400 group-hover:text-cyan-700 transition-colors z-10">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Dars & Fokus Taymeri */}
          <div
            onClick={() => navigate('/timer')}
            className="group relative bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 rounded-2xl border border-blue-200/80 border-l-4 border-l-blue-600 p-4.5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-blue-300/20 blur-sm pointer-events-none" />
            <div className="flex items-center gap-3.5 min-w-0 z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                isTimerActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-600 text-white'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-blue-950 truncate">Dars Taymeri</h4>
                  {isTimerActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <p className="text-[11px] text-blue-700/80 font-mono font-medium truncate">
                  {isTimerActive
                    ? 'Fokus faol hisoblanmoqda...'
                    : todayTotalSeconds > 0
                    ? `${Math.floor(todayTotalSeconds / 3600) > 0 ? `${Math.floor(todayTotalSeconds / 3600)}s ` : ''}${Math.floor((todayTotalSeconds % 3600) / 60)} daq dars qilindi`
                    : 'Fokusni boshlash'}
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/90 border border-blue-100 shadow-xs flex items-center justify-center text-blue-400 group-hover:text-blue-700 transition-colors z-10">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Widgets Panel (Kalendar, Quote, Maqsadlar uchun progress) */}
      <div className="w-full xl:w-80 shrink-0 space-y-5">
        <CalendarWidget
          selectedDate={selectedCalendarDate}
          onSelectDate={(d) => setSelectedCalendarDate(d)}
        />
        <QuoteWidget />
        <GoalsProgressWidget
          satPercent={satPercent}
          englishPercent={englishPercent}
          fitnessPercent={fitnessPercent}
          sleepPercent={sleepPercent}
        />
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
        defaultDate={selectedCalendarDate}
        defaultCategory={selectedCategory}
      />
    </div>
  );
};
