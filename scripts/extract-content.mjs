// Regenerates content/section-1/ from the reviewer-approved source file.
// Usage: node scripts/extract-content.mjs
//
// The source is a single review page. Notes are the <section data-mode="notes"> blocks;
// flashcards and MCQs are the CARDS and MCQ object literals in its script.
// Content is copied verbatim: nothing is added, removed or reworded.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'content-source', 'pharmdaily-section1-final.html');
const OUT = join(root, 'content', 'section-1');

// source topic key -> content folder slug
const TOPICS = {
  routes: 'routes-of-administration',
  pk: 'pharmacokinetics',
  pd: 'pharmacodynamics',
};

const html = readFileSync(SOURCE, 'utf8');

// Pull a `var NAME={...};` literal out of the script and evaluate it in an empty sandbox.
function readLiteral(name) {
  const start = html.indexOf(`var ${name}={`);
  if (start < 0) throw new Error(`${name} not found in source`);
  const end = html.indexOf('\n]};', start);
  if (end < 0) throw new Error(`end of ${name} not found`);
  const code = html.slice(start, end + 4);
  const sandbox = {};
  vm.runInNewContext(code, sandbox);
  return sandbox[name];
}

function readNotes(key) {
  const re = new RegExp(`<section data-topic="${key}" data-mode="notes"[^>]*>([\\s\\S]*?)\\n</section>`);
  const m = html.match(re);
  if (!m) throw new Error(`notes for ${key} not found`);
  return m[1]
    // review-page navigation buttons: the site renders its own from the real counts
    .replace(/\s*<div class="next">[\s\S]*?<\/div>/, '')
    // decorative icon inside the clinic callout: the site supplies its own
    .replace(/(<div class="clinic">)\s*<svg[\s\S]*?<\/svg>/g, '$1')
    .replace(/^\n+|\s+$/g, '') + '\n';
}

const CARDS = readLiteral('CARDS');
const MCQ = readLiteral('MCQ');

if (existsSync(OUT)) rmSync(OUT, { recursive: true });

const report = [];
for (const [key, slug] of Object.entries(TOPICS)) {
  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });

  const flashcards = CARDS[key].map(([q, a]) => ({ q, a }));
  const mcq = MCQ[key].map(([q, options, answer, explanation]) => {
    if (options.length !== 4) throw new Error(`${key}: "${q}" has ${options.length} options`);
    if (!(answer >= 0 && answer < 4)) throw new Error(`${key}: "${q}" has bad answer index`);
    return { q, options, answer, explanation };
  });

  writeFileSync(join(dir, 'notes.html'), readNotes(key));
  writeFileSync(join(dir, 'flashcards.json'), JSON.stringify(flashcards, null, 2) + '\n');
  writeFileSync(join(dir, 'mcq.json'), JSON.stringify(mcq, null, 2) + '\n');
  report.push(`${slug}: ${flashcards.length} flashcards, ${mcq.length} MCQs`);
}

console.log(report.join('\n'));
