# Fahim SOC Simulator

A realistic, instructor-friendly SOC training simulator that combines:

- Cisco Secure Endpoint (AMP-style workflow)
- Cisco XDR (investigation graph + SHA pivots)
- Microsoft Defender XDR (incidents, explorer, hunting, assets, cloud/identity views)

Built for hands-on classroom practice with rich dummy data and interactive analyst workflows.

## Highlights

- Role-based login landing page (`Admin` and `Student`)
- AMP incident triage flow (`Begin Work` -> `In Progress` -> `Resolved`)
- XDR investigation with hash lookup and incident-linked context
- Defender XDR-style navigation with multi-workload experience
- Email Explorer lab with phishing dataset, preview, trace, quarantine, restore
- Instructor-only Notepad with:
  - rich text editing
  - red marker annotation mode
  - quick tools (template presets, save/load templates, class reset, restore phishing emails)

## Tech Stack

- React + TypeScript
- Vite
- React Router (`HashRouter` for static hosting — URLs use `#`, e.g. `…/fahimsocsimulator/#/inbox`, so refresh on any route works on GitHub Pages)
- CSS (custom styling)

## Run Locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Environment variables (SOC Tutor)

**Why a proxy:** Browsers block direct calls to `api.openai.com` (CORS). Putting `VITE_OPENAI_API_KEY` in the build does **not** make live chat work on the public site. Use a tiny HTTPS proxy that holds your OpenAI key server-side.

### Local development

1. Copy `.env.example` to `.env`.
2. Set **`OPENAI_API_KEY=sk-...`** (recommended — not embedded in the client) **or** `VITE_OPENAI_API_KEY=...` (used only by the Vite dev proxy).
3. Run `npm run dev`. The app calls same-origin `/__openai/v1/...`; Vite forwards to OpenAI with your key.

### GitHub Pages (production)

1. Deploy **`workers/tutor-proxy.mjs`** to [Cloudflare Workers](https://developers.cloudflare.com/workers/) (see `wrangler.toml`). Store the API key on the worker: `wrangler secret put OPENAI_API_KEY`.
2. Note the worker URL, e.g. `https://fahim-soc-tutor.<subdomain>.workers.dev`.
3. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables** → **New repository variable**. Name: **`VITE_TUTOR_API_URL`**, value: your worker URL (no trailing slash required).
4. Push or re-run **Deploy to GitHub Pages** so `npm run build` picks up the variable.

`.env` stays **gitignored**; the worker secret lives in Cloudflare, not in the repo.

## Backend + shared classroom memory

The app can run in two modes:

- **Local-only mode:** if `VITE_API_BASE_URL` is empty, the simulator keeps using browser storage so demos still work.
- **Shared classroom mode:** if `VITE_API_BASE_URL` points to the Cloudflare Worker, students, scenarios, activity, grades, XDR response actions, AMP lab state, Defender lab state, and instructor notepad state sync through Cloudflare D1.

### Free Cloudflare D1 setup

1. Log in to Cloudflare Wrangler:

```bash
npx wrangler login
```

2. Create the small SQLite database:

```bash
npx wrangler d1 create fahim-soc-classroom
```

3. Copy the printed `database_id` into `wrangler.toml`.

4. Apply the schema:

```bash
npx wrangler d1 migrations apply fahim-soc-classroom --remote
```

5. Deploy the Worker:

```bash
npx wrangler deploy
```

6. In GitHub repo **Settings → Secrets and variables → Actions → Variables**, set:

```text
VITE_API_BASE_URL=https://<your-worker>.workers.dev
VITE_TUTOR_API_URL=https://<your-worker>.workers.dev/v1/tutor
```

7. Re-run **Deploy to GitHub Pages**.

### What the backend stores

- Student roster and classroom profiles
- Instructor-published scenarios
- Student activity feed
- Grades and instructor comments
- XDR response action ledger
- Shared AMP incident/work state
- Defender email lab state, blocked domains, and investigations
- Instructor notepad body and saved templates

This is intentionally small and classroom-friendly. It is not enterprise auth; it is a lightweight shared memory layer for a handful of students.

## Project Structure

- `src/pages/` - main simulator pages (AMP, XDR, Defender, Notepad, Landing)
- `src/components/` - reusable UI components and floating buttons
- `src/data/` - mock datasets and simulator seed data
- `src/styles/` - global and module styles
- `src/layouts/` - shared layouts for AMP/XDR/Defender shells

## Training Notes

- This project is intentionally simulation-only and uses dummy data.
- It is designed for SOC teaching labs, demonstrations, and student practice.

## License

For educational/internal training use.

