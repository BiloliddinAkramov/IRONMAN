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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { FocusSession, Task, Challenge, SleepRecord, Expense, UserProfile } from '../types';

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
};
