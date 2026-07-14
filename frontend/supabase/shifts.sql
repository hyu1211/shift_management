-- ============================================================
-- shifts テーブルの RLS 設定
-- Supabase Dashboard > SQL Editor で実行してください
-- 前提: shifts テーブルは既に存在する
-- （id, user_id, shift_date, term_id, day, is_working, start_time, end_time, is_confirmed）
-- ============================================================

-- 1. RLS 有効化
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーがある場合は削除（再実行用）
-- 2026-07-08: 実DBには日本語名(自分のシフトのみ操作可能 等)と英語名の重複ポリシー、
-- さらに"Enable read access for all users"(anon含むpublicへのSELECT全公開)が混在しており、
-- shifts_update_admin は WITH CHECK(true) で無条件許可になっていたため統合・是正した。
DROP POLICY IF EXISTS "自分のシフトのみ操作可能" ON public.shifts;
DROP POLICY IF EXISTS "管理者は全員のシフトを閲覧可能" ON public.shifts;
DROP POLICY IF EXISTS "管理者はシフトを更新可能" ON public.shifts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_admin" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_own" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_own" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_admin" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_own_or_admin" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert_own" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_own_or_admin" ON public.shifts;

-- 2. ポリシー: 自分が提出したシフト、または管理者は全員分閲覧可
-- （teacher/my-shifts は自分の分のみ、admin/shifts は全講師分を参照する）
-- is_admin_user()はSECURITY DEFINERなのでprofilesのRLSを経由せず判定できる
CREATE POLICY "shifts_select_own_or_admin"
  ON public.shifts
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_admin_user()
  );

-- 3. ポリシー: 自分の行のみ提出可（ShiftForm の upsert で使用）
CREATE POLICY "shifts_insert_own"
  ON public.shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- 4. ポリシー: 本人は自分のシフトを編集可、管理者は確定状態(is_confirmed)等を更新可
-- （admin/shifts の toggleConfirm はサーバーアクションを介さずクライアントから
--   直接updateしているため、このRLSが唯一の防御線になっている点に注意）
CREATE POLICY "shifts_update_own_or_admin"
  ON public.shifts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_admin_user()
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR public.is_admin_user()
  );
