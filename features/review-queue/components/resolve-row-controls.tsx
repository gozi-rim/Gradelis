"use client";

import { useState, useTransition } from "react";
import { rejectUploadRow, resolveUploadRow } from "@/lib/actions/review-queue";
import type { ReviewRow } from "@/lib/queries/review-queue";

export function ResolveRowControls({
  row,
  courseKnown,
}: {
  row: ReviewRow;
  courseKnown: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState(row.matchedStudentId ?? "");
  const [score, setScore] = useState(row.score === null ? "" : String(row.score));
  const [note, setNote] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Something went wrong.");
    });
  };

  const approve = () =>
    run(() =>
      resolveUploadRow({
        rowId: row.id,
        studentId: studentId || undefined,
        score: score.trim() === "" ? undefined : Number(score),
      }),
    );

  return (
    <div className="space-y-2">
      {row.studentCandidates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {row.studentCandidates.map((c) => (
            <button
              key={c.item.id}
              type="button"
              onClick={() => setStudentId(c.item.id)}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                studentId === c.item.id
                  ? "border-[#2e63e5] bg-[#eaf2ff] text-[#2e63e5]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.item.matricNumber} — {c.item.fullName}{" "}
              <span className="text-slate-400">{Math.round(c.score * 100)}%</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Score"
          inputMode="decimal"
          className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-sm"
        />
        <button
          type="button"
          disabled={pending || !courseKnown}
          onClick={approve}
          title={courseKnown ? undefined : "Fix the file's course code first"}
          className="h-8 rounded-lg bg-[#18a558] px-3 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "..." : "Approve"}
        </button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason, if rejecting"
          className="h-8 flex-1 rounded-lg border border-slate-200 px-2 text-sm"
        />
        <button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() => run(() => rejectUploadRow({ rowId: row.id, note }))}
          className="h-8 rounded-lg border border-red-300 px-3 text-xs font-medium text-red-600 disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
