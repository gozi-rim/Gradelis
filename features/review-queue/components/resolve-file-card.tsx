"use client";

import { useState, useTransition } from "react";
import { rejectUploadFile, resolveUploadFile } from "@/lib/actions/review-queue";
import type { ReviewFile } from "@/lib/queries/review-queue";

export function ResolveFileCard({ file }: { file: ReviewFile }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState(file.raw.courseCode);
  const [note, setNote] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Something went wrong.");
    });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800">
        The course code on this file did not match anything.
      </p>
      <p className="mt-1 text-sm text-amber-700">{file.errorMessage}</p>

      {file.courseCandidates.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-amber-800">Did you mean:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {file.courseCandidates.map((c) => (
              <button
                key={c.item.id}
                type="button"
                onClick={() => setCourseCode(c.item.code)}
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs text-amber-900 hover:bg-amber-100"
              >
                {c.item.code} — {c.item.title}{" "}
                <span className="text-amber-500">{Math.round(c.score * 100)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          placeholder="Course code"
          className="h-9 rounded-lg border border-amber-300 px-3 text-sm"
        />
        <button
          type="button"
          disabled={pending || !courseCode.trim()}
          onClick={() => run(() => resolveUploadFile({ fileId: file.id, courseCode }))}
          className="h-9 rounded-lg bg-[#2e63e5] px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Working..." : "Match and import"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason, if rejecting"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() => run(() => rejectUploadFile({ fileId: file.id, note }))}
          className="h-9 rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          Reject file
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
