import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { FocusSession, Task, Challenge, SleepRecord, Expense, UserProfile, MobileSyncPayload, TaskStatus } from '../types';

export const firestorePersistence = {
  // Profiles
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.id), profile);
    } catch (e) {
      console.warn('Firestore saveProfile fallback to offline:', e);
    }
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore getProfile fallback to offline:', e);
    }
    return null;
  },

  // Focus Sessions
  async saveFocusSession(session: FocusSession, userId: string): Promise<void> {
    const sessionWithUser = { ...session, user_id: userId };
    try {
      await setDoc(doc(db, 'focus_sessions', session.id), sessionWithUser);
    } catch (e) {
      console.warn('Firestore saveFocusSession fallback to offline:', e);
    }
  },

  async getFocusSessions(userId: string): Promise<FocusSession[]> {
    try {
      const q = query(
        collection(db, 'focus_sessions'),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocs(q);
      const list: FocusSession[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as FocusSession);
      });
      // Sort descending by created_at or date
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return list;
    } catch (e) {
      console.warn('Firestore getFocusSessions fallback to offline:', e);
      return [];
    }
  },

  async deleteFocusSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'focus_sessions', sessionId));
    } catch (e) {
      console.warn('Firestore deleteFocusSession fallback:', e);
    }
  },

  // Tasks
  async saveTask(task: Task, userId: string): Promise<void> {
    const taskWithUser = { ...task, user_id: userId };
    try {
      await setDoc(doc(db, 'tasks', task.id), taskWithUser);
    } catch (e) {
      console.warn('Firestore saveTask fallback:', e);
    }
  },

  async getTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocs(q);
      const list: Task[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Task);
      });
      return list;
    } catch (e) {
      console.warn('Firestore getTasks fallback:', e);
      return [];
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      console.warn('Firestore deleteTask fallback:', e);
    }
  },

  // Challenges
  async saveChallenge(challenge: Challenge, userId: string): Promise<void> {
    const chalWithUser = { ...challenge, user_id: userId };
    try {
      await setDoc(doc(db, 'challenges', challenge.id), chalWithUser);
    } catch (e) {
      console.warn('Firestore saveChallenge fallback:', e);
    }
  },

  async getChallenge(userId: string): Promise<Challenge | null> {
    try {
      const q = query(
        collection(db, 'challenges'),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocs(q);
      let found: Challenge | null = null;
      snapshot.forEach((d) => {
        const item = d.data() as Challenge;
        if (item.status === 'active') {
          found = item;
        }
      });
      return found;
    } catch (e) {
      console.warn('Firestore getChallenge fallback:', e);
      return null;
    }
  },

  // Sleep
  async saveSleepRecord(record: SleepRecord, userId: string): Promise<void> {
    try {
      await setDoc(doc(db, 'sleep_records', record.id), { ...record, user_id: userId });
    } catch (e) {
      console.warn('Firestore saveSleepRecord fallback:', e);
    }
  },

  // Expenses
  async saveExpense(expense: Expense, userId: string): Promise<void> {
    try {
      await setDoc(doc(db, 'expenses', expense.id), { ...expense, user_id: userId });
    } catch (e) {
      console.warn('Firestore saveExpense fallback:', e);
    }
  },

  // Mobile Companion Real-time Sync
  async saveMobileSync(payload: MobileSyncPayload): Promise<void> {
    const cleanCode = payload.sync_code.replace(/\s+/g, '').trim();
    if (!cleanCode) return;
    try {
      await setDoc(doc(db, 'mobile_sync', cleanCode), payload);
    } catch (e) {
      console.warn('Firestore saveMobileSync fallback to localStorage:', e);
    }
    try {
      localStorage.setItem(`ironman_sync_${cleanCode}`, JSON.stringify(payload));
    } catch {}
  },

  async getMobileSync(syncCode: string): Promise<MobileSyncPayload | null> {
    const cleanCode = syncCode.replace(/\s+/g, '').trim();
    if (!cleanCode) return null;
    try {
      const snap = await getDoc(doc(db, 'mobile_sync', cleanCode));
      if (snap.exists()) {
        const data = snap.data() as MobileSyncPayload;
        localStorage.setItem(`ironman_sync_${cleanCode}`, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Firestore getMobileSync error, falling back to localStorage:', e);
    }
    const local = localStorage.getItem(`ironman_sync_${cleanCode}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return null;
  },

  subscribeMobileSync(syncCode: string, onUpdate: (data: MobileSyncPayload) => void): Unsubscribe {
    const cleanCode = syncCode.replace(/\s+/g, '').trim();
    const docRef = doc(db, 'mobile_sync', cleanCode);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as MobileSyncPayload;
          localStorage.setItem(`ironman_sync_${cleanCode}`, JSON.stringify(data));
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('Mobile sync snapshot subscription warning:', error);
      }
    );
  },

  async toggleMobileTaskStatus(
    syncCode: string,
    taskId: string,
    currentStatus: TaskStatus
  ): Promise<MobileSyncPayload | null> {
    const cleanCode = syncCode.replace(/\s+/g, '').trim();
    let current = await this.getMobileSync(cleanCode);
    if (!current) return null;

    const newStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const nowIso = new Date().toISOString();

    const updatedTasks = current.today_tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === 'COMPLETED' ? nowIso : undefined,
        };
      }
      return t;
    });

    const updatedRecentTasks = (current.all_recent_tasks || []).map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === 'COMPLETED' ? nowIso : undefined,
        };
      }
      return t;
    });

    const completedCount = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
    const totalCount = updatedTasks.length;
    const newRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const updatedPayload: MobileSyncPayload = {
      ...current,
      today_tasks: updatedTasks,
      all_recent_tasks: updatedRecentTasks,
      analytics: {
        ...current.analytics,
        today_tasks_completed: completedCount,
        today_tasks_total: totalCount,
        completion_rate: newRate,
      },
      updated_at: nowIso,
    };

    await this.saveMobileSync(updatedPayload);
    return updatedPayload;
  },
};
