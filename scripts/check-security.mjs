// Security checks on the built site (run after `npm run build`). No browser needed.
//   - every inline <script> in dist/ has its sha256 hash in the CSP in vercel.json (and no stale hashes)
//   - vercel.json still sets all the security headers
//   - no inline event handlers or javascript: URLs
//   - nothing loads from another origin
//   - dist/ holds no source maps, source files, notes, tests or env files
// Print the hashes the CSP needs with: node scripts/check-security.mjs --hashes

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p) : files.push(relative(DIST, p).split(sep).join('/'));
  }
})(DIST);

let problems = 0;
const say = (ok, msg) => { if (!ok) problems++; console.log(`${ok ? '✓' : '✗'} ${msg}`); };

// Inline scripts and their hashes.
const html = files.filter((f) => f.endsWith('.html'));
const inline = new Map(); // hash -> pages
let handlers = [], external = [];
for (const f of html) {
  const src = readFileSync(join(DIST, f), 'utf8');
  for (const [, attrs, body] of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc\s*=/.test(attrs)) continue;
    const h = `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
    inline.set(h, [...(inline.get(h) ?? []), f]);
  }
  for (const [m] of src.matchAll(/<[^>]+\son[a-z]+\s*=\s*["'][^>]*>/gi)) handlers.push(`${f}: ${m.slice(0, 60)}`);
  for (const [m] of src.matchAll(/(?:href|src)\s*=\s*["']\s*javascript:[^"']*/gi)) handlers.push(`${f}: ${m}`);
  // Outbound <a> links are fine; anything the page *loads* must be same-origin.
  for (const [, tag, url] of src.matchAll(/<(script|link|img|iframe|source|video|audio|object|embed)\b[^>]*?\s(?:src|href)\s*=\s*["']((?:https?:)?\/\/[^"']+)/gi)) external.push(`${f}: <${tag}> ${url}`);
}

if (process.argv.includes('--hashes')) {
  for (const [h, pages] of inline) console.log(`${h}  (${pages.length} pages)`);
  process.exit(0);
}

// Headers in vercel.json.
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const all = Object.fromEntries((vercel.headers?.find((h) => h.source === '/(.*)')?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]));
const csp = all['content-security-policy'] ?? '';
const directive = (name) => (csp.split(';').map((d) => d.trim().split(/\s+/)).find(([n]) => n === name) ?? []).slice(1);

const required = {
  'content-security-policy': (v) => /default-src 'self'/.test(v) && /frame-ancestors 'none'/.test(v) && /object-src 'none'/.test(v),
  'x-content-type-options': (v) => v === 'nosniff',
  'referrer-policy': (v) => v === 'strict-origin-when-cross-origin',
  'permissions-policy': (v) => ['camera=()', 'microphone=()', 'geolocation=()'].every((p) => v.includes(p)),
  'x-frame-options': (v) => v === 'DENY',
  'strict-transport-security': (v) => /max-age=\d{8,}/.test(v),
};
for (const [key, ok] of Object.entries(required)) say(Boolean(all[key]) && ok(all[key]), `header ${key}: ${all[key] ?? 'missing'}`.slice(0, 110));

const scriptSrc = directive('script-src');
say(!scriptSrc.includes("'unsafe-inline'") && !scriptSrc.includes("'unsafe-eval'"), `script-src has no 'unsafe-inline' / 'unsafe-eval'`);
const missing = [...inline].filter(([h]) => !scriptSrc.includes(h));
say(missing.length === 0, `inline scripts allowed by CSP hash: ${inline.size - missing.length}/${inline.size}${missing.map(([h, p]) => `\n    add ${h} (used in ${p[0]})`).join('')}`);
const stale = scriptSrc.filter((s) => s.startsWith("'sha256-") && !inline.has(s));
say(stale.length === 0, `no stale hashes in script-src${stale.length ? ': ' + stale.join(' ') : ''}`);

say(handlers.length === 0, `no inline event handlers or javascript: URLs${handlers.length ? '\n    ' + handlers.join('\n    ') : ''}`);
say(external.length === 0, `no cross-origin resources${external.length ? '\n    ' + external.join('\n    ') : ''}`);

// Files that must never ship.
const forbidden = files.filter((f) =>
  /\.map$/.test(f) ||
  /(^|\/)(content-source|content|scripts|src|node_modules|screenshots|test-results|\.git|\.vercel)\//.test(f) ||
  /(^|\/)(CLAUDE|README)\.md$/i.test(f) || /\.(md|mjs|ts|astro|json)$/.test(f) ||
  /(^|\/)\.env/.test(f) || /(^|\/)(test|tests|__tests__|playground|sandbox)(\/|\.html$)/i.test(f),
);
say(forbidden.length === 0, `no source maps, source, notes or test files in dist/${forbidden.length ? ': ' + forbidden.join(', ') : ''}`);
const mapRefs = files.filter((f) => /\.(js|css|html)$/.test(f) && /sourceMappingURL=/.test(readFileSync(join(DIST, f), 'utf8')));
say(mapRefs.length === 0, `no sourceMappingURL comments${mapRefs.length ? ': ' + mapRefs.join(', ') : ''}`);

console.log(`\n${files.length} files in dist/: ${html.length} pages, ${files.filter((f) => f.endsWith('.js')).length} scripts`);
console.log(problems ? `${problems} problem(s)` : 'All security checks passed');
process.exit(problems ? 1 : 0);
