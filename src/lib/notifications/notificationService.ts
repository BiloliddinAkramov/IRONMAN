import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { NotificationPreferences, Task } from '../../types';
import { getTashkentTodayString } from '../dates';

export interface NotificationStatus {
  supported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isNative: boolean;
}

class NotificationService {
  private isNative = Capacitor.isNativePlatform();

  async checkPermission(): Promise<NotificationStatus> {
    if (this.isNative) {
      try {
        const check = await LocalNotifications.checkPermissions();
        return {
          supported: true,
          permission: check.display === 'granted' ? 'granted' : check.display === 'denied' ? 'denied' : 'prompt',
          isNative: true,
        };
      } catch (err) {
        console.warn('Native checkPermissions failed:', err);
        return { supported: false, permission: 'unsupported', isNative: true };
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      return {
        supported: true,
        permission: Notification.permission as 'granted' | 'denied' | 'prompt',
        isNative: false,
      };
    }

    return { supported: false, permission: 'unsupported', isNative: false };
  }

  async requestPermission(): Promise<NotificationStatus> {
    if (this.isNative) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return {
          supported: true,
          permission: result.display === 'granted' ? 'granted' : 'denied',
          isNative: true,
        };
      } catch (err) {
        console.error('LocalNotifications.requestPermissions error:', err);
        return { supported: false, permission: 'denied', isNative: true };
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return {
          supported: true,
          permission: res as 'granted' | 'denied' | 'prompt',
          isNative: false,
        };
      } catch (err) {
        console.error('Web Notification.requestPermission error:', err);
        return { supported: false, permission: 'denied', isNative: false };
      }
    }

    return { supported: false, permission: 'unsupported', isNative: false };
  }

  /**
   * Schedules a task reminder for a specific task.
   */
  async scheduleTaskReminder(task: Task): Promise<boolean> {
    if (!task.scheduled_time || !task.scheduled_date) return false;

    const [h, m] = task.scheduled_time.split(':').map(Number);
    const [year, month, day] = task.scheduled_date.split('-').map(Number);
    const triggerDate = new Date(year, month - 1, day, h, m, 0);

    // If time is in the past, do not schedule
    if (triggerDate.getTime() <= Date.now()) return false;

    const id = Math.abs(this.hashString(task.id));

    if (this.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title: `IRONMAN: ${task.title}`,
              body: `Belgilangan vaqt yaqinlashmoqda (${task.category})`,
              schedule: { at: triggerDate },
              sound: 'beep.wav',
              extra: { taskId: task.id },
            },
          ],
        });
        return true;
      } catch (e) {
        console.error('Failed to schedule native notification:', e);
        return false;
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const delayMs = triggerDate.getTime() - Date.now();
      // Web timeout fallback for the current active tab
      if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification(`IRONMAN: ${task.title}`, {
            body: `Belgilangan vaqt yaqinlashmoqda (${task.category})`,
            icon: '/icons/icon-192.png',
          });
        }, delayMs);
        return true;
      }
    }

    return false;
  }

  /**
   * Check daily planning reminder condition.
   * If user has no SAT or Fitness plan for today, notify them.
   */
  async checkDailyPlanningReminders(
    tasks: Task[],
    preferences: NotificationPreferences
  ): Promise<void> {
    const today = getTashkentTodayString();
    const todayTasks = tasks.filter((t) => t.scheduled_date === today);

    const hasSatOrEnglish = todayTasks.some(
      (t) => (t.category === 'SAT' || t.category === 'English') && t.status !== 'ARCHIVED'
    );
    const hasFitness = todayTasks.some(
      (t) => t.category === 'Fitness' && t.status !== 'ARCHIVED'
    );

    // Check if we already notified today to prevent spam
    const lastNotifiedDay = localStorage.getItem('ironman_last_planning_notified_date');
    if (lastNotifiedDay === today) {
      return; // Already notified today
    }

    if (preferences.notify_missing_sat && !hasSatOrEnglish) {
      await this.sendImmediateNotification(
        1001,
        'IRONMAN: SAT & English rejasi',
        'Bugungi SAT va ingliz tili rejangiz hali kiritilmagan. Intizomni saqlang!'
      );
    }

    if (preferences.notify_missing_fitness && !hasFitness) {
      await this.sendImmediateNotification(
        1002,
        'IRONMAN: Fitness rejasi',
        'Bugungi jismoniy mashg‘ulot yoki dam olish rejangiz hali belgilanmagan.'
      );
    }

    localStorage.setItem('ironman_last_planning_notified_date', today);
  }

  async sendImmediateNotification(id: number, title: string, body: string): Promise<boolean> {
    if (this.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'beep.wav',
            },
          ],
        });
        return true;
      } catch (e) {
        console.error('Failed to send immediate native notification:', e);
        return false;
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/icons/icon-192.png' });
        return true;
      } catch (e) {
        console.error('Web notification failed:', e);
      }
    }

    return false;
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    if (this.isNative) {
      try {
        const id = Math.abs(this.hashString(taskId));
        await LocalNotifications.cancel({ notifications: [{ id }] });
      } catch (e) {
        console.error('Failed to cancel native notification:', e);
      }
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const notificationService = new NotificationService();
