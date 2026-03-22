import { MovieChooser } from '@/components/movie-chooser';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#fef3f2,_#f8fafc)] px-4 py-10 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] dark:text-white">
      <MovieChooser />
      <footer className="mx-auto mt-10 max-w-5xl text-xs text-slate-500 dark:text-slate-400">
        Built with TMDb data. This product uses the TMDb API but is not endorsed or certified by TMDb.
      </footer>
    </main>
  );
}
