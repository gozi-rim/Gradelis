import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = "none";

export function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="M4 12h7V4H4v8Zm0 8h7v-6H4v6Zm9 0h7V12h-7v8Zm0-10h7V4h-7v6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path d="M6 20h12v-2H6v2Zm6-16-5 5h3v6h4V9h3l-5-5Z" fill="currentColor" />
    </svg>
  );
}

export function StudentsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.3 0-7 1.2-7 3.5V19h10v-2.5C11 14.2 6.3 13 4 13Zm12 0c-.3 0-.7 0-1 .1 1.1.8 2 1.9 2 3.4V19h3v-2.5c0-2.3-4.7-3.5-7-3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="M7 2h8l5 5v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V8h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h6M9 16h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="M10 4h10M4 4h2M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM20 12h-2M4 12h10m2 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM8 20h12M4 20h2m2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="M6 10a6 6 0 1 1 12 0v5l1.8 2.2a1 1 0 0 1-.8 1.6H5a1 1 0 0 1-.8-1.6L6 15.1V10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserOutlineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c1.8-3.6 4.4-5 8-5s6.2 1.4 8 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="m7 12 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 8 8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloudUploadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="M7 18a4 4 0 0 1-.3-8A6 6 0 0 1 18 8a4 4 0 0 1-.2 8H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m12 19.5 0-7m0 0-2.5 2.5M12 12.5l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExcelFileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path d="M6 2h8l4 4v16H6z" fill="#1f7a4f" />
      <path d="M14 2v4h4" fill="#2aa066" />
      <path
        d="m8.2 15.8 1.9-3-1.7-2.6h1.8l.8 1.5.8-1.5h1.8l-1.7 2.6 1.9 3h-1.9l-1-1.8-1 1.8H8.2Z"
        fill="white"
      />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} {...props}>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
