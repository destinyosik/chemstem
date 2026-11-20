export const chemistryIndustries = [
  {
    slug: "soap-detergent",
    name: "Soap and Detergent Industries",
    description: "Formulation, surfactants, quality, and cleaning-product manufacturing.",
    searchTerms: "soap detergent surfactant cleaning product",
    keywords: ["soap", "detergent", "surfactant", "cleaning product"],
  },
  {
    slug: "cosmetics",
    name: "Cosmetics Industries",
    description: "Cosmetic formulation, product safety, quality, and manufacturing.",
    searchTerms: "cosmetics cosmetic formulation skincare personal care",
    keywords: ["cosmetic", "skincare", "personal care", "beauty", "makeup"],
  },
  {
    slug: "pharmaceutical",
    name: "Pharmaceutical Industries",
    description: "Medicine development, GMP laboratories, quality, and manufacturing.",
    searchTerms: "pharmaceutical pharmaceutical chemist GMP drug quality",
    keywords: ["pharmaceutical", "pharma", "drug", "medicine", "GMP", "pharmac"],
  },
  {
    slug: "paint",
    name: "Paint Industries",
    description: "Coatings formulation, pigments, testing, and production.",
    searchTerms: "paint coatings pigment formulation",
    keywords: ["paint", "coating", "pigment", "varnish"],
  },
  {
    slug: "water-treatment",
    name: "Water Treatment Industries",
    description: "Water chemistry, treatment operations, testing, and compliance.",
    searchTerms: "water treatment water quality wastewater chemistry",
    keywords: ["water treatment", "wastewater", "water quality", "effluent"],
  },
  {
    slug: "food-processing",
    name: "Food Processing Industries",
    description: "Food chemistry, safety, process quality, and product development.",
    searchTerms: "food processing food chemist food safety quality",
    keywords: ["food processing", "food chemist", "food safety", "food quality"],
  },
  {
    slug: "beverage-drink",
    name: "Beverage and Drink Industries",
    description: "Beverage formulation, laboratory analysis, and production quality.",
    searchTerms: "beverage drinks brewery brewing beverage quality",
    keywords: ["beverage", "drink", "brewery", "brewing", "soft drink"],
  },
  {
    slug: "petroleum",
    name: "Petroleum Industries",
    description: "Petroleum analysis, refining, fuels, lubricants, and process chemistry.",
    searchTerms: "petroleum oil gas refinery fuels lubricant chemistry",
    keywords: ["petroleum", "refinery", "oil and gas", "fuel", "lubricant"],
  },
  {
    slug: "laboratory-services",
    name: "Laboratory Services",
    description: "Analytical testing, calibration, research, and laboratory quality systems.",
    searchTerms: "laboratory analyst laboratory technician analytical chemist",
    keywords: ["laboratory", "laboratories", "lab technician", "analytical", "testing lab"],
  },
  {
    slug: "plastics-polymer",
    name: "Plastics and Polymer Industries",
    description: "Polymer synthesis, materials testing, compounding, and production.",
    searchTerms: "plastics polymer resin materials chemistry",
    keywords: ["plastic", "polymer", "resin", "compounding"],
  },
  {
    slug: "agrochemical",
    name: "Agrochemical Industries",
    description: "Agricultural chemicals, formulation, residue analysis, and regulation.",
    searchTerms: "agrochemical pesticide fertilizer crop protection",
    keywords: ["agrochemical", "pesticide", "fertilizer", "crop protection", "agriculture chemical"],
  },
] as const;

export type ChemistryIndustry = (typeof chemistryIndustries)[number];

export function getChemistryIndustry(slug: string): ChemistryIndustry | undefined {
  return chemistryIndustries.find((industry) => industry.slug === slug);
}

export const relatedChemistryRoles = [
  "Quality Control Analyst",
  "Laboratory Technician",
  "Industrial Chemist",
  "Formulation Chemist",
  "Production Chemist",
  "Analytical Chemist",
];

const chemistrySearchTerms =
  /\b(chem|chemist|chemistry|chemical|laboratory|laboratories|lab|analytical|formulation|quality control|quality assurance|qc analyst|production chemist|process chemist|water treatment|polymer|pharma|petroleum|food safety)\b/i;

export function isChemistryCareerSearch(query: string): boolean {
  return chemistrySearchTerms.test(query);
}

export function findSimilarChemistryRoles(query: string): string[] {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  const ranked = relatedChemistryRoles
    .map((role) => ({
      role,
      score: words.filter((word) => role.toLowerCase().includes(word)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.length
    ? ranked.slice(0, 3).map((entry) => entry.role)
    : relatedChemistryRoles.slice(0, 3);
}
