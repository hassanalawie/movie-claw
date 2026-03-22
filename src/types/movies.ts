export type Movie = {
  id: number;
  title: string;
  overview: string;
  releaseYear: string;
  posterPath: string;
  voteAverage: number;
  voteCount: number;
  runtime: number | null;
  genres: string[];
  tagline: string;
};

export type ComparisonLogEntry = {
  winnerTitle: string;
  loserTitle: string;
};
