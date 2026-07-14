-- ============================================================
-- profiles テーブルの RLS 設定
-- Supabase Dashboard > SQL Editor で実行してください
-- 前提: profiles テーブルは既に存在し、role列は 'teacher' 等の
-- デフォルト値を持つ運用（クライアントからroleを直接指定することはない）
-- ============================================================

-- 0. 担当教科カラム（2026-07-08追加）
-- 既存のsubject（最適化API連携で使う単一教科）とは別に、講師情報確認ページ用の
-- 複数選択教科を保持する。値は "学校段階:教科" 形式（例: 小学:国語, 高校:数1）。
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teachable_subjects text[] NOT NULL DEFAULT '{}';

-- 1. RLS 有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーがある場合は削除（再実行用）
-- 2026-07-08: 実DBには "Enable read access for all users"(anon含むpublicへのSELECT全公開)や
-- profiles_select_admin/profiles_select_own等の重複ポリシーが混在していたため統合した。
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;

-- 2. ポリシー: 自分の行、または管理者は全員分閲覧可
-- （admin/shifts画面や最適化APIが他講師のprofilesを参照するために必要）
-- is_admin_user()はSECURITY DEFINERなので自己参照によるRLS再帰を避けられる
CREATE POLICY "profiles_select_self_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR public.is_admin_user()
  );

-- 3. ポリシー: setup-profile画面から自分の行のみ作成可
-- role はクライアントから指定させない（未指定=NULL、またはデフォルト値'staff'のみ許可）
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (select auth.uid())
    AND (role IS NULL OR role = 'staff')
  );

-- 4. ポリシー: 自分の行、または管理者は全員分を更新可（full_name/teachable_subjects等）
-- 2026-07-08: 講師情報確認ページで管理者が他講師のteachable_subjectsを編集できるよう、
-- 自分の行限定だったポリシーを管理者にも拡張。role列自体の変更防止は下記トリガーで別途保証する
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()) OR public.is_admin_user())
  WITH CHECK (id = (select auth.uid()) OR public.is_admin_user());

-- 5. role列の自己昇格を防止するトリガー
-- RLSのWITH CHECKだけでは「行は自分のものだが特定の列だけは変更禁止」という
-- 列単位の制御ができないため、トリガーで NEW.role <> OLD.role を検出して拒否する。
-- 2026-07-08: このトリガーは以前このファイルに定義されていたが実DBには未適用で、
-- profiles_update_own の WITH CHECK が id 一致しか見ていなかったため、
-- 任意の認証ユーザーが自分のroleを'admin'に書き換えて権限昇格できる状態だった。
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin_user() THEN
      RAISE EXCEPTION 'roleの変更は管理者のみ可能です';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- トリガー関数はトリガー経由でのみ呼び出す想定のため、RPC経由の直接実行を禁止する
REVOKE EXECUTE ON FUNCTION public.prevent_self_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_prevent_self_role_change ON public.profiles;

CREATE TRIGGER profiles_prevent_self_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();
