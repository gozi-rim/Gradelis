import { ChevronDownIcon } from "@/shared/icons/ui-icons";

export function SessionSelect() {
  return (
    <button
      type="button"
      className="inline-flex h-11 min-w-24 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800"
    >
      U2021
      <ChevronDownIcon className="size-4 text-slate-700" />
    </button>
  );
}
