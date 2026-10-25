import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { FocusSession, FocusCategory, DailyFocusSummary } from '../../types';
import { getTashkentTodayString, formatUzbekDate } from '../../lib/dates';
import { useChallenge } from '../challenges/ChallengeContext';
import { useAuth } from '../auth/AuthContext';
import { firestorePersistence } from '../../lib/firestorePersistence';

interface ActiveTimerState {
  isActive: boolean;
  isPaused: boolean;
  startedAt: number | null; // timestamp
  accumulatedSeconds: number; // seconds prior to last resume
  lastResumeTime: number | null; // timestamp of last resume
  taskName: string;
  category: FocusCategory;
  tasksCompleted: number;
}

interface TimerContextType {
  // Active Timer
  isActive: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  currentTaskName: string;
  currentCategory: FocusCategory;
  currentTasksCount: number;
  startTimer: (category?: FocusCategory, taskName?: string, tasksCount?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveTimer: (taskName?: string, category?: FocusCategory, tasksCount?: number, notes?: string) => FocusSession;
  cancelTimer: () => void;
  updateActiveSessionDetails: (details: { taskName?: string; category?: FocusCategory; tasksCount?: number }) => void;

  // History & Sessions
  sessions: FocusSession[];
  addManualSession: (session: Omit<FocusSession, 'id' | 'created_at'>) => void;
  deleteSession: (sessionId: string) => void;

  // Summaries
  todaySessions: FocusSession[];
  todayTotalSeconds: number;
  todayTasksCompleted: number;
  getDailySummaries: () => DailyFocusSummary[];
  getChartData: (range: 'weekly' | 'monthly' | 'all') => {
    date: string;
    displayDate: string;
    hours: number;
    minutes: number;
    formattedTime: string;
    tasksCount: number;
    sessionsCount: number;
  }[];
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSIONS_KEY = 'ironman_focus_sessions_v1';
const LOCAL_STORAGE_ACTIVE_TIMER_KEY = 'ironman_active_focus_timer_v1';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { dayInfo } = useChallenge();
  const todayStr = getTashkentTodayString();

  // Active Timer State - starts completely inactive/zero
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TIMER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse active timer:', e);
    }
    return {
      isActive: false,
      isPaused: false,
      startedAt: null,
      accumulatedSeconds: 0,
      lastResumeTime: null,
      taskName: 'SAT Math: Practice & Problem Solving',
      category: 'SAT Math',
      tasksCompleted: 1,
    };
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Sessions History: strictly starts empty (0) for fresh profiles
  const [sessions, setSessions] = useState<FocusSession[]>(() => {
    try {
      const key = user ? `ironman_${user.id}_focus_sessions` : LOCAL_STORAGE_SESSIONS_KEY;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy sample seed sessions if any were cached previously
          const realSessions = parsed.filter((s: FocusSession) => !s.id?.startsWith('seed-'));
          return realSessions;
        }
      }
    } catch (e) {
      console.warn('Failed to parse sessions from storage:', e);
    }
    return [];
  });

  // Reload sessions when user changes and sync with cloud
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    const key = `ironman_${user.id}_focus_sessions`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realSessions = parsed.filter((s: FocusSession) => !s.id?.startsWith('seed-'));
          setSessions(realSessions);
        }
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.warn('Failed to load user sessions:', e);
      setSessions([]);
    }

    // Seamlessly sync with Firestore in background
    firestorePersistence.getFocusSessions(user.id).then((cloudSessions) => {
      if (cloudSessions && cloudSessions.length > 0) {
        setSessions((prev) => {
          const idMap = new Map<string, FocusSession>();
          cloudSessions.forEach((s) => idMap.set(s.id, s));
          prev.forEach((s) => idMap.set(s.id, s));
          const merged = Array.from(idMap.values()).sort((a, b) =>
            (b.created_at || '').localeCompare(a.created_at || '')
          );
          try {
            localStorage.setItem(key, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
  }, [user?.id]);

  // Calculate live elapsed seconds based on wall-clock time
  const calculateElapsed = (timer: ActiveTimerState) => {
    if (!timer.isActive) return 0;
    if (timer.isPaused) return timer.accumulatedSeconds;
    if (!timer.lastResumeTime) return timer.accumulatedSeconds;
    const currentRun = Math.floor((Date.now() - timer.lastResumeTime) / 1000);
    return timer.accumulatedSeconds + Math.max(0, currentRun);
  };

  // Sync elapsed seconds every second if active
  useEffect(() => {
    if (!activeTimer.isActive) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(calculateElapsed(activeTimer));

    if (activeTimer.isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed(activeTimer));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Persist active timer whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TIMER_KEY, JSON.stringify(activeTimer));
    } catch (e) {
      console.warn('Failed to save active timer to storage:', e);
    }
  }, [activeTimer]);

  // Persist sessions per user
  const saveSessions = (newSessions: FocusSession[], sessionToSync?: FocusSession) => {
    setSessions(newSessions);
    try {
      const key = user ? `ironman_${user.id}_focus_sessions` : LOCAL_STORAGE_SESSIONS_KEY;
      localStorage.setItem(key, JSON.stringify(newSessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
    if (user?.id && sessionToSync) {
      firestorePersistence.saveFocusSession(sessionToSync, user.id);
    }
  };

  // Timer controls
  const startTimer = (
    category: FocusCategory = 'SAT Math',
    taskName = 'SAT Math mashg‘uloti',
    tasksCount = 1
  ) => {
    const now = Date.now();
    setActiveTimer({
      isActive: true,
      isPaused: false,
      startedAt: now,
      accumulatedSeconds: 0,
      lastResumeTime: now,
      taskName: taskName || 'Dars seansi',
      category: category || 'SAT Math',
      tasksCompleted: Math.max(1, tasksCount),
    });
  };

  const pauseTimer = () => {
    if (!activeTimer.isActive || activeTimer.isPaused) return;
    const now = Date.now();
    const currentRun = activeTimer.lastResumeTime
      ? Math.floor((now - activeTimer.lastResumeTime) / 1000)
      : 0;
    setActiveTimer((prev) => ({
      ...prev,
      isPaused: true,
      accumulatedSeconds: prev.accumulatedSeconds + Math.max(0, currentRun),
      lastResumeTime: null,
    }));
  };

  const resumeTimer = () => {
    if (!activeTimer.isActive || !activeTimer.isPaused) return;
    const now = Date.now();
    setActiveTimer((prev) => ({
      ...prev,
      isPaused: false,
      lastResumeTime: now,
    }));
  };

  const updateActiveSessionDetails = (details: {
    taskName?: string;
    category?: FocusCategory;
    tasksCount?: number;
  }) => {
    setActiveTimer((prev) => ({
      ...prev,
      taskName: details.taskName !== undefined ? details.taskName : prev.taskName,
      category: details.category !== undefined ? details.category : prev.category,
      tasksCompleted: details.tasksCount !== undefined ? details.tasksCount : prev.tasksCompleted,
    }));
  };

  const stopAndSaveTimer = (
    taskName?: string,
    category?: FocusCategory,
    tasksCount?: number,
    notes?: string
  ): FocusSession => {
    const totalSecs = Math.max(10, calculateElapsed(activeTimer)); // minimum 10s logged
    const now = new Date();
    const startTimeStr = activeTimer.startedAt
      ? new Date(activeTimer.startedAt).toTimeString().substring(0, 5)
      : now.toTimeString().substring(0, 5);
    const endTimeStr = now.toTimeString().substring(0, 5);

    const newSession: FocusSession = {
      id: 'session-' + Date.now(),
      date: todayStr,
      start_time: startTimeStr,
      end_time: endTimeStr,
      duration_seconds: totalSecs,
      task_name: taskName || activeTimer.taskName || 'Fokus darsi',
      category: category || activeTimer.category || 'SAT Math',
      tasks_completed: tasksCount !== undefined ? tasksCount : activeTimer.tasksCompleted || 1,
      notes: notes || 'Fokus taymeri orqali yakunlandi',
      created_at: now.toISOString(),
    };

    const updated = [newSession, ...sessions];
    saveSessions(updated, newSession);

    // Reset active timer
    setActiveTimer({
      isActive: false,
      isPaused: false,
      startedAt: null,
      accumulatedSeconds: 0,
      lastResumeTime: null,
      taskName: 'SAT Math: Practice & Problem Solving',
      category: 'SAT Math',
      tasksCompleted: 1,
    });

    return newSession;
  };

  const cancelTimer = () => {
    setActiveTimer({
      isActive: false,
      isPaused: false,
      startedAt: null,
      accumulatedSeconds: 0,
      lastResumeTime: null,
      taskName: 'SAT Math: Practice & Problem Solving',
      category: 'SAT Math',
      tasksCompleted: 1,
    });
  };

  const addManualSession = (sessionData: Omit<FocusSession, 'id' | 'created_at'>) => {
    const session: FocusSession = {
      ...sessionData,
      id: 'session-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    saveSessions([session, ...sessions], session);
  };

  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessions(updated);
    if (user?.id) {
      firestorePersistence.deleteFocusSession(sessionId);
    }
  };

  // Summaries
  const todaySessions = useMemo(() => {
    return sessions.filter((s) => s.date === todayStr);
  }, [sessions, todayStr]);

  const todayTotalSeconds = useMemo(() => {
    const savedToday = todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    // If active timer running today, also include current elapsed seconds
    const liveExtra = activeTimer.isActive ? elapsedSeconds : 0;
    return savedToday + liveExtra;
  }, [todaySessions, activeTimer.isActive, elapsedSeconds]);

  const todayTasksCompleted = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.tasks_completed || 0), 0);
  }, [todaySessions]);

  // Group by day for Flashcard summaries
  const getDailySummaries = (): DailyFocusSummary[] => {
    const map = new Map<string, FocusSession[]>();

    // Include today if not yet in map
    if (!map.has(todayStr)) {
      map.set(todayStr, []);
    }

    sessions.forEach((s) => {
      const list = map.get(s.date) || [];
      list.push(s);
      map.set(s.date, list);
    });

    const dates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return dates.map((date) => {
      const daySessions = map.get(date) || [];
      const totalSec = daySessions.reduce((acc, s) => acc + s.duration_seconds, 0);
      const totalTasks = daySessions.reduce((acc, s) => acc + (s.tasks_completed || 0), 0);

      return {
        date,
        total_duration_seconds: totalSec,
        total_tasks_completed: totalTasks,
        session_count: daySessions.length,
        sessions: daySessions,
      };
    });
  };

  // Chart data calculation
  const getChartData = (range: 'weekly' | 'monthly' | 'all') => {
    const dailyMap = new Map<string, { duration_seconds: number; tasks_completed: number; count: number }>();

    // Determine how many days back to prepare
    let daysBack = 7;
    if (range === 'monthly') daysBack = 30;
    if (range === 'all') daysBack = 90;

    const todayDate = new Date(todayStr);

    // Initialize consecutive dates in chronological order
    const dateList: string[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      dateList.push(str);
      dailyMap.set(str, { duration_seconds: 0, tasks_completed: 0, count: 0 });
    }

    // Populate from sessions
    sessions.forEach((s) => {
      if (dailyMap.has(s.date)) {
        const item = dailyMap.get(s.date)!;
        item.duration_seconds += s.duration_seconds;
        item.tasks_completed += (s.tasks_completed || 0);
        item.count += 1;
      }
    });

    // If active timer running today, add to today
    if (activeTimer.isActive && dailyMap.has(todayStr)) {
      const item = dailyMap.get(todayStr)!;
      item.duration_seconds += elapsedSeconds;
    }

    return dateList.map((dStr) => {
      const data = dailyMap.get(dStr) || { duration_seconds: 0, tasks_completed: 0, count: 0 };
      const hours = Number((data.duration_seconds / 3600).toFixed(1));
      const totalMins = Math.round(data.duration_seconds / 60);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;

      // Format short date, e.g. "25-Okt"
      const parts = dStr.split('-');
      const dayNum = parseInt(parts[2], 10);
      const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      const monthStr = monthNames[parseInt(parts[1], 10) - 1] || '';
      const displayDate = `${dayNum}-${monthStr}`;

      return {
        date: dStr,
        displayDate,
        hours,
        minutes: totalMins,
        formattedTime: `${h}s ${m}d`,
        tasksCount: data.tasks_completed,
        sessionsCount: data.count,
      };
    });
  };

  return (
    <TimerContext.Provider
      value={{
        isActive: activeTimer.isActive,
        isPaused: activeTimer.isPaused,
        elapsedSeconds,
        currentTaskName: activeTimer.taskName,
        currentCategory: activeTimer.category,
        currentTasksCount: activeTimer.tasksCompleted,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopAndSaveTimer,
        cancelTimer,
        updateActiveSessionDetails,
        sessions,
        addManualSession,
        deleteSession,
        todaySessions,
        todayTotalSeconds,
        todayTasksCompleted,
        getDailySummaries,
        getChartData,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
