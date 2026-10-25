import React, { useState } from 'react';
import {
  Check,
  Lock,
  Clock,
  BookOpen,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { Task } from '../../types';
import { formatMinutes } from '../../lib/dates';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  onArchive?: (taskId: string) => Promise<any>;
  onDelete?: (taskId: string) => Promise<any>;
  showCategory?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onArchive,
  onDelete,
  showCategory = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCompleted = task.status === 'COMPLETED';
  const isLocked = task.status === 'LOCKED' || task.status === 'MISSED';
  const isCarried = Boolean(task.carried_from_task_id);

  const handleToggle = async () => {
    if (isCompleted || isLocked || loading) return;
    setLoading(true);
    setErrorMsg(null);
    const res = await onComplete(task.id);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
    setLoading(false);
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'SAT':
      case 'English':
        return <BookOpen className="w-3.5 h-3.5 text-blue-600" />;
      case 'Fitness':
        return <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all ${
        isCompleted
          ? 'bg-slate-50/60 border-slate-200'
          : isLocked
          ? 'bg-slate-50 border-slate-200 opacity-80'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox / Lock indicator */}
        <div className="pt-0.5 shrink-0">
          {isLocked ? (
            <div
              className="w-5 h-5 rounded-md border border-slate-300 bg-slate-200 flex items-center justify-center text-slate-500 cursor-not-allowed"
              title="Muddati o‘tgan va qulflangan"
            >
              <Lock className="w-3 h-3" />
            </div>
          ) : (
            <button
              onClick={handleToggle}
              disabled={loading || isCompleted}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-blue-600 hover:bg-blue-50'
              }`}
              aria-label={isCompleted ? 'Bajarildi' : 'Bajarilgan deb belgilash'}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-medium leading-snug break-words ${
                isCompleted
                  ? 'line-through text-slate-400'
                  : isLocked
                  ? 'text-slate-600'
                  : 'text-slate-900'
              }`}
            >
              {task.title}
            </h4>

            {/* Menu */}
            {(onArchive || onDelete) && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  aria-label="Qo‘shimcha amallar"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 w-36 bg-white rounded-lg shadow-md border border-slate-200 py-1 z-20 text-xs">
                    {onArchive && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onArchive(task.id);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Arxivlash
                      </button>
                    )}
                    {onDelete && !isLocked && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(task.id);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        O‘chirish
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes if any */}
          {task.notes && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.notes}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
            {showCategory && (
              <span className="flex items-center gap-1 font-medium">
                {getCategoryIcon()}
                <span>{task.category}</span>
              </span>
            )}

            {task.scheduled_time && (
              <span className="flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.scheduled_time.substring(0, 5)}</span>
              </span>
            )}

            {task.estimated_minutes > 0 && (
              <span className="font-mono tabular-nums">
                {formatMinutes(task.estimated_minutes)}
              </span>
            )}

            {isCarried && (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                <ArrowRight className="w-3 h-3" />
                O‘tgan kundan ko‘chirildi
              </span>
            )}

            {isLocked && (
              <span className="text-red-600 font-medium text-[11px]">
                Qulflangan (bajarilmadi)
              </span>
            )}

            {isCompleted && task.completed_at && (
              <span className="text-emerald-600 font-medium text-[11px]">
                Bajarildi
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
