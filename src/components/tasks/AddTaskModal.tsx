import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TaskCategory } from '../../types';
import { getTashkentTodayString } from '../../lib/dates';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    category: TaskCategory;
    scheduled_date: string;
    scheduled_time?: string;
    estimated_minutes?: number;
    notes?: string;
    carry_forward?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  defaultDate?: string;
  defaultCategory?: TaskCategory;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultDate,
  defaultCategory = 'General',
}) => {
  const today = getTashkentTodayString();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [scheduledDate, setScheduledDate] = useState(defaultDate || today);
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [carryForward, setCarryForward] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vazifa nomi kiritilishi shart');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await onAdd({
      title: title.trim(),
      category,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || undefined,
      estimated_minutes: Number(estimatedMinutes) || 30,
      notes: notes.trim() || undefined,
      carry_forward: carryForward,
    });

    setLoading(false);

    if (res.success) {
      setTitle('');
      setNotes('');
      setScheduledTime('');
      onClose();
    } else {
      setError(res.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yangi vazifa qo‘shish">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Vazifa nomi *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: SAT Math — Quadratic Equations"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategoriya
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white text-slate-900"
            >
              <option value="SAT">SAT</option>
              <option value="English">English</option>
              <option value="Fitness">Fitness</option>
              <option value="General">Umumiy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejalashtirilgan sana
            </label>
            <input
              type="date"
              min={today}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Boshlanish vaqti (ixtiyoriy)
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Taxminiy vaqt (daqiqa)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white text-slate-900 font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Qo‘shimcha izoh (ixtiyoriy)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mavzular yoki mashq tafsilotlari..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-slate-800 block">
              Keyingi kunga ko‘chirish
            </span>
            <span className="text-[11px] text-slate-500 block">
              Bajarilmasa, ertangi kunga avtomatik o‘tkaziladi
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={carryForward}
              onChange={(e) => setCarryForward(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
            Bekor qilish
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Vazifani saqlash
          </Button>
        </div>
      </form>
    </Modal>
  );
};
