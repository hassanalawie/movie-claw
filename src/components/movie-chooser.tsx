"use client";

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { vibeGroups, type VibeId, vibeOptionMap } from '@/data/vibes';
import type { Movie, ComparisonLogEntry } from '@/types/movies';

const MIN_ROUNDS = 4;
const OVERTIME_ROUNDS = 6;

export function MovieChooser() {
  const [selected, setSelected] = useState<Set<VibeId>>(new Set());
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'picking' | 'decision' | 'final'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deck, setDeck] = useState<Movie[]>([]);
  const [scores, setScores] = useState<Record<number, { wins: number; losses: number }>>({});
  const [rounds, setRounds] = useState(0);
  const [log, setLog] = useState<ComparisonLogEntry[]>([]);
  const [summary, setSummary] = useState<{ chips: VibeId[]; note?: string } | null>(null);
  const [finalCandidate, setFinalCandidate] = useState<Movie | null>(null);
  const [finalChoice, setFinalChoice] = useState<Movie | null>(null);

  const currentPair = deck.length >= 2 ? ([deck[0], deck[1]] as [Movie, Movie]) : null;
  const learningProgress = Math.min(rounds / MIN_ROUNDS, 1);

  const requiredGroupSatisfied = vibeGroups
    .filter((group) => group.required)
    .every((group) => group.options.some((option) => selected.has(option.id)));

  const canSubmit = selected.size > 0 && requiredGroupSatisfied;

  const selectionSummary = useMemo(() => {
    if (!summary) return null;
    return summary.chips.map((chip) => vibeOptionMap[chip]?.label ?? chip);
  }, [summary]);

  function toggleChip(chip: VibeId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next;
    });
  }

  function resetAll() {
    setSelected(new Set());
    setNote('');
    setStatus('idle');
    setError(null);
    setToast(null);
    setDeck([]);
    setScores({});
    setRounds(0);
    setLog([]);
    setSummary(null);
    setFinalCandidate(null);
    setFinalChoice(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('loading');
    setError(null);
    setToast(null);

    const payload = {
      chips: Array.from(selected),
      note: note.trim(),
    };

    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unable to fetch movies.' }));
        throw new Error(data.error || 'Unable to fetch movies.');
      }

      const data = (await res.json()) as { movies: Movie[] };
      if (!data.movies.length) {
        throw new Error('No matches found. Try broadening your vibe.');
      }

      const seededDeck = shuffleMovies(data.movies);
      setDeck(seededDeck);
      setScores(createScoreMap(data.movies));
      setRounds(0);
      setLog([]);
      setSummary({ chips: payload.chips, note: payload.note || undefined });
      setFinalCandidate(null);
      setFinalChoice(null);
      setStatus('picking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  }

  function handleChoice(movieId: number) {
    if (!currentPair) return;
    const [first, second, ...rest] = deck;
    const winnerIsFirst = movieId === first.id;
    const winnerIsSecond = movieId === second.id;
    if (!winnerIsFirst && !winnerIsSecond) return;

    const winner = winnerIsFirst ? first : second;
    const loser = winnerIsFirst ? second : first;
    const newDeck = winnerIsFirst ? [first, ...rest, second] : [second, ...rest, first];

    const updatedScores = applyScore(scores, winner.id, loser.id);
    const nextRounds = rounds + 1;
    const learningLog: ComparisonLogEntry = { winnerTitle: winner.title, loserTitle: loser.title };

    setDeck(newDeck);
    setScores(updatedScores);
    setRounds(nextRounds);
    setLog((prev) => [...prev, learningLog]);
    setToast(`Noted: ${winner.title} is leading the vibe.`);

    const { leader, margin } = rankLeaders(updatedScores, newDeck);
    const ready =
      Boolean(leader) &&
      nextRounds >= MIN_ROUNDS &&
      (margin >= 2 || (nextRounds >= MIN_ROUNDS + OVERTIME_ROUNDS && margin >= 1));

    if (ready && leader) {
      setFinalCandidate(leader);
      setStatus('decision');
    } else {
      setFinalCandidate(null);
      setStatus('picking');
    }
  }

  function handleSkip() {
    if (!currentPair) return;
    const [first, second, ...rest] = deck;
    const newDeck = [...rest, first, second];
    setDeck(newDeck);
    setToast('Okay, grabbing a different matchup.');
    setLog((prev) => [
      ...prev,
      { winnerTitle: 'Skipped that pairing', loserTitle: `${first.title} vs ${second.title}`, skipped: true },
    ]);
  }

  function handleLock() {
    if (!finalCandidate) return;
    setFinalChoice(finalCandidate);
    setStatus('final');
    setToast(null);
  }

  function keepExploring() {
    setFinalCandidate(null);
    setStatus('picking');
    setToast('No rush. We’ll keep comparing.');
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-2xl shadow-rose-950/10 backdrop-blur dark:bg-slate-900/70 sm:p-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-500">Movie Claw</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
          Tell me the vibe. I’ll duel the movies until you crown tonight’s pick.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Choose a few cozy chips or jot a note. I’ll pull contenders, pit them head-to-head, and learn what you’re feeling.
        </p>
      </header>

      {summary && (
        <SummaryBar summary={selectionSummary} note={summary.note} onEdit={resetAll} />
      )}

      {(status === 'idle' || status === 'loading') && (
        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            {vibeGroups.map((group) => (
              <VibeGroup key={group.id} group={group} selected={selected} toggleChip={toggleChip} />
            ))}
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Optional note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g., We’re folding laundry, keep it light"
              className="min-h-24 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              maxLength={160}
            />
            <span className="text-xs text-slate-400">{note.length}/160 characters</span>
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={!canSubmit || status === 'loading'}
              className="inline-flex items-center justify-center rounded-full bg-rose-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? 'Gathering contenders…' : 'Find my movie'}
            </button>
            <button type="button" onClick={resetAll} className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Reset selection
            </button>
          </div>
        </form>
      )}

      {status === 'picking' && currentPair && (
        <ComparisonStage
          pair={currentPair}
          onChoose={handleChoice}
          onSkip={handleSkip}
          rounds={rounds}
          learningProgress={learningProgress}
          log={log}
        />
      )}

      {status === 'decision' && finalCandidate && (
        <DecisionStage movie={finalCandidate} onLock={handleLock} onKeepExploring={keepExploring} rounds={rounds} log={log} />
      )}

      {status === 'final' && finalChoice && <FinalStage movie={finalChoice} log={log} onRestart={resetAll} />}

      {toast && status === 'picking' && (
        <div className="rounded-2xl border border-rose-100/40 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 shadow-inner dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
          {toast}
        </div>
      )}
    </section>
  );
}

type VibeGroupProps = {
  group: (typeof vibeGroups)[number];
  selected: Set<VibeId>;
  toggleChip: (chip: VibeId) => void;
};

function VibeGroup({ group, selected, toggleChip }: VibeGroupProps) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-slate-100/80 bg-white/70 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
      <legend className="text-sm font-semibold uppercase tracking-widest text-slate-500">{group.title}</legend>
      {group.description && <p className="text-sm text-slate-500">{group.description}</p>}
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const isActive = selected.has(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleChip(option.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-rose-400 bg-rose-500/10 text-rose-600'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type SummaryBarProps = {
  summary: string[] | null;
  note?: string;
  onEdit: () => void;
};

function SummaryBar({ summary, note, onEdit }: SummaryBarProps) {
  if (!summary) return null;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-50">
      <div className="flex flex-wrap gap-2">
        {summary.map((label) => (
          <span key={label} className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-amber-700">
            {label}
          </span>
        ))}
        {note && <span className="text-xs text-amber-800">“{note}”</span>}
      </div>
      <button className="text-xs font-semibold uppercase tracking-widest" onClick={onEdit}>
        Start over
      </button>
    </div>
  );
}

type ComparisonStageProps = {
  pair: [Movie, Movie];
  onChoose: (id: number) => void;
  onSkip: () => void;
  rounds: number;
  learningProgress: number;
  log: ComparisonLogEntry[];
};

function ComparisonStage({ pair, onChoose, onSkip, rounds, learningProgress, log }: ComparisonStageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <div className="flex flex-1 items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-rose-400 transition-all"
              style={{ width: `${learningProgress * 100}%` }}
            />
          </div>
          <span>{rounds} comparisons in</span>
        </div>
        <span>Pick the one that feels closer.</span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {pair.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onChoose={() => onChoose(movie.id)} />
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
      >
        Neither of these
      </button>
      {log.length > 0 && <SessionLog log={log} />}
    </div>
  );
}

type MovieCardProps = {
  movie: Movie;
  onChoose: () => void;
};

function MovieCard({ movie, onChoose }: MovieCardProps) {
  const posterUrl = movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : undefined;
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-lg shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900/70">
      {posterUrl ? (
        <Image src={posterUrl} alt={movie.title} width={400} height={600} className="h-72 w-full rounded-2xl object-cover" loading="lazy" />
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
          No poster
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          {movie.title}{' '}
          <span className="text-base text-slate-500">({movie.releaseYear})</span>
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-h-24 overflow-hidden">
          {movie.overview || 'No synopsis available.'}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {movie.genres.map((genre) => (
            <span key={genre} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              {genre}
            </span>
          ))}
        </div>
      </div>
      <button
        className="mt-auto rounded-full bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 dark:bg-rose-500/80 hover:dark:bg-rose-500"
        onClick={onChoose}
      >
        Pick this one
      </button>
    </article>
  );
}

type SessionLogProps = {
  log: ComparisonLogEntry[];
};

function SessionLog({ log }: SessionLogProps) {
  if (!log.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Session log</p>
      <ul className="space-y-1">
        {log.slice(-6).map((entry, index) => (
          <li key={`${entry.winnerTitle}-${index}`}>
            {entry.skipped ? (
              <span className="text-slate-400">Skipped {entry.loserTitle}</span>
            ) : (
              <>
                {entry.winnerTitle}
                <span className="mx-1 text-slate-400">beat</span>
                {entry.loserTitle}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

type DecisionStageProps = {
  movie: Movie;
  onLock: () => void;
  onKeepExploring: () => void;
  rounds: number;
  log: ComparisonLogEntry[];
};

function DecisionStage({ movie, onLock, onKeepExploring, rounds, log }: DecisionStageProps) {
  const posterUrl = movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : undefined;
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-xl dark:border-emerald-500/20 dark:bg-emerald-500/10">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">We have a frontrunner</p>
      <div className="grid gap-4 md:grid-cols-[240px,1fr]">
        {posterUrl && <Image src={posterUrl} alt={movie.title} width={420} height={630} className="h-72 w-full rounded-2xl object-cover" />}
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-emerald-900 dark:text-emerald-100">{movie.title}</h2>
          <p className="text-sm text-emerald-800/90 dark:text-emerald-100/80">{movie.tagline || movie.overview}</p>
          <div className="flex flex-wrap gap-2 text-xs text-emerald-900/80">
            <span>{movie.releaseYear}</span>
            {movie.runtime && <span>{movie.runtime} min</span>}
            <span>{movie.voteAverage}★</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-emerald-600 px-4 py-2 text-white shadow-md shadow-emerald-600/40" onClick={onLock}>
              Lock it in
            </button>
            <button className="text-sm font-semibold text-emerald-800 underline" onClick={onKeepExploring}>
              Keep comparing
            </button>
          </div>
          <p className="text-xs text-emerald-900/70">{rounds} comparisons so far.</p>
        </div>
      </div>
      <SessionLog log={log} />
    </div>
  );
}

type FinalStageProps = {
  movie: Movie;
  log: ComparisonLogEntry[];
  onRestart: () => void;
};

function FinalStage({ movie, log, onRestart }: FinalStageProps) {
  const posterUrl = movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : undefined;
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-slate-900 bg-slate-900 p-6 text-white shadow-2xl">
      <p className="text-xs uppercase tracking-[0.4em] text-amber-200">Tonight’s pick</p>
      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        {posterUrl && (
          <Image src={posterUrl} alt={movie.title} width={440} height={660} className="h-80 w-full rounded-3xl object-cover" />
        )}
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold">{movie.title}</h2>
          <p className="text-sm text-slate-300">{movie.tagline || movie.overview}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200">
            <span>{movie.releaseYear}</span>
            {movie.runtime && <span>{movie.runtime} min</span>}
            <span>{movie.voteAverage} ★</span>
          </div>
          <button
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(`${movie.title} (${movie.releaseYear})`);
              }
            }}
          >
            Copy title to share
          </button>
          <button className="text-sm font-semibold underline" onClick={onRestart}>
            Start a new session
          </button>
        </div>
      </div>
      <SessionLog log={log} />
    </div>
  );
}

function createScoreMap(movies: Movie[]) {
  return movies.reduce<Record<number, { wins: number; losses: number }>>((acc, movie) => {
    acc[movie.id] = { wins: 0, losses: 0 };
    return acc;
  }, {});
}

function applyScore(
  scores: Record<number, { wins: number; losses: number }>,
  winnerId: number,
  loserId: number
) {
  return {
    ...scores,
    [winnerId]: {
      wins: (scores[winnerId]?.wins ?? 0) + 1,
      losses: scores[winnerId]?.losses ?? 0,
    },
    [loserId]: {
      wins: scores[loserId]?.wins ?? 0,
      losses: (scores[loserId]?.losses ?? 0) + 1,
    },
  };
}

function rankLeaders(scores: Record<number, { wins: number; losses: number }>, movies: Movie[]) {
  const entries = Object.entries(scores).map(([id, value]) => ({
    id: Number(id),
    score: value.wins - value.losses,
    wins: value.wins,
  }));
  const sorted = entries
    .sort((a, b) => {
      if (b.score === a.score) {
        return b.wins - a.wins;
      }
      return b.score - a.score;
    })
    .slice(0, 2);
  const leader = sorted[0] ? movies.find((movie) => movie.id === sorted[0].id) ?? null : null;
  const margin =
    sorted.length === 2 ? sorted[0].score - sorted[1].score : sorted[0]?.score ?? 0;
  return { leader, margin };
}

function shuffleMovies(movies: Movie[]) {
  const copy = [...movies];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
