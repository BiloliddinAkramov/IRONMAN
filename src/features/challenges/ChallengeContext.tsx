import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Challenge, ChallengeDayInfo } from '../../types';
import {
  calculateChallengeDates,
  getChallengeDayInfo,
  getTashkentTodayString,
} from '../../lib/dates';
import { firestorePersistence } from '../../lib/firestorePersistence';

interface ChallengeContextType {
  activeChallenge: Challenge | null;
  dayInfo: ChallengeDayInfo | null;
  loading: boolean;
  createChallenge: (startDate: string) => Promise<{ success: boolean; error?: string }>;
  completeChallenge: () => Promise<void>;
  refreshChallenge: () => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

const LOCAL_STORAGE_CHALLENGE_KEY = 'ironman_local_challenge';

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [dayInfo, setDayInfo] = useState<ChallengeDayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const loadChallenge = async () => {
    if (!user) {
      setActiveChallenge(null);
      setDayInfo(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (configured && supabase) {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching challenge from Supabase:', error);
          loadLocalChallenge();
        } else if (data) {
          setActiveChallenge(data as Challenge);
          updateDayMetrics(data as Challenge);
        } else {
          setActiveChallenge(null);
          setDayInfo(null);
        }
      } catch (err) {
        console.warn('Challenge fetch exception:', err);
        loadLocalChallenge();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalChallenge();
      setLoading(false);
    }
  };

  const loadLocalChallenge = () => {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHALLENGE_KEY);
    if (raw) {
      try {
        const parsed: Challenge = JSON.parse(raw);
        if (parsed.status === 'active') {
          setActiveChallenge(parsed);
          updateDayMetrics(parsed);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse local challenge:', e);
      }
    }

    if (user?.id) {
      firestorePersistence.getChallenge(user.id).then((cloudChal) => {
        if (cloudChal && cloudChal.status === 'active') {
          setActiveChallenge(cloudChal);
          updateDayMetrics(cloudChal);
          localStorage.setItem(LOCAL_STORAGE_CHALLENGE_KEY, JSON.stringify(cloudChal));
        }
      });
    }

    setActiveChallenge(null);
    setDayInfo(null);
  };

  const updateDayMetrics = (challenge: Challenge) => {
    const info = getChallengeDayInfo(challenge.start_date, challenge.end_date);
    setDayInfo(info);
  };

  useEffect(() => {
    loadChallenge();
  }, [user]);

  const createChallenge = async (startDate: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Foydalanuvchi tizimga kirmagan' };

    try {
      const { endDate } = calculateChallengeDates(startDate);

      const newChallenge: Partial<Challenge> = {
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (configured && supabase) {
        // Cancel any old active challenge first
        await supabase
          .from('challenges')
          .update({ status: 'cancelled' })
          .eq('user_id', user.id)
          .eq('status', 'active');

        const { data, error } = await supabase
          .from('challenges')
          .insert(newChallenge)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        setActiveChallenge(data as Challenge);
        updateDayMetrics(data as Challenge);
        firestorePersistence.saveChallenge(data as Challenge, user.id);
      } else {
        const localId = 'challenge-' + Date.now();
        const savedChallenge: Challenge = {
          id: localId,
          ...(newChallenge as Omit<Challenge, 'id'>),
        };
        localStorage.setItem(LOCAL_STORAGE_CHALLENGE_KEY, JSON.stringify(savedChallenge));
        setActiveChallenge(savedChallenge);
        updateDayMetrics(savedChallenge);
        firestorePersistence.saveChallenge(savedChallenge, user.id);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Chaqiriq yaratishda xatolik yuz berdi' };
    }
  };

  const completeChallenge = async () => {
    if (!activeChallenge) return;

    if (configured && supabase) {
      await supabase
        .from('challenges')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', activeChallenge.id);
    }

    const updated = { ...activeChallenge, status: 'completed' as const };
    localStorage.setItem(LOCAL_STORAGE_CHALLENGE_KEY, JSON.stringify(updated));
    if (user?.id) {
      firestorePersistence.saveChallenge(updated, user.id);
    }
    setActiveChallenge(null);
    setDayInfo(null);
  };

  return (
    <ChallengeContext.Provider
      value={{
        activeChallenge,
        dayInfo,
        loading,
        createChallenge,
        completeChallenge,
        refreshChallenge: loadChallenge,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};
