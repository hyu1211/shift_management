-- ============================================================
-- 授業テーブル (lessons) の作成と RLS 設定
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- 1. テーブル作成
-- 注: 実DBは id/lesson_date/start_time/subject/student_name/period のみで作成されており、
-- created_at/updated_at列は存在しない（このCREATE TABLEは新規環境向けの参考定義）。
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_date date NOT NULL,
  start_time time NOT NULL,
  subject text,
  student_name text,
  period integer CHECK (period >= 1 AND period <= 8)
);

-- 2026-07-08: assigned_user_id列が実DBに存在せず、シフト最適化結果の保存(saveAssignedShift)が
-- 常にRLS/カラムエラーで失敗していたため追加。
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

-- 2. インデックス
CREATE INDEX IF NOT EXISTS lessons_lesson_date_idx
  ON public.lessons (lesson_date);

CREATE INDEX IF NOT EXISTS lessons_assigned_user_id_idx
  ON public.lessons (assigned_user_id);

-- 4. RLS 有効化
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーがある場合は削除（再実行用）
-- 2026-07-08: 実DBには "Enable read access for all users"(publicロール=anon含む)しか
-- 存在せず、INSERT/UPDATE/DELETEを許可するポリシーが一つも無かったため
-- createLesson/deleteLesson/saveAssignedShiftが常にRLS拒否されていた。
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lessons;
DROP POLICY IF EXISTS "lessons_select_authenticated" ON public.lessons;
DROP POLICY IF EXISTS "lessons_insert_admin" ON public.lessons;
DROP POLICY IF EXISTS "lessons_update_admin" ON public.lessons;
DROP POLICY IF EXISTS "lessons_delete_admin" ON public.lessons;

-- 5. ポリシー: ログインユーザーは閲覧可（anonへの公開はしない）
CREATE POLICY "lessons_select_authenticated"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (true);

-- 6. ポリシー: 管理者のみ登録・更新・削除可
-- is_admin_user() は SECURITY DEFINER なので profiles の RLS を経由せず判定できる
CREATE POLICY "lessons_insert_admin"
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "lessons_update_admin"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "lessons_delete_admin"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- ============================================================
-- 動作確認用サンプルデータ（任意）
-- ============================================================
-- INSERT INTO public.lessons (lesson_date, period, subject, student_name, start_time)
-- VALUES
--   ('2026-06-01', 1, '数学', 'A君', '09:00'),
--   ('2026-06-01', 2, '英語', 'Bさん', '10:00'),
--   ('2026-06-01', 3, '国語', 'Cくん', '11:00');
