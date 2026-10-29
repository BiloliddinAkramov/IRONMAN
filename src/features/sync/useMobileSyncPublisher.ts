import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useChallenge } from '../challenges/ChallengeContext';
import { useTasks } from '../tasks/TaskContext';
import { useTimer } from '../timer/TimerContext';
import { useSleep } from '../sleep/useSleep';
import { useExpenses } from '../expenses/useExpenses';
import { getTashkentTodayString } from '../../lib/dates';
import { firestorePersistence } from '../../lib/firestorePersistence';
import { MobileSyncPayload, MobileTaskItem, MobileDailyStat } from '../../types';

const UZ_WEEKDAYS = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export const useMobileSyncPublisher = () => {
  const { user, profile } = useAuth();
  const { dayInfo } = useChallenge();
  const { tasks, updateTask } = useTasks();
  const { todayTotalSeconds, sessions } = useTimer();
  const { sleepRecords, sleepTargetHours } = useSleep();
  const { expenses } = useExpenses();

  const isRemoteUpdatingRef = useRef(false);
  const lastPublishedHashRef = useRef('');

  useEffect(() => {
    if (!profile?.sync_code || !user) return;
    const syncCode = profile.sync_code.trim();
    if (!syncCode) return;

    const todayStr = getTashkentTodayString();

    // 1. Filter today's tasks
    const todayTasksRaw = tasks.filter(
      (t) => t.scheduled_date === todayStr && t.status !== 'ARCHIVED'
    );

    const mapToMobileItem = (t: any): MobileTaskItem => ({
      id: t.id,
      title: t.title,
      category: t.category,
      scheduled_date: t.scheduled_date,
      scheduled_time: t.scheduled_time,
      estimated_minutes: t.estimated_minutes || 30,
      status: t.status,
      completed_at: t.completed_at,
      notes: t.notes,
    });

    const todayTasks: MobileTaskItem[] = todayTasksRaw.map(mapToMobileItem);

    // Filter recent tasks (last 14 days and next 7 days) for mobile calendar viewing/ticking
    const allRecentTasks: MobileTaskItem[] = tasks
      .filter((t) => t.status !== 'ARCHIVED')
      .map(mapToMobileItem);

    const completedCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;
    const totalCount = todayTasks.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 2. Category minutes breakdown for today
    const categoryBreakdown: { [category: string]: number } = {};
    sessions.forEach((s) => {
      if (s.date === todayStr) {
        const cat = s.category || 'Umumiy';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Math.round(s.duration_seconds / 60);
      }
    });

    // 3. Format focus time
    const h = Math.floor(todayTotalSeconds / 3600);
    const m = Math.floor((todayTotalSeconds % 3600) / 60);
    const todayFocusFormatted = h > 0 ? `${h} soat ${m} daqiqa` : `${m} daqiqa`;

    // 4. Calculate streak days
    const uniqueCompletedDates = new Set(
      tasks.filter((t) => t.status === 'COMPLETED').map((t) => t.scheduled_date)
    );
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 90; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (uniqueCompletedDates.has(dStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    if (streak === 0 && uniqueCompletedDates.size > 0) {
      streak = 1;
    }

    // 5. Build recent 7 days stats for area/line charts
    const recentDays: MobileDailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayTasks = tasks.filter((t) => t.scheduled_date === dStr && t.status !== 'ARCHIVED');
      const dayCompleted = dayTasks.filter((t) => t.status === 'COMPLETED').length;
      const dayTotal = dayTasks.length;
      const dayRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : (i === 0 ? completionRate : 0);

      let dayFocusSec = 0;
      sessions.forEach((s) => {
        if (s.date === dStr) dayFocusSec += s.duration_seconds;
      });

      recentDays.push({
        date: dStr,
        dayName: UZBEK_DAY_ABBR(d.getDay()),
        completed: dayCompleted,
        total: dayTotal,
        focusMinutes: Math.round(dayFocusSec / 60),
        rate: dayRate,
      });
    }

    // 6. Sleep summary
    const latestSleep = sleepRecords.find((r) => r.sleep_date === todayStr) || sleepRecords[0];
    const sleepHours = latestSleep ? Math.round((latestSleep.duration_minutes / 60) * 10) / 10 : 7.5;

    // 7. Expenses summary
    const currentMonthPrefix = todayStr.substring(0, 7);
    const monthExpenses = expenses
      .filter((e) => e.expense_date.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const payload: MobileSyncPayload = {
      sync_code: syncCode,
      user_id: user.id,
      display_name: profile.display_name || 'Foydalanuvchi',
      today_date: todayStr,
      today_tasks: todayTasks,
      all_recent_tasks: allRecentTasks,
      analytics: {
        today_focus_seconds: todayTotalSeconds,
        today_focus_formatted: todayFocusFormatted,
        today_tasks_completed: completedCount,
        today_tasks_total: totalCount,
        completion_rate: completionRate,
        current_streak_days: Math.max(streak, completedCount > 0 ? 1 : 0),
        challenge_day_number: dayInfo?.dayNumber || 1,
        challenge_total_days: dayInfo?.totalDays || 90,
        challenge_percent: dayInfo?.progressPercent || 0,
        category_breakdown: categoryBreakdown,
        recent_days: recentDays,
        sleep_hours: sleepHours,
        sleep_bedtime: latestSleep?.bedtime || '23:00',
        sleep_wake_time: latestSleep?.wake_time || '07:00',
        sleep_target_hours: sleepTargetHours || 8,
        total_expenses_month: monthExpenses,
        completed_dates: Array.from(uniqueCompletedDates),
      },
      updated_at: new Date().toISOString(),
    };

    // Serialize to prevent duplicate publish loops
    const currentHash = JSON.stringify({
      code: syncCode,
      tasks: todayTasks.map((t) => `${t.id}:${t.status}`),
      sec: Math.floor(todayTotalSeconds / 10),
      day: dayInfo?.dayNumber,
      sleep: sleepHours,
      exp: monthExpenses,
    });

    if (lastPublishedHashRef.current !== currentHash && !isRemoteUpdatingRef.current) {
      lastPublishedHashRef.current = currentHash;
      firestorePersistence.saveMobileSync(payload);
    }
  }, [profile?.sync_code, user, tasks, todayTotalSeconds, dayInfo, sessions, sleepRecords, sleepTargetHours, expenses]);

  // Subscribe to real-time changes made from mobile device
  useEffect(() => {
    if (!profile?.sync_code) return;
    const syncCode = profile.sync_code.trim();
    if (!syncCode) return;

    const unsubscribe = firestorePersistence.subscribeMobileSync(syncCode, (remoteData) => {
      if (!remoteData) return;

      const itemsToCheck = [
        ...(remoteData.today_tasks || []),
        ...(remoteData.all_recent_tasks || []),
      ];

      // Check if any task status was ticked on the phone
      itemsToCheck.forEach((remoteTask) => {
        const localTask = tasks.find((t) => t.id === remoteTask.id);
        if (localTask && localTask.status !== remoteTask.status) {
          isRemoteUpdatingRef.current = true;
          updateTask(remoteTask.id, {
            status: remoteTask.status,
            completed_at: remoteTask.completed_at,
          }).finally(() => {
            setTimeout(() => {
              isRemoteUpdatingRef.current = false;
            }, 500);
          });
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.sync_code, tasks, updateTask]);
};

function UZBEK_DAY_ABBR(dayNum: number): string {
  return UZ_WEEKDAYS[dayNum] || 'Du';
}
