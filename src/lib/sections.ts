// The 14 sections, in syllabus order. A section is live once its topics are
// reviewer-approved and present under content/section-<n>/.

export interface Topic {
  slug: string; // folder name under content/section-<n>/
  title: string; // shown in navigation and cards
  short: string; // compact label for the topic switcher
  reviewed: string; // month the reviewer last approved it, YYYY-MM
}

export interface Section {
  n: number;
  title: string;
  topics: Topic[]; // empty = "Soon"
  planned?: string; // target month for an upcoming section, shown in the homepage roadmap
}

export const SECTIONS: Section[] = [
  {
    n: 1,
    title: 'General pharmacology',
    topics: [
      { slug: 'routes-of-administration', title: 'Routes of administration', short: 'Routes', reviewed: '2026-11' },
      { slug: 'pharmacokinetics', title: 'Pharmacokinetics', short: 'Kinetics', reviewed: '2026-11' },
      { slug: 'pharmacodynamics', title: 'Pharmacodynamics', short: 'Dynamics', reviewed: '2026-11' },
    ],
  },
  { n: 2, title: 'Autonomic nervous system', topics: [], planned: 'Dec' },
  {
    n: 3,
    title: 'Autacoids and NSAIDs',
    topics: [
      { slug: 'nsaids', title: 'NSAIDs and antipyretic-analgesics', short: 'NSAIDs', reviewed: '2026-11' },
    ],
  },
  { n: 4, title: 'Respiratory system', topics: [], planned: 'Jan' },
  { n: 5, title: 'Hormones', topics: [] },
  { n: 6, title: 'Peripheral nervous system (local anaesthetics)', topics: [] },
  {
    n: 7,
    title: 'Central nervous system',
    topics: [
      { slug: 'sedative-hypnotics', title: 'Sedative-hypnotics: basics', short: 'Basics', reviewed: '2026-11' },
      { slug: 'benzodiazepines', title: 'Benzodiazepines', short: 'Benzodiazepines', reviewed: '2026-11' },
      { slug: 'z-compounds', title: 'Z compounds and other hypnotics', short: 'Z compounds', reviewed: '2026-11' },
    ],
  },
  { n: 8, title: 'Cardiovascular system', topics: [] },
  { n: 9, title: 'Kidney', topics: [] },
  { n: 10, title: 'Blood', topics: [] },
  { n: 11, title: 'Gastrointestinal tract', topics: [] },
  { n: 12, title: 'Antimicrobials', topics: [] },
  { n: 13, title: 'Anticancer drugs', topics: [] },
  { n: 14, title: 'Miscellaneous', topics: [] },
];

export const isLive = (s: Section) => s.topics.length > 0;
export const sectionPath = (s: Section) => `/section-${s.n}/`;
// '2026-11' -> 'Nov 2026'
export const formatMonth = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
export const topicPath = (s: Section, t: Topic) => `/section-${s.n}/${t.slug}/`;

// plural(1, 'topic') -> '1 topic'; plural(3, 'MCQ') -> '3 MCQs'
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
