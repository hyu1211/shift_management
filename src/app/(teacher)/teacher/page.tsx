"use client";

import Link from "next/link";
import { CalendarIcon, EyeIcon } from "@/components/common/icons";

export default function TeacherHomePage() {
  return (
    <div className="grid gap-4 md:gap-5">
      <Link
        href="/teacher/submit"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <CalendarIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">シフトを提出する</div>
          <p className="mt-1 text-sm text-zinc-500">希望する年月・半月を選んで提出します</p>
        </div>
      </Link>

      <Link
        href="/teacher/my-shifts"
        className="group flex items-center gap-4 rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors duration-500 group-hover:bg-zinc-200">
          <EyeIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-zinc-800">シフトを確認する</div>
          <p className="mt-1 text-sm text-zinc-500">提出済みシフトと確定状況を確認します</p>
        </div>
      </Link>
    </div>
  );
}
