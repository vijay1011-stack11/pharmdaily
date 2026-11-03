# PharmDaily

Free diagram-based pharmacology notes, flashcards and MCQs for BDS students. Built with Astro as a static site; notes pages ship no JavaScript beyond the tab switcher.

## Commands

```sh
npm install
npm run content        # regenerate content/ from content-source/
npm run dev            # local dev server
npm run build          # static build into dist/
npm run check:content  # every notes phrase is on the built page; card/MCQ counts match
npm run check:security # CSP hashes match dist/, headers present, no source maps/source files/external loads
npm run preview        # serve dist/ on :4321, then:
npm run check:pages    # Playwright: 390px + 1280px, light + dark, overflow, tap targets, flashcard/MCQ flows
```

## How it fits together

- `content-source/`: reviewer-approved source pages. `scripts/extract-content.mjs` copies their notes, flashcards and MCQs verbatim into `content/section-<n>/<topic>/`.
- `src/lib/content.ts` loads `content/` at build time, turns drug lists into chips and places diagrams according to `src/lib/diagram-map.ts`.
- `src/components/diagrams/`: one inline-SVG component per diagram, coloured through CSS variables so it works in light and dark.
- A diagram may replace a block of notes only if it carries the same words; `check:content` fails the build otherwise.
