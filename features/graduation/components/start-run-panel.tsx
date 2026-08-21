"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startGraduationRun } from "@/lib/actions/graduation";

export function StartRunPanel({ sessions }: { sessions: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entrySession, setEntrySession] = useState(sessions[0] ?? "");

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await startGraduationRun({ entrySession });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/hod/reports/graduation/${result.data.runId}`);
    });
  };

  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-semibold text-slate-700">Run graduation evaluation</h3>
      <p className="mt-1 text-sm text-slate-400">
        Pick the year the cohort entered. Each run is saved on its own and never
        changes afterwards.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {sessions.length > 0 ? (
          <select
            value={entrySession}
            onChange={(e) => setEntrySession(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          >
            {sessions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={entrySession}
            onChange={(e) => setEntrySession(e.target.value)}
            placeholder="2021/2022"
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          />
        )}

        <button
          type="button"
          onClick={run}
          disabled={pending || !entrySession}
          className="h-11 rounded-xl bg-[#2e63e5] px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Evaluating..." : "Run evaluation"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </article>
  );
}
