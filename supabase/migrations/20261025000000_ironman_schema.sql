-- ============================================================================
-- IRONMAN: Complete Supabase PostgreSQL Schema with RLS and Business Logic
-- Timezone: Asia/Tashkent
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Tashkent',
  preferred_currency TEXT NOT NULL DEFAULT 'UZS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CHALLENGES TABLE (3-month commitment)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_user_status ON public.challenges(user_id, status);

-- 3. TASKS TABLE (with deadlines, carry-forward, locking)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('SAT', 'English', 'Fitness', 'General')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  deadline_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED', 'LOCKED', 'ARCHIVED')),
  completed_at TIMESTAMPTZ,
  estimated_minutes INTEGER DEFAULT 30,
  notes TEXT,
  carry_forward BOOLEAN NOT NULL DEFAULT TRUE,
  carried_from_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(user_id, category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(user_id, status);

-- 4. WEEKLY FITNESS TEMPLATES (recurring schedule templates)
CREATE TABLE IF NOT EXISTS public.fitness_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday ... 6=Saturday
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_templates_user_day ON public.fitness_templates(user_id, day_of_week);

-- 5. MOCK TESTS (10-mock challenge tracker)
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  mock_number INTEGER NOT NULL CHECK (mock_number BETWEEN 1 AND 10),
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  planned_date DATE,
  completed_at TIMESTAMPTZ,
  total_score INTEGER CHECK (total_score IS NULL OR (total_score BETWEEN 400 AND 1600)),
  reading_writing_score INTEGER CHECK (reading_writing_score IS NULL OR (reading_writing_score BETWEEN 200 AND 800)),
  math_score INTEGER CHECK (math_score IS NULL OR (math_score BETWEEN 200 AND 800)),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_challenge_mock UNIQUE (user_id, challenge_id, mock_number)
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_user ON public.mock_tests(user_id);

-- 6. SLEEP RECORDS
CREATE TABLE IF NOT EXISTS public.sleep_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL,
  bedtime TIME NOT NULL,
  wake_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_sleep_date UNIQUE (user_id, sleep_date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_user_date ON public.sleep_records(user_id, sleep_date);

-- 7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'UZS',
  category TEXT NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(user_id, category);

-- 8. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_expense_category UNIQUE (user_id, name)
);

-- 9. PLAYLISTS (Fitness & Study)
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fitness', 'study')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_playlist_type UNIQUE (user_id, type)
);

-- 10. PLAYLIST TRACKS (Metadata for local device audio)
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  file_name TEXT NOT NULL,
  local_uri TEXT,
  duration_seconds INTEGER DEFAULT 0,
  track_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_order ON public.playlist_tracks(playlist_id, track_order);

-- 11. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_planning_time TIME NOT NULL DEFAULT '08:00:00',
  notify_task_deadline BOOLEAN NOT NULL DEFAULT TRUE,
  notify_missing_sat BOOLEAN NOT NULL DEFAULT TRUE,
  notify_missing_fitness BOOLEAN NOT NULL DEFAULT TRUE,
  notify_sleep BOOLEAN NOT NULL DEFAULT TRUE,
  sleep_target_hours NUMERIC(3, 1) NOT NULL DEFAULT 8.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: user can only see/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Challenges
CREATE POLICY "Users can manage own challenges" ON public.challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fitness Templates
CREATE POLICY "Users can manage own fitness templates" ON public.fitness_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mock Tests
CREATE POLICY "Users can manage own mock tests" ON public.mock_tests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sleep Records
CREATE POLICY "Users can manage own sleep records" ON public.sleep_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Expense Categories
CREATE POLICY "Users can manage own expense categories" ON public.expense_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Playlists
CREATE POLICY "Users can manage own playlists" ON public.playlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Playlist Tracks (via playlist ownership)
CREATE POLICY "Users can manage tracks in own playlists" ON public.playlist_tracks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid())
  );

-- Notification Preferences
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RPC: Secure Task Completion with Tashkent Deadline Check
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_task(p_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task RECORD;
  v_today DATE;
  v_now TIMESTAMPTZ;
BEGIN
  -- Get current Tashkent date and time
  v_now := NOW() AT TIME ZONE 'Asia/Tashkent';
  v_today := (v_now)::DATE;

  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vazifa topilmadi');
  END IF;

  IF v_task.status = 'COMPLETED' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Vazifa allaqachon bajarilgan');
  END IF;

  -- Deadline check: Can only be completed on the scheduled date
  IF v_task.scheduled_date < v_today THEN
    -- Lock task as missed
    UPDATE public.tasks
    SET status = 'LOCKED', updated_at = NOW()
    WHERE id = p_task_id;
    RETURN jsonb_build_object('success', false, 'error', 'Muddat o‘tgan. Vazifa qulflangan.');
  END IF;

  -- Update task to completed
  UPDATE public.tasks
  SET status = 'COMPLETED',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_task_id;

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id);
END;
$$;

-- ============================================================================
-- RPC: Carry Forward Incomplete Tasks
-- ============================================================================
CREATE OR REPLACE FUNCTION public.carry_forward_incomplete_tasks(p_target_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task RECORD;
  v_count INTEGER := 0;
  v_yesterday DATE := p_target_date - 1;
BEGIN
  -- Iterate through incomplete tasks from yesterday that have carry_forward = true
  FOR v_task IN
    SELECT * FROM public.tasks
    WHERE user_id = v_user_id
      AND scheduled_date = v_yesterday
      AND status = 'PENDING'
      AND carry_forward = TRUE
  LOOP
    -- Mark original as MISSED & LOCKED
    UPDATE public.tasks
    SET status = 'LOCKED', updated_at = NOW()
    WHERE id = v_task.id;

    -- Check if carry instance already exists to avoid duplicates
    IF NOT EXISTS (
      SELECT 1 FROM public.tasks
      WHERE user_id = v_user_id
        AND carried_from_task_id = v_task.id
        AND scheduled_date = p_target_date
    ) THEN
      INSERT INTO public.tasks (
        user_id,
        challenge_id,
        title,
        category,
        scheduled_date,
        scheduled_time,
        status,
        estimated_minutes,
        notes,
        carry_forward,
        carried_from_task_id
      ) VALUES (
        v_user_id,
        v_task.challenge_id,
        v_task.title,
        v_task.category,
        p_target_date,
        v_task.scheduled_time,
        'PENDING',
        v_task.estimated_minutes,
        v_task.notes,
        v_task.carry_forward,
        v_task.id
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
