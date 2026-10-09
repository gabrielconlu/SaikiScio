# SaikiScio

SaikiScio is a responsive skill-improvement website built with React, TypeScript, Vite, and Tailwind CSS. It helps users discover skills they want to grow, complete a guided assessment, and receive a personalized learning path tailored to their goals, time, and preferred learning style.

## Features

- Warm, engaging landing page
- Multi-step interactive assessment
- One skill per roadmap, with separate saved plans learners can switch between without losing their answers or progress
- Personalized three-week plan generated in the browser from selected skills, the learner's written goal, confidence ratings, preferred learning formats, and weekly time
- Check-in answers, lesson notes, and activity progress saved in the current browser so learners can return later
- PostgreSQL persistence through a local Node API in development or a Vercel Node.js function in deployment
- Email/password registration and sign-in, secure server-side sessions, account progress sync, password changes, and account deletion
- Local-only email verification and password recovery with a demo inbox; no email is sent
- Built-in short lessons, hands-on projects, reading, video-style walkthroughs, and guided practice for each skill
- Dedicated Terms, Privacy, and Cookie & Storage pages
- Optional AI-generated, domain-adaptive roadmaps through Google AI Studio (API key stays on the local server)
- Interactive roadmaps with a next-step guide, combined progress tracking, saved action reflections, milestone check-ins, and a completable practice routine
- Branching scenario challenges, weekly mini-quests that rotate by week and adapt to the selected skill, goal, confidence, and AI roadmap, plus saved reflections/history and explanatory lesson quizzes
- Responsive design for desktop, tablet, and mobile
- Accessible controls and clear user flow
- Local browser storage remains available if PostgreSQL is not connected
- No analytics, advertising, or third-party video is used; signed-in accounts use an essential HttpOnly session cookie

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Getting started

1. Install Node.js LTS from https://nodejs.org/
2. Open the project folder in a terminal
3. Install dependencies:

```bash
npm install
```

4. In one terminal, start the local Node API and keep it running:

```bash
npm run dev:api
```

5. In another terminal, start the website:

```bash
npm run dev
```

6. Open the local URL shown in the terminal (typically http://localhost:5173). The Vite development server proxies `/api` requests to the local API.

Create an account from the **Sign in** link. Passwords must contain at least 6 characters and are hashed with Node's scrypt; the session cookie is HttpOnly and SameSite. On Vercel, account registration and sign-in work without email verification. Password recovery is unavailable until an email provider is configured, so users should keep their password safe. Locally, the API provides a **Demo inbox** (`/dev-mail`) for previewing one-time verification and reset links without sending email. Its messages are held in API memory and clear when the API restarts. Do not deploy or expose this inbox publicly.

## Production build

```bash
npm run build
```

## Deploy to Vercel

The repository includes a Vercel Node.js function at `api/[...path].mjs` for the existing `/api/*` routes and a single-page-app fallback for React Router. Vercel serves the frontend and API from the same origin; local PostgreSQL and the local API process are not used in production.

1. Create a managed PostgreSQL database (for example, through a Vercel Marketplace integration or another hosted PostgreSQL provider). Use its TLS-enabled connection string, preferably its serverless/pooled connection URL when offered.
2. Before deploying, set `DATABASE_URL` in your terminal to the hosted database's TLS-enabled connection string and run `npm run db:setup` once. This applies the idempotent `server/schema.sql`; the script refuses to run without an explicit `DATABASE_URL`, so it will not accidentally apply a production schema to your local database. Do not expose database credentials in the browser or commit them.
3. Import this Git repository into Vercel. Use the repository root, Node.js 20 or newer, build command `npm run build`, and output directory `dist`. `vercel.json` supplies these build and routing settings.
4. Add these Environment Variables in Vercel for every environment you intend to use:
   - `DATABASE_URL`: the hosted PostgreSQL connection string.
   - `GEMINI_API_KEY`: a Google AI Studio key. Keep it server-side.
   - `GEMINI_MODEL`: optional; defaults to `gemini-3.5-flash`.
   - `SITE_ORIGINS`: optional comma-separated trusted origins when the browser frontend is on a different origin. Same-origin Vercel deployments derive and validate their origin automatically.
5. Deploy, then test `/api/health`, account registration, sign-in, saved-progress reload, sign-out, and AI roadmap generation on the deployed domain. Use separate Vercel Preview and Production databases/credentials when practical. Password recovery is unavailable until a real email provider is configured.

`DATABASE_URL` takes precedence over the local `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` settings. The API limits its PostgreSQL pool to one connection per Vercel function instance. Apply the schema before the first database-backed request. If the database password contains shell-special characters, set `DATABASE_URL` through your terminal's environment-variable UI rather than typing it into a command that may be saved in shell history.

**Deployment is not the same as public-launch readiness.** Production accounts can be created without email verification, but password recovery cannot send a reset email. Before relying on accounts for real users, configure a transactional email provider and sending domain. In-memory sign-in and roadmap rate limits are not shared between Vercel function instances. Also configure backups/monitoring and review the legal notices for your audience and jurisdiction. Never use the local development database or its credentials for deployment.

## GitHub Pages deployment

This app is configured with `base: "./"` for static hosting compatibility.

To deploy on GitHub Pages, build the project and publish the generated `dist` folder from a GitHub Pages branch or via GitHub Actions.

## Notes

The repo is configured locally for a project called "SaikiScio". To push to GitHub, authenticate with GitHub in your environment and run:

```bash
git push -u origin main
```

## Privacy and saved learning

Check-in answers, learning preferences, lesson notes, and progress are stored in browser local storage and, when signed in, in PostgreSQL under the account. When a learner requests a roadmap, the skill, explanation, and weekly availability are sent by the server to Google AI Studio. Account sessions use an HttpOnly cookie. The site requests typography from Google Fonts. No analytics or advertising is currently used.

## Local PostgreSQL API

1. Copy `.env.example` to `.env` and set `PGPASSWORD` to the local password for `saikiscio_app`. Keep `.env` private; it is ignored by Git.
2. In one terminal, run `npm run dev:api`. The API initializes the account, session, and progress tables from `server/schema.sql` on startup.
3. In another terminal, run `npm run dev` and open the Vite URL. Vite proxies `/api` requests to the local API.
4. Check `http://127.0.0.1:3001/api/health` for a database connection check.

The `server/schema.sql` file creates `users`, `sessions`, `auth_email_tokens`, and `account_progress`. Account data is stored as JSONB per user. Applying the schema to an existing database marks existing accounts as verified to avoid locking them out. New local-demo accounts verify through the demo inbox before sign-in; Vercel accounts are created without email verification. `learning_progress` from the anonymous prototype is left intact; browser-local progress is copied into a new account on first sign-in if that account has no saved plan.

Keep `npm run dev:api` running while using account sync. If the website reports that account sync is unavailable, start that command in a terminal and choose **Retry account sync**; your browser-saved learning remains available while the local API is offline.

## Google AI Studio roadmaps

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Put it in the private `.env` file as `GEMINI_API_KEY=...`. Never put this key in frontend code, commit it, or share it publicly. `.env` is ignored by Git.
3. Optionally set `GEMINI_MODEL` (defaults to `gemini-3.5-flash`), then restart `npm run dev:api`.
4. Submit a target skill and explanation in the check-in. The API sends those fields and weekly time to Google AI Studio and returns a validated roadmap with the four requested sections. Generated roadmaps are saved with learning progress.

The local API limits roadmap generation to 8 requests per IP per hour. This in-memory limit is best-effort and does not provide a global quota when deployed as serverless functions. Google AI Studio usage, quotas, data handling, model availability, and any charges are governed by your Google account and Google's current terms. Do not include sensitive personal information in skill explanations. Without an API key, built-in skills still show the local starter plan, while unsupported/custom skills show a setup error rather than fabricated domain advice.
