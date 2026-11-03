// Where each diagram goes in a topic's notes.
//
// heading: exact text of the h2/h3 the diagram belongs under ('' = before the first heading)
// mode:
//   afterHeading  insert straight after the heading
//   before/after  insert next to the nth block matching `block` under that heading
//   replace       swap that block for the diagram. Only allowed when the diagram carries
//                 every word of the block; scripts/check-content.mjs enforces this.
// block: '.class' or 'tag'
//
// A placement that can't be found fails the build, so content edits can't silently
// drop a diagram.

export interface Placement {
  heading: string;
  mode: 'afterHeading' | 'before' | 'after' | 'replace';
  block?: string;
  nth?: number;
  diagram: string;
}

export const PLACEMENTS: Record<string, Placement[]> = {
  'section-1/routes-of-administration': [
    { heading: 'The route map', mode: 'replace', block: '.metro', diagram: 'RouteMap' },
    { heading: 'Why sublingual is fast', mode: 'replace', block: '.paths', diagram: 'SublingualPaths' },
    { heading: 'Injections', mode: 'before', block: '.rows', diagram: 'InjectionDepths' },
    { heading: 'Inside a skin patch (TTS)', mode: 'replace', block: '.layers', diagram: 'PatchLayers' },
  ],
  'section-1/pharmacokinetics': [
    { heading: '', mode: 'replace', block: '.flow', diagram: 'Adme' },
    { heading: 'Crossing membranes', mode: 'afterHeading', diagram: 'MembraneTransport' },
    { heading: 'Absorption', mode: 'before', block: '.split', diagram: 'AcidBaseAbsorption' },
    { heading: 'First-pass metabolism', mode: 'replace', block: '.flow', diagram: 'FirstPass' },
    { heading: 'Distribution', mode: 'before', block: '.split', diagram: 'ProteinBinding' },
    { heading: 'Redistribution', mode: 'replace', block: '.flow', diagram: 'Redistribution' },
    { heading: 'Phase I and Phase II', mode: 'afterHeading', diagram: 'MetabolismPhases' },
    { heading: 'In the kidney', mode: 'replace', block: '.flow', diagram: 'RenalExcretion' },
    { heading: 'Kinetics of elimination', mode: 'replace', block: '.flow', diagram: 'HalfLife' },
    { heading: 'Kinetics of elimination', mode: 'after', block: '.split', diagram: 'EliminationOrder' },
  ],
  'section-1/pharmacodynamics': [
    { heading: 'Ways drugs act', mode: 'replace', block: '.chips', diagram: 'FourTargets' },
    { heading: 'Enzymes', mode: 'after', block: 'p', diagram: 'EnzymeMechanisms' },
    { heading: 'Enzymes', mode: 'after', block: '.def', nth: 2, diagram: 'EnzymeCurves' },
    { heading: 'Ion channels', mode: 'after', block: '.def', diagram: 'ChannelBlock' },
    { heading: 'Transporters', mode: 'after', block: '.def', diagram: 'Reuptake' },
    { heading: 'Transporters', mode: 'after', block: '.rows', diagram: 'RenalTransport' },
    { heading: 'Affinity and intrinsic activity', mode: 'replace', block: '.scale', diagram: 'ResponseBars' },
    { heading: 'Affinity and intrinsic activity', mode: 'before', block: '.card', diagram: 'PartialAgonist' },
    { heading: 'Two-state model', mode: 'replace', block: '.paths', diagram: 'TwoState' },
    { heading: 'Receptor families', mode: 'before', block: '.rgrid', diagram: 'ReceptorSpeed' },
    { heading: '1. G-protein coupled receptors (GPCR)', mode: 'after', block: 'p', diagram: 'Gpcr' },
    { heading: '(b) Phospholipase C: IP₃–DAG pathway', mode: 'after', block: '.split', diagram: 'Ip3Dag' },
    { heading: '2. Ion channel receptors (ligand-gated)', mode: 'after', block: '.def', diagram: 'LigandGated' },
    { heading: '3. Transmembrane enzyme-linked receptors', mode: 'after', block: '.def', diagram: 'EnzymeLinked' },
    { heading: '4. Transmembrane JAK-STAT binding receptors', mode: 'after', block: '.def', diagram: 'JakStat' },
    { heading: '5. Receptors regulating gene expression (nuclear receptors)', mode: 'after', block: '.def', diagram: 'NuclearReceptor' },
    { heading: 'Regulation of receptors', mode: 'after', block: 'p', diagram: 'ReceptorRegulation' },
    { heading: 'Dose and response', mode: 'replace', block: '.chart', diagram: 'DoseResponse' },
    { heading: 'Dose and response', mode: 'after', block: '.def', diagram: 'TherapeuticWindow' },
    { heading: 'Combinations', mode: 'afterHeading', diagram: 'CombinationBars' },
    { heading: 'Antagonism', mode: 'after', block: '.split', diagram: 'AntagonistCurves' },
  ],
};
