# SaikiScio

SaikiScio is a responsive skill-improvement website built with React, TypeScript, Vite, and Tailwind CSS. It helps users discover skills they want to grow, complete a guided assessment, and receive a personalized learning path tailored to their goals, time, and preferred learning style.

## Features

- Warm, engaging landing page
- Multi-step interactive assessment
- Personalized three-week plan generated in the browser from selected skills, the learner's written goal, confidence ratings, preferred learning formats, and weekly time
- Check-in answers, lesson notes, and activity progress saved in the current browser so learners can return later
- Optional local PostgreSQL persistence through a localhost-only Node API
- Email/password registration and sign-in, secure server-side sessions, account progress sync, password changes, and account deletion
- Built-in short lessons, hands-on projects, reading, video-style walkthroughs, and guided practice for each skill
- Dedicated Terms, Privacy, and Cookie & Storage pages
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

Create an account from the **Sign in** link. Passwords must contain at least 6 characters and are hashed with Node's scrypt; the session cookie is HttpOnly and SameSite. The prototype currently has no email verification or email-based password reset.

## Production build

```bash
npm run build
```

## GitHub Pages deployment

This app is configured with `base: "./"` for static hosting compatibility.

To deploy on GitHub Pages, build the project and publish the generated `dist` folder from a GitHub Pages branch or via GitHub Actions.

## Notes

The repo is configured locally for a project called "SaikiScio". To push to GitHub, authenticate with GitHub in your environment and run:

```bash
git push -u origin main
```

## Privacy and saved learning

Check-in answers, learning preferences, lesson notes, and progress are stored in browser local storage and, when signed in, in PostgreSQL under the account. Account sessions use a local HttpOnly cookie. The API binds to `127.0.0.1` for development only. Do not expose it to the internet or use it for real users without HTTPS, rate-limit storage shared across API instances, email verification and recovery, production secret management, backups, monitoring, and a reviewed privacy/legal program. No analytics, advertising, or hosted AI service is currently used.

## Local PostgreSQL API

1. Copy `.env.example` to `.env` and set `PGPASSWORD` to the local password for `saikiscio_app`. Keep `.env` private; it is ignored by Git.
2. In one terminal, run `npm run dev:api`. The API initializes the account, session, and progress tables from `server/schema.sql` on startup.
3. In another terminal, run `npm run dev` and open the Vite URL. Vite proxies `/api` requests to the local API.
4. Check `http://127.0.0.1:3001/api/health` for a database connection check.

The `server/schema.sql` file creates `users`, `sessions`, and `account_progress`. Account data is stored as JSONB per user. `learning_progress` from the anonymous prototype is left intact; browser-local progress is copied into a new account on first registration/sign-in if that account has no saved plan.

Keep `npm run dev:api` running while using account sync. If the website reports that account sync is unavailable, start that command in a terminal and choose **Retry account sync**; your browser-saved learning remains available while the local API is offline.
