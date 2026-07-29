import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ShieldGraduateIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M32 4 49 14v16c0 12.2-6.9 21.2-17 25.7C21.9 51.2 15 42.2 15 30V14L32 4Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="m22 24 10-5 10 5-10 5-10-5Z" fill="currentColor" />
      <path d="M32 29v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 38c2.8 3.2 14.2 3.2 18 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-white">
      <div className="rounded-xl bg-white/5 p-1.5">
        <ShieldGraduateIcon className="size-11" />
      </div>
      {!compact ? <span className="text-[30px] font-semibold leading-none">GradElis</span> : null}
    </div>
  );
}
