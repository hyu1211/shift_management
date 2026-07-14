"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  UserIcon,
  UsersIcon,
} from "@/components/common/icons";

export default function AdminHomePage() {
  return (
    <div className="grid gap-4 md:gap-5">
      <Link
        href="/admin/lessons"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <BookOpenIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">授業を登録する</div>
          <p className="mt-1 text-sm text-zinc-500">自動割り当てに使う授業予定を登録・管理します</p>
        </div>
      </Link>
      <Link
        href="/admin/shifts"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <ClipboardListIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">シフトを管理する</div>
          <p className="mt-1 text-sm text-zinc-500">講師の提出シフトを確認し、確定状態を更新します</p>
        </div>
      </Link>
      <Link
        href="/admin/confirmed-shifts"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <CheckCircleIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">確定シフトを確認する</div>
          <p className="mt-1 text-sm text-zinc-500">確定済みの授業担当割り当てを月単位で閲覧します</p>
        </div>
      </Link>
      <Link
        href="/admin/students"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">生徒情報を確認する</div>
          <p className="mt-1 text-sm text-zinc-500">氏名・学年・学校・備考を登録・確認します</p>
        </div>
      </Link>
      <Link
        href="/admin/teachers"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <UsersIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">講師情報を確認する</div>
          <p className="mt-1 text-sm text-zinc-500">氏名と担当教科（小学・中学・高校）を確認・編集します</p>
        </div>
      </Link>
    </div>
  );
}
