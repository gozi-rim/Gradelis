"use client";

import { useState } from "react";
import {
  CourseItem,
  createCourseManual,
  updateCourse,
} from "@/lib/actions/admin-courses";

type CourseCrudModalProps = {
  course?: CourseItem | null;
  defaultLevel?: number;
  defaultSemester?: "FIRST" | "SECOND";
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function CourseCrudModal({
  course,
  defaultLevel = 100,
  defaultSemester = "FIRST",
  onClose,
  onSuccess,
}: CourseCrudModalProps) {
  const isEditing = !!course;

  const [code, setCode] = useState(course?.code || "");
  const [title, setTitle] = useState(course?.title || "");
  const [creditUnits, setCreditUnits] = useState(course?.creditUnits || 3);
  const [level, setLevel] = useState<number>(course?.level || defaultLevel);
  const [semester, setSemester] = useState<"FIRST" | "SECOND">(
    course?.semester || defaultSemester
  );
  const [courseType, setCourseType] = useState<"COMPULSORY" | "ELECTIVE">(
    course?.courseType || "COMPULSORY"
  );
  const [isActive, setIsActive] = useState(course ? course.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setErrorMessage("Please fill in course code and title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditing && course) {
        const res = await updateCourse({
          id: course.id,
          code: code.trim(),
          title: title.trim(),
          creditUnits: Number(creditUnits),
          level: Number(level),
          semester,
          courseType,
          isActive,
        });
        if (res.success) {
          onSuccess(res.message || "Course updated successfully.");
          onClose();
        } else {
          setErrorMessage(res.error || "Failed to update course.");
        }
      } else {
        const res = await createCourseManual({
          code: code.trim(),
          title: title.trim(),
          creditUnits: Number(creditUnits),
          level: Number(level),
          semester,
          courseType,
        });
        if (res.success) {
          onSuccess(res.message || "Course created successfully.");
          onClose();
        } else {
          setErrorMessage(res.error || "Failed to create course.");
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
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
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditing ? "Edit Course Details" : "Create New Course"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEditing
                ? "Update curriculum attributes, credit weight, or status"
                : "Register a single course in the departmental catalog"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CPE 401"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Credit Units <span className="text-red-500">*</span>
              </label>
              <select
                value={creditUnits}
                onChange={(e) => setCreditUnits(Number(e.target.value))}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                <option value={1}>1 Credit Unit</option>
                <option value={2}>2 Credit Units</option>
                <option value={3}>3 Credit Units</option>
                <option value={4}>4 Credit Units</option>
                <option value={5}>5 Credit Units</option>
                <option value={6}>6 Credit Units</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Embedded Systems Design & Application"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                <option value={100}>100 Level (Year 1)</option>
                <option value={200}>200 Level (Year 2)</option>
                <option value={300}>300 Level (Year 3)</option>
                <option value={400}>400 Level (Year 4)</option>
                <option value={500}>500 Level (Year 5)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) =>
                  setSemester(e.target.value as "FIRST" | "SECOND")
                }
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                <option value="FIRST">First Semester</option>
                <option value="SECOND">Second Semester</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Course Classification
              </label>
              <select
                value={courseType}
                onChange={(e) =>
                  setCourseType(e.target.value as "COMPULSORY" | "ELECTIVE")
                }
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                <option value="COMPULSORY">COMPULSORY</option>
                <option value="ELECTIVE">ELECTIVE</option>
              </select>
            </div>

            {isEditing && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Offering Status
                </label>
                <select
                  value={isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
                >
                  <option value="ACTIVE">Active (Offered)</option>
                  <option value="INACTIVE">Inactive (Archived)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#2e63e5] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf] disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Course"
                : "Register Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
