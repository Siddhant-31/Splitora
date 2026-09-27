import Link from "next/link";

export function Panel({
  title,
  description,
  href,
  hrefLabel = "View all",
  children,
  fill = false,
  className = "",
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${
        fill ? "flex flex-col" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="rounded-sm text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {hrefLabel}
          </Link>
        )}
      </div>
      <div className={`mt-5 ${fill ? "flex flex-1 flex-col" : ""}`}>
        {children}
      </div>
    </section>
  );
}
