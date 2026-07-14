"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminDateGroup, AdminShiftDisplay } from "@/types/shift";
import { buildAdminDateGroups } from "@/features/shift/lib/period";
import { buildTermId, type ShiftTerm } from "@/features/shift/lib/term";
import { formatTimeHHmm } from "@/features/shift/lib/time";
import { saveAssignedShift } from "@/features/shift/api/saveShift";
import {
  generateOptimizedShift,
  type OptimizedScheduleItem,
} from "@/features/shift/api/optimizeShift";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/common/Toast";
import { useConfirm } from "@/components/common/ConfirmDialog";
import Button from "@/components/common/Button";
import YearMonthSelect from "@/features/shift/components/YearMonthSelect";
import PeriodToggle from "@/features/shift/components/PeriodToggle";
import UnassignedAlertBanner from "@/features/shift/components/UnassignedAlertBanner";
import {
  SparklesIcon,
  AlertTriangleIcon,
  UserIcon,
  CheckCircleIcon,
  ZapIcon,
} from "@/components/common/icons";

export default function AdminShiftsPage() {
  const today = new Date();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const currentYear = today.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(today.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<ShiftTerm>("first");

  const [displayDates, setDisplayDates] = useState<AdminDateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // 自動割り当て用のState
  const [optimizingDate, setOptimizingDate] = useState<string | null>(null);
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [aiResults, setAiResults] = useState<
    Record<string, OptimizedScheduleItem[]>
  >({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});

  const runAiOptimization = async (dateStr: string) => {
    setOptimizingDate(dateStr);
    setAiErrors((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });

    try {
      const result = await generateOptimizedShift(dateStr);

      if (!result.success) {
        setAiErrors((prev) => ({
          ...prev,
          [dateStr]: result.message,
        }));
        return;
      }

      setAiResults((prev) => ({ ...prev, [dateStr]: result.schedule }));
    } catch (error) {
      console.error(error);
      setAiErrors((prev) => ({
        ...prev,
        [dateStr]: getErrorMessage(error),
      }));
    } finally {
      setOptimizingDate(null);
    }
  };

  const runBulkOptimization = async () => {
    const targetDates = displayDates.filter((d) => d.shifts.length > 0);
    if (targetDates.length === 0) return;

    setBulkOptimizing(true);
    await Promise.all(
      targetDates.map(async (d) => {
        try {
          const result = await generateOptimizedShift(d.date);
          if (!result.success) {
            setAiErrors((prev) => ({ ...prev, [d.date]: result.message }));
            return;
          }
          setAiErrors((prev) => {
            const next = { ...prev };
            delete next[d.date];
            return next;
          });
          setAiResults((prev) => ({ ...prev, [d.date]: result.schedule }));
        } catch (error) {
          console.error(error);
          setAiErrors((prev) => ({ ...prev, [d.date]: getErrorMessage(error) }));
        }
      }),
    );
    setBulkOptimizing(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const isResultAlreadySaved = (dateStr: string) => {
    const items = aiResults[dateStr];
    if (!items || items.length === 0) return false;
    return items.every(
      (item) => item.assignedInstructorId === item.currentAssignedInstructorId,
    );
  };

  const handleSaveShift = async (dateStr: string) => {
    const confirmed = await confirm(
      "この自動割り当て結果をデータベースに保存し、正式なシフトとして確定しますか？",
    );
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const result = await saveAssignedShift(aiResults[dateStr]);
      if (result.success) {
        showToast("シフトを保存しました！");
        // 保存完了後、画面を最新状態にするためにリロード
        setReloadKey((k) => k + 1);
      } else {
        showToast(result.message || "保存に失敗しました。", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("通信エラーが発生しました。", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const termId = buildTermId(targetYear, targetMonth, targetPeriod);
        const datesInRange = buildAdminDateGroups(
          targetYear,
          targetMonth,
          targetPeriod,
        );

        const { data, error } = await supabase
          .from("shifts")
          .select(
            `
            id,
            user_id,
            shift_date,
            start_time,
            end_time,
            is_confirmed
          `,
          )
          .eq("term_id", termId)
          .eq("is_working", true)
          .order("start_time", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error(error);
          return;
        }

        const userIds = Array.from(
          new Set((data ?? []).map((shift) => shift.user_id)),
        );
        const { data: profileRows, error: profileRowsError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profileRowsError) {
          console.error(profileRowsError);
        }
        if (
          !profileRowsError &&
          userIds.length > 0 &&
          (profileRows?.length ?? 0) === 0
        ) {
          console.warn(
            "profilesが0件です。RLSポリシーで他ユーザーのprofiles参照が拒否されている可能性があります。",
            {
              shiftUserCount: userIds.length,
            },
          );
        }

        const profileMap = new Map(
          (profileRows ?? []).map((row) => [row.id, row.full_name]),
        );

        data?.forEach((shift) => {
          const target = datesInRange.find((d) => d.date === shift.shift_date);
          if (target) {
            target.shifts.push({
              ...shift,
              teacherName: profileMap.get(shift.user_id) ?? "名前未設定",
            } as AdminShiftDisplay);
          }
        });

        setDisplayDates(datesInRange);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, targetMonth, targetPeriod, targetYear]);

  const toggleConfirm = async (shiftId: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("shifts")
      .update({ is_confirmed: !currentStatus })
      .eq("id", shiftId);

    if (!error) setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <h2 className="text-2xl font-semibold tracking-wide text-zinc-800">
          シフト管理
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          講師の提出シフトを確認し、確定状態を更新します
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-zinc-200/40 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <YearMonthSelect
            year={targetYear}
            month={targetMonth}
            yearOptions={yearOptions}
            onYearChange={setTargetYear}
            onMonthChange={setTargetMonth}
          />
        </div>

        <PeriodToggle value={targetPeriod} onChange={setTargetPeriod} />

        <Button
          variant="dark-compact"
          onClick={runBulkOptimization}
          disabled={bulkOptimizing || displayDates.every((d) => d.shifts.length === 0)}
          className="ml-auto inline-flex items-center gap-1.5"
        >
          <ZapIcon className="h-4 w-4" />
          {bulkOptimizing ? "一斉振り分け中..." : "一斉振り分け"}
        </Button>
      </div>

      {loading ? (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 py-10 text-center text-sm font-medium text-zinc-400">
          読み込み中...
        </p>
      ) : (
        <div className="grid gap-6">
            {displayDates.map((item) => (
              <section
                key={item.date}
                className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-zinc-200/40 backdrop-blur-md"
              >
                {/* 1. ヘッダーと自動割り当てボタン */}
                <div className="flex items-center justify-between border-b border-zinc-100/90 bg-zinc-50/70 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-base font-semibold tracking-wide text-zinc-700">{item.label}</span>
                    <span className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium tracking-wide text-zinc-500">
                      提出: {item.shifts.length}名
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Button
                      variant="action-blue"
                      onClick={() => runAiOptimization(item.date)}
                      disabled={optimizingDate === item.date || item.shifts.length === 0}
                      className="inline-flex items-center gap-1.5"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {optimizingDate === item.date ? "計算中..." : "自動割り当て"}
                    </Button>
                    {aiErrors[item.date] && (
                      <span className="ml-4 max-w-md text-sm font-medium text-red-600">
                        {aiErrors[item.date]}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. 提出されたシフト一覧（元々の表示） */}
                <div className="space-y-3 p-5 md:p-6">
                  {item.shifts.length > 0 ? (
                    item.shifts.map((shift) => (
                      <div key={shift.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-100/80 bg-white/90 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold tracking-wide text-zinc-800">{shift.teacherName} 先生</span>
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium tracking-wide text-zinc-500">
                            {formatTimeHHmm(shift.start_time)}〜{formatTimeHHmm(shift.end_time)}
                          </span>
                        </div>
                        <Button
                          variant={shift.is_confirmed ? "action-emerald" : "outline-neutral"}
                          onClick={() => toggleConfirm(shift.id, shift.is_confirmed)}
                          className="inline-flex items-center gap-1.5"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          {shift.is_confirmed ? "確定済み" : "確定する"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-6 text-center text-sm font-medium italic text-zinc-400">
                      講師はいません
                    </p>
                  )}
                </div>

                {/* 3. 自動割り当て結果（マトリックス時間割表示） */}
                {aiResults[item.date] && (
                  <div className="border-t border-zinc-200 bg-blue-50/30 p-5 md:p-6">
                    <h3 className="mb-5 text-lg font-bold text-blue-800 flex items-center gap-2">
                      <span className="bg-blue-600 w-1.5 h-6 rounded-full"></span>
                      自動作成時間割（プレビュー）
                    </h3>

                    <div className="mb-5">
                      <UnassignedAlertBanner
                        items={aiResults[item.date]
                          .filter((aiItem) => aiItem.isAlert)
                          .map((aiItem) => ({
                            id: `lesson-${aiItem.lessonId}`,
                            label: `${aiItem.period}限 ${aiItem.subject} - ${aiItem.studentName}`,
                          }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* 1〜8限までをループ */}
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                        // この限数（p）に該当する授業だけを抽出
                        const lessonsInPeriod = aiResults[item.date].filter((aiItem) => aiItem.period === p);

                        // この限数に授業がない場合は枠を表示しない（スッキリさせるため）
                        if (lessonsInPeriod.length === 0) return null;

                        return (
                          <div key={p} className="flex border-l-4 border-blue-400 bg-white shadow-sm rounded-r-xl overflow-hidden">
                            {/* 左側：時限ラベル */}
                            <div className="w-16 bg-blue-50/50 flex flex-col justify-center items-center border-r border-blue-100">
                              <span className="text-xl font-black text-blue-700">{p}</span>
                              <span className="text-[10px] font-bold text-blue-600 uppercase">限</span>
                            </div>

                            {/* 右側：授業カード */}
                            <div className="flex-1 p-3 flex flex-wrap gap-3 items-center min-h-[70px]">
                              {lessonsInPeriod.map((aiItem) => (
                                <div
                                  key={aiItem.lessonId}
                                  id={`lesson-${aiItem.lessonId}`}
                                  className={`min-w-[180px] scroll-mt-6 p-3 rounded-lg border ${
                                    aiItem.isAlert
                                      ? "border-red-200 bg-red-50"
                                      : "border-emerald-200 bg-emerald-50/50"
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-zinc-700">{aiItem.subject}</span>
                                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-500">
                                      {aiItem.studentName}
                                    </span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 text-sm font-black ${aiItem.isAlert ? "text-red-600" : "text-emerald-700"}`}>
                                    {aiItem.isAlert ? (
                                      <>
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        未配置
                                      </>
                                    ) : (
                                      <>
                                        <UserIcon className="h-4 w-4" />
                                        {aiItem.assignedInstructorName}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 保存ボタン */}
                    <div className="mt-6 text-right">
                      <Button
                        variant="action-emerald"
                        onClick={() => handleSaveShift(item.date)}
                        disabled={isSaving || isResultAlreadySaved(item.date)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {isSaving
                          ? "保存中..."
                          : isResultAlreadySaved(item.date)
                            ? "変更なし（保存済み）"
                            : "このシフトを確定して保存"}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
      )}
    </div>
  );
}
