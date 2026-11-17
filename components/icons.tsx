import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function AtomIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <circle cx="20" cy="20" r="3.1" fill="currentColor" />
      <ellipse
        cx="20"
        cy="20"
        rx="15"
        ry="6.4"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(45 20 20)"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="15"
        ry="6.4"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-45 20 20)"
      />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M3.5 10h12m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="10.8" cy="10.8" r="6.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4.1 4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <rect x="4" y="8.5" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
