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

        <div className="mt-2 flex flex-col gap-1 border-t border-slate-200/70 pt-3 text-xs text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
          <p>
            Fait par : <span className="font-semibold text-slate-700 dark:text-slate-200">DIFFO KENNE GARNEL</span>
            {" "}- Matricule : <span className="font-medium">24P816</span>
            {" "}- Filière : <span className="font-medium">AIA-4</span>
          </p>
          <p>
            UE : <span className="font-medium">IA et applications</span>
            {" "}- Supervisé par : <span className="font-medium">M. Omgba Btha</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
