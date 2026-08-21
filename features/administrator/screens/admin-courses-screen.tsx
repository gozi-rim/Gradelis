"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CourseItem,
  getCourses,
  deleteCourse,
  LevelSemesterGroupSummary,
  getCoursesOverview,
} from "@/lib/actions/admin-courses";
import { CourseImportModal } from "../components/course-import-modal";
import { CourseCrudModal } from "../components/course-crud-modal";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

export function AdminCoursesScreen() {
  // Active selection: e.g. "100-FIRST" or null (overview table)
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  // Overview table state
  const [groups, setGroups] = useState<LevelSemesterGroupSummary[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [groupSearch, setGroupSearch] = useState("");
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [totalCreditUnitsCount, setTotalCreditUnitsCount] = useState(0);

  // Drilldown courses state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Derive level & semester from activeGroupKey
  const activeGroup = groups.find((g) => g.key === activeGroupKey);
  const activeLevel = activeGroup ? activeGroup.level : 100;
  const activeSemester = activeGroup ? activeGroup.semester : "FIRST";

  // Fetch Overview
  const fetchOverview = useCallback(async () => {
    try {
      const res = await getCoursesOverview();
      if (res.success) {
        setGroups(res.groups);
        setTotalCoursesCount(res.totalCourses);
        setTotalCreditUnitsCount(res.totalCreditUnits);
      }
    } catch {
      // silently handle
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  // Fetch Courses for active group
  const fetchCourses = useCallback(async () => {
    if (!activeGroupKey) return;
    try {
      const res = await getCourses({
        level: String(activeLevel),
        semester: activeSemester,
        courseType: typeFilter,
        search: courseSearch,
      });
      if (res.success) {
        setCourses(res.courses);
      }
    } catch {
      // silently handle
    } finally {
      setIsCoursesLoading(false);
    }
  }, [activeGroupKey, activeLevel, activeSemester, typeFilter, courseSearch]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    getCoursesOverview().then((res) => {
      if (isMounted && res.success) {
        setGroups(res.groups);
        setTotalCoursesCount(res.totalCourses);
        setTotalCreditUnitsCount(res.totalCreditUnits);
        setIsOverviewLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load courses when active group or filter changes
  useEffect(() => {
    if (!activeGroupKey) return;
    let isMounted = true;

    getCourses({
      level: String(activeLevel),
      semester: activeSemester,
      courseType: typeFilter,
      search: courseSearch,
    }).then((res) => {
      if (isMounted && res.success) {
        setCourses(res.courses);
        setIsCoursesLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeGroupKey, activeLevel, activeSemester, typeFilter, courseSearch]);

  const handleDelete = async () => {
    if (!deletingCourse) return;
    try {
      const res = await deleteCourse(deletingCourse.id);
      if (res.success) {
        showToast(res.message);
        setDeletingCourse(null);
        fetchCourses();
        fetchOverview();
      }
    } catch {
      showToast("Failed to delete course.");
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.levelName.toLowerCase().includes(groupSearch.toLowerCase()) ||
      g.semesterName.toLowerCase().includes(groupSearch.toLowerCase()) ||
      `${g.level}`.includes(groupSearch)
  );

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
            {activeGroupKey && (
              <button
                type="button"
                onClick={() => {
                  setActiveGroupKey(null);
                  setCourseSearch("");
                  setTypeFilter("ALL");
                }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#2e63e5] hover:underline"
              >
                ← Academic Levels &amp; Semesters
              </button>
            )}
            {activeGroupKey && <span className="text-slate-300">/</span>}
            <h2 className="text-xl font-bold text-slate-800">
              {activeGroupKey
                ? `${activeGroup?.levelName} · ${activeGroup?.semesterName} Curriculum`
                : "Departmental Course Curriculum"}
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {activeGroupKey
              ? `Manage accredited courses, credit load, and compulsory/elective requirements for ${activeGroup?.levelName} (${activeGroup?.semesterName}).`
              : "Organized by academic level and semester. Select a curriculum block to view or seed courses."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingCourse(null);
              setShowCrudModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            + Add Single Course
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

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Courses
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {activeGroupKey ? courses.length : totalCoursesCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {activeGroupKey ? `In this semester` : "Across entire curriculum"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Credit Load
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {activeGroupKey
              ? courses.reduce((acc, c) => acc + c.creditUnits, 0)
              : totalCreditUnitsCount}{" "}
            Units
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Graduation credit requirement
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Compulsory Courses
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {activeGroupKey
              ? courses.filter((c) => c.courseType === "COMPULSORY").length
              : groups.reduce((acc, g) => acc + g.compulsoryCount, 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mandatory departmental units
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Elective Offerings
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-600">
            {activeGroupKey
              ? courses.filter((c) => c.courseType === "ELECTIVE").length
              : groups.reduce((acc, g) => acc + g.electiveCount, 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Specialization options
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LEVELS & SEMESTERS OVERVIEW TABLE (When no block is opened)       */}
      {/* ========================================================================= */}
      {!activeGroupKey && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <input
                type="text"
                placeholder="Search level or semester (e.g. 100 Level, First Semester)..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              />
              {groupSearch && (
                <button
                  type="button"
                  onClick={() => setGroupSearch("")}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Click <strong className="font-semibold text-slate-600">&quot;View Course List&quot;</strong> or any row to manage courses for that semester.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {isOverviewLoading ? (
              <div className="py-16 text-center text-sm font-medium text-slate-400">
                Loading curriculum blocks...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-slate-700">No matching levels found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-4">Curriculum Block</th>
                      <th className="px-5 py-4">Academic Level</th>
                      <th className="px-5 py-4">Semester</th>
                      <th className="px-5 py-4 text-center">Total Courses</th>
                      <th className="px-5 py-4 text-center">Credit Load</th>
                      <th className="px-5 py-4">Classification</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroups.map((g) => (
                      <tr
                        key={g.key}
                        onClick={() => {
                          setActiveGroupKey(g.key);
                          setCourseSearch("");
                        }}
                        className="cursor-pointer transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-bold text-blue-700">
                              {g.level / 100}Y
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {g.levelName} · {g.semesterName}
                              </p>
                              <p className="text-xs text-slate-400">
                                Year {g.level / 100} Undergraduate
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {g.levelName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-700">
                            {g.semesterName}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-800">
                          {g.totalCourses} {g.totalCourses === 1 ? "course" : "courses"}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-emerald-600">
                          {g.totalCreditUnits} Units
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                              {g.compulsoryCount} Compulsory
                            </span>
                            {g.electiveCount > 0 && (
                              <span className="rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">
                                {g.electiveCount} Elective
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveGroupKey(g.key);
                              setCourseSearch("");
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#2e63e5] transition hover:bg-[#2e63e5] hover:text-white"
                          >
                            <span>View Course List</span>
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
      {/* VIEW 2: SEMESTER COURSES LIST (When a level & semester is clicked)        */}
      {/* ========================================================================= */}
      {activeGroupKey && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Banner & Switcher */}
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveGroupKey(null);
                  setCourseSearch("");
                  setTypeFilter("ALL");
                }}
                className="flex size-9 items-center justify-center rounded-xl border border-blue-200 bg-white text-sm font-bold text-[#2e63e5] shadow-xs hover:bg-blue-50"
              >
                ←
              </button>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {activeGroup?.levelName} · {activeGroup?.semesterName} Catalog
                </p>
                <p className="text-xs text-slate-500">
                  Total load: {courses.reduce((acc, c) => acc + c.creditUnits, 0)} Units across {courses.length} courses
                </p>
              </div>
            </div>

            {/* Quick Switcher dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Switch Level/Sem:</span>
              <select
                value={activeGroupKey}
                onChange={(e) => {
                  setActiveGroupKey(e.target.value);
                  setCourseSearch("");
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                {groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.levelName} ({g.semesterName}) - {g.totalCourses} courses
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search and Filters Bar within block */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Search ${activeGroup?.levelName} courses by code (e.g. CPE 401) or title...`}
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              />
              {courseSearch && (
                <button
                  type="button"
                  onClick={() => setCourseSearch("")}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#2e63e5]"
            >
              <option value="ALL">All Classifications</option>
              <option value="COMPULSORY">Compulsory Courses</option>
              <option value="ELECTIVE">Elective Courses</option>
            </select>
          </div>

          {/* Courses Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {isCoursesLoading ? (
              <div className="py-16 text-center text-sm font-medium text-slate-400">
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-slate-700">
                  No courses found for {activeGroup?.levelName} ({activeGroup?.semesterName})
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Register a single course or use &quot;Batch Excel Seeding&quot; to populate.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourse(null);
                      setShowCrudModal(true);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    + Add Single Course
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
                      <th className="px-4 py-3.5">Course Code</th>
                      <th className="px-4 py-3.5">Course Title</th>
                      <th className="px-4 py-3.5 text-center">Credit Units</th>
                      <th className="px-4 py-3.5">Level &amp; Semester</th>
                      <th className="px-4 py-3.5">Classification</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((course) => (
                      <tr
                        key={course.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {course.code}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {course.title}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                          {course.creditUnits}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {course.level}L · {course.semester === "FIRST" ? "1st Sem" : "2nd Sem"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              course.courseType === "COMPULSORY"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {course.courseType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                              course.isActive
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {course.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCourse(course);
                                setShowCrudModal(true);
                              }}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCourse(course)}
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

      {/* Modals */}
      {showImportModal && (
        <CourseImportModal
          defaultLevel={activeLevel}
          defaultSemester={activeSemester}
          onClose={() => setShowImportModal(false)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchCourses();
            fetchOverview();
          }}
        />
      )}

      {showCrudModal && (
        <CourseCrudModal
          course={editingCourse}
          defaultLevel={activeLevel}
          defaultSemester={activeSemester}
          onClose={() => {
            setShowCrudModal(false);
            setEditingCourse(null);
          }}
          onSuccess={(msg) => {
            showToast(msg);
            fetchCourses();
            fetchOverview();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">
              Delete Course?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove{" "}
              <strong className="text-slate-800">
                {deletingCourse.code} - {deletingCourse.title}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
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
