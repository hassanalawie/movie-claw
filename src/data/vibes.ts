export type VibeRule = {
  addGenres?: number[];
  excludeGenres?: number[];
  voteAverage?: { min?: number; max?: number };
  runtime?: { min?: number; max?: number };
  releaseYear?: { min?: number; max?: number };
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';
};

export type VibeOption = {
  id: VibeId;
  label: string;
  description: string;
  rules?: VibeRule;
};

export type VibeGroup = {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  options: VibeOption[];
};

export type VibeId =
  | 'background-friendly'
  | 'fully-engaged'
  | 'cozy-heart'
  | 'witty-banters'
  | 'mind-bending'
  | 'adventure-mode'
  | 'nostalgic-night'
  | 'slow-energy'
  | 'steady-energy'
  | 'high-energy';

export const vibeGroups: VibeGroup[] = [
  {
    id: 'attention',
    title: 'Attention level',
    description: 'How locked-in are you tonight? Pick at least one.',
    required: true,
    options: [
      {
        id: 'background-friendly',
        label: 'Background-friendly',
        description: 'Easy to follow while multitasking.',
        rules: {
          sortBy: 'popularity.desc',
          voteAverage: { max: 7.4 },
        },
      },
      {
        id: 'fully-engaged',
        label: 'Fully engaged',
        description: 'We want something rich and rewarding.',
        rules: {
          sortBy: 'vote_average.desc',
          voteAverage: { min: 7 },
          runtime: { min: 95 },
        },
      },
    ],
  },
  {
    id: 'tone',
    title: 'Tone & mood',
    description: 'Layer on the vibe you’re craving.',
    options: [
      {
        id: 'cozy-heart',
        label: 'Cozy & heartwarming',
        description: 'Gentle stakes, comfy endings.',
        rules: {
          addGenres: [35, 18, 10749, 10751],
        },
      },
      {
        id: 'witty-banters',
        label: 'Clever & witty',
        description: 'Smart banter, maybe a caper.',
        rules: {
          addGenres: [35, 80],
          voteAverage: { min: 6.5 },
        },
      },
      {
        id: 'mind-bending',
        label: 'Mind-bending',
        description: 'Twisty sci-fi or elevated thrillers.',
        rules: {
          addGenres: [878, 9648, 53],
          voteAverage: { min: 6.7 },
        },
      },
      {
        id: 'adventure-mode',
        label: 'Adventurous',
        description: 'Epic journeys and stylish action.',
        rules: {
          addGenres: [12, 14, 28],
        },
      },
      {
        id: 'nostalgic-night',
        label: 'Nostalgic night',
        description: 'Older favorites and classics.',
        rules: {
          releaseYear: { max: 2010 },
        },
      },
    ],
  },
  {
    id: 'energy',
    title: 'Energy',
    description: 'How lively should it feel?',
    options: [
      {
        id: 'slow-energy',
        label: 'Low & slow',
        description: 'Let it simmer; nothing frantic.',
        rules: {
          runtime: { min: 110 },
          excludeGenres: [28, 27],
        },
      },
      {
        id: 'steady-energy',
        label: 'Even keel',
        description: 'Balanced pacing.',
      },
      {
        id: 'high-energy',
        label: 'High energy',
        description: 'Keep the adrenaline up.',
        rules: {
          addGenres: [28, 53],
          runtime: { max: 130 },
        },
      },
    ],
  },
];

export const vibeOptionMap = vibeGroups
  .flatMap((group) => group.options)
  .reduce<Record<VibeId, VibeOption>>((acc, option) => {
    acc[option.id] = option;
    return acc;
  }, {} as Record<VibeId, VibeOption>);
