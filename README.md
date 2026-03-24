# Review Intelligence - Automated Version

This is the upgraded version of the MVP. It is designed for **full automation**:
- server fetches businesses from Google and Yelp automatically
- server fetches review excerpts automatically
- server runs AI summarization automatically when `OPENAI_API_KEY` is present
- one-click UI for users
- batch endpoint for scheduled jobs
- cron endpoint for recurring automatic market scans
- Docker support for one-command deployment

## What this solves
You said you do **not** want to manually look up businesses or copy reviews. This version is built for that. The user enters a service and city, and the app does the rest.

## What still requires credentials
No system can legally and reliably pull live data from Google and Yelp without credentials. So this app still needs:

- `GOOGLE_MAPS_API_KEY`
- `YELP_API_KEY`
- `OPENAI_API_KEY` for AI summarization

That is the only real blocker. Without keys, the app cannot access live data.

## Quick start
1. Copy `.env.example` to `.env.local`
2. Fill in the API keys
3. Run:

```bash
npm install
npm run dev
```

Or use Docker:

```bash
docker compose up --build
```

## Endpoints
- `POST /api/analyze` -> one search
- `POST /api/batch-analyze` -> run multiple searches automatically
- `GET /api/cron` -> trigger default scheduled jobs with token auth

## Default cron jobs
- snow removal in Laval
- lawn care in Laval

## What this version adds
- AI summarization using OpenAI structured output
- batch automation
- cron trigger
- Dockerfile and compose
- `.env.example`

## Next real upgrade
If you want this production-grade after keys are added, the next step is:
1. persistent database
2. scheduled background worker
3. saved histories and comparison pages
4. stronger entity resolution
5. more sources
