import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="rounded-lg bg-indigo-600 px-2 py-1 text-sm text-white">LightGCN</span>
          <span className="hidden sm:inline">Recommandations de films</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Accueil
          </Link>
          <Link href="/movies" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Catalogue
          </Link>
        </div>
      </nav>
    </header>
  );
}
