import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useChallenge } from '../challenges/ChallengeContext';
import { MockTest } from '../../types';
import { validateSatScore, validateSatSectionScore } from '../../lib/validation';

const LOCAL_STORAGE_MOCKS_KEY = 'ironman_local_mocks';

export function useMocks() {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  // Initialize standard 10 mocks
  const createDefaultMocks = (userId: string, challengeId?: string): MockTest[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `mock-${i + 1}`,
      user_id: userId,
      challenge_id: challengeId,
      mock_number: i + 1,
      status: 'NOT_STARTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  };

  const loadMocks = useCallback(async () => {
    if (!user) {
      setMocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (configured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mock_tests')
          .select('*')
          .eq('user_id', user.id)
          .order('mock_number', { ascending: true });

        if (error) {
          console.warn('Error loading mocks from Supabase:', error);
          loadLocalMocks();
        } else if (data && data.length > 0) {
          // Fill in any missing numbers up to 10
          const map = new Map<number, MockTest>();
          data.forEach((m) => map.set(m.mock_number, m as MockTest));
          const completeList: MockTest[] = [];
          for (let i = 1; i <= 10; i++) {
            if (map.has(i)) {
              completeList.push(map.get(i)!);
            } else {
              completeList.push({
                id: `mock-${i}`,
                user_id: user.id,
                challenge_id: activeChallenge?.id,
                mock_number: i,
                status: 'NOT_STARTED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
          setMocks(completeList);
        } else {
          // Initialize 10 empty mocks
          const defaults = createDefaultMocks(user.id, activeChallenge?.id);
          setMocks(defaults);
        }
      } catch (err) {
        console.warn('Mocks fetch exception:', err);
        loadLocalMocks();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalMocks();
      setLoading(false);
    }
  }, [user, activeChallenge, configured]);

  const loadLocalMocks = () => {
    if (!user) return;
    const raw = localStorage.getItem(LOCAL_STORAGE_MOCKS_KEY);
    if (raw) {
      try {
        const parsed: MockTest[] = JSON.parse(raw);
        if (parsed.length === 10) {
          setMocks(parsed);
          return;
        }
      } catch (e) {
        console.warn('Error parsing local mocks:', e);
      }
    }
    const defaults = createDefaultMocks(user.id, activeChallenge?.id);
    setMocks(defaults);
    localStorage.setItem(LOCAL_STORAGE_MOCKS_KEY, JSON.stringify(defaults));
  };

  const saveLocalMocks = (list: MockTest[]) => {
    localStorage.setItem(LOCAL_STORAGE_MOCKS_KEY, JSON.stringify(list));
    setMocks(list);
  };

  useEffect(() => {
    loadMocks();
  }, [loadMocks]);

  const updateMock = async (
    mockNumber: number,
    updates: Partial<MockTest>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Tizimga kirish talab etiladi' };

    // Validate scores
    if (updates.total_score !== undefined) {
      const v = validateSatScore(updates.total_score);
      if (!v.valid) return { success: false, error: v.error };
    }
    if (updates.reading_writing_score !== undefined) {
      const v = validateSatSectionScore(updates.reading_writing_score, 'Reading & Writing');
      if (!v.valid) return { success: false, error: v.error };
    }
    if (updates.math_score !== undefined) {
      const v = validateSatSectionScore(updates.math_score, 'Math');
      if (!v.valid) return { success: false, error: v.error };
    }

    const currentMock = mocks.find((m) => m.mock_number === mockNumber);
    if (!currentMock) return { success: false, error: 'Mock topilmadi' };

    const updatedItem: MockTest = {
      ...currentMock,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'COMPLETED' && !updatedItem.completed_at) {
      updatedItem.completed_at = new Date().toISOString();
    }

    const updatedList = mocks.map((m) => (m.mock_number === mockNumber ? updatedItem : m));

    if (configured && supabase) {
      try {
        const { error } = await supabase.from('mock_tests').upsert({
          ...updatedItem,
          user_id: user.id,
          challenge_id: activeChallenge?.id,
          mock_number: mockNumber,
        });

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    saveLocalMocks(updatedList);
    return { success: true };
  };

  const completedCount = mocks.filter((m) => m.status === 'COMPLETED').length;
  const recordedScores = mocks
    .filter((m) => m.total_score !== undefined && m.total_score !== null)
    .map((m) => m.total_score as number);
  const latestMock = [...mocks]
    .filter((m) => m.status === 'COMPLETED' && m.total_score)
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))[0];

  return {
    mocks,
    loading,
    updateMock,
    completedCount,
    recordedScores,
    latestMock,
    refreshMocks: loadMocks,
  };
}
