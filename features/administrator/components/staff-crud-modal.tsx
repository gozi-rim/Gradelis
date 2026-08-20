"use client";

import { useState } from "react";
import { StaffItem, createStaffManual, updateStaff, resetStaffPassword } from "@/lib/actions/admin-staff";
import { UserRole } from "@/generated/prisma";
import { generateTemporaryPassword } from "@/lib/excel/staff-excel-template";

type StaffCrudModalProps = {
  initialData?: StaffItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function StaffCrudModal({
  initialData,
  onClose,
  onSuccess,
}: StaffCrudModalProps) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState<UserRole>((initialData?.role as UserRole) || "LECTURER");
  const [isActive, setIsActive] = useState<boolean>(
    initialData ? initialData.isActive : true
  );
  const [customPassword, setCustomPassword] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetPassResult, setResetPassResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please provide both name and email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        const res = await updateStaff({
          id: initialData.id,
          name,
          email,
          role,
          isActive,
        });

        if (res.success) {
          onSuccess(res.message || "Staff member updated successfully.");
          onClose();
        } else {
          setError(res.error || "Failed to update staff member.");
        }
      } else {
        const passToUse = autoGenerate
          ? generateTemporaryPassword()
          : customPassword || generateTemporaryPassword();

        const res = await createStaffManual({
          name,
          email,
          role,
          password: passToUse,
        });

        if (res.success) {
          onSuccess(
            `Staff created successfully. Temporary Password: ${passToUse}`
          );
          onClose();
        } else {
          setError(res.error || "Failed to create staff member.");
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

  const handleResetPassword = async () => {
    if (!initialData) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await resetStaffPassword(initialData.id);
      if (res.success) {
        setResetPassResult(res.temporaryPassword || "NewPassword123");
      }
    } catch {
      setError("Failed to reset password.");
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditing ? "Edit Staff Account" : "Create Staff Account"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEditing
                ? "Update permissions, designation or account status"
                : "Add single faculty member with role credentials"}
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

          {resetPassResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              <p className="font-bold">New Temporary Password Generated:</p>
              <p className="mt-1 font-mono text-base font-bold text-blue-700">
                {resetPassResult}
              </p>
              <p className="mt-1 text-slate-600">
                Please securely share this password with the staff member.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Kelvin Bello"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. kelvin.bello@university.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                System Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              >
                <option value="LECTURER">Lecturer / Adviser</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="SYSTEM_ADMIN">System Administrator</option>
              </select>
            </div>

            {isEditing && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Account Status
                </label>
                <select
                  value={isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
                >
                  <option value="ACTIVE">Active Account</option>
                  <option value="INACTIVE">Disabled Account</option>
                </select>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Password Generation
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="size-4 rounded text-[#2e63e5]"
                  />
                  Auto-generate 8-digit temporary password
                </label>
              </div>

              {!autoGenerate && (
                <input
                  type="text"
                  placeholder="Enter initial password (min 6 chars)"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
                />
              )}
            </div>
          )}

          {isEditing && (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Password Recovery
                </p>
                <p className="text-[11px] text-slate-400">
                  Generate a new temporary login password for this user
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#2e63e5] shadow-xs hover:bg-slate-50"
              >
                Reset Password
              </button>
            </div>
          )}

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
                : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
