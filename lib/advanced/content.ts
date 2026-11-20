export type CareerRoadmap = {
  title: string;
  summary: string;
  universityKnowledge: string[];
  additionalSkills: string[];
  certifications: string[];
  practicalExperience: string[];
  entryPositions: string[];
  progression: string[];
  responsibilities: string[];
};

export const careerRoadmaps: CareerRoadmap[] = [
  {
    title: "Analytical Chemistry and Quality Control",
    summary: "Measure what is in a sample, how much is present, and whether a product meets its specification.",
    universityKnowledge: [
      "Analytical, physical, and inorganic chemistry; equilibria; statistics; and calibration.",
      "Instrument principles for chromatography, spectroscopy, electrochemistry, and sample preparation.",
    ],
    additionalSkills: [
      "Method validation, uncertainty, control charts, technical writing, and traceable record keeping.",
      "Practical HPLC/GC, UV-Vis, FTIR, titration, LIMS, and safe sample handling.",
    ],
    certifications: [
      "ISO/IEC 17025 laboratory quality-system training is useful for testing laboratories.",
      "Consider ASQ Certified Quality Improvement Associate or Certified Quality Technician as experience fits.",
      "Check local accreditation-body and employer requirements before paying for a credential.",
    ],
    practicalExperience: [
      "Complete a supervised placement in a testing, food, pharmaceutical, environmental, or materials laboratory.",
      "Build a redacted portfolio sample: a method outline, validation summary, control chart, and corrective-action note.",
    ],
    entryPositions: ["Laboratory analyst", "Quality-control chemist", "Analytical technician", "Sample-preparation analyst"],
    progression: ["Senior analyst", "Method-development or validation specialist", "Laboratory supervisor", "Quality or technical manager"],
    responsibilities: [
      "Prepare samples, standards, and reagents; operate and maintain instruments.",
      "Review results against specifications, investigate out-of-trend findings, and maintain auditable records.",
      "Support method validation, proficiency testing, audits, and corrective actions.",
    ],
  },
  {
    title: "Industrial Chemistry, Process, and Petrochemicals",
    summary: "Apply chemistry to reliable, safe, and efficient large-scale production and product development.",
    universityKnowledge: [
      "Physical and organic chemistry, thermodynamics, kinetics, catalysis, materials, and reaction engineering fundamentals.",
      "Mass balance, heat transfer, process flow diagrams, and introductory process control.",
    ],
    additionalSkills: [
      "Process data analysis, root-cause investigation, technical reporting, and communication across operations teams.",
      "Process safety, hazard identification, permit-to-work awareness, and basic process simulation literacy.",
    ],
    certifications: [
      "NEBOSH or IOSH safety training can support safety-focused roles; choose the level requested by employers.",
      "ISO 9001 or ISO 14001 internal-auditor training can help in quality and environmental systems.",
      "Professional registration is country-specific; verify current requirements with the relevant regulator.",
    ],
    practicalExperience: [
      "Seek industrial attachment in production, refinery, energy, cement, polymer, or chemical manufacturing operations.",
      "Document a non-confidential process-improvement or troubleshooting case study with measured outcomes.",
    ],
    entryPositions: ["Process laboratory analyst", "Production chemist", "Operations graduate trainee", "Process-development assistant"],
    progression: ["Production or process chemist", "Process engineer/technologist with the required qualifications", "Shift or unit lead", "Operations or technical manager"],
    responsibilities: [
      "Monitor process and product data and communicate deviations to the responsible operations team.",
      "Support scale-up, process trials, quality investigations, and safe change control.",
      "Collaborate with engineers and operators; chemists should not perform engineering sign-off outside their competence.",
    ],
  },
  {
    title: "Pharmaceutical, Formulation, and Regulatory Chemistry",
    summary: "Support the development, testing, manufacture, and compliant documentation of medicines and related products.",
    universityKnowledge: [
      "Organic, analytical, and physical chemistry; instrumental analysis; formulation principles; and microbiology fundamentals.",
      "Stability, solubility, degradation, and the relationship between material properties and product performance.",
    ],
    additionalSkills: [
      "Good Manufacturing Practice (GMP), controlled documentation, deviation handling, and data integrity.",
      "Formulation, stability-study design, analytical method transfer, and clear cross-functional communication.",
    ],
    certifications: [
      "Recognized GMP/GxP training is commonly expected; select training aligned with the regulator and role.",
      "Regulatory-affairs certificates can be useful for regulatory roles but do not replace required professional registration.",
    ],
    practicalExperience: [
      "Apply for a supervised placement in pharmaceutical quality control, quality assurance, formulation, or regulatory operations.",
      "Prepare a non-confidential sample stability protocol or analytical method summary for a portfolio.",
    ],
    entryPositions: ["Pharmaceutical quality-control analyst", "Formulation laboratory assistant", "QA documentation associate", "Regulatory affairs assistant"],
    progression: ["Senior analyst or formulation chemist", "Validation or regulatory specialist", "Team lead", "Quality, development, or regulatory manager"],
    responsibilities: [
      "Perform or review testing under approved methods and controlled procedures.",
      "Maintain complete, attributable records; report deviations promptly; and protect product traceability.",
      "Support stability, validation, change-control, and regulatory-submission activities.",
    ],
  },
  {
    title: "Environmental and Water Chemistry",
    summary: "Use chemical evidence to monitor environmental quality, assess contamination, and support remediation.",
    universityKnowledge: [
      "Environmental, analytical, and aqueous chemistry; acid-base equilibria; redox; and contaminant fate.",
      "Sampling, preservation, instrumental methods, and introductory environmental toxicology.",
    ],
    additionalSkills: [
      "Field sampling plans, chain of custody, GIS/data handling, uncertainty, and environmental reporting.",
      "Knowledge of local discharge limits, environmental impact assessment, and laboratory quality systems.",
    ],
    certifications: [
      "ISO/IEC 17025 training is relevant for accredited environmental laboratories.",
      "ISO 14001 auditor training or a recognized environmental-management credential may support compliance roles.",
      "Safety and fieldwork qualifications depend on local rules and the hazards of the site.",
    ],
    practicalExperience: [
      "Seek placements with water utilities, environmental laboratories, regulators, consultancies, or remediation teams.",
      "Develop a portfolio sampling plan and an anonymized results interpretation with limitations clearly stated.",
    ],
    entryPositions: ["Water-quality analyst", "Environmental laboratory analyst", "Field sampling assistant", "Environmental compliance assistant"],
    progression: ["Environmental chemist", "Senior consultant or monitoring specialist", "Project lead", "Environmental or sustainability manager"],
    responsibilities: [
      "Collect or receive representative samples with complete chain-of-custody records.",
      "Analyze contaminants, compare findings to applicable standards, and explain uncertainty and limitations.",
      "Support monitoring, compliance reporting, impact assessment, and remediation decisions.",
    ],
  },
  {
    title: "Materials, Energy, and Research Chemistry",
    summary: "Investigate the composition, structure, and performance of materials for energy, manufacturing, and research.",
    universityKnowledge: [
      "Physical, inorganic, and solid-state chemistry; materials characterization; kinetics; and structure-property relationships.",
      "Research methods, statistics, literature evaluation, and laboratory safety.",
    ],
    additionalSkills: [
      "Materials characterization such as XRD, SEM/EDS, thermal analysis, electrochemistry, and spectroscopy.",
      "Experimental design, reproducible data analysis, scientific writing, and basic coding for data workflows.",
    ],
    certifications: [
      "Instrument-vendor or facility training is more useful than a generic certificate for many specialist instruments.",
      "Consider project-management or research-integrity training for research and development roles.",
      "Postgraduate study may be required for independent research positions; check each role's criteria.",
    ],
    practicalExperience: [
      "Join a university research group, national laboratory, materials manufacturer, battery/energy team, or R&D placement.",
      "Prepare a research poster or report using public or permitted data and clearly state methods and limitations.",
    ],
    entryPositions: ["Research assistant", "Materials laboratory analyst", "R&D technician", "Graduate formulation or testing chemist"],
    progression: ["Research or development chemist", "Project scientist or characterization specialist", "R&D team lead", "Research manager or academic pathway"],
    responsibilities: [
      "Plan and run experiments safely, maintain instrument records, and preserve raw data.",
      "Interpret structure and performance data, communicate uncertainty, and compare results with literature.",
      "Contribute to scale-up, technical reports, publications, intellectual-property review, or product development.",
    ],
  },
];

export const jobProcessGuides = [
  {
    title: "Build a chemistry-focused CV",
    steps: [
      "Lead with a concise profile tailored to the role, then list education, relevant laboratory skills, experience, and selected projects.",
      "Name instruments and methods only when you can explain your level of hands-on competence.",
      "Show evidence: sample throughput, method validation, audit readiness, turnaround time, or a quantified project result.",
      "Include safety, quality systems, data integrity, and software only when you have used or formally studied them.",
      "Use a clean one- or two-page layout, consistent dates, and no confidential employer or research information.",
    ],
  },
  {
    title: "Write a professional cover letter",
    steps: [
      "Address the hiring team and identify the position and where you found it.",
      "Connect two or three requirements in the advert to specific examples from coursework, placement, or work.",
      "Explain why the organisation's chemistry, product, or impact interests you without generic praise.",
      "Close with availability and a courteous request to discuss your fit; keep it to one page.",
    ],
  },
  {
    title: "Prepare for technical interviews",
    steps: [
      "Review the methods and instruments on your CV; be ready to explain calibration, controls, uncertainty, and limitations.",
      "Practice a structured troubleshooting example: observation, checks, evidence, escalation, and documented outcome.",
      "Refresh safety, sample integrity, quality systems, and the fundamentals relevant to the specific role.",
      "Never guess a result or claim unsupervised competence you do not have; explain how you would verify safely.",
    ],
  },
  {
    title: "Apply for industrial placements",
    steps: [
      "Start early and check university placement requirements, eligibility, location, and application dates.",
      "Target employers with relevant laboratories or production teams; tailor each CV and letter to their work.",
      "Describe your learning goals, practical availability, and safety awareness clearly.",
      "Track applications and follow up politely; never send sensitive identity documents unless the employer's process is verified.",
    ],
  },
  {
    title: "Create a professional chemistry portfolio",
    steps: [
      "Include a short profile, skills matrix, selected project summaries, and sanitized examples of technical writing or data presentation.",
      "Explain your specific contribution, method, quality checks, result, and limitations for each project.",
      "Remove personal data, unpublished research, employer records, and other confidential material unless you have written permission.",
      "Use a professional, accessible format and test every link before sharing it with an employer.",
    ],
  },
];
