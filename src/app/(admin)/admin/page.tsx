"use client";

import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="grid gap-4 md:gap-5">
      <Link
        href="/admin/shifts"
        className="group rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
      >
        <div className="text-lg font-semibold tracking-wide text-zinc-800">📋 シフトを管理する</div>
        <p className="mt-1 text-sm text-zinc-500">講師の提出シフトを確認し、確定状態を更新します</p>
      </Link>
    </div>
  );
}
