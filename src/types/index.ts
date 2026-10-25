export type TaskCategory = 'SAT' | 'English' | 'Fitness' | 'General';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'LOCKED' | 'ARCHIVED';

export interface UserProfile {
  id: string;
  display_name: string;
  timezone: string;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (3 calendar months later)
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  challenge_id?: string;
  title: string;
  category: TaskCategory;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:mm
  deadline_at?: string;   // ISO string or Tashkent 23:59:59
  status: TaskStatus;
  completed_at?: string;
  estimated_minutes: number;
  notes?: string;
  carry_forward: boolean;
  carried_from_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MockTest {
  id: string;
  user_id: string;
  challenge_id?: string;
  mock_number: number; // 1 to 10
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  planned_date?: string; // YYYY-MM-DD
  completed_at?: string;
  total_score?: number; // 400 - 1600
  reading_writing_score?: number; // 200 - 800
  math_score?: number; // 200 - 800
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FitnessTemplate {
  id: string;
  user_id: string;
  day_of_week: number; // 0=Yakshanba, 1=Dushanba, ... 6=Shanba
  exercise_name: string;
  sets?: number;
  reps?: number;
  duration_minutes?: number;
  rest_seconds?: number;
  notes?: string;
  created_at: string;
}

export interface SleepRecord {
  id: string;
  user_id: string;
  challenge_id?: string;
  sleep_date: string; // YYYY-MM-DD
  bedtime: string;    // HH:mm (e.g. 23:00)
  wake_time: string;  // HH:mm (e.g. 07:00)
  duration_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  challenge_id?: string;
  amount: number;
  currency: string; // default UZS
  category: string;
  expense_date: string; // YYYY-MM-DD
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  title: string;
  artist?: string;
  file_name: string;
  local_uri?: string;
  duration_seconds: number;
  track_order: number;
  created_at: string;
  file_blob?: Blob;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  type: 'fitness' | 'study';
  created_at: string;
  updated_at: string;
  tracks?: PlaylistTrack[];
}

export interface NotificationPreferences {
  user_id: string;
  daily_planning_time: string; // HH:mm:ss, e.g. 08:00:00
  notify_task_deadline: boolean;
  notify_missing_sat: boolean;
  notify_missing_fitness: boolean;
  notify_sleep: boolean;
  sleep_target_hours: number;
  updated_at: string;
}

export interface ChallengeDayInfo {
  dayNumber: number;
  totalDays: number;
  daysCompleted: number;
  daysRemaining: number;
  progressPercent: number;
  isCompleted: boolean;
  isUpcoming: boolean;
}

export type FocusCategory =
  | 'SAT Math'
  | 'SAT Reading & Writing'
  | 'English'
  | 'Grammar'
  | 'Vocabulary'
  | 'Practice Test'
  | 'Umumiy';

export interface FocusSession {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm or ISO
  end_time: string; // HH:mm or ISO
  duration_seconds: number;
  task_name: string;
  category: FocusCategory;
  tasks_completed: number;
  notes?: string;
  created_at: string;
}

export interface DailyFocusSummary {
  date: string; // YYYY-MM-DD
  day_number?: number;
  total_duration_seconds: number;
  total_tasks_completed: number;
  session_count: number;
  sessions: FocusSession[];
}

