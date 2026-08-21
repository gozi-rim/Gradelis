"use client";

import { useState } from "react";
import { StudentItem, createStudentManual, updateStudent } from "@/lib/actions/admin-students";
import { StudentStatus } from "@/generated/prisma";

type StudentCrudModalProps = {
  initialData?: StudentItem | null;
  defaultSession: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function StudentCrudModal({
  initialData,
  defaultSession,
  onClose,
  onSuccess,
}: StudentCrudModalProps) {
  const isEditing = !!initialData;
  const [matricNumber, setMatricNumber] = useState(initialData?.matricNumber || "");
  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [entrySession, setEntrySession] = useState(
    initialData?.entrySession || defaultSession || "2024/2025"
  );
  const [currentLevel, setCurrentLevel] = useState<number>(
    initialData?.currentLevel || 100
  );
  const [status, setStatus] = useState<StudentStatus>(
    (initialData?.status as StudentStatus) || "ACTIVE"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber.trim() || !fullName.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        const res = await updateStudent({
          id: initialData.id,
          matricNumber,
          fullName,
          entrySession,
          currentLevel,
          status,
        });

        if (res.success) {
          onSuccess(res.message || "Student updated successfully.");
          onClose();
        } else {
          setError(res.error || "Failed to update student.");
        }
      } else {
        const res = await createStudentManual({
          matricNumber,
          fullName,
          entrySession,
          currentLevel,
          status,
        });

        if (res.success) {
          onSuccess(res.message || "Student created successfully.");
          onClose();
        } else {
          setError(res.error || "Failed to create student.");
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditing ? "Edit Student Details" : "Add Single Student Record"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEditing
                ? "Update student matriculation credentials and cohort details"
                : "Manually add a single student to the departmental registry"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Matriculation Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ENG/2024/001"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emmanuel Okonkwo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Entry Session
              </label>
              <select
                value={entrySession}
                onChange={(e) => setEntrySession(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2023/2024">2023/2024</option>
                <option value="2022/2023">2022/2023</option>
                <option value="2021/2022">2021/2022</option>
                <option value="2020/2021">2020/2021</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Current Level
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              >
                <option value={100}>100 Level (Year 1)</option>
                <option value={200}>200 Level (Year 2)</option>
                <option value={300}>300 Level (Year 3)</option>
                <option value={400}>400 Level (Year 4)</option>
                <option value={500}>500 Level (Year 5)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Academic Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StudentStatus)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="GRADUATED">GRADUATED</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#2e63e5] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2456cf] hover:cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
