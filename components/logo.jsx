// Splitora logo: a coin cut in two and slid apart, one half for each side of a split.
// Pure SVG + text, so it works in both server and client components.

export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7.01 32.5A19 19 0 0 1 40.99 15.5Z"
        fill="#5B4BDB"
        transform="translate(-0.72 -1.43)"
      />
      <path
        d="M40.99 15.5A19 19 0 0 1 7.01 32.5Z"
        fill="#2DD4A7"
        transform="translate(0.72 1.43)"
      />
    </svg>
  );
}

export function Logo({ className = "", markClassName = "h-9 w-9", tone = "dark" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span
        className={`font-display text-[1.7rem] font-bold leading-none tracking-tight ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
      >
        Splitora
      </span>
    </span>
  );
}
