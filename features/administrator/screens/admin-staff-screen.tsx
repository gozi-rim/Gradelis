"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StaffItem,
  getStaff,
  deleteStaff,
  resetStaffPassword,
} from "@/lib/actions/admin-staff";
import { StaffImportModal } from "../components/staff-import-modal";
import { StaffCrudModal } from "../components/staff-crud-modal";
import { StaffCredentialsModal } from "../components/staff-credentials-modal";
import { StaffCredentialItem } from "@/lib/excel/staff-excel-template";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

export function AdminStaffScreen() {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [recentCredentials, setRecentCredentials] = useState<StaffCredentialItem[]>([]);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffItem | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await getStaff({
        role: roleFilter,
        status: statusFilter,
        search: searchTerm,
      });
      if (res.success) {
        setStaffList(res.staff);
        setTotalCount(res.total);
      }
    } catch {
      // handled gracefully
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    getStaff({
      role: roleFilter,
      status: statusFilter,
      search: searchTerm,
    }).then((res) => {
      if (isMounted && res.success) {
        setStaffList(res.staff);
        setTotalCount(res.total);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [roleFilter, statusFilter, searchTerm]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    try {
      const res = await deleteStaff(deletingStaff.id);
      if (res.success) {
        showToast(res.message);
        setDeletingStaff(null);
        fetchStaff();
      }
    } catch {
      showToast("Failed to remove staff member.");
    }
  };

  const handleInlineResetPassword = async (staff: StaffItem) => {
    try {
      const res = await resetStaffPassword(staff.id);
      if (res.success) {
        setRecentCredentials([
          {
            name: staff.name,
            email: staff.email,
            role: staff.role,
            temporaryPassword: res.temporaryPassword || "",
            status: "Password Reset Successfully",
          },
        ]);
        setShowCredentialsModal(true);
      }
    } catch {
      showToast("Failed to reset password.");
    }
  };

  // Metrics
  const hodCount = staffList.filter((s) => s.role === "HOD").length;
  const lecturerCount = staffList.filter((s) => s.role === "LECTURER").length;
  const adminCount = staffList.filter((s) => s.role === "SYSTEM_ADMIN").length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SYSTEM_ADMIN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "HOD":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "LECTURER":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Staff &amp; Faculty Accounts
          </h2>
          <p className="text-sm text-slate-500">
            Batch Excel seeding with temporary password creation and access governance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingStaff(null);
              setShowCrudModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            + Create Staff
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e63e5] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf] hover:cursor-pointer"
          >
            <ExcelFileIcon className="size-4" />
            Import &amp; Generate Passwords
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Staff Accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalCount}</p>
          <p className="mt-1 text-xs text-slate-400">Department faculty &amp; admins</p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Head of Department
          </p>
          <p className="mt-2 text-3xl font-bold text-purple-600">{hodCount}</p>
          <p className="mt-1 text-xs text-slate-400">Curriculum &amp; review authority</p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Course Lecturers
          </p>
          <p className="mt-2 text-3xl font-bold text-cyan-600">{lecturerCount}</p>
          <p className="mt-1 text-xs text-slate-400">Course advisers &amp; instructors</p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            System Administrators
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2e63e5]">{adminCount}</p>
          <p className="mt-1 text-xs text-slate-400">Platform access controllers</p>
        </article>
      </section>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs sm:p-6">
        {/* Filters Toolbar */}
        <div className="mb-6 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by staff name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:bg-white focus:ring-1 focus:ring-[#2e63e5]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            >
              <option value="ALL">All Roles</option>
              <option value="LECTURER">Course Lecturers / Advisers</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="SYSTEM_ADMIN">System Administrators</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts Only</option>
              <option value="INACTIVE">Disabled Accounts Only</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            Loading staff accounts...
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-700">
              No staff accounts found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search or use &quot;Import &amp; Generate Passwords&quot; to seed
              faculty members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">Staff Member</th>
                  <th className="px-4 py-3.5">Email Address</th>
                  <th className="px-4 py-3.5">Designation / Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-[#172a49] text-xs font-bold text-white">
                          {staff.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{staff.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">
                      {staff.email}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadge(
                          staff.role
                        )}`}
                      >
                        {staff.role === "SYSTEM_ADMIN"
                          ? "Administrator"
                          : staff.role === "HOD"
                          ? "Head of Dept (HOD)"
                          : "Lecturer"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {staff.isActive ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {new Date(staff.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInlineResetPassword(staff)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
                          title="Generate temporary password"
                        >
                          Reset Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaff(staff);
                            setShowCrudModal(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStaff(staff)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 shadow-2xs hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <StaffImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(msg, creds) => {
            showToast(msg);
            fetchStaff();
            if (creds && creds.length > 0) {
              setRecentCredentials(creds);
              setShowCredentialsModal(true);
            }
          }}
        />
      )}

      {/* Credentials Export Modal */}
      {showCredentialsModal && (
        <StaffCredentialsModal
          credentials={recentCredentials}
          onClose={() => setShowCredentialsModal(false)}
        />
      )}

      {/* Manual Add/Edit Modal */}
      {showCrudModal && (
        <StaffCrudModal
          initialData={editingStaff}
          onClose={() => {
            setShowCrudModal(false);
            setEditingStaff(null);
          }}
          onSuccess={(msg) => {
            showToast(msg);
            fetchStaff();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingStaff(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
              !
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-slate-800">
              Delete Staff Account?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500">
              Are you sure you want to remove{" "}
              <strong className="text-slate-700">
                {deletingStaff.name} ({deletingStaff.email})
              </strong>
              ? Their audit trail records will be preserved in the system logs.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
