export function HodSessionBadge({ label = "2024/2025 Session" }: { label?: string }) {
  return (
    <div className="inline-flex h-11 items-center rounded-lg border border-[#d6deeb] bg-white px-4 text-sm text-slate-500">
      {label}
    </div>
  );
}
