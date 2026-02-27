export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 px-4 text-center">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} EmailScheduler. All rights reserved.
      </p>
    </footer>
  );
}
