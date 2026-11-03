// Browser checks on the built site (needs `npm run preview` running on :4321).
// For every page at 390px and 1280px, light and dark:
//   - no horizontal scroll
//   - interactive elements at least 44px tall (reports offenders)
//   - full-page screenshot to screenshots/
// On topic pages also: recount flashcards and MCQs in the DOM, and exercise the tabs,
// a flashcard reveal and an MCQ answer.

import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

// `astro preview` doesn't apply vercel.json, so add its headers to every response here.
// That way the Content-Security-Policy is enforced and any violation fails the run.
const VERCEL_HEADERS = Object.fromEntries(
  JSON.parse(readFileSync('vercel.json', 'utf8')).headers.find((h) => h.source === '/(.*)').headers.map((h) => [h.key, h.value]),
);

const BASE = process.env.BASE ?? 'http://localhost:4321';
const PAGES = ['/', '/section-1/', '/section-1/routes-of-administration/', '/section-1/pharmacokinetics/', '/section-1/pharmacodynamics/', '/about/', '/privacy/', '/404'];
const SIZES = [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 800 }];
mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();
let problems = 0;
const say = (ok, msg) => { if (!ok) problems++; console.log(`${ok ? '✓' : '✗'} ${msg}`); };

for (const scheme of ['light', 'dark']) {
  for (const size of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, colorScheme: scheme, deviceScaleFactor: 1, hasTouch: size.name === 'phone' });
    await ctx.route('**/*', async (route) => {
      // Vercel serves the analytics script only in production; stand in for it so its load is still CSP-checked.
      if (new URL(route.request().url()).pathname.startsWith('/_vercel/insights/')) {
        return route.fulfill({ status: 200, contentType: 'text/javascript', body: '', headers: VERCEL_HEADERS });
      }
      const res = await route.fetch();
      await route.fulfill({ response: res, headers: { ...res.headers(), ...VERCEL_HEADERS } });
    });
    await ctx.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP blocked ${e.violatedDirective}: ${e.blockedURI || 'inline'}`));
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errors.push(m.text()));
    // The /404 page is meant to 404.
    page.on('response', (r) => {
      const u = new URL(r.url());
      if (r.status() >= 400 && u.pathname !== '/404') errors.push(`${r.status()} ${u.pathname}`);
    });

    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      const tag = `${scheme} ${size.name} ${path}`;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      say(overflow <= 0, `${tag}: horizontal overflow ${overflow}px`);

      if (size.name === 'phone' && scheme === 'light') {
        const small = await page.evaluate(() =>
          [...document.querySelectorAll('main a, main button, main summary, header a, footer a')]
            .filter((el) => el.offsetParent !== null)
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ el, r }) => r.height < 44 && !el.closest('.notes, .lede, .credit, .next, .page p'))
            .map(({ el, r }) => `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}" ${Math.round(r.height)}px`),
        );
        say(small.length === 0, `${tag}: tap targets under 44px: ${small.length ? small.join('; ') : 'none'}`);
      }

      const slug = path.replace(/\//g, '_') || 'home';
      await page.screenshot({ path: `screenshots/${scheme}-${size.name}${slug}.png`, fullPage: true });

      if (path.split('/').filter(Boolean).length === 2) {
        const counts = await page.evaluate(() => ({ cards: document.querySelectorAll('[data-card]').length, mcqs: document.querySelectorAll('[data-mcq]').length, figs: document.querySelectorAll('#notes figure').length }));
        if (scheme === 'light') console.log(`  ${size.name} ${path}: ${counts.cards} flashcards, ${counts.mcqs} MCQs, ${counts.figs} figures`);

        if (scheme === 'light' && size.name === 'phone') {
          await page.click('#tab-flashcards');
          const shown = await page.locator('#flashcards').isVisible();
          await page.locator('.fc-card.on .fc-face').click();
          const answerVisible = await page.locator('.fc-card.on .a').isVisible();
          await page.click('[data-act="got"]');
          const pos = await page.locator('[data-pos]').textContent();
          say(shown && answerVisible && pos === '2', `${path}: flashcards tab, reveal, "Got it" advances (now card ${pos})`);
          await page.screenshot({ path: `screenshots/light-phone${slug}flashcards.png` });

          await page.click('#tab-mcqs');
          const first = page.locator('[data-mcq]').first();
          await first.locator('.opt').nth(0).click();
          const res = await first.locator('[data-result]').textContent();
          const locked = await first.locator('.opt').nth(1).isDisabled();
          say(Boolean(res) && locked, `${path}: MCQ answer shows explanation and locks options`);
          await page.screenshot({ path: `screenshots/light-phone${slug}mcqs.png` });

          await page.reload({ waitUntil: 'networkidle' });
          const kept = await page.locator('[data-mcq]').first().locator('[data-result]').isVisible();
          say(kept && (await page.locator('#mcqs').isVisible()), `${path}: #mcqs deep link and saved answer survive reload`);
          await page.click('[data-reset]');
          await page.click('#tab-flashcards');
          await page.click('[data-act="reset"]');
          await page.click('#tab-notes');
        }
      }
    }
    say(errors.length === 0, `${scheme} ${size.name}: console errors ${errors.length ? errors.join(' | ') : 'none'}`);
    await ctx.close();
  }
}
await browser.close();
console.log(problems ? `\n${problems} problem(s)` : '\nAll page checks passed');
process.exit(problems ? 1 : 0);
