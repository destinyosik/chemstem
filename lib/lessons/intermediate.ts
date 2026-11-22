export type IntermediateLesson = {
  title: string;
  summary: string;
  explanation: string;
  equation: string;
  application: string;
};

export const intermediateLessons: IntermediateLesson[] = [
  {
    title: "Chemical thermodynamics",
    summary: "Relate heat, work, enthalpy, entropy, and Gibbs energy to chemical change.",
    explanation:
      "Thermodynamics describes energy changes between states. Enthalpy change tracks heat at constant pressure, while entropy measures how energy and matter are dispersed among accessible arrangements. A negative Gibbs energy change indicates a thermodynamically favorable direction at the stated temperature and pressure; it does not predict how quickly the process occurs.",
    equation: "ΔG = ΔH − TΔS",
    application:
      "Use Gibbs energy to compare the favorability of a reaction at different temperatures, then use kinetics to decide whether it proceeds at a useful rate.",
  },
  {
    title: "Chemical kinetics and reaction mechanisms",
    summary: "Interpret rate laws, reaction orders, activation energy, and elementary steps.",
    explanation:
      "Kinetics studies how quickly concentrations change and which molecular events control the rate. A rate law is determined experimentally and is not generally obtained by reading coefficients from an overall balanced equation. Mechanisms propose elementary steps whose combined stoichiometry matches the overall reaction.",
    equation: "rate = k[A]ᵐ[B]ⁿ;  k = A e^(−Eₐ/RT)",
    application:
      "Temperature, catalysts, and concentration can change the observed rate. A catalyst provides a lower-activation-energy pathway without changing the equilibrium constant.",
  },
  {
    title: "Chemical equilibrium",
    summary: "Use reaction quotients and equilibrium constants to predict reaction direction.",
    explanation:
      "At dynamic equilibrium, forward and reverse reaction rates are equal, so measurable concentrations remain constant even though reactions continue at the molecular scale. The reaction quotient Q has the same form as K but uses current concentrations; comparing Q with K predicts which direction will move toward equilibrium.",
    equation: "aA + bB ⇌ cC + dD;  Kc = [C]ᶜ[D]ᵈ / ([A]ᵃ[B]ᵇ)",
    application:
      "Industrial processes adjust pressure, temperature, and feed composition to improve yield while accounting for the energy and economic costs of those changes.",
  },
  {
    title: "Acid–base equilibria and buffers",
    summary: "Connect pH, Ka, conjugate pairs, and buffer capacity.",
    explanation:
      "Brønsted–Lowry acids donate protons and bases accept them. Weak acids and bases ionize incompletely, so equilibrium calculations are needed to estimate pH. A buffer contains a weak acid and its conjugate base (or a weak base and conjugate acid) and resists moderate pH changes by consuming added acid or base.",
    equation: "pH = pKa + log₁₀([A⁻]/[HA])",
    application:
      "Buffers help maintain the pH ranges needed for enzyme activity, analytical measurements, and many manufacturing processes.",
  },
  {
    title: "Electrochemistry",
    summary: "Use redox reactions and electrode potentials to understand cells and electrolysis.",
    explanation:
      "Oxidation is loss of electrons and reduction is gain. In a galvanic cell, a spontaneous redox reaction drives electron flow through an external circuit. In an electrolytic cell, an external power source drives a non-spontaneous reaction. Cell notation and half-reactions help track electrons and charge.",
    equation: "ΔG° = −nFE°cell",
    application:
      "Electrochemical principles explain batteries, corrosion control, electroplating, and the industrial production of elements such as aluminium.",
  },
  {
    title: "Organic reaction mechanisms",
    summary: "Track electron-pair movement in substitution, addition, elimination, and oxidation.",
    explanation:
      "An organic mechanism is a sequence of electron-pair movements that explains how reactants form products. Nucleophiles donate electron pairs; electrophiles accept them. The substrate structure, solvent, leaving group, and reaction conditions influence which pathway is favored.",
    equation: "Nu:⁻ + R–LG → R–Nu + LG⁻",
    application:
      "Mechanism-based reasoning helps chemists predict products, choose synthesis conditions, and explain why changing a solvent or substrate can alter a reaction pathway.",
  },
  {
    title: "Coordination chemistry",
    summary: "Describe metal complexes, ligands, coordination number, and ligand-field effects.",
    explanation:
      "A coordination complex contains a central metal ion or atom bonded to surrounding ligands through donated electron pairs. The geometry and ligand field influence colour, magnetism, and reactivity. Oxidation state and coordination number are determined from the complex formula and its bonding model.",
    equation: "[Cu(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CuCl₄]²⁻ + 6H₂O",
    application:
      "Coordination compounds are important in biological metal sites, catalysts, pigments, and analytical chemistry.",
  },
  {
    title: "Molecular spectroscopy",
    summary: "Use electromagnetic absorption to infer molecular structure and energy levels.",
    explanation:
      "Molecules absorb or emit radiation when photon energy matches an allowed energy difference. Infrared spectra reveal vibrational modes associated with functional groups, UV–visible spectra probe electronic transitions, and nuclear magnetic resonance spectra provide information about chemical environments in a molecule.",
    equation: "ΔE = hν = hc/λ",
    application:
      "Combining IR, UV–visible, and NMR evidence helps identify compounds and assess sample purity without relying on appearance alone.",
  },
];
