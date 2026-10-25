import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { FitnessTemplate } from '../../types';

const LOCAL_STORAGE_FITNESS_TEMPLATES = 'ironman_fitness_templates';

export function useFitness() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FitnessTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const loadTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (configured && supabase) {
      try {
        const { data, error } = await supabase
          .from('fitness_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('day_of_week', { ascending: true });

        if (error) {
          console.warn('Error loading fitness templates from Supabase:', error);
          loadLocalTemplates();
        } else if (data) {
          setTemplates(data as FitnessTemplate[]);
        }
      } catch (err) {
        console.warn('Fitness templates exception:', err);
        loadLocalTemplates();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalTemplates();
      setLoading(false);
    }
  }, [user, configured]);

  const loadLocalTemplates = () => {
    const raw = localStorage.getItem(LOCAL_STORAGE_FITNESS_TEMPLATES);
    if (raw) {
      try {
        setTemplates(JSON.parse(raw));
        return;
      } catch (e) {
        console.warn('Error parsing local fitness templates:', e);
      }
    }
    setTemplates([]);
  };

  const saveLocalTemplates = (items: FitnessTemplate[]) => {
    localStorage.setItem(LOCAL_STORAGE_FITNESS_TEMPLATES, JSON.stringify(items));
    setTemplates(items);
  };

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const addTemplateExercise = async (data: {
    day_of_week: number;
    exercise_name: string;
    sets?: number;
    reps?: number;
    duration_minutes?: number;
    rest_seconds?: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Tizimga kirish talab etiladi' };
    if (!data.exercise_name.trim()) return { success: false, error: 'Mashq nomi kiritilishi shart' };

    const newTemplateData: Partial<FitnessTemplate> = {
      user_id: user.id,
      day_of_week: data.day_of_week,
      exercise_name: data.exercise_name.trim(),
      sets: data.sets,
      reps: data.reps,
      duration_minutes: data.duration_minutes,
      rest_seconds: data.rest_seconds,
      notes: data.notes?.trim(),
      created_at: new Date().toISOString(),
    };

    if (configured && supabase) {
      try {
        const { data: created, error } = await supabase
          .from('fitness_templates')
          .insert(newTemplateData)
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        setTemplates((prev) => [...prev, created as FitnessTemplate]);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      const item: FitnessTemplate = {
        id: 'ft-' + Date.now(),
        ...(newTemplateData as Omit<FitnessTemplate, 'id'>),
      };
      const updated = [...templates, item];
      saveLocalTemplates(updated);
      return { success: true };
    }
  };

  const deleteTemplateExercise = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (configured && supabase) {
      try {
        const { error } = await supabase.from('fitness_templates').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    const updated = templates.filter((t) => t.id !== id);
    saveLocalTemplates(updated);
    return { success: true };
  };

  const copyDayExercisesTo = async (
    fromDay: number,
    toDay: number
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    const sourceExercises = templates.filter((t) => t.day_of_week === fromDay);
    if (sourceExercises.length === 0) {
      return { success: false, count: 0, error: 'Nusxa olish uchun tanlangan kunda mashqlar yo‘q' };
    }

    let count = 0;
    for (const ex of sourceExercises) {
      await addTemplateExercise({
        day_of_week: toDay,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        duration_minutes: ex.duration_minutes,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      });
      count++;
    }

    return { success: true, count };
  };

  const getExercisesForDay = (dayOfWeek: number) => {
    return templates.filter((t) => t.day_of_week === dayOfWeek);
  };

  return {
    templates,
    loading,
    addTemplateExercise,
    deleteTemplateExercise,
    copyDayExercisesTo,
    getExercisesForDay,
    refreshTemplates: loadTemplates,
  };
}
