export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <p>
        Système de recommandation basé sur <strong>LightGCN</strong> (PyTorch) — Jeu de données{" "}
        <strong>MovieLens ml-latest-small</strong>.
      </p>
      <p className="mt-1">Affiches fournies par TMDb. Projet académique — Recommandations-System.</p>
    </footer>
  );
}
