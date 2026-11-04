# PharmDaily

Free pharmacology revision site for BDS (dental) and MBBS students. Every topic is written for both courses. Diagram notes, flashcards and MCQs, built on KD Tripathi's *Essentials of Medical Pharmacology*.

- **Developer:** Vijay. Also a portfolio project for his MS application, so commit history and code quality matter.
- **Content reviewer:** a BDS 3rd-year student. She checks everything on her phone. Nothing goes live without her approval.

## v1 scope. Do not add anything beyond this without asking Vijay.

- No sign-in, no accounts, no database. Notes are static files in this repo.
- No custom domain yet. Use the free `*.vercel.app` address.
- Free and non-commercial: no ads, no payments. (Required by the Vercel Hobby plan.)
- Flashcard and MCQ progress is saved only in the student's browser (`localStorage`, wrapped in try/catch).
- A simple privacy policy page: no accounts, no cookies, cookieless anonymous analytics only.

## Tech

- **Astro**, static output, deployed on Vercel Hobby. Chosen because it ships zero JavaScript by default: notes pages must load fast on cheap Android phones on mobile data. Only flashcards and MCQs need client JS (small Astro islands or plain `<script>`; no React unless there's a real need).
- Content lives in `content/` as plain files (see below). Pages are generated from it; never hand-write a topic page.
- Analytics: Vercel Web Analytics (cookieless). Nothing else that tracks users.
- Node 22+.

## Repo layout

```
content-source/                 # the reviewer-approved source files (e.g. pharmdaily-section1-final.html). Never edit content by hand elsewhere.
content/section-<n>/<topic-slug>/   # generated from content-source/; do not hand-edit
  notes.html        # the topic's notes markup
  flashcards.json   # [{ "q": "...", "a": "..." }]
  mcq.json          # [{ "q", "options": [4], "answer": <index>, "explanation" }]
content/section-<n>/review-flags.json   # reviewer's open questions, if any; delete once all are resolved
```

## Site structure (v1)

- `/` Home: hero, list of all 14 sections (live ones link, others say "Soon"), how a topic works, footer.
- `/section-1/` Section page: its topics.
- `/section-1/<topic>/` Topic: Notes / Flashcards / MCQs as three tabs on one page.
- `/privacy/`, `/about/`.

## Design rules

All visual design (colours, type, layout, components, motion) comes from the `ui-ux-pro-max` skill. Use it when building or changing any UI. These functional rules always apply:

- Phone-first. Design at 390px wide, then scale up. No horizontal scroll on phone, ever.
- Diagrams stack vertically on small screens. Never shrink a wide diagram until it's unreadable.
- Tap targets at least 44px. Inputs 16px (no iOS zoom).
- Respect `prefers-reduced-motion`.
- Dental "For your clinic" points stay visually distinct from the rest of the notes.

## Content rules

- Sources: the reviewer's college notes first; checked against KD Tripathi.
- Never copy textbook text or figures. Rewrite in plain words and redraw all diagrams.
- Anything added from the textbook (not in her notes) carries the `KDT` tag. Anything uncertain or conflicting gets a review flag. Never guess a fact.
- Per topic: at least 10 flashcards and at least 10 MCQs (4 options, one short explanation); larger topics may have more.
- Build every topic for both BDS and MBBS: one shared core, an "MBBS extras" box where MBBS needs more depth, and dental relevance (local anaesthetics, analgesics, antimicrobials) marked "For your clinic". MBBS extras need an MBBS reviewer's approval before going live.
- Before a topic goes live: its review flags are resolved and the reviewer has approved it. In the live site, hide the `KDT` tags and the review UI (they're for review copies only), unless Vijay says otherwise.

## Section order

1 General Pharmacology · 2 ANS · 3 Autacoids and NSAIDs · 4 Respiratory · 5 Hormones · 6 Peripheral NS (Local Anaesthetics) · 7 CNS · 8 CVS · 9 Kidney · 10 Blood · 11 GI · 12 Antimicrobials · 13 Anticancer · 14 Miscellaneous

## Workflow

1. New topic content is drafted and reviewed outside this repo (Claude chat, as a phone review link).
2. Approved source files are added here under `content-source/`, and `content/` is regenerated from them.
3. Build, check at 390px and 1280px, push. Vercel deploys automatically.

## Security

- No secrets in the repo, ever. `.env*` is gitignored; v1 needs no keys at all.
- Never render user input as HTML. Only reviewer-approved build-time content goes through `set:html`; anything from the browser (localStorage, URL, hash) is read as data and written with `textContent`.
- Security headers live in `vercel.json`; keep them. The CSP allows inline scripts only by sha256 hash, so after changing an `is:inline` script, run `node scripts/check-security.mjs --hashes` and update `script-src`. `npm run check:security` fails on any mismatch, and `check:pages` enforces the CSP in the browser.
- Before each release: `npm audit` (fix anything found), `npm run build`, `npm run check:security`.
- Any future feature that adds login, a database or an API needs a security review before it's built.

## Working style for Claude in this repo

- Be direct. Tell Vijay when he's wrong. One clear recommendation, not a menu.
- Small, meaningful commits with clear messages.
- Before calling UI work done, check it at phone width (Playwright is fine) and say what still needs a real phone.
