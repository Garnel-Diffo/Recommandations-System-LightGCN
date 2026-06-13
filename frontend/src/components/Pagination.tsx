import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export default function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const pages = getPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 py-6 sm:gap-2">
      <PageLink
        href={buildHref(prev)}
        disabled={page === 1}
        ariaLabel="Page précédente"
        className="px-3"
      >
        ←<span className="ml-1 hidden sm:inline">Précédent</span>
      </PageLink>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1 text-sm text-slate-400 dark:text-slate-500"
          >
            …
          </span>
        ) : (
          <PageLink
            key={p}
            href={buildHref(p)}
            active={p === page}
            ariaLabel={`Page ${p}`}
            className="min-w-[2.25rem] px-0"
          >
            {p}
          </PageLink>
        ),
      )}

      <PageLink
        href={buildHref(next)}
        disabled={page === totalPages}
        ariaLabel="Page suivante"
        className="px-3"
      >
        <span className="mr-1 hidden sm:inline">Suivant</span>→
      </PageLink>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  active,
  ariaLabel,
  className = "",
  children,
}: {
  href: string;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center justify-center rounded-lg border text-sm font-medium transition ${className} ${
        disabled
          ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
          : active
            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
            : "border-slate-300 text-slate-700 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </Link>
  );
}

function getPageList(page: number, totalPages: number): (number | "...")[] {
  const delta = 1;
  const range: (number | "...")[] = [];
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);

  if (start > 1) {
    range.push(1);
    if (start > 2) range.push("...");
  }
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) range.push("...");
    range.push(totalPages);
  }
  return range;
}
