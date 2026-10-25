import React, { useState } from 'react';
import { useSleep } from '../features/sleep/useSleep';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  getTashkentTodayString,
  calculateSleepDuration,
  formatUzbekDate,
} from '../lib/dates';
import {
  Moon,
  Plus,
  Clock,
  CheckCircle,
  TrendingUp,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const SleepPage: React.FC = () => {
  const {
    sleepRecords,
    sleepTargetHours,
    recordSleep,
    deleteSleepRecord,
    updateSleepTarget,
    averageHours,
    totalLoggedDays,
  } = useSleep();

  const todayStr = getTashkentTodayString();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Form state
  const [sleepDate, setSleepDate] = useState(todayStr);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Target input
  const [tempTarget, setTempTarget] = useState(sleepTargetHours);

  // Real-time calculated duration preview
  const durationPreview = calculateSleepDuration(bedtime, wakeTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await recordSleep({
      sleep_date: sleepDate,
      bedtime,
      wake_time: wakeTime,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      setIsRecordModalOpen(false);
      setNotes('');
    } else {
      setError(res.error || 'Xatolik yuz berdi');
    }
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    updateSleepTarget(tempTarget);
    setIsTargetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Left Edge Accent */}
      <div className="bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/40 rounded-2xl sm:rounded-3xl border border-purple-200/90 border-l-[5px] border-l-purple-600 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2.5">
              <Moon className="w-3.5 h-3.5" />
              <span>UYQU MODULI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Kunlik Uyqu va Tiklanish
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
              Yetarli va sifatli uyqu — miya va tana samaradorligining asosi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setTempTarget(sleepTargetHours);
                setIsTargetModalOpen(true);
              }}
            >
              Maqsadni sozlash
            </Button>
            <button
              onClick={() => {
                setSleepDate(todayStr);
                setIsRecordModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Uyquni qayd etish</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Flashcards - Exact same color scheme and styling as Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Blue - O‘rtacha Uyqu */}
        <div className="group relative rounded-2xl border border-blue-200/90 hover:border-blue-400 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#60A5FA' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-blue-600 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                O‘RTACHA UYQU
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-blue-950">
              {totalLoggedDays > 0 ? `${averageHours} s` : '—'}
            </span>
            <span className="text-xs font-semibold truncate text-blue-700">
              {totalLoggedDays > 0 && parseFloat(averageHours) >= sleepTargetHours
                ? 'maqsad darajasida'
                : 'kunlik'}
            </span>
          </div>
        </div>

        {/* Card 2: Emerald - Belgilangan Maqsad */}
        <div className="group relative rounded-2xl border border-emerald-200/90 hover:border-emerald-400 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#34D399' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-emerald-600 text-white">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                BELGILANGAN MAQSAD
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-950">
              {sleepTargetHours} soat
            </span>
            <span className="text-xs font-semibold truncate text-emerald-700">
              optimal
            </span>
          </div>
        </div>

        {/* Card 3: Amber - Qayd Etilgan Kunlar */}
        <div className="group relative rounded-2xl border border-amber-200/90 hover:border-amber-400 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white p-4.5 sm:p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: '#FBBF24' }}
          />

          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-amber-500 text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                QAYD ETILGAN KUNLAR
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-amber-950">
              {totalLoggedDays}
            </span>
            <span className="text-xs font-semibold truncate text-amber-700">
              kun
            </span>
          </div>
        </div>

        {/* Card 4: Purple - Oxirgi Qayd */}
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
                OXIRGI QAYD
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 z-10 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-purple-950">
              {sleepRecords[0] ? `${(sleepRecords[0].duration_minutes / 60).toFixed(1)} s` : '—'}
            </span>
            <span className="text-xs font-semibold truncate text-purple-700">
              oxirgi
            </span>
          </div>
        </div>
      </div>

      {/* Sleep History Timeline with Left Edge Accent */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-purple-600 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Uyqu qaydlari tarixi
            </h3>
          </div>
        </div>

        {sleepRecords.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Hali birorta uyqu qaydi kiritilmagan.{' '}
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Bugungi uyquni kiritish
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sleepRecords.map((record) => {
              const hours = (record.duration_minutes / 60).toFixed(1);
              const diffMinutes = record.duration_minutes - sleepTargetHours * 60;
              const isTargetMet = record.duration_minutes >= sleepTargetHours * 60;

              return (
                <div
                  key={record.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isTargetMet
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {formatUzbekDate(record.sleep_date, true)}
                      </h4>
                      <p className="text-slate-500 font-mono mt-0.5">
                        Yotish: {record.bedtime} · Uyg‘onish: {record.wake_time}
                      </p>
                      {record.notes && (
                        <p className="text-slate-400 mt-1 italic leading-relaxed">
                          "{record.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                    <div className="text-right">
                      <div className="font-mono tabular-nums font-bold text-sm text-slate-900">
                        {hours} soat
                      </div>
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          diffMinutes >= 0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {diffMinutes >= 0
                          ? `+${Math.round(diffMinutes)} daq maqsad ustida`
                          : `${Math.round(diffMinutes)} daq kam`}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteSleepRecord(record.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded"
                      aria-label="Qaydni o‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Sleep Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Uyquni qayd etish"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sana
            </label>
            <input
              type="date"
              max={todayStr}
              value={sleepDate}
              onChange={(e) => setSleepDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yotish vaqti
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Uyg‘onish vaqti
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          {/* Automatic calculation preview */}
          <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <span>Hisoblangan davomiylik:</span>
            <strong className="font-mono font-bold text-sm">
              {durationPreview.formatted} ({durationPreview.durationMinutes} daqiqa)
            </strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uyqu sifati yoki eslatma (ixtiyoriy)
            </label>
            <textarea
              rows={2}
              placeholder="Uyqu chuqurligi, uyg‘onish holati..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Target Edit Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Kunlik uyqu maqsadini sozlash"
      >
        <form onSubmit={handleSaveTarget} className="space-y-4 text-sm">
          <p className="text-xs text-slate-500">
            Sog‘lom aqliy faoliyat va tiklanish uchun optimal uyqu soatini tanlang.
          </p>

          <div className="flex items-center gap-4 py-2">
            <input
              type="range"
              min="5"
              max="11"
              step="0.5"
              value={tempTarget}
              onChange={(e) => setTempTarget(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="font-mono font-bold text-sm text-slate-900 w-16 text-right">
              {tempTarget} soat
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsTargetModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
