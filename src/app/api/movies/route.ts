import { NextRequest, NextResponse } from 'next/server';
import { vibeOptionMap, type VibeId } from '@/data/vibes';
import type { Movie } from '@/types/movies';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const MIN_VOTE_COUNT = 200;
const MAX_RESULTS = 16;

const genreNames: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

type DiscoverFilters = {
  addGenres: Set<number>;
  excludeGenres: Set<number>;
  voteAverage: { min?: number; max?: number };
  runtime: { min?: number; max?: number };
  releaseYear: { min?: number; max?: number };
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';
};

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
};

type TmdbDetail = {
  id: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing TMDB_API_KEY. Add it to .env.local.' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const chips = (body?.chips ?? []) as VibeId[];
  const note = typeof body?.note === 'string' ? body.note.slice(0, 160) : '';

  if (!Array.isArray(chips) || chips.length === 0) {
    return NextResponse.json(
      { error: 'Pick at least one vibe before searching.' },
      { status: 400 }
    );
  }

  const filters = mergeVibeRules(chips);

  try {
    const discoverResults = await fetchDiscover(filters, apiKey);
    const noteResults = note ? await fetchSearch(note, apiKey) : [];

    let combined = dedupeById([...noteResults, ...discoverResults])
      .filter((movie) => Boolean(movie.poster_path) && movie.vote_count >= MIN_VOTE_COUNT)
      .slice(0, MAX_RESULTS);

    if (combined.length === 0) {
      const fallback = await fetchPopular(apiKey);
      combined = fallback.slice(0, MAX_RESULTS);
    }

    if (combined.length === 0) {
      return NextResponse.json({ movies: [] });
    }

    const detailed = await enrichMovies(combined, apiKey);

    return NextResponse.json({ movies: detailed });
  } catch (error) {
    console.error('[tmdb-error]', error);
    return NextResponse.json({ error: 'Something went wrong fetching movies.' }, { status: 500 });
  }
}

function mergeVibeRules(chips: VibeId[]): DiscoverFilters {
  return chips.reduce<DiscoverFilters>(
    (acc, chip) => {
      const rules = vibeOptionMap[chip]?.rules;
      if (!rules) return acc;

      rules.addGenres?.forEach((g) => acc.addGenres.add(g));
      rules.excludeGenres?.forEach((g) => acc.excludeGenres.add(g));

      if (rules.voteAverage?.min) {
        acc.voteAverage.min = Math.max(acc.voteAverage.min ?? 0, rules.voteAverage.min);
      }
      if (rules.voteAverage?.max) {
        acc.voteAverage.max = Math.min(acc.voteAverage.max ?? 10, rules.voteAverage.max);
      }

      if (rules.runtime?.min) {
        acc.runtime.min = Math.max(acc.runtime.min ?? 0, rules.runtime.min);
      }
      if (rules.runtime?.max) {
        acc.runtime.max = Math.min(acc.runtime.max ?? Infinity, rules.runtime.max);
      }

      if (rules.releaseYear?.min) {
        acc.releaseYear.min = Math.max(acc.releaseYear.min ?? 1900, rules.releaseYear.min);
      }
      if (rules.releaseYear?.max) {
        acc.releaseYear.max = Math.min(acc.releaseYear.max ?? new Date().getFullYear(), rules.releaseYear.max);
      }

      if (rules.sortBy) {
        acc.sortBy = rules.sortBy;
      }

      return acc;
    },
    {
      addGenres: new Set<number>(),
      excludeGenres: new Set<number>(),
      voteAverage: {},
      runtime: {},
      releaseYear: {},
    }
  );
}

async function fetchDiscover(filters: DiscoverFilters, apiKey: string) {
  const searchParams = new URLSearchParams({
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    sort_by: filters.sortBy ?? 'popularity.desc',
    'vote_count.gte': String(MIN_VOTE_COUNT),
    page: '1',
    api_key: apiKey,
  });

  if (filters.addGenres.size) {
    searchParams.set('with_genres', Array.from(filters.addGenres).join(','));
  }
  if (filters.excludeGenres.size) {
    searchParams.set('without_genres', Array.from(filters.excludeGenres).join(','));
  }
  if (filters.voteAverage.min) {
    searchParams.set('vote_average.gte', filters.voteAverage.min.toString());
  }
  if (filters.voteAverage.max && filters.voteAverage.max < 10) {
    searchParams.set('vote_average.lte', filters.voteAverage.max.toString());
  }
  if (filters.runtime.min) {
    searchParams.set('with_runtime.gte', filters.runtime.min.toString());
  }
  if (filters.runtime.max && filters.runtime.max < Infinity) {
    searchParams.set('with_runtime.lte', filters.runtime.max.toString());
  }
  if (filters.releaseYear.min) {
    searchParams.set('primary_release_date.gte', `${filters.releaseYear.min}-01-01`);
  }
  if (filters.releaseYear.max) {
    searchParams.set('primary_release_date.lte', `${filters.releaseYear.max}-12-31`);
  }

  const res = await fetch(`${TMDB_API_BASE}/discover/movie?${searchParams.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`TMDb discover error: ${res.status}`);
  }

  const data = await res.json();
  return data.results as TmdbMovie[];
}

async function fetchSearch(query: string, apiKey: string) {
  const searchParams = new URLSearchParams({
    include_adult: 'false',
    language: 'en-US',
    page: '1',
    query,
    api_key: apiKey,
  });

  const res = await fetch(`${TMDB_API_BASE}/search/movie?${searchParams.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results as TmdbMovie[];
}

async function fetchPopular(apiKey: string) {
  const params = new URLSearchParams({
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    sort_by: 'popularity.desc',
    'vote_count.gte': '300',
    page: '1',
    api_key: apiKey,
  });

  const res = await fetch(`${TMDB_API_BASE}/discover/movie?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results as TmdbMovie[];
}

function dedupeById(movies: TmdbMovie[]) {
  const seen = new Set<number>();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

async function enrichMovies(movies: TmdbMovie[], apiKey: string): Promise<Movie[]> {
  const limited = movies.slice(0, MAX_RESULTS);
  const enriched = await Promise.all(
    limited.map(async (movie) => {
      const details = await fetchMovieDetail(movie.id, apiKey);
      return transformMovie(movie, details);
    })
  );
  return enriched;
}

async function fetchMovieDetail(id: number, apiKey: string): Promise<TmdbDetail> {
  const searchParams = new URLSearchParams({ api_key: apiKey });
  const res = await fetch(`${TMDB_API_BASE}/movie/${id}?${searchParams.toString()}`, {
    next: { revalidate: 24 * 60 * 60 },
  });
  if (!res.ok) {
    return { id, runtime: null, genres: [], tagline: '' };
  }
  return (await res.json()) as TmdbDetail;
}

function transformMovie(movie: TmdbMovie, detail: TmdbDetail): Movie {
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : '—';
  const genres = (detail.genres?.length ? detail.genres : movie.genre_ids.map((id) => ({ id, name: genreNames[id] })))
    .filter(Boolean)
    .map((g) => g.name)
    .slice(0, 3);

  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    releaseYear,
    posterPath: movie.poster_path ?? '',
    voteAverage: Number(movie.vote_average.toFixed(1)),
    voteCount: movie.vote_count,
    runtime: detail.runtime,
    genres,
    tagline: detail.tagline ?? '',
  };
}
