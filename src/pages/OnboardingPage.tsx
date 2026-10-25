import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { Button } from '../components/ui/Button';
import {
  getTashkentTodayString,
  calculateChallengeDates,
  formatUzbekDate,
} from '../lib/dates';
import { notificationService } from '../lib/notifications/notificationService';
import { Calendar, Clock, Bell, Moon, Award, ArrowRight } from 'lucide-react';

import { IronmanLogo } from '../components/ui/IronmanLogo';

export const OnboardingPage: React.FC = () => {
  const { profile } = useAuth();
  const { createChallenge } = useChallenge();
  const navigate = useNavigate();

  const todayStr = getTashkentTodayString();
  const [startDate, setStartDate] = useState(todayStr);
  const [planningTime, setPlanningTime] = useState('08:00');
  const [sleepTarget, setSleepTarget] = useState(8.0);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute 3-month calculation live preview
  let datesPreview: { startDate: string; endDate: string; totalDays: number } | null = null;
  try {
    datesPreview = calculateChallengeDates(startDate);
  } catch (e) {
    // ignore
  }

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    // Save preferences
    localStorage.setItem('ironman_daily_planning_time', planningTime);
    localStorage.setItem('ironman_sleep_target', sleepTarget.toString());
    localStorage.setItem('ironman_notifications_enabled', enableNotifications ? 'true' : 'false');

    // Request notification permission if enabled
    if (enableNotifications) {
      await notificationService.requestPermission();
    }

    // Create 3-month challenge
    const res = await createChallenge(startDate);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Chaqiriqni boshlashda xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-xl w-full mx-auto bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 sm:px-8 border-b border-slate-100 bg-slate-900 text-white">
          <IronmanLogo size="md" showText={false} className="mb-3" />
          <h2 className="text-xl font-bold tracking-tight text-white">
            Xush kelibsiz, {profile?.display_name || 'Qahramon'}!
          </h2>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            IRONMAN — sizning 3 oylik shaxsiy intizom, SAT, fitness va har kungi qat’iy rejangizni shakllantiruvchi platforma.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Step 1: Challenge Start Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>1. Chaqiriqning boshlanish sanasi</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dastur tanlangan kundan boshlab aynan <strong>3 kalendar oy</strong> davom etadi. Sanalar Osiyo/Toshkent vaqti bilan hisoblanadi.
            </p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-mono text-slate-900"
            />

            {datesPreview && (
              <div className="p-3.5 bg-blue-50/70 rounded-lg border border-blue-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Boshlanish:</span>
                  <strong className="font-mono">{formatUzbekDate(datesPreview.startDate)}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Tugash muddati:</span>
                  <strong className="font-mono">{formatUzbekDate(datesPreview.endDate)}</strong>
                </div>
                <div className="flex justify-between text-blue-800 font-semibold pt-1 border-t border-blue-200/60">
                  <span>Umumiy davomiylik:</span>
                  <span className="font-mono tabular-nums">{datesPreview.totalDays} kun</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Daily planning reminder time */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>2. Har kungi rejalashtirish eslatmasi</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Har kuni ertalab kunlik SAT va Fitness rejalarini kiritish uchun eslatma vaqti.
            </p>
            <input
              type="time"
              value={planningTime}
              onChange={(e) => setPlanningTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-mono text-slate-900"
            />
          </div>

          {/* Step 3: Sleep Target */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Moon className="w-4 h-4 text-blue-600" />
              <span>3. Kunlik uyqu maqsadi</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jismoniy va aqliy tiklanish uchun maqsad qilingan uyqu miqdori.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="6"
                max="10"
                step="0.5"
                value={sleepTarget}
                onChange={(e) => setSleepTarget(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="font-mono tabular-nums font-bold text-sm text-slate-900 w-16 text-right">
                {sleepTarget} soat
              </span>
            </div>
          </div>

          {/* Step 4: Notifications permission */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>4. Qurilma bildirishnomalari</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vazifalar muddati yaqinlashganda va kiritilmagan rejalar haqida bildirishnoma yuborish.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              onClick={handleFinish}
            >
              <span>Chaqiriqni boshlash</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
