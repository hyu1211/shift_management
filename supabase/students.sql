-- ============================================================
-- 生徒テーブル (students) の作成と RLS 設定
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text NOT NULL CHECK (grade IN (
    '小1','小2','小3','小4','小5','小6',
    '中1','中2','中3',
    '高1','高2','高3'
  )),
  school text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS 有効化
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーがある場合は削除（再実行用）
DROP POLICY IF EXISTS "students_select_authenticated" ON public.students;
DROP POLICY IF EXISTS "students_insert_admin" ON public.students;
DROP POLICY IF EXISTS "students_update_admin" ON public.students;
DROP POLICY IF EXISTS "students_delete_admin" ON public.students;

-- 3. ポリシー: ログインユーザーは閲覧可
CREATE POLICY "students_select_authenticated"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. ポリシー: 管理者のみ登録・更新・削除可
CREATE POLICY "students_insert_admin"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "students_update_admin"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "students_delete_admin"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user());
