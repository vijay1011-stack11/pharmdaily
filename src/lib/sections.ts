// The 14 sections, in syllabus order. A section is live once its topics are
// reviewer-approved and present under content/section-<n>/.

export interface Topic {
  slug: string; // folder name under content/section-<n>/
  title: string; // shown in navigation and cards
  short: string; // compact label for the topic switcher
}

export interface Section {
  n: number;
  title: string;
  topics: Topic[]; // empty = "Soon"
}

export const SECTIONS: Section[] = [
  {
    n: 1,
    title: 'General Pharmacology',
    topics: [
      { slug: 'routes-of-administration', title: 'Routes of administration', short: 'Routes' },
      { slug: 'pharmacokinetics', title: 'Pharmacokinetics', short: 'Kinetics' },
      { slug: 'pharmacodynamics', title: 'Pharmacodynamics', short: 'Dynamics' },
    ],
  },
  { n: 2, title: 'Autonomic Nervous System', topics: [] },
  { n: 3, title: 'Autacoids and NSAIDs', topics: [] },
  { n: 4, title: 'Respiratory System', topics: [] },
  { n: 5, title: 'Hormones', topics: [] },
  { n: 6, title: 'Peripheral Nervous System (Local Anaesthetics)', topics: [] },
  { n: 7, title: 'Central Nervous System', topics: [] },
  { n: 8, title: 'Cardiovascular System', topics: [] },
  { n: 9, title: 'Kidney', topics: [] },
  { n: 10, title: 'Blood', topics: [] },
  { n: 11, title: 'Gastrointestinal Tract', topics: [] },
  { n: 12, title: 'Antimicrobials', topics: [] },
  { n: 13, title: 'Anticancer Drugs', topics: [] },
  { n: 14, title: 'Miscellaneous', topics: [] },
];

export const isLive = (s: Section) => s.topics.length > 0;
export const sectionPath = (s: Section) => `/section-${s.n}/`;
export const topicPath = (s: Section, t: Topic) => `/section-${s.n}/${t.slug}/`;
