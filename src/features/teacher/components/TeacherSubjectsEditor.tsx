"use client";

import { useState } from "react";
import { updateTeacherSubjects } from "@/features/teacher/api/teacherActions";
import { buildSubjectTag, SCHOOL_LEVELS, SUBJECTS_BY_LEVEL } from "@/features/teacher/lib/subjects";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/common/Toast";
import Button from "@/components/common/Button";
import type { Teacher } from "@/types/teacher";

type TeacherSubjectsEditorProps = {
  teacher: Teacher;
  onSaved: () => void;
};

function sameSubjects(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const tag of a) {
    if (!b.has(tag)) return false;
  }
  return true;
}

export default function TeacherSubjectsEditor({ teacher, onSaved }: TeacherSubjectsEditorProps) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set(teacher.teachable_subjects));
  const [savedSubjects, setSavedSubjects] = useState<Set<string>>(
    new Set(teacher.teachable_subjects),
  );
  const [saving, setSaving] = useState(false);

  const isDirty = !sameSubjects(selected, savedSubjects);

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateTeacherSubjects(teacher.id, Array.from(selected));
      if (!result.success) {
        showToast(result.message, "error");
        return;
      }
      setSavedSubjects(new Set(selected));
      showToast("担当教科を保存しました。");
      onSaved();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`space-y-4 rounded-3xl border p-6 shadow-xl backdrop-blur-md transition-colors duration-300 ${
        isDirty
          ? "border-amber-300 bg-amber-50/40 shadow-amber-100/50"
          : "border-white/70 bg-white/80 shadow-zinc-200/40"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold tracking-wide text-zinc-800">
            {teacher.full_name?.trim() || "名前未設定"} 先生
          </span>
          {isDirty && (
            <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-700">
              未保存の変更があります
            </span>
          )}
        </div>
        <Button variant="action-blue" onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? "保存中..." : isDirty ? "この講師の担当教科を保存" : "保存済み"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SCHOOL_LEVELS.map((level) => (
          <div key={level} className="space-y-2 rounded-2xl border border-zinc-100/90 bg-zinc-50/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{level}</span>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS_BY_LEVEL[level].map((subject) => {
                const tag = buildSubjectTag(level, subject);
                const checked = selected.has(tag);
                return (
                  <label
                    key={tag}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
                      checked
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(tag)}
                      className="sr-only"
                    />
                    {subject}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
