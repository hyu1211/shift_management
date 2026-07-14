"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deleteStudent } from "@/features/student/api/studentActions";
import StudentForm from "@/features/student/components/StudentForm";
import { useToast } from "@/components/common/Toast";
import { useConfirm } from "@/components/common/ConfirmDialog";
import Button from "@/components/common/Button";
import { ChevronRightIcon, TrashIcon } from "@/components/common/icons";
import { GRADE_OPTIONS, type Student } from "@/types/student";

const filterInputClassName =
  "rounded-xl border border-zinc-200 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition-all duration-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200";

export default function AdminStudentsPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const fetchStudents = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("grade", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setStudents([]);
    } else {
      setStudents((data ?? []) as Student[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, reloadKey]);

  const gradeOrder = new Map(GRADE_OPTIONS.map((g, i) => [g, i]));
  const sortedStudents = [...students].sort(
    (a, b) => (gradeOrder.get(a.grade) ?? 0) - (gradeOrder.get(b.grade) ?? 0),
  );

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim();
    return sortedStudents.filter((student) => {
      if (gradeFilter !== "all" && student.grade !== gradeFilter) return false;
      if (query && !student.name.includes(query)) return false;
      return true;
    });
  }, [sortedStudents, searchQuery, gradeFilter]);

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

  const handleDelete = async (studentId: string) => {
    const confirmed = await confirm("この生徒情報を削除しますか？");
    if (!confirmed) return;

    setDeletingId(studentId);
    const result = await deleteStudent(studentId);
    setDeletingId(null);

    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <h2 className="text-2xl font-semibold tracking-wide text-zinc-800">生徒情報</h2>
        <p className="mt-1 text-sm text-zinc-500">氏名・学年・学校・備考を登録・確認します</p>
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
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className={filterInputClassName}
        >
          <option value="all">すべての学年</option>
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <Button
          variant="action-blue"
          onClick={() => setShowCreateForm((v) => !v)}
          className="ml-auto"
        >
          {showCreateForm ? "閉じる" : "＋ 生徒を追加"}
        </Button>
      </div>

      {showCreateForm && (
        <StudentForm
          editingStudent={null}
          onSaved={() => {
            setReloadKey((key) => key + 1);
            setShowCreateForm(false);
          }}
          onCancelEdit={() => setShowCreateForm(false)}
        />
      )}

      {loading ? (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 py-10 text-center text-sm font-medium text-zinc-400">
          読み込み中...
        </p>
      ) : sortedStudents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-10 text-center text-sm font-medium text-zinc-400">
          まだ生徒が登録されていません
        </p>
      ) : filteredStudents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-10 text-center text-sm font-medium text-zinc-400">
          条件に一致する生徒がいません
        </p>
      ) : (
        <div className="space-y-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500">
            {filteredStudents.length}名 / 全{sortedStudents.length}名
          </span>

          {filteredStudents.map((student) => {
            const isExpanded = expandedIds.has(student.id);
            return (
              <div key={student.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100/80 bg-white/75 px-5 py-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleExpand(student.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <ChevronRightIcon
                      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {student.grade}
                    </span>
                    <span className="text-sm font-semibold text-zinc-800">{student.name}</span>
                  </button>
                  <Button
                    variant="outline-danger"
                    onClick={() => handleDelete(student.id)}
                    disabled={deletingId === student.id}
                    className="inline-flex shrink-0 items-center gap-1.5"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deletingId === student.id ? "削除中..." : "削除"}
                  </Button>
                </div>

                {isExpanded && (
                  <StudentForm
                    editingStudent={student}
                    onSaved={() => setReloadKey((key) => key + 1)}
                    onCancelEdit={() => toggleExpand(student.id)}
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
