type IconProps = {
  className?: string;
};

const DEFAULT_CLASS = "h-5 w-5";
const strokeProps = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BookOpenIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M12 6.5c-1.5-1-4-1.5-6-1.5-.6 0-1 .4-1 1v11c0 .6.4 1 1 1 2 0 4.5.5 6 1.5 1.5-1 4-1.5 6-1.5.6 0 1-.4 1-1V6c0-.6-.4-1-1-1-2 0-4.5.5-6 1.5Z" />
      <path d="M12 6.5V19" />
    </svg>
  );
}

export function ClipboardListIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}

export function CalendarIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function EyeIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SparklesIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2c.5 3.5 1.5 6 3 7.5S19 12 22 12c-3 0-5 1-6.5 2.5S12 18.5 12 22c-.5-3.5-1.5-6-3-7.5S5 12 2 12c3 0 5-1 6.5-2.5S12 5.5 12 2Z" />
    </svg>
  );
}

export function AlertTriangleIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </svg>
  );
}

export function UserIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
    </svg>
  );
}

export function CheckCircleIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

export function ZapIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function ChevronRightIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </svg>
  );
}

export function UsersIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.8-3.5 3-5.5 6-5.5s5.2 2 6 5.5" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 14.5c2.4.3 4 2 4.6 5" />
    </svg>
  );
}

export function TrashIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
