"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StudentItem,
  getStudents,
  deleteStudent,
  SessionCohortSummary,
  getSessionsOverview,
} from "@/lib/actions/admin-students";
import { StudentImportModal } from "../components/student-import-modal";
import { StudentCrudModal } from "../components/student-crud-modal";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

const ACADEMIC_LEVELS = [
  { label: "All Levels", value: "ALL" },
  { label: "100 Level (Year 1)", value: "100" },
  { label: "200 Level (Year 2)", value: "200" },
  { label: "300 Level (Year 3)", value: "300" },
  { label: "400 Level (Year 4)", value: "400" },
  { label: "500 Level (Year 5)", value: "500" },
];

export function AdminStudentsScreen() {
  // Navigation & view state: null = Sessions Overview Table, string = Session Detail View
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Sessions Table state
  const [sessions, setSessions] = useState<SessionCohortSummary[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sessionSearch, setSessionSearch] = useState("");

  // Students Table state (inside an active session)
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // Filters within a session
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch Sessions Overview
  const fetchSessions = useCallback(async () => {
    try {
      const res = await getSessionsOverview();
      if (res.success) {
        setSessions(res.sessions);
      }
    } catch {
      // silently handle
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  // Fetch Students for selected session
  const fetchStudents = useCallback(async () => {
    if (!activeSession) return;
    try {
      const res = await getStudents({
        session: activeSession,
        level: levelFilter,
        status: statusFilter,
        search: searchTerm,
      });
      if (res.success) {
        setStudents(res.students);
        setTotalStudentsCount(res.total);
      }
    } catch {
      // silently handle
    } finally {
      setIsStudentsLoading(false);
    }
  }, [activeSession, levelFilter, statusFilter, searchTerm]);

  // Load sessions on mount
  useEffect(() => {
    let isMounted = true;
    getSessionsOverview().then((res) => {
      if (isMounted && res.success) {
        setSessions(res.sessions);
        setIsSessionsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load students whenever activeSession or filters change
  useEffect(() => {
    if (!activeSession) return;
    let isMounted = true;

    getStudents({
      session: activeSession,
      level: levelFilter,
      status: statusFilter,
      search: searchTerm,
    }).then((res) => {
      if (isMounted && res.success) {
        setStudents(res.students);
        setTotalStudentsCount(res.total);
        setIsStudentsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeSession, levelFilter, statusFilter, searchTerm]);

  const handleDelete = async () => {
    if (!deletingStudent) return;
    try {
      const res = await deleteStudent(deletingStudent.id);
      if (res.success) {
        showToast(res.message);
        setDeletingStudent(null);
        fetchStudents();
        fetchSessions();
      }
    } catch {
      showToast("Failed to delete student record.");
    }
  };

  // Metrics for Top Bar
  const totalDepartmentStudents = sessions.reduce((acc, s) => acc + s.totalStudents, 0);
  const totalActiveStudents = sessions.reduce((acc, s) => acc + s.activeStudents, 0);
  const totalGraduatedStudents = sessions.reduce((acc, s) => acc + s.graduatedStudents, 0);
  const totalCohorts = sessions.length;

  const currentSessionSummary = sessions.find((s) => s.session === activeSession);

  // Filtered sessions for table
  const filteredSessions = sessions.filter(
    (s) =>
      s.session.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.levelName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.adviserName.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "GRADUATED":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "SUSPENDED":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "WITHDRAWN":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Toast Notification */}
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

      {/* Sub-header & Top Action Bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            {activeSession && (
              <button
                type="button"
                onClick={() => {
                  setActiveSession(null);
                  setSearchTerm("");
                  setLevelFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#2e63e5] hover:underline"
              >
                ← Academic Sessions
              </button>
            )}
            {activeSession && <span className="text-slate-300">/</span>}
            <h2 className="text-xl font-bold text-slate-800">
              {activeSession ? `${activeSession} Academic Session Roster` : "Departmental Academic Sessions & Cohorts"}
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {activeSession
              ? `Manage registered students, status credentials, and batch imports for cohort ${activeSession}.`
              : "Select an academic session to view, manage, or import student cohort rosters."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingStudent(null);
              setShowCrudModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            + Add Single Student
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e63e5] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf]"
          >
            <ExcelFileIcon className="size-4" />
            Batch Excel Seeding
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Students
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {activeSession ? totalStudentsCount : totalDepartmentStudents}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {activeSession ? `Enrolled in ${activeSession}` : "Across all academic cohorts"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Students
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {activeSession
              ? students.filter((s) => s.status === "ACTIVE").length
              : totalActiveStudents}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Enrolled and eligible
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeSession ? "Current Level" : "Academic Cohorts"}
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {activeSession
              ? currentSessionSummary?.levelName || "Undergraduate"
              : totalCohorts}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {activeSession ? `Entry Session ${activeSession}` : "Active entry cohorts registered"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeSession ? "Assigned Adviser" : "Graduated Alumni"}
          </p>
          <p className="mt-2 text-lg font-bold text-slate-800 truncate">
            {activeSession
              ? currentSessionSummary?.adviserName || "Unassigned"
              : totalGraduatedStudents}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {activeSession ? "Designated Course Adviser" : "Completed degree requirements"}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SESSIONS OVERVIEW TABLE (When no session is opened)              */}
      {/* ========================================================================= */}
      {!activeSession && (
        <div className="space-y-4">
          {/* Search bar for sessions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <input
                type="text"
                placeholder="Search academic session (e.g. 2024/2025, 100 Level, adviser)..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              />
              {sessionSearch && (
                <button
                  type="button"
                  onClick={() => setSessionSearch("")}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Click <strong className="font-semibold text-slate-600">&quot;View Student List&quot;</strong> or any session row to inspect the cohort roster.
            </p>
          </div>

          {/* Sessions Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {isSessionsLoading ? (
              <div className="py-16 text-center text-sm font-medium text-slate-400">
                Loading academic cohorts...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-slate-700">No sessions match your search</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your keyword or seed a new cohort.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-4">Academic Session / Cohort</th>
                      <th className="px-5 py-4">Current Level</th>
                      <th className="px-5 py-4 text-center">Total Enrolled</th>
                      <th className="px-5 py-4 text-center">Active Status</th>
                      <th className="px-5 py-4">Course Adviser</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.map((cohort) => (
                      <tr
                        key={cohort.session}
                        onClick={() => {
                          setActiveSession(cohort.session);
                          setSearchTerm("");
                        }}
                        className="cursor-pointer transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-bold text-blue-700">
                              {cohort.session.slice(2, 4)}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">{cohort.session} Session</p>
                              <p className="text-xs text-slate-400">Entry Cohort</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {cohort.levelName}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-800">
                          {cohort.totalStudents} {cohort.totalStudents === 1 ? "student" : "students"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            {cohort.activeStudents} Active
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-700">
                            {cohort.adviserName}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSession(cohort.session);
                              setSearchTerm("");
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#2e63e5] transition hover:bg-[#2e63e5] hover:text-white"
                          >
                            <span>View Student List</span>
                            <span>→</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: COHORT STUDENTS LIST VIEW (When a session is clicked / opened)   */}
      {/* ========================================================================= */}
      {activeSession && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Session Banner and Switcher */}
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveSession(null);
                  setSearchTerm("");
                  setLevelFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="flex size-9 items-center justify-center rounded-xl border border-blue-200 bg-white text-sm font-bold text-[#2e63e5] shadow-xs hover:bg-blue-50"
              >
                ←
              </button>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {activeSession} Academic Session Roster
                </p>
                <p className="text-xs text-slate-500">
                  Showing all students registered under entry session {activeSession}
                </p>
              </div>
            </div>

            {/* Quick Session Switcher dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Switch Session:</span>
              <select
                value={activeSession}
                onChange={(e) => {
                  setActiveSession(e.target.value);
                  setSearchTerm("");
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                {sessions.map((s) => (
                  <option key={s.session} value={s.session}>
                    {s.session} ({s.totalStudents} students)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search and Filters Bar within session */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Search ${activeSession} students by matric number or name...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#2e63e5]"
            >
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#2e63e5]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="GRADUATED">Graduated</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          {/* Student Roster Table for this session */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {isStudentsLoading ? (
              <div className="py-16 text-center text-sm font-medium text-slate-400">
                Loading students for {activeSession}...
              </div>
            ) : students.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-slate-700">
                  No students found in {activeSession}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try adjusting your search or click &quot;Batch Excel Seeding&quot; to import students.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setShowCrudModal(true);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    + Add Single Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="rounded-xl bg-[#2e63e5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2456cf]"
                  >
                    Batch Excel Seeding
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3.5">Matric Number</th>
                      <th className="px-4 py-3.5">Full Name</th>
                      <th className="px-4 py-3.5">Entry Session</th>
                      <th className="px-4 py-3.5">Current Level</th>
                      <th className="px-4 py-3.5">Method</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {student.matricNumber}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {student.entrySession}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {student.currentLevel} Level
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              student.creationMethod === "EXCEL_IMPORT"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {student.creationMethod === "EXCEL_IMPORT"
                              ? "Excel Batch"
                              : "Manual"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                              student.status
                            )}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(student);
                                setShowCrudModal(true);
                              }}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingStudent(student)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {showImportModal && (
        <StudentImportModal
          defaultSession={activeSession || "2024/2025"}
          onClose={() => setShowImportModal(false)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchStudents();
            fetchSessions();
          }}
        />
      )}

      {showCrudModal && (
        <StudentCrudModal
          student={editingStudent}
          defaultSession={activeSession || "2024/2025"}
          onClose={() => {
            setShowCrudModal(false);
            setEditingStudent(null);
          }}
          onSuccess={(msg) => {
            showToast(msg);
            fetchStudents();
            fetchSessions();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">
              Delete Student Record?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove{" "}
              <strong className="text-slate-800">
                {deletingStudent.fullName} ({deletingStudent.matricNumber})
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
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
