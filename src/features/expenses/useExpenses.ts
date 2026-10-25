import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useChallenge } from '../challenges/ChallengeContext';
import { Expense } from '../../types';
import { validateExpenseAmount } from '../../lib/validation';

const LOCAL_STORAGE_EXPENSES_KEY = 'ironman_local_expenses';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Oziq-ovqat',
  'Transport',
  'Ta’lim',
  'Fitness',
  'Shaxsiy',
  'Boshqa',
];

export function useExpenses() {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const loadExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (configured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error loading expenses from Supabase:', error);
          loadLocalExpenses();
        } else if (data) {
          setExpenses(data as Expense[]);
        }
      } catch (err) {
        console.warn('Expenses fetch exception:', err);
        loadLocalExpenses();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalExpenses();
      setLoading(false);
    }
  }, [user, configured]);

  const loadLocalExpenses = () => {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    if (raw) {
      try {
        setExpenses(JSON.parse(raw));
        return;
      } catch (e) {
        console.warn('Error parsing local expenses:', e);
      }
    }
    setExpenses([]);
  };

  const saveLocalExpenses = (items: Expense[]) => {
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(items));
    setExpenses(items);
  };

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const addExpense = async (data: {
    amount: number;
    currency?: string;
    category: string;
    expense_date: string;
    description: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Tizimga kirish talab etiladi' };

    const v = validateExpenseAmount(data.amount);
    if (!v.valid) return { success: false, error: v.error };

    if (!data.description.trim()) {
      return { success: false, error: 'Xarajat tavsifi kiritilishi shart' };
    }

    const newExpenseData: Partial<Expense> = {
      user_id: user.id,
      challenge_id: activeChallenge?.id,
      amount: data.amount,
      currency: data.currency || 'UZS',
      category: data.category || 'Boshqa',
      expense_date: data.expense_date,
      description: data.description.trim(),
      notes: data.notes?.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (configured && supabase) {
      try {
        const { data: created, error } = await supabase
          .from('expenses')
          .insert(newExpenseData)
          .select()
          .single();

        if (error) return { success: false, error: error.message };

        setExpenses((prev) => [created as Expense, ...prev]);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      const item: Expense = {
        id: 'exp-' + Date.now(),
        ...(newExpenseData as Omit<Expense, 'id'>),
      };
      const updated = [item, ...expenses];
      saveLocalExpenses(updated);
      return { success: true };
    }
  };

  const updateExpense = async (
    id: string,
    updates: Partial<Expense>
  ): Promise<{ success: boolean; error?: string }> => {
    if (updates.amount !== undefined) {
      const v = validateExpenseAmount(updates.amount);
      if (!v.valid) return { success: false, error: v.error };
    }

    const updatedList = expenses.map((e) =>
      e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
    );

    if (configured && supabase) {
      try {
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    saveLocalExpenses(updatedList);
    return { success: true };
  };

  const deleteExpense = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (configured && supabase) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    const updated = expenses.filter((e) => e.id !== id);
    saveLocalExpenses(updated);
    return { success: true };
  };

  // Aggregations
  const totalAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const getCategoryBreakdown = () => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + Number(e.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    totalAmount,
    getCategoryBreakdown,
    refreshExpenses: loadExpenses,
  };
}
