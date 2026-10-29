import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { firestorePersistence } from '../../lib/firestorePersistence';
import { testConnection } from '../../lib/firebase';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  regenerateSyncCode: () => Promise<string>;
  resetPasswordEmail: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'ironman_local_user';
const LOCAL_STORAGE_PROFILE_KEY = 'ironman_local_profile';

export const generate6DigitPin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (configured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser({ id: session.user.id, email: session.user.email });
            await fetchProfile(session.user.id);
          } else {
            // Check if local guest session exists
            loadLocalSession();
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
              if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email });
                await fetchProfile(session.user.id);
              } else {
                setUser(null);
                setProfile(null);
              }
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        } catch (e) {
          console.error('Supabase getSession error:', e);
          loadLocalSession();
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        // Supabase not configured in env, load local persistence
        loadLocalSession();
        if (mounted) setLoading(false);
      }
    }

    initAuth();
    testConnection();

    return () => {
      mounted = false;
    };
  }, [configured]);

  const loadLocalSession = () => {
    const rawUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    const rawProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (rawUser && rawProfile) {
      try {
        const u = JSON.parse(rawUser);
        const p: UserProfile = JSON.parse(rawProfile);
        if (!p.sync_code) {
          p.sync_code = generate6DigitPin();
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
        }
        setUser(u);
        setProfile(p);
        // Background check cloud
        if (u.id) {
          firestorePersistence.getProfile(u.id).then((cloudProf) => {
            if (cloudProf) {
              if (!cloudProf.sync_code) {
                cloudProf.sync_code = p.sync_code || generate6DigitPin();
                firestorePersistence.saveProfile(cloudProf);
              }
              setProfile(cloudProf);
            } else {
              firestorePersistence.saveProfile(p);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to parse local auth cache:', e);
      }
    } else {
      // First default local session with fresh profile and sync code
      const defaultUser = { id: 'ironman-user-main', email: 'biloliddin@ironman.uz' };
      const defaultProfile: UserProfile = {
        id: defaultUser.id,
        display_name: 'Biloliddin',
        timezone: 'Asia/Tashkent',
        preferred_currency: 'UZS',
        sync_code: generate6DigitPin(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(defaultUser));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(defaultProfile));
      setUser(defaultUser);
      setProfile(defaultProfile);
      firestorePersistence.saveProfile(defaultProfile);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Profile fetch error:', error);
        }

        if (data) {
          setProfile(data as UserProfile);
          return;
        }
      } catch (e) {
        console.warn('Profile fetch exception:', e);
      }
    }

    // Try Firestore
    const cloudProf = await firestorePersistence.getProfile(userId);
    if (cloudProf) {
      setProfile(cloudProf);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (configured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        await fetchProfile(data.user.id);
      }
      return {};
    } else {
      // Local fallback mode
      const rawUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.email === email.trim()) {
          setUser(parsed);
          const rawProf = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          if (rawProf) setProfile(JSON.parse(rawProf));
          return {};
        }
      }
      // First time local login or creation
      const localUser = { id: 'local-user-' + Date.now(), email: email.trim() };
      const localProfile: UserProfile = {
        id: localUser.id,
        display_name: email.split('@')[0],
        timezone: 'Asia/Tashkent',
        preferred_currency: 'UZS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(localProfile));
      setUser(localUser);
      setProfile(localProfile);
      return {};
    }
  };

  const clearAllUserData = () => {
    const keys = [
      'ironman_local_challenge',
      'ironman_local_tasks',
      'ironman_fitness_templates',
      'ironman_local_mocks',
      'ironman_local_sleep',
      'ironman_local_expenses',
      'ironman_focus_sessions_v1',
      'ironman_active_focus_timer_v1',
    ];
    keys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    // Clear all previous data so the new profile starts completely from 0
    clearAllUserData();

    if (configured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        const newProfile: UserProfile = {
          id: data.user.id,
          display_name: displayName.trim() || email.split('@')[0],
          timezone: 'Asia/Tashkent',
          preferred_currency: 'UZS',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Create profile in Supabase
        await supabase.from('profiles').upsert(newProfile);
        setProfile(newProfile);

        // If email confirmation required
        if (!data.session) {
          return { requiresEmailConfirmation: true };
        }
      }
      return {};
    } else {
      // Local fallback creation - brand new profile starting with 0 data
      const localUser = { id: 'local-user-' + Date.now(), email: email.trim() };
      const localProfile: UserProfile = {
        id: localUser.id,
        display_name: displayName.trim() || email.split('@')[0],
        timezone: 'Asia/Tashkent',
        preferred_currency: 'UZS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(localProfile));
      firestorePersistence.saveProfile(localProfile);
      setUser(localUser);
      setProfile(localProfile);
      return {};
    }
  };

  const signOut = async () => {
    if (configured && supabase) {
      await supabase.auth.signOut();
    }
    clearAllUserData();
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);

    firestorePersistence.saveProfile(updated);

    if (configured && supabase && user) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    } else {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }
  };

  const regenerateSyncCode = async (): Promise<string> => {
    const newCode = generate6DigitPin();
    if (profile) {
      const updated: UserProfile = {
        ...profile,
        sync_code: newCode,
        updated_at: new Date().toISOString(),
      };
      setProfile(updated);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
      await firestorePersistence.saveProfile(updated);
    }
    return newCode;
  };

  const resetPasswordEmail = async (email: string): Promise<{ error?: string }> => {
    if (configured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
    }
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: configured,
        signIn,
        signUp,
        signOut,
        updateProfile,
        regenerateSyncCode,
        resetPasswordEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
