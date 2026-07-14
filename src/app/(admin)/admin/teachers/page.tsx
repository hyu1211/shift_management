"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import TeacherSubjectsEditor from "@/features/teacher/components/TeacherSubjectsEditor";
import { ALL_SUBJECTS, parseSubjectTag } from "@/features/teacher/lib/subjects";
import { ChevronRightIcon } from "@/components/common/icons";
import type { Teacher } from "@/types/teacher";

const filterInputClassName =
  "rounded-xl border border-zinc-200 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition-all duration-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [reloadKey, setReloadKey] = useState(0);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, teachable_subjects")
      .eq("role", "staff")
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);
      setTeachers([]);
    } else {
      setTeachers((data ?? []) as Teacher[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers, reloadKey]);

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim();
    return teachers.filter((teacher) => {
      if (query && !(teacher.full_name ?? "").includes(query)) return false;
      if (
        subjectFilter !== "all" &&
        !teacher.teachable_subjects.some(
          (tag) => parseSubjectTag(tag).subject === subjectFilter,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [teachers, searchQuery, subjectFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <h2 className="text-2xl font-semibold tracking-wide text-zinc-800">講師情報</h2>
        <p className="mt-1 text-sm text-zinc-500">
          氏名と担当教科（小学・中学・高校）を確認・編集します
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-zinc-200/40 backdrop-blur-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="名前で検索"
          className={`${filterInputClassName} flex-1 min-w-[10rem]`}
        />
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className={filterInputClassName}
        >
          <option value="all">すべての教科</option>
          {ALL_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 py-10 text-center text-sm font-medium text-zinc-400">
          読み込み中...
        </p>
      ) : teachers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-10 text-center text-sm font-medium text-zinc-400">
          講師が登録されていません
        </p>
      ) : filteredTeachers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-10 text-center text-sm font-medium text-zinc-400">
          条件に一致する講師がいません
        </p>
      ) : (
        <div className="space-y-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500">
            {filteredTeachers.length}名 / 全{teachers.length}名
          </span>

          {filteredTeachers.map((teacher) => {
            const isExpanded = expandedIds.has(teacher.id);
            const subjectCount = teacher.teachable_subjects.length;
            return (
              <div key={teacher.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(teacher.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-zinc-100/80 bg-white/75 px-5 py-3 text-left shadow-sm"
                >
                  <ChevronRightIcon
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-sm font-semibold text-zinc-800">
                    {teacher.full_name?.trim() || "名前未設定"}
                  </span>
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-500">
                    {subjectCount > 0 ? `${subjectCount}科目` : "未設定"}
                  </span>
                </button>

                {isExpanded && (
                  <TeacherSubjectsEditor
                    teacher={teacher}
                    onSaved={() => setReloadKey((key) => key + 1)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
