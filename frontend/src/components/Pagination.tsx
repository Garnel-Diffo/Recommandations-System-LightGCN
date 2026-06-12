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

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <Link
        href={buildHref(prev)}
        aria-disabled={page === 1}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
          page === 1
            ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
            : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        ← Précédent
      </Link>
      <span className="text-sm text-slate-600 dark:text-slate-300">
        Page {page} / {totalPages}
      </span>
      <Link
        href={buildHref(next)}
        aria-disabled={page === totalPages}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
          page === totalPages
            ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
            : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        Suivant →
      </Link>
    </div>
  );
}
