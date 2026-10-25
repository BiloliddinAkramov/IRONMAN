import React, { useState } from 'react';
import { useTasks } from '../features/tasks/TaskContext';
import { useFitness } from '../features/fitness/useFitness';
import { TaskCard } from '../components/tasks/TaskCard';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import {
  UZBEK_WEEKDAYS_FROM_MONDAY,
  getTashkentTodayString,
  getWeekdayIndex,
  formatMinutes,
} from '../lib/dates';
import {
  Dumbbell,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ChevronRight,
  BarChart3,
  Activity,
} from 'lucide-react';

// Athlete silhouette with mountain contours illustration
const AthleteSilhouetteIllustration: React.FC<{ className?: string }> = ({
  className = 'w-48 h-32 sm:w-64 sm:h-36',
}) => (
  <div
    className={`relative flex items-center justify-end shrink-0 select-none pointer-events-none overflow-hidden ${className}`}
  >
    <svg
      viewBox="0 0 320 170"
      className="w-full h-full object-contain"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background mountains */}
      <path
        d="M 10 170 L 65 110 L 105 145 L 165 90 L 225 140 L 285 105 L 320 130 L 320 170 Z"
        fill="#93c5fd"
        fillOpacity="0.22"
      />
      <path
        d="M 60 170 L 115 125 L 155 155 L 215 105 L 265 145 L 320 115 L 320 170 Z"
        fill="#60a5fa"
        fillOpacity="0.18"
      />

      {/* Muscular athlete silhouette flexing */}
      <g fill="#3b82f6" fillOpacity="0.28">
        {/* Head */}
        <circle cx="240" cy="50" r="15" />
        {/* Neck */}
        <path d="M 234 64 L 246 64 L 248 76 L 232 76 Z" />
        {/* Torso */}
        <path d="M 222 76 C 222 76 232 74 246 74 C 260 74 266 80 266 104 C 266 125 256 170 256 170 L 224 170 C 224 170 218 132 220 104 C 220 86 222 76 222 76 Z" />
        {/* Left shoulder */}
        <path d="M 222 80 C 210 84 200 94 200 108 C 200 117 206 125 212 126 C 217 127 222 120 222 114 C 222 100 220 90 222 80 Z" />
        {/* Right shoulder & bicep */}
        <path d="M 256 78 C 268 78 280 86 282 100 C 284 112 278 120 270 124 C 266 116 262 106 258 98 Z" />
        {/* Forearm & flexed fist */}
        <path d="M 280 100 C 282 90 280 76 276 66 C 272 58 264 56 260 60 C 256 64 258 76 262 86 C 266 96 270 104 280 100 Z" />
        <circle cx="266" cy="58" r="7.5" />
      </g>
    </svg>
  </div>
);

export const FitnessPage: React.FC = () => {
  const { tasks, addTask, completeTask, archiveTask, deleteTask } = useTasks();
  const { getExercisesForDay } = useFitness();

  const todayStr = getTashkentTodayString();
  const currentWeekdayIndex = getWeekdayIndex(todayStr);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(currentWeekdayIndex);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter fitness tasks
  const fitnessTasks = tasks.filter(
    (t) => t.category === 'Fitness' && t.status !== 'ARCHIVED'
  );

  const todayFitnessTasks = fitnessTasks.filter((t) => t.scheduled_date === todayStr);
  const completedTodayTasks = todayFitnessTasks.filter((t) => t.status === 'COMPLETED');
  const completedAllFitnessTasks = fitnessTasks.filter((t) => t.status === 'COMPLETED');

  const totalWorkoutMinutes = completedAllFitnessTasks.reduce(
    (acc, t) => acc + (t.estimated_minutes || 0),
    0
  );

  // Approximate calories: ~7.5 kcal per workout minute
  const totalCalories = Math.round(totalWorkoutMinutes * 7.5);

  const dailyGoalPercent =
    todayFitnessTasks.length > 0
      ? Math.round((completedTodayTasks.length / todayFitnessTasks.length) * 100)
      : 0;

  // Calculate completed days in the week
  const completedDaysInWeek = UZBEK_WEEKDAYS_FROM_MONDAY.filter((item) => {
    if (item.index === currentWeekdayIndex) {
      return completedTodayTasks.length > 0;
    }
    return false;
  }).length;

  return (
    <div className="space-y-6">
      {/* 1. Fitness Hero Banner: Sog‘lom tana — kuchli iroda with Left Edge Accent */}
      <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/70 border border-blue-100/90 border-l-[5px] border-l-blue-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200/80 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>FITNESS MODULI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Sog‘lom tana — kuchli iroda
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5 leading-relaxed">
            O‘z maqsadingiz sari har kuni bir qadam.
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto relative z-10">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Mashq qo‘shish</span>
          </button>

          {/* Silhouette illustration */}
          <AthleteSilhouetteIllustration />
        </div>
      </div>

      {/* 2. 4 Metric Flashcards - Exact same color scheme and styling as Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Blue - Bugungi Trening */}
        <div
          onClick={() => setIsAddModalOpen(true)}
          className="group relative rounded-2xl border border-blue-200/90 hover:border-blue-400 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-0.5"
        >
          {/* Decorative ambient blur orb */}
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#60A5FA' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-blue-600 text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                BUGUNGI TRENING
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-blue-950">
              {completedTodayTasks.length} / {todayFitnessTasks.length || 1}
            </span>
            <span className="text-xs font-semibold truncate text-blue-700">
              mashq
            </span>
          </div>
        </div>

        {/* Card 2: Emerald - Jami Kaloriya */}
        <div className="group relative rounded-2xl border border-emerald-200/90 hover:border-emerald-400 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#34D399' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-emerald-600 text-white">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                JAMI KALORIYA
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-950">
              {totalCalories}
            </span>
            <span className="text-xs font-semibold truncate text-emerald-700">
              kkal
            </span>
          </div>
        </div>

        {/* Card 3: Amber - Trening Vaqti */}
        <div className="group relative rounded-2xl border border-amber-200/90 hover:border-amber-400 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#FBBF24' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-amber-500 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                TRENING VAQTI
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-amber-950">
              {totalWorkoutMinutes > 0 ? formatMinutes(totalWorkoutMinutes) : '0 daq'}
            </span>
          </div>
        </div>

        {/* Card 4: Purple - Kunlik Maqsad */}
        <div className="group relative rounded-2xl border border-purple-200/90 hover:border-purple-400 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#C084FC' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-purple-600 text-white">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                KUNLIK MAQSAD
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>

          <div className="space-y-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-purple-950">
              {dailyGoalPercent}%
            </span>
            <div className="h-1.5 w-full bg-purple-100/80 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(dailyGoalPercent, 4)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Haftalik mashqlar with Left Edge Accent */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-blue-600 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Haftalik mashqlar
            </h3>
          </div>
          <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 tabular-nums">
            {completedDaysInWeek} / 7 kun
          </span>
        </div>

        {/* 7 Days Grid: Dush, Sesh, Chor, Pay, Jum, Shan, Yak */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
          {UZBEK_WEEKDAYS_FROM_MONDAY.map((item) => {
            const isToday = currentWeekdayIndex === item.index;
            const isSelected = selectedDayIndex === item.index;

            return (
              <button
                key={item.index}
                onClick={() => setSelectedDayIndex(item.index)}
                className={`p-3.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[90px] relative ${
                  isToday
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isSelected
                    ? 'bg-blue-50/80 border border-blue-300 text-blue-900'
                    : 'bg-slate-50/70 border border-slate-100 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    isToday ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {item.short}
                </span>

                {isToday && (
                  <span className="text-[10px] text-blue-100 font-medium mt-0.5">
                    Bugun
                  </span>
                )}

                {/* Bottom circle or check */}
                {isToday ? (
                  <CheckCircle2 className="w-4 h-4 text-white mt-2" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-200/70 mt-3" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bugungi fitness mashg‘ulotlari with Left Edge Accent */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-emerald-600 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Bugungi fitness mashg‘ulotlari ({todayFitnessTasks.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mashq qo‘shish</span>
          </button>
        </div>

        {todayFitnessTasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-7 flex items-center justify-center gap-3 text-slate-500 text-xs sm:text-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="font-medium text-slate-600">
              Bugun mashg‘ulot belgilanmagan. Yangi mashq qo‘shish uchun yuqoridagi tugmani bosing.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {todayFitnessTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={completeTask}
                onArchive={archiveTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
        defaultDate={todayStr}
        defaultCategory="Fitness"
      />
    </div>
  );
};
