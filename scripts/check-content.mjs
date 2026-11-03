// Verifies the built site against content/: run after `npm run build`.
//
// 1. Every piece of text in each topic's notes.html appears, in order within the piece,
//    on the built topic page. This is what allows a diagram to replace a block of notes:
//    the diagram (or its caption/legend) must carry the same words.
// 2. The built page has exactly as many flashcards and MCQs as the JSON files.
//
// Pieces are text nodes split at commas, semicolons and sentence ends, so a diagram may
// break a list across lines. Text inside one SVG <text> is joined with spaces.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, TextNode } from 'node-html-parser';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function textOf(node, out = []) {
  if (node instanceof TextNode) out.push(node.text);
  else if (!['script', 'style'].includes(node.rawTagName?.toLowerCase())) node.childNodes.forEach((c) => textOf(c, out));
  return out;
}

let failed = false;
const summary = [];
for (const sec of readdirSync(join(root, 'content')).filter((d) => d.startsWith('section-'))) {
  for (const topic of readdirSync(join(root, 'content', sec))) {
    const dir = join(root, 'content', sec, topic);
    if (!existsSync(join(dir, 'notes.html'))) continue;
    const built = join(root, 'dist', sec, topic, 'index.html');
    if (!existsSync(built)) { console.error(`✗ ${sec}/${topic}: not built`); failed = true; continue; }

    const page = parse(readFileSync(built, 'utf8'));
    // Only the topic header and the Notes panel: flashcards/MCQs repeat many phrases and would mask gaps.
    const scope = [page.querySelector('.topic-hero'), page.querySelector('#notes')];
    if (scope.some((n) => !n)) { console.error(`✗ ${sec}/${topic}: page structure changed`); failed = true; continue; }
    const pageText = ' ' + norm(scope.flatMap((n) => textOf(n)).join(' ')) + ' ';

    const pieces = textOf(parse(readFileSync(join(dir, 'notes.html'), 'utf8')))
      .flatMap((t) => t.split(/,|;|\.\s/))
      .map((p) => norm(p).replace(/^[\s:·.()]+|[\s:·.()]+$/g, ''))
      .filter((p) => /[\p{L}\p{N}]/u.test(p));
    const missing = [...new Set(pieces.filter((p) => !pageText.includes(p)))];

    const cards = JSON.parse(readFileSync(join(dir, 'flashcards.json'), 'utf8')).length;
    const mcqs = JSON.parse(readFileSync(join(dir, 'mcq.json'), 'utf8')).length;
    const builtCards = page.querySelectorAll('[data-card]').length;
    const builtMcqs = page.querySelectorAll('[data-mcq]').length;

    const ok = missing.length === 0 && cards === builtCards && mcqs === builtMcqs;
    failed ||= !ok;
    summary.push(`${ok ? '✓' : '✗'} ${sec}/${topic}: ${pieces.length} text pieces, ${missing.length} missing · flashcards ${builtCards}/${cards} · MCQs ${builtMcqs}/${mcqs}`);
    for (const m of missing) summary.push(`    missing: "${m}"`);
  }
}
console.log(summary.join('\n'));
process.exit(failed ? 1 : 0);
