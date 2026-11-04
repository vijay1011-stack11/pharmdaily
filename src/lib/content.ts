// Build-time loading of the generated content in content/section-<n>/<topic>/.
// Nothing here ships to the browser.

import { parse, HTMLElement, type Node } from 'node-html-parser';
import { PLACEMENTS, type Placement } from './diagram-map';

export interface Flashcard { q: string; a: string }
export interface Mcq { q: string; options: string[]; answer: number; explanation: string }

const notesFiles = import.meta.glob('/content/section-*/*/notes.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const cardFiles = import.meta.glob('/content/section-*/*/flashcards.json', { import: 'default', eager: true }) as Record<string, Flashcard[]>;
const mcqFiles = import.meta.glob('/content/section-*/*/mcq.json', { import: 'default', eager: true }) as Record<string, Mcq[]>;

function file<T>(files: Record<string, T>, section: number, topic: string, name: string): T {
  const key = `/content/section-${section}/${topic}/${name}`;
  if (!(key in files)) throw new Error(`Missing content file ${key}`);
  return files[key];
}

export const getFlashcards = (section: number, topic: string) => file(cardFiles, section, topic, 'flashcards.json');
export const getMcqs = (section: number, topic: string) => file(mcqFiles, section, topic, 'mcq.json');

export interface Hero { eyebrow: string; title: string; lede: string }
export type Segment = { kind: 'html'; html: string } | { kind: 'diagram'; name: string };
export interface Notes { hero: Hero; toc: { id: string; text: string }[]; segments: Segment[] }

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CLINIC_ICON =
  '<svg class="clinic-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3c-2 0-3 2-3 4 0 3 1 5 2 8 .6 2 1 5 2.5 5 1.4 0 1.5-3 2.2-5 .3-.9.6-1.3 1.3-1.3s1 .4 1.3 1.3c.7 2 .8 5 2.2 5 1.5 0 1.9-3 2.5-5 1-3 2-5 2-8 0-2-1-4-3-4-1.8 0-2.6 1-5 1S8.8 3 7 3z"/></svg>';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Turn the source markup into the site's markup without changing any wording. */
function enhance(root: HTMLElement) {
  // Comma-separated drug lists become chips (same text, one chip per drug).
  for (const el of root.querySelectorAll('.drugs')) {
    if (el.childNodes.some((c) => c instanceof HTMLElement)) continue;
    const items = el.text.split(',').map((s) => s.trim()).filter(Boolean);
    el.replaceWith(`<ul class="chips">${items.map((t) => `<li class="chip">${escapeHtml(t)}</li>`).join('')}</ul>`);
  }
  // Mind maps: the review page's jump buttons become plain in-page links (no script needed),
  // and the dashed spokes are drawn by a static SVG behind the 3 x 3 grid.
  for (const el of root.querySelectorAll('.cloud[data-to]')) {
    el.replaceWith(`<a class="${el.getAttribute('class')}" href="#${el.getAttribute('data-to')}">${el.innerHTML}</a>`);
  }
  for (const el of root.querySelectorAll('.mind')) {
    const spokes = [[1, 1], [3, 1], [5, 1], [1, 3], [5, 3], [1, 5], [3, 5], [5, 5]]
      .map(([x, y]) => `<line x1="3" y1="3" x2="${x}" y2="${y}"/>`).join('');
    el.insertAdjacentHTML('afterbegin', `<svg class="spokes" viewBox="0 0 6 6" preserveAspectRatio="none" aria-hidden="true">${spokes}</svg>`);
  }
  // Clinic callouts get an icon and an aside role.
  for (const el of root.querySelectorAll('.clinic')) {
    el.tagName = 'aside';
    el.setAttribute('aria-label', 'For your clinic');
    el.insertAdjacentHTML('afterbegin', CLINIC_ICON);
  }
}

function matches(node: Node, sel: string): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  return sel.startsWith('.') ? node.classList.contains(sel.slice(1)) : node.tagName.toLowerCase() === sel;
}
const isHeading = (n: Node): n is HTMLElement => n instanceof HTMLElement && /^H[23]$/.test(n.tagName);

export function getNotes(section: number, topic: string): Notes {
  const root = parse(file(notesFiles, section, topic, 'notes.html'));
  enhance(root);

  const heroEl = root.querySelector('.hero');
  if (!heroEl) throw new Error(`${topic}: notes have no hero`);
  const hero: Hero = {
    eyebrow: heroEl.querySelector('.eyebrow')?.text.trim() ?? '',
    title: heroEl.querySelector('h1')?.text.trim() ?? '',
    lede: heroEl.querySelector('.lede')?.innerHTML.trim() ?? '',
  };
  heroEl.remove();

  // Heading ids for in-page navigation. h3 titles repeat across sections, so prefix with the h2.
  const toc: Notes['toc'] = [];
  const used = new Set<string>();
  let currentH2 = '';
  for (const h of root.querySelectorAll('h2, h3')) {
    const text = h.text.trim();
    let id = h.tagName === 'H2' ? slugify(text) : `${currentH2}-${slugify(text)}`;
    while (used.has(id)) id += '-x';
    used.add(id);
    h.setAttribute('id', id);
    if (h.tagName === 'H2') { currentH2 = id; toc.push({ id, text }); }
  }

  // Top-level blocks, with diagrams placed by the map.
  const blocks: (Node | { diagram: string })[] = root.childNodes.filter(
    (n) => n instanceof HTMLElement || n.text.trim() !== '',
  );
  for (const p of PLACEMENTS[`section-${section}/${topic}`] ?? []) place(blocks, p, topic);

  const segments: Segment[] = [];
  for (const b of blocks) {
    if ('diagram' in b) { segments.push({ kind: 'diagram', name: b.diagram }); continue; }
    const html = b.toString();
    const last = segments[segments.length - 1];
    if (last?.kind === 'html') last.html += '\n' + html;
    else segments.push({ kind: 'html', html });
  }
  return { hero, toc, segments };
}

function place(blocks: (Node | { diagram: string })[], p: Placement, topic: string) {
  const where = `${topic}: diagram ${p.diagram} at "${p.heading}"`;
  const hIdx = p.heading === ''
    ? -1
    : blocks.findIndex((b) => !('diagram' in b) && isHeading(b) && b.text.trim() === p.heading);
  if (p.heading !== '' && hIdx < 0) throw new Error(`${where}: heading not found`);
  if (p.mode === 'afterHeading') { blocks.splice(hIdx + 1, 0, { diagram: p.diagram }); return; }

  let seen = 0;
  for (let i = hIdx + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if ('diagram' in b) continue;
    if (isHeading(b)) break;
    if (matches(b, p.block!) && seen++ === (p.nth ?? 0)) {
      if (p.mode === 'replace') blocks.splice(i, 1, { diagram: p.diagram });
      else blocks.splice(p.mode === 'after' ? i + 1 : i, 0, { diagram: p.diagram });
      return;
    }
  }
  throw new Error(`${where}: block ${p.block} #${p.nth ?? 0} not found`);
}
