import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useChallenge } from '../challenges/ChallengeContext';
import { Task, TaskCategory, TaskStatus } from '../../types';
import { getTashkentTodayString, isTaskPastDeadline } from '../../lib/dates';
import { notificationService } from '../../lib/notifications/notificationService';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (data: {
    title: string;
    category: TaskCategory;
    scheduled_date: string;
    scheduled_time?: string;
    estimated_minutes?: number;
    notes?: string;
    carry_forward?: boolean;
  }) => Promise<{ success: boolean; task?: Task; error?: string }>;
  completeTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<{ success: boolean; error?: string }>;
  archiveTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  runDailyCarryForward: (todayStr?: string) => Promise<number>;
  getTasksForDate: (dateStr: string) => Task[];
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const LOCAL_STORAGE_TASKS_KEY = 'ironman_local_tasks';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (configured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true, nullsFirst: false });

        if (error) {
          console.warn('Error fetching tasks from Supabase:', error);
          loadLocalTasks();
        } else if (data) {
          setTasks(data as Task[]);
        }
      } catch (err) {
        console.warn('Tasks fetch exception:', err);
        loadLocalTasks();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalTasks();
      setLoading(false);
    }
  }, [user, configured]);

  const loadLocalTasks = () => {
    const raw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
    if (raw) {
      try {
        const parsed: Task[] = JSON.parse(raw);
        setTasks(parsed);
        return;
      } catch (e) {
        console.warn('Failed to parse local tasks:', e);
      }
    }
    setTasks([]);
  };

  const saveLocalTasks = (newTasks: Task[]) => {
    localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(newTasks));
    setTasks(newTasks);
  };

  /**
   * Run Carry-Forward:
   * Scans all past tasks whose scheduled_date < today in Asia/Tashkent.
   * If a task was PENDING and past deadline, mark original as LOCKED / MISSED.
   * If carry_forward is true, creates a new instance for today (unless an instance already exists).
   */
  const runDailyCarryForward = useCallback(async (customToday?: string): Promise<number> => {
    if (!user) return 0;
    const today = customToday || getTashkentTodayString();

    let carriedCount = 0;
    const updatedTasks: Task[] = [...tasks];
    const newInstances: Task[] = [];

    for (let i = 0; i < updatedTasks.length; i++) {
      const task = updatedTasks[i];

      // Check if task is from a past date and still pending
      if (task.status === 'PENDING' && isTaskPastDeadline(task.scheduled_date, today)) {
        // Mark original as LOCKED
        task.status = 'LOCKED';
        task.updated_at = new Date().toISOString();

        if (task.carry_forward) {
          // Check if already carried to today to prevent duplicate records
          const alreadyCarried = updatedTasks.some(
            (t) => t.carried_from_task_id === task.id && t.scheduled_date === today
          );

          if (!alreadyCarried) {
            const newInstance: Task = {
              id: 'task-carried-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              user_id: user.id,
              challenge_id: activeChallenge?.id,
              title: task.title,
              category: task.category,
              scheduled_date: today,
              scheduled_time: task.scheduled_time,
              status: 'PENDING',
              estimated_minutes: task.estimated_minutes,
              notes: task.notes,
              carry_forward: task.carry_forward,
              carried_from_task_id: task.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            newInstances.push(newInstance);
            carriedCount++;
          }
        }
      }
    }

    if (carriedCount > 0 || newInstances.length > 0) {
      const allTasks = [...updatedTasks, ...newInstances];

      if (configured && supabase) {
        try {
          // Call database RPC carry_forward if available
          await supabase.rpc('carry_forward_incomplete_tasks', { p_target_date: today });
          // Reload from database
          await loadTasks();
        } catch (e) {
          console.warn('Supabase carry_forward RPC failed, updating locally & batch updating:', e);
          saveLocalTasks(allTasks);
        }
      } else {
        saveLocalTasks(allTasks);
      }
    }

    return carriedCount;
  }, [user, tasks, activeChallenge, configured, loadTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Run carry-forward check on startup or date change
  useEffect(() => {
    if (tasks.length > 0) {
      runDailyCarryForward();
    }
  }, [tasks.length]);

  const addTask = async (data: {
    title: string;
    category: TaskCategory;
    scheduled_date: string;
    scheduled_time?: string;
    estimated_minutes?: number;
    notes?: string;
    carry_forward?: boolean;
  }): Promise<{ success: boolean; task?: Task; error?: string }> => {
    if (!user) return { success: false, error: 'Tizimga kirish talab etiladi' };
    if (!data.title.trim()) return { success: false, error: 'Vazifa nomini kiritish shart' };

    const today = getTashkentTodayString();
    if (data.scheduled_date < today) {
      return { success: false, error: 'O‘tgan sana uchun yangi vazifa kiritish taqiqlangan' };
    }

    const newTaskData: Partial<Task> = {
      user_id: user.id,
      challenge_id: activeChallenge?.id,
      title: data.title.trim(),
      category: data.category,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time || undefined,
      status: 'PENDING',
      estimated_minutes: data.estimated_minutes || 30,
      notes: data.notes?.trim() || undefined,
      carry_forward: data.carry_forward ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (configured && supabase) {
      try {
        const { data: created, error } = await supabase
          .from('tasks')
          .insert(newTaskData)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        const task = created as Task;
        setTasks((prev) => [...prev, task]);

        // Schedule notification reminder if scheduled_time exists
        if (task.scheduled_time) {
          notificationService.scheduleTaskReminder(task);
        }

        return { success: true, task };
      } catch (err: any) {
        return { success: false, error: err.message || 'Xatolik yuz berdi' };
      }
    } else {
      const task: Task = {
        id: 'task-' + Date.now(),
        ...(newTaskData as Omit<Task, 'id'>),
      };
      const updated = [...tasks, task];
      saveLocalTasks(updated);

      if (task.scheduled_time) {
        notificationService.scheduleTaskReminder(task);
      }

      return { success: true, task };
    }
  };

  const completeTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Vazifa topilmadi' };

    if (task.status === 'COMPLETED') {
      return { success: true }; // Already completed
    }

    const today = getTashkentTodayString();

    // Check deadline enforcement:
    // A task can only be completed on its scheduled_date
    if (task.scheduled_date < today) {
      // Mark as LOCKED / MISSED
      await updateTask(taskId, { status: 'LOCKED' });
      return {
        success: false,
        error: 'Vazifa muddati o‘tgan! Kechagi vazifani kechikib bajarish taqiqlangan.',
      };
    }

    if (configured && supabase) {
      try {
        // Try calling the secure server-side RPC first
        const { data: rpcData, error: rpcErr } = await supabase.rpc('complete_task', {
          p_task_id: taskId,
        });

        if (rpcErr || (rpcData && !rpcData.success)) {
          const errMsg = rpcData?.error || rpcErr?.message || 'Bajarishda xatolik';
          return { success: false, error: errMsg };
        }

        // Update local state
        const now = new Date().toISOString();
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED', completed_at: now } : t))
        );
        return { success: true };
      } catch (e: any) {
        console.warn('RPC complete_task failed, falling back to direct update:', e);
      }
    }

    // Direct update
    const completedAt = new Date().toISOString();
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'COMPLETED' as TaskStatus, completed_at: completedAt } : t
    );
    if (configured && supabase) {
      await supabase
        .from('tasks')
        .update({ status: 'COMPLETED', completed_at: completedAt, updated_at: completedAt })
        .eq('id', taskId);
    }
    saveLocalTasks(updated);
    return { success: true };
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Task>
  ): Promise<{ success: boolean; error?: string }> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Vazifa topilmadi' };

    const today = getTashkentTodayString();

    // If task is locked or missed, do not allow arbitrary status change to COMPLETED
    if (task.scheduled_date < today && updates.status === 'COMPLETED') {
      return {
        success: false,
        error: 'Muddati o‘tgan vazifani bajarilgan deb belgilab bo‘lmaydi.',
      };
    }

    const updatedTask = { ...task, ...updates, updated_at: new Date().toISOString() };
    const newTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));

    if (configured && supabase) {
      try {
        const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    saveLocalTasks(newTasks);
    return { success: true };
  };

  const archiveTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    return updateTask(taskId, { status: 'ARCHIVED' });
  };

  const deleteTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Vazifa topilmadi' };

    const today = getTashkentTodayString();
    if (task.scheduled_date < today && task.status === 'LOCKED') {
      // Historical missed records must be preserved!
      return {
        success: false,
        error: 'Tarixiy qaydlarni o‘chirish taqiqlanadi. Vazifani arxivlashingiz mumkin.',
      };
    }

    if (configured && supabase) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    const filtered = tasks.filter((t) => t.id !== taskId);
    saveLocalTasks(filtered);
    await notificationService.cancelTaskReminder(taskId);
    return { success: true };
  };

  const getTasksForDate = (dateStr: string): Task[] => {
    return tasks.filter((t) => t.scheduled_date === dateStr && t.status !== 'ARCHIVED');
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        addTask,
        completeTask,
        updateTask,
        archiveTask,
        deleteTask,
        runDailyCarryForward,
        getTasksForDate,
        refreshTasks: loadTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
