import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useChallenge } from '../challenges/ChallengeContext';
import { SleepRecord } from '../../types';
import { calculateSleepDuration, getTashkentTodayString } from '../../lib/dates';

const LOCAL_STORAGE_SLEEP_KEY = 'ironman_local_sleep';

export function useSleep() {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sleepTargetHours, setSleepTargetHours] = useState<number>(8.0);
  const configured = isSupabaseConfigured();

  const loadSleepRecords = useCallback(async () => {
    if (!user) {
      setSleepRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Load sleep target
    const savedTarget = localStorage.getItem('ironman_sleep_target');
    if (savedTarget) {
      setSleepTargetHours(parseFloat(savedTarget));
    }

    if (configured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sleep_records')
          .select('*')
          .eq('user_id', user.id)
          .order('sleep_date', { ascending: false });

        if (error) {
          console.warn('Error fetching sleep records from Supabase:', error);
          loadLocalSleep();
        } else if (data) {
          setSleepRecords(data as SleepRecord[]);
        }
      } catch (err) {
        console.warn('Sleep records exception:', err);
        loadLocalSleep();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalSleep();
      setLoading(false);
    }
  }, [user, configured]);

  const loadLocalSleep = () => {
    const raw = localStorage.getItem(LOCAL_STORAGE_SLEEP_KEY);
    if (raw) {
      try {
        setSleepRecords(JSON.parse(raw));
        return;
      } catch (e) {
        console.warn('Error parsing local sleep records:', e);
      }
    }
    setSleepRecords([]);
  };

  const saveLocalSleep = (records: SleepRecord[]) => {
    localStorage.setItem(LOCAL_STORAGE_SLEEP_KEY, JSON.stringify(records));
    setSleepRecords(records);
  };

  useEffect(() => {
    loadSleepRecords();
  }, [loadSleepRecords]);

  const recordSleep = async (data: {
    sleep_date: string;
    bedtime: string;
    wake_time: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Tizimga kirish talab etiladi' };

    const today = getTashkentTodayString();
    if (data.sleep_date > today) {
      return { success: false, error: 'Kelgusi kunlar uchun uyqu kiritib bo‘lmaydi' };
    }

    const { durationMinutes } = calculateSleepDuration(data.bedtime, data.wake_time);

    const recordData: Partial<SleepRecord> = {
      user_id: user.id,
      challenge_id: activeChallenge?.id,
      sleep_date: data.sleep_date,
      bedtime: data.bedtime,
      wake_time: data.wake_time,
      duration_minutes: durationMinutes,
      notes: data.notes?.trim() || undefined,
      updated_at: new Date().toISOString(),
    };

    if (configured && supabase) {
      try {
        const { data: upserted, error } = await supabase
          .from('sleep_records')
          .upsert(recordData, { onConflict: 'user_id,sleep_date' })
          .select()
          .single();

        if (error) return { success: false, error: error.message };

        setSleepRecords((prev) => {
          const filtered = prev.filter((r) => r.sleep_date !== data.sleep_date);
          return [upserted as SleepRecord, ...filtered].sort((a, b) => b.sleep_date.localeCompare(a.sleep_date));
        });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      const existingIdx = sleepRecords.findIndex((r) => r.sleep_date === data.sleep_date);
      let updated: SleepRecord[];
      if (existingIdx !== -1) {
        const item: SleepRecord = {
          ...sleepRecords[existingIdx],
          ...recordData,
        };
        updated = [...sleepRecords];
        updated[existingIdx] = item;
      } else {
        const item: SleepRecord = {
          id: 'sleep-' + Date.now(),
          created_at: new Date().toISOString(),
          ...(recordData as Omit<SleepRecord, 'id' | 'created_at'>),
        };
        updated = [item, ...sleepRecords];
      }
      updated.sort((a, b) => b.sleep_date.localeCompare(a.sleep_date));
      saveLocalSleep(updated);
      return { success: true };
    }
  };

  const deleteSleepRecord = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (configured && supabase) {
      try {
        const { error } = await supabase.from('sleep_records').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    const updated = sleepRecords.filter((r) => r.id !== id);
    saveLocalSleep(updated);
    return { success: true };
  };

  const updateSleepTarget = (hours: number) => {
    setSleepTargetHours(hours);
    localStorage.setItem('ironman_sleep_target', hours.toString());
  };

  // Metrics
  const totalLoggedDays = sleepRecords.length;
  const totalMinutes = sleepRecords.reduce((acc, r) => acc + r.duration_minutes, 0);
  const averageMinutes = totalLoggedDays > 0 ? Math.round(totalMinutes / totalLoggedDays) : 0;
  const averageHours = (averageMinutes / 60).toFixed(1);

  return {
    sleepRecords,
    loading,
    sleepTargetHours,
    recordSleep,
    deleteSleepRecord,
    updateSleepTarget,
    averageHours,
    averageMinutes,
    totalLoggedDays,
    refreshSleep: loadSleepRecords,
  };
}
