import React, { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { useSleep } from '../features/sleep/useSleep';
import { useTasks } from '../features/tasks/TaskContext';
import { useExpenses } from '../features/expenses/useExpenses';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  formatUzbekDate,
  calculateChallengeDates,
} from '../lib/dates';
import { notificationService } from '../lib/notifications/notificationService';
import {
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  getSupabaseConfig,
} from '../lib/supabase';
import {
  Settings as SettingsIcon,
  User,
  Calendar,
  Clock,
  Bell,
  Moon,
  Download,
  Database,
  AlertTriangle,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, signOut, isConfigured } = useAuth();
  const { activeChallenge, createChallenge } = useChallenge();
  const { sleepTargetHours, updateSleepTarget } = useSleep();
  const { tasks } = useTasks();
  const { expenses } = useExpenses();

  // Profile form state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [currency, setCurrency] = useState(profile?.preferred_currency || 'UZS');
  const [profileSaved, setProfileSaved] = useState(false);

  // Challenge settings state
  const [isChallengeDateModalOpen, setIsChallengeDateModalOpen] = useState(false);
  const [newStartDate, setNewStartDate] = useState(activeChallenge?.start_date || '');
  const [challengeWarningConfirm, setChallengeWarningConfirm] = useState(false);

  // Daily planning time
  const [planningTime, setPlanningTime] = useState(
    localStorage.getItem('ironman_daily_planning_time') || '08:00'
  );
  const [notifySat, setNotifySat] = useState(
    localStorage.getItem('ironman_notify_sat') !== 'false'
  );
  const [notifyFitness, setNotifyFitness] = useState(
    localStorage.getItem('ironman_notify_fitness') !== 'false'
  );

  // Supabase modal
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  // Logout confirm
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const supabaseConfig = getSupabaseConfig();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      display_name: displayName.trim(),
      preferred_currency: currency,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSaveReminders = () => {
    localStorage.setItem('ironman_daily_planning_time', planningTime);
    localStorage.setItem('ironman_notify_sat', notifySat ? 'true' : 'false');
    localStorage.setItem('ironman_notify_fitness', notifyFitness ? 'true' : 'false');
    notificationService.requestPermission();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleUpdateChallengeStartDate = async () => {
    if (!newStartDate) return;
    await createChallenge(newStartDate);
    setIsChallengeDateModalOpen(false);
    setChallengeWarningConfirm(false);
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      user: { id: user?.id, email: user?.email, profile },
      challenge: activeChallenge,
      tasks,
      expenses,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironman_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCustomSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) return;
    saveCustomSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Sozlamalar va Profil
            </h2>
          </div>
        </div>
      </div>

      {profileSaved && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sozlamalar muvaffaqiyatli saqlandi.</span>
        </div>
      )}

      {/* 1. Profile Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Shaxsiy Profil</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ism / Taxallus
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'Mahalliy foydalanuvchi'}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standart valyuta
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="UZS">UZS (O‘zbekiston so‘mi)</option>
                <option value="USD">USD (AQSh dollari)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vaqt mintaqasi
              </label>
              <input
                type="text"
                disabled
                value="Asia/Tashkent (UTC+5)"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" type="submit">
              Profilni saqlash
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Challenge Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              3 oylik chaqiriq parametrlari
            </h3>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStartDate(activeChallenge?.start_date || '');
              setIsChallengeDateModalOpen(true);
            }}
          >
            Boshlanish sanasini o‘zgartirish
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Boshlanish sanasi:</span>
            <strong className="text-slate-900 font-mono text-sm">
              {formatUzbekDate(activeChallenge?.start_date || '')}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Yakunlanish sanasi:</span>
            <strong className="text-slate-900 font-mono text-sm">
              {formatUzbekDate(activeChallenge?.end_date || '')}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Holat:</span>
            <strong className="text-emerald-700 font-semibold text-sm">
              Faol intizom davri
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Daily Reminders & Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Rejalashtirish va bildirishnomalar
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kunlik ertalabki rejalashtirish eslatmasi vaqti
            </label>
            <input
              type="time"
              value={planningTime}
              onChange={(e) => setPlanningTime(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm font-mono bg-white"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifySat}
                onChange={(e) => setNotifySat(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-slate-700 font-medium">
                Kunlik SAT/English rejasi kiritilmaganda eslatish
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyFitness}
                onChange={(e) => setNotifyFitness(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-slate-700 font-medium">
                Kunlik Fitness rejasi belgilanmaganda eslatish
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={handleSaveReminders}>
              Eslatmalarni saqlash
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Database & Supabase Integration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Supabase Ma’lumotlar Bazasi
            </h3>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSupabaseModalOpen(true)}
          >
            Ulanishni sozlash
          </Button>
        </div>

        <div className="text-xs space-y-2 text-slate-600">
          <p>
            Holat:{' '}
            <strong className={isConfigured ? 'text-emerald-600' : 'text-slate-800'}>
              {isConfigured ? 'Supabase PostgreSQL ulangan' : 'Mahalliy xavfsiz rejim'}
            </strong>
          </p>
          {supabaseConfig.url && (
            <p className="font-mono text-[11px] text-slate-500">
              URL: {supabaseConfig.url}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            Barcha SQL migratsiyalar <code>supabase/migrations/</code> papkasida mavjud bo‘lib, RLS xavfsizlik qoidalarini o‘z ichiga oladi.
          </p>
        </div>
      </div>

      {/* 5. Personal Data Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Download className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Ma’lumotlarni yuklab olish</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          O‘zingiz kiritgan barcha vazifalar, mock natijalari, xarajatlar va profilingizni shaxsiy kompyuteringizga JSON formatida yuklab olishingiz mumkin.
        </p>

        <Button variant="secondary" size="sm" onClick={handleExportJSON}>
          <Download className="w-4 h-4 mr-1.5" />
          JSON faylini yuklab olish
        </Button>
      </div>

      {/* 6. Sign Out & Account Action */}
      <div className="bg-white rounded-xl border border-red-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-red-100 pb-3 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-bold">Chiqish va Xavfsizlik</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Joriy sessiyani tugatish va tizimdan chiqish.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsLogoutConfirmOpen(true)}
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Tizimdan chiqish
        </Button>
      </div>

      {/* Challenge Start Date Edit Modal with Warning */}
      <Modal
        isOpen={isChallengeDateModalOpen}
        onClose={() => setIsChallengeDateModalOpen(false)}
        title="Chaqiriq boshlanish sanasini o‘zgartirish"
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 leading-relaxed">
            <strong>Ogohlantirish:</strong> Chaqiriq sanasini o‘zgartirish kunlar hisobi va tarixiy tahlilga ta’sir qiladi. Ushbu amal faqat dastlabki xatolikni tuzatish uchun mo‘ljallangan.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yangi boshlanish sanasi
            </label>
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={challengeWarningConfirm}
              onChange={(e) => setChallengeWarningConfirm(e.target.checked)}
              className="rounded"
            />
            <span>Ogohlantirishni o‘qidim va o‘zgartirishni tasdiqlayman</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsChallengeDateModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!challengeWarningConfirm || !newStartDate}
              onClick={handleUpdateChallengeStartDate}
            >
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Supabase Config Modal */}
      <Modal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        title="Supabase ulanish sozlamalari"
      >
        <form onSubmit={handleSaveCustomSupabase} className="space-y-4 text-sm">
          <p className="text-xs text-slate-500">
            Shaxsiy Supabase loyihangiz ma’lumotlarini kiriting.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project URL
            </label>
            <input
              type="url"
              required
              placeholder="https://xyz.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anon Key
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            {isConfigured && (
              <button
                type="button"
                onClick={() => clearCustomSupabaseConfig()}
                className="text-xs text-red-600 hover:underline"
              >
                Ulanishni tozalash
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsSupabaseModalOpen(false)}
              >
                Yopish
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Saqlash va Ulanish
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Logout Confirm Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={signOut}
        title="Tizimdan chiqish"
        message="Haqiqatan ham IRONMAN tizimidan chiqmoqchimisiz?"
        confirmLabel="Chiqish"
      />
    </div>
  );
};
