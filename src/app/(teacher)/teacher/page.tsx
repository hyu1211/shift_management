"use client";

import Link from "next/link";

export default function TeacherHomePage() {
  return (
    <div className="grid gap-4 md:gap-5">
      <Link
        href="/teacher/submit"
        className="group rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="text-lg font-semibold tracking-wide text-zinc-800">📅 シフトを提出する</div>
        <p className="mt-1 text-sm text-zinc-500">希望する年月・半月を選んで提出します</p>
      </Link>

      <Link
        href="/teacher/my-shifts"
        className="group rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="text-lg font-semibold tracking-wide text-zinc-800">🔍 シフトを確認する</div>
        <p className="mt-1 text-sm text-zinc-500">提出済みシフトと確定状況を確認します</p>
      </Link>
    </div>
  );
}
