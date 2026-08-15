"use client";

import { ChevronDownIcon } from "@/shared/icons/ui-icons";

// ─── Static options (will be replaced with real data later) ───────────────────

const academicSessions = ["2025/2026", "2024/2025", "2023/2024"];
const academicLevels   = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const lecturers        = [
  "Dr. Kelvin Bello",
  "Dr. Grace Ibrahim",
  "Dr. Emeka Nwosu",
  "Dr. Maryam Bello",
  "Dr. A. Okafor",
  "Dr. T. Lawal",
];

// ─── Reusable select field ────────────────────────────────────────────────────

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          defaultValue={defaultValue}
          className="h-14 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

// ─── Date field ───────────────────────────────────────────────────────────────

function DateField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type="date"
          id={name}
          name={name}
          defaultValue={defaultValue}
          className="h-14 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
        />
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AssignAdviserScreen() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Assign any lecturer to a level for a selected academic session
      </p>

      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        {/* Section heading */}
        <div className="mb-6 border-b border-slate-100 pb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            New Adviser Assignment
          </h2>
          <p className="mt-1 text-sm text-[#2e63e5]">
            One active adviser can be assigned to each level per session.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          <SelectField
            label="Academic Session"
            name="academicSession"
            options={academicSessions}
            defaultValue="2025/2026"
          />

          <SelectField
            label="Academic Level"
            name="academicLevel"
            options={academicLevels}
            defaultValue="Year 3"
          />

          <SelectField
            label="Select Lecturer"
            name="lecturer"
            options={lecturers}
            defaultValue="Dr. Kelvin Bello"
          />

          <DateField
            label="Access Start Date"
            name="accessStartDate"
            defaultValue="2025-09-01"
          />

          <DateField
            label="Access End Date"
            name="accessEndDate"
            defaultValue="2030-08-31"
          />

          {/* Access rule + submit */}
          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-xl bg-blue-50 px-5 py-4 sm:flex-1">
              <p className="text-sm font-semibold text-[#2e63e5]">Access rule</p>
              <p className="mt-0.5 text-sm text-slate-600">
                The lecturer will only access records for Year 3 during this session.
              </p>
            </div>

            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-[#2e63e5] px-8 text-sm font-semibold text-white transition hover:bg-[#2456cf] hover:cursor-pointer"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
