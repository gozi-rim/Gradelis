import Link from "next/link";

// ─── Static data ──────────────────────────────────────────────────────────────

const topStats = [
  {
    label: "Total Users",
    value: "7",
    sub: "1 Admin · 1 HOD · 5 Advisers",
    valueColor: "text-slate-800",
  },
  {
    label: "Head of Department",
    value: "1",
    sub: "EEE Department",
    valueColor: "text-slate-800",
  },
  {
    label: "Course Advisers",
    value: "5",
    sub: "One adviser per level",
    valueColor: "text-slate-800",
  },
  {
    label: "Total Students",
    value: "596",
    sub: "Across Year 1–5",
    valueColor: "text-slate-800",
  },
  {
    label: "Pending Submissions",
    value: "8",
    sub: "Awaiting HOD review",
    valueColor: "text-[#ff9800]",
  },
  {
    label: "System Status",
    value: "Operational",
    sub: "No system alerts",
    valueColor: "text-[#18a558]",
  },
] as const;

const levelRows = [
  { level: "Year 1", adviser: "Dr. Grace Ibrahim", students: 145, uploaded: 12, pending: 2 },
  { level: "Year 2", adviser: "Dr. Emeka Nwosu", students: 132, uploaded: 14, pending: 1 },
  { level: "Year 3", adviser: "Dr. Maryam Bello", students: 118, uploaded: 13, pending: 3 },
  { level: "Year 4", adviser: "Dr. A. Okafor", students: 105, uploaded: 15, pending: 1 },
  { level: "Year 5", adviser: "Dr. T. Lawal", students: 96, uploaded: 10, pending: 1 },
] as const;

const userOverviewRows = [
  { label: "Administrator", count: 1, color: "bg-[#2e63e5]" },
  { label: "Head of Department", count: 1, color: "bg-[#6b4fe8]" },
  { label: "Course Advisers", count: 5, color: "bg-[#1e93da]" },
  { label: "Active Accounts", count: 7, color: "bg-[#18a558]" },
  { label: "Disabled Accounts", count: 0, color: "bg-slate-300" },
] as const;

// donut segments: administrator 1/7, hod 1/7, advisers 5/7
// approximate conic: admin ~14%, hod ~14%, advisers ~72%
const USER_DONUT =
  "conic-gradient(#2e63e5 0% 14%, #6b4fe8 14% 28%, #1e93da 28% 100%)";

// submission donut: 25 approved, 8 pending, 2 rejected, 5 corrections — total 40? design says 33
// design: 25 approved (green), 8 pending (amber), 2 rejected (red), 5 corrections (blue) = 40... label says 33
// use design label 33 but proportions from counts
const SUB_DONUT =
  "conic-gradient(#18a558 0% 63%, #ff9800 63% 83%, #ef4444 83% 88%, #2e63e5 88% 100%)";

type HealthRow = {
  label: string;
  value: string;
  valueColor: string;
  isProgress?: boolean;
};

const systemHealthRows: HealthRow[] = [
  { label: "Database Connection", value: "Connected", valueColor: "text-[#18a558]" },
  { label: "Server Status", value: "Online", valueColor: "text-[#18a558]" },
  { label: "Storage Usage", value: "42%", valueColor: "text-slate-700", isProgress: true },
  { label: "Last Backup", value: "Today, 10:30 AM", valueColor: "text-slate-700" },
  { label: "Recent Activity", value: "Year 3 adviser account updated", valueColor: "text-slate-700" },
];

const quickActions = [
  { label: "Create User", href: "/administrator/user-management", color: "border-[#2e63e5] text-[#2e63e5] hover:bg-[#2e63e5]" },
  { label: "Assign HOD", href: "/administrator/user-management", color: "border-[#18a558] text-[#18a558] hover:bg-[#18a558]" },
  { label: "Assign Adviser", href: "/administrator/assign-adviser", color: "border-[#6b4fe8] text-[#6b4fe8] hover:bg-[#6b4fe8]" },
  { label: "Create Session", href: "/administrator/academic-sessions", color: "border-[#ff9800] text-[#ff9800] hover:bg-[#ff9800]" },
  { label: "Manage Levels", href: "/administrator/academic-sessions", color: "border-[#1e93da] text-[#1e93da] hover:bg-[#1e93da]" },
  { label: "Backup Database", href: "/administrator/system-logs", color: "border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]" },
  { label: "View Logs", href: "/administrator/system-logs", color: "border-slate-400 text-slate-600 hover:bg-slate-600" },
] as const;

// ─── Inline SVG line-chart (static, matches design curves) ────────────────────
function AcademicSessionChart() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="mt-3 w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      {/* Green curve – submission trend */}
      <polyline
        points="0,70 40,55 80,40 120,22 160,10 200,4"
        fill="none"
        stroke="#18a558"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Blue curve – baseline/comparison */}
      <polyline
        points="0,75 40,72 80,65 120,55 160,48 200,42"
        fill="none"
        stroke="#2e63e5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AdminDashboardScreen() {
  return (
    <div className="space-y-6">

      {/* Sub-title row */}
      <p className="text-sm text-slate-500">
        Electrical/Electronic Engineering Department · 1 HOD · 5 Course Advisers · Year 1–5
      </p>

      {/* ── Top stats ── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {topStats.map((stat) => (
          <article key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className={`mt-1.5 text-3xl font-semibold ${stat.valueColor}`}>
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
          </article>
        ))}
      </section>

      {/* ── Mid row: Level summary + User overview ── */}
      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">

        {/* EEE Level Summary */}
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">EEE Level Summary</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            One assigned Course Adviser for each academic level.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Level</th>
                  <th className="px-2 py-2">Course Adviser</th>
                  <th className="px-2 py-2">Students</th>
                  <th className="px-2 py-2">Uploaded</th>
                  <th className="px-2 py-2">Pending</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {levelRows.map((row) => (
                  <tr key={row.level} className="border-t border-slate-100 text-slate-600">
                    <td className="px-2 py-3 font-medium">{row.level}</td>
                    <td className="px-2 py-3">{row.adviser}</td>
                    <td className="px-2 py-3">{row.students}</td>
                    <td className="px-2 py-3">{row.uploaded}</td>
                    <td className="px-2 py-3">{row.pending}</td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* User Overview donut */}
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">User Overview</h3>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {/* Donut */}
            <div className="relative shrink-0">
              <div
                className="grid size-36 place-items-center rounded-full"
                style={{ background: USER_DONUT }}
              >
                <div className="grid size-24 place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-xs text-slate-400">Users</p>
                    <p className="text-2xl font-semibold text-slate-800">7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-sm">
              {userOverviewRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-6">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={`size-2.5 rounded-full ${row.color}`} />
                    {row.label}
                  </span>
                  <span className="font-semibold text-slate-800">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* ── Bottom row: Submission overview + Academic session + System health ── */}
      <section className="grid gap-4 xl:grid-cols-3">

        {/* Submission Overview */}
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Submission Overview</h3>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div
              className="grid size-36 shrink-0 place-items-center rounded-full"
              style={{ background: SUB_DONUT }}
            >
              <div className="grid size-24 place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-2xl font-semibold text-slate-800">33</p>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <p className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-[#18a558]" />
                25 Approved
              </p>
              <p className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-[#ff9800]" />
                8 Pending
              </p>
              <p className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-[#ef4444]" />
                2 Rejected
              </p>
              <p className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-[#2e63e5]" />
                5 Corrections
              </p>
            </div>
          </div>
        </article>

        {/* Academic Session Summary */}
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Academic Session Summary</h3>
          <div className="mt-3 space-y-1 text-sm text-slate-500">
            <p className="text-xs uppercase tracking-wide text-slate-400">Current Session</p>
            <p className="text-2xl font-bold text-slate-800">2024/2025</p>
            <p className="text-xs uppercase tracking-wide text-slate-400 pt-2">Semester</p>
            <p className="text-sm text-slate-700">Second Semester</p>
            <p className="text-xs uppercase tracking-wide text-slate-400 pt-2">Submission Window</p>
            <p className="text-sm font-semibold text-[#18a558]">OPEN</p>
          </div>
          <AcademicSessionChart />
        </article>

        {/* System Health & Recent Activity */}
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">System Health &amp; Recent Activity</h3>
          <div className="mt-4 space-y-3 text-sm">
            {systemHealthRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <span className="text-slate-500">{row.label}</span>
                {row.isProgress ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[42%] rounded-full bg-[#2e63e5]" />
                    </div>
                    <span className="text-slate-700">42%</span>
                  </div>
                ) : (
                  <span className={`font-medium ${row.valueColor}`}>{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ── Quick Actions ── */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition hover:text-white ${action.color}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
