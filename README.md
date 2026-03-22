# Movie Claw

A cozy “Tinder for movie night” web app: describe the vibe (attention level, tone, energy) and Movie Claw fetches contenders from TMDb, pits them head‑to‑head, learns what you like, and surfaces a final pick you can lock in.

https://github.com/hassanalawie/movie-claw

## Features

- Multi-select vibe chips plus optional freeform note to capture intent without heavy typing
- Server-side TMDb integration (API key stays on the server)
- Pairwise comparison loop with progress meter, session log, and adaptive scoring
- Decision-ready state that highlights the current frontrunner and lets you keep exploring or lock it in
- Finale card for sharing / restarting sessions
- Cozy, couch-friendly UI (large tap targets, warm palette, single-page flow)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # drop in your TMDb API key
npm run dev
```

Then open <http://localhost:3000>.

## Environment variables

- `TMDB_API_KEY` – required. Get one at <https://www.themoviedb.org/settings/api>. Keep it in `.env.local` (already gitignored).

## Development scripts

- `npm run dev` – start Next.js dev server
- `npm run lint` – run ESLint
- `npm run build` – production build

## Deployment

Deploy straight to Vercel:

```bash
vercel --prod
```

Make sure the `TMDB_API_KEY` is configured as an encrypted environment variable in your hosting provider before promoting to production.

## Credits & notes

This product uses the TMDb API but is not endorsed or certified by TMDb.
