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
- React Router
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

