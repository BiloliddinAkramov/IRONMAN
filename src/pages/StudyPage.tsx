import React, { useState } from 'react';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { useTasks } from '../features/tasks/TaskContext';
import { useMocks } from '../features/study/useMocks';
import { TaskCard } from '../components/tasks/TaskCard';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { MockTest } from '../types';
import {
  getTashkentTodayString,
  formatUzbekDate,
  formatMinutes,
} from '../lib/dates';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Target,
  CheckCircle2,
  FileText,
} from 'lucide-react';

// Crisp 3D Stack of Books with Potted Plant Illustration
const BooksWithPlantIllustration: React.FC<{ className?: string }> = ({ className = 'w-44 h-32 sm:w-56 sm:h-36' }) => (
  <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`}>
    {/* Soft ambient background glow */}
    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl transform scale-90 pointer-events-none" />

    <svg
      viewBox="0 0 240 170"
      className="w-full h-full relative z-10 drop-shadow-sm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground drop shadow */}
      <ellipse cx="120" cy="150" rx="92" ry="12" fill="#0f172a" fillOpacity="0.08" />

      {/* Book 1 (Bottom - Purple/Violet) */}
      <g id="bottom-book">
        {/* Pages */}
        <path d="M 46 126 L 174 138 L 194 121 L 66 109 Z" fill="#f8fafc" />
        <path d="M 46 126 L 46 134 L 174 146 L 174 138 Z" fill="#e2e8f0" />
        <path d="M 174 146 L 194 129 L 194 121 L 174 138 Z" fill="#cbd5e1" />
        {/* Cover */}
        <path d="M 40 133 L 174 148 L 199 128 L 65 113 Z" fill="#4c1d95" />
        <path d="M 40 133 L 40 140 L 174 154 L 174 148 Z" fill="#6d28d9" />
        <path d="M 40 140 L 63 121 L 65 113 L 40 133 Z" fill="#7c3aed" />
      </g>

      {/* Book 2 (Middle - Crisp White/Ice Blue) */}
      <g id="middle-book">
        {/* Pages */}
        <path d="M 52 106 L 178 118 L 198 102 L 72 90 Z" fill="#ffffff" />
        <path d="M 52 106 L 52 114 L 178 126 L 178 118 Z" fill="#f1f5f9" />
        <path d="M 178 126 L 198 110 L 198 102 L 178 118 Z" fill="#cbd5e1" />
        {/* Cover */}
        <path d="M 48 113 L 178 127 L 202 109 L 72 94 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M 48 113 L 48 120 L 178 133 L 178 127 Z" fill="#94a3b8" />
        <path d="M 48 120 L 70 102 L 72 94 L 48 113 Z" fill="#e2e8f0" />
      </g>

      {/* Book 3 (Top - Vibrant Royal Blue) */}
      <g id="top-book">
        {/* Pages */}
        <path d="M 56 84 L 178 96 L 198 80 L 76 68 Z" fill="#f8fafc" />
        <path d="M 56 84 L 56 91 L 178 103 L 178 96 Z" fill="#e2e8f0" />
        <path d="M 178 103 L 198 87 L 198 80 L 178 96 Z" fill="#cbd5e1" />
        {/* Top Cover */}
        <path d="M 52 80 L 176 92 L 198 76 L 74 64 Z" fill="#2563eb" />
        {/* Embossed Spine & Ribbon line */}
        <path d="M 66 79 L 168 89" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <path d="M 52 80 L 52 90 L 176 102 L 176 92 Z" fill="#1d4ed8" />
        <path d="M 52 90 L 74 74 L 74 64 L 52 80 Z" fill="#1e40af" />
      </g>

      {/* Potted Plant Sitting on the Top Book */}
      <g id="plant-pot">
        {/* Pot soft shadow */}
        <ellipse cx="148" cy="80" rx="14" ry="4.5" fill="#1e3a8a" fillOpacity="0.25" />

        {/* Teal ceramic planter pot */}
        <path d="M 137 62 L 140 78 C 140 79.5 156 79.5 156 78 L 159 62 Z" fill="#0f766e" />
        <ellipse cx="148" cy="62" rx="11" ry="3.5" fill="#14b8a6" />
        <ellipse cx="148" cy="62" rx="8.5" ry="2.2" fill="#1e293b" />

        {/* Sprouting lush green leaves */}
        <path d="M 145 61 C 137 50 131 48 126 47 C 130 55 138 60 145 61 Z" fill="#22c55e" />
        <path d="M 148 61 C 148 44 150 35 150 30 C 154 39 150 51 148 61 Z" fill="#16a34a" />
        <path d="M 149 61 C 154 48 160 44 163 43 C 160 52 153 58 149 61 Z" fill="#4ade80" />
        <path d="M 149 61 C 158 55 165 56 168 57 C 162 62 153 62 149 61 Z" fill="#22c55e" />
      </g>
    </svg>
  </div>
);

export const StudyPage: React.FC = () => {
  const { tasks, addTask, completeTask, archiveTask, deleteTask } = useTasks();
  const { mocks, updateMock, completedCount, latestMock } = useMocks();

  const todayStr = getTashkentTodayString();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);

  // Score edit state
  const [mockScoreInput, setMockScoreInput] = useState<{
    total?: number;
    rw?: number;
    math?: number;
    duration?: number;
    notes?: string;
    plannedDate?: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  }>({ status: 'NOT_STARTED' });
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Filter SAT and English tasks
  const studyTasks = tasks.filter(
    (t) => (t.category === 'SAT' || t.category === 'English') && t.status !== 'ARCHIVED'
  );

  const completedStudyTasks = studyTasks.filter((t) => t.status === 'COMPLETED');
  const totalStudyMinutes = completedStudyTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);

  // Group study tasks by date
  const todayStudyTasks = studyTasks.filter((t) => t.scheduled_date === todayStr);
  const upcomingStudyTasks = studyTasks.filter((t) => t.scheduled_date > todayStr);
  const pastStudyTasks = studyTasks.filter((t) => t.scheduled_date < todayStr);

  const handleOpenMockModal = (mock: MockTest) => {
    setSelectedMock(mock);
    setMockScoreInput({
      total: mock.total_score,
      rw: mock.reading_writing_score,
      math: mock.math_score,
      duration: mock.duration_minutes,
      notes: mock.notes || '',
      plannedDate: mock.planned_date || '',
      status: mock.status,
    });
    setScoreError(null);
  };

  const handleSaveMockScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMock) return;

    setScoreLoading(true);
    setScoreError(null);

    const res = await updateMock(selectedMock.mock_number, {
      status: mockScoreInput.status,
      total_score: mockScoreInput.total ? Number(mockScoreInput.total) : undefined,
      reading_writing_score: mockScoreInput.rw ? Number(mockScoreInput.rw) : undefined,
      math_score: mockScoreInput.math ? Number(mockScoreInput.math) : undefined,
      duration_minutes: mockScoreInput.duration ? Number(mockScoreInput.duration) : undefined,
      notes: mockScoreInput.notes?.trim() || undefined,
      planned_date: mockScoreInput.plannedDate || undefined,
    });

    setScoreLoading(false);

    if (res.success) {
      setSelectedMock(null);
    } else {
      setScoreError(res.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner: SAT VA ENGLISH MODULI with Left Edge Accent */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-100/70 border border-blue-100/90 border-l-[5px] border-l-blue-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200/80 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>SAT VA ENGLISH MODULI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            O‘quv rejasi va 10 ta Mock Test
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5 leading-relaxed">
            Maqsadingiz sari har kuni bir qadam oldinga!
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto relative z-10">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi mavzu</span>
          </button>

          {/* Isometric Books Illustration with Plant on top */}
          <BooksWithPlantIllustration />
        </div>
      </div>

      {/* 2. 4 Metric Flashcards - Exact same color scheme and styling as Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Blue - 10-Mock Jarayoni */}
        <div className="group relative rounded-2xl border border-blue-200/90 hover:border-blue-400 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#60A5FA' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-blue-600 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                10-MOCK JARAYONI
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <Award className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>

          <div className="space-y-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-blue-950">
              {completedCount} / 10
            </span>
            <div className="h-1.5 w-full bg-blue-100/80 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max((completedCount / 10) * 100, 6)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Emerald - Mavzular Bajarildi */}
        <div className="group relative rounded-2xl border border-emerald-200/90 hover:border-emerald-400 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#34D399' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-emerald-600 text-white">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                MAVZULAR BAJARILDI
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="space-y-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-950">
              {completedStudyTasks.length}
            </span>
            <div className="h-1.5 w-full bg-emerald-100/80 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    studyTasks.length > 0
                      ? Math.max((completedStudyTasks.length / studyTasks.length) * 100, 6)
                      : 6
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Amber - O‘qish Vaqti */}
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
                O‘QISH VAQTI
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>

          <div className="space-y-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-amber-950">
              {totalStudyMinutes > 0 ? formatMinutes(totalStudyMinutes) : '0 daq'}
            </span>
            <div className="h-1.5 w-full bg-amber-100/80 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max((totalStudyMinutes / 300) * 100, 6), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Purple - Oxirgi Mock Bali */}
        <div className="group relative rounded-2xl border border-purple-200/90 hover:border-purple-400 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#C084FC' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-purple-600 text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                OXIRGI MOCK BALI
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>

          <div className="space-y-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-purple-950">
              {latestMock?.total_score ? latestMock.total_score : '—'}
            </span>
            <div className="h-1.5 w-full bg-purple-100/80 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    latestMock?.total_score
                      ? Math.min(Math.max((latestMock.total_score / 1600) * 100, 6), 100)
                      : 6
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 10 ta Mock Test trekeri with Left Edge Accent */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-blue-600 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              10 ta Mock Test trekeri
            </h3>
          </div>
          <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 tabular-nums">
            {completedCount} / 10 mock bajarildi
          </span>
        </div>

        {/* 2 rows x 5 columns grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
          {mocks.map((mock) => {
            const isDone = mock.status === 'COMPLETED';
            const inProgress = mock.status === 'IN_PROGRESS';

            return (
              <button
                key={mock.mock_number}
                onClick={() => handleOpenMockModal(mock)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group relative ${
                  isDone
                    ? 'bg-blue-50/40 border-blue-200 hover:border-blue-400 hover:shadow-xs'
                    : inProgress
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-blue-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900">
                      Mock {String(mock.mock_number).padStart(2, '0')}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      isDone
                        ? 'text-emerald-700 bg-emerald-50'
                        : inProgress
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-blue-600/70 bg-blue-50/70'
                    }`}
                  >
                    {isDone ? 'Bajarildi' : inProgress ? 'Jarayonda' : 'Boshlanmadi'}
                  </span>
                </div>

                <div className="text-xl font-black font-mono tabular-nums text-slate-900 mt-2.5">
                  {mock.total_score ? mock.total_score : '—'}
                </div>

                <div className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors mt-1 font-medium truncate">
                  {mock.reading_writing_score && mock.math_score ? (
                    <span className="text-slate-600 font-medium">
                      RW: {mock.reading_writing_score} · M: {mock.math_score}
                    </span>
                  ) : mock.planned_date ? (
                    <span className="text-slate-500">Sana: {formatUzbekDate(mock.planned_date)}</span>
                  ) : (
                    <span>Natijani kiritish</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bugungi o‘rganish rejalari with Left Edge Accent */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-indigo-600 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Bugungi o‘rganish rejalari ({todayStudyTasks.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mavzu qo‘shish</span>
          </button>
        </div>

        {todayStudyTasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-7 flex items-center justify-center gap-3 text-slate-500 text-xs sm:text-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-medium text-slate-600">Bugun uchun SAT yoki English rejasi belgilanmagan. Yangi mavzu qo‘shish uchun yuqoridagi tugmani bosing.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {todayStudyTasks.map((t) => (
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

      {/* Upcoming Tasks (if any) */}
      {upcomingStudyTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Kelgusi rejalashtirilgan mavzular ({upcomingStudyTasks.length})
          </h3>
          <div className="space-y-2">
            {upcomingStudyTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={completeTask}
                onArchive={archiveTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historical / Past Tasks (if any) */}
      {pastStudyTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">
            O‘tgan kunlar tarixi ({pastStudyTasks.length})
          </h3>
          <div className="space-y-2 opacity-90">
            {pastStudyTasks.slice(0, 10).map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={completeTask}
                onArchive={archiveTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Mock Score Edit Modal */}
      {selectedMock && (
        <Modal
          isOpen={Boolean(selectedMock)}
          onClose={() => setSelectedMock(null)}
          title={`Mock ${String(selectedMock.mock_number).padStart(2, '0')} ma’lumotlari`}
        >
          <form onSubmit={handleSaveMockScore} className="space-y-4 text-sm">
            {scoreError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                {scoreError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Holat
              </label>
              <select
                value={mockScoreInput.status}
                onChange={(e) =>
                  setMockScoreInput({
                    ...mockScoreInput,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="NOT_STARTED">Boshlanmadi</option>
                <option value="IN_PROGRESS">Jarayonda</option>
                <option value="COMPLETED">Bajarildi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejalashtirilgan sana
              </label>
              <input
                type="date"
                value={mockScoreInput.plannedDate}
                onChange={(e) =>
                  setMockScoreInput({
                    ...mockScoreInput,
                    plannedDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Umumiy ball (400–1600)
                </label>
                <input
                  type="number"
                  min="400"
                  max="1600"
                  placeholder="1450"
                  value={mockScoreInput.total ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setMockScoreInput({ ...mockScoreInput, total: val });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RW (200–800)
                </label>
                <input
                  type="number"
                  min="200"
                  max="800"
                  placeholder="720"
                  value={mockScoreInput.rw ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setMockScoreInput({ ...mockScoreInput, rw: val });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Math (200–800)
                </label>
                <input
                  type="number"
                  min="200"
                  max="800"
                  placeholder="730"
                  value={mockScoreInput.math ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setMockScoreInput({ ...mockScoreInput, math: val });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sarflangan vaqt (daqiqa)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                placeholder="134"
                value={mockScoreInput.duration ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setMockScoreInput({ ...mockScoreInput, duration: val });
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mock xatolari tahlili va eslatmalar
              </label>
              <textarea
                rows={3}
                placeholder="Xatolar va e’tibor qaratish kerak bo‘lgan savollar..."
                value={mockScoreInput.notes}
                onChange={(e) =>
                  setMockScoreInput({ ...mockScoreInput, notes: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setSelectedMock(null)}
              >
                Bekor qilish
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={scoreLoading}>
                Natijani saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
        defaultDate={todayStr}
        defaultCategory="SAT"
      />
    </div>
  );
};
