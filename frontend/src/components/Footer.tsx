export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 py-8 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          Système de recommandation basé sur
          <span className="rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-2 py-0.5 text-xs font-semibold text-white">
            LightGCN
          </span>
          (PyTorch) · Jeu de données <strong className="font-semibold">MovieLens ml-latest-small</strong>
        </p>
        <p>Affiches fournies par TMDb.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Projet académique ·{" "}
          <a
            href="https://github.com/Garnel-Diffo/Recommandations-System-LightGCN"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 transition hover:underline dark:text-indigo-400"
          >
            Recommandations-System-LightGCN
          </a>
        </p>
      </div>
    </footer>
  );
}
