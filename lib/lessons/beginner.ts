export type LessonQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type LessonReference = {
  label: string;
  href: string;
};

export type BeginnerLesson = {
  slug: string;
  title: string;
  description: string;
  definition: string;
  explanation: string[];
  analogy: string;
  examples: string[];
  equations: { label: string; formula: string; note: string }[];
  quiz: LessonQuestion[];
  references: LessonReference[];
};

const openStax = (section: string, label: string): LessonReference => ({
  label: `OpenStax Chemistry 2e, ${label}`,
  href: `https://openstax.org/books/chemistry-2e/pages/${section}`,
});

export const beginnerLessons: BeginnerLesson[] = [
  {
    slug: "what-is-chemistry",
    title: "What is Chemistry?",
    description: "Meet the science of matter, its properties, and how it changes.",
    definition: "Chemistry is the study of matter: what it is made of, how it behaves, and how it changes.",
    explanation: [
      "Matter includes the air around you, the water you drink, and the materials used to make a phone. Chemists investigate matter at scales ranging from visible objects to atoms and molecules. They use observations and experiments to build explanations that can be tested.",
      "A chemical change rearranges atoms into different substances. A physical change changes a material's form or state without changing which substance it is. This way of thinking connects chemistry to biology, medicine, engineering, cooking, and environmental science.",
    ],
    analogy: "A recipe describes ingredients and the changes they undergo while cooking. Chemistry asks what those ingredients are made of and why heating or mixing them produces a different result.",
    examples: ["Iron gradually forming rust is a chemical change.", "Ice melting is a physical change: the substance remains water."],
    equations: [{ label: "An example of a chemical change", formula: "4 Fe + 3 O₂ → 2 Fe₂O₃", note: "Iron reacts with oxygen to form iron(III) oxide, a major component of rust." }],
    quiz: [
      { prompt: "Which question is chemistry especially equipped to answer?", options: ["What particles make up a substance?", "How many people live in a city?", "Which language is oldest?"], answer: 0, explanation: "Chemistry studies the composition and behavior of matter." },
      { prompt: "When ice melts, has water become a new substance?", options: ["Yes, it becomes oxygen", "No, it is still water", "Yes, it becomes salt"], answer: 1, explanation: "Melting is a physical change; liquid water and ice are both H₂O." },
    ],
    references: [openStax("1-1-chemistry-in-context", "§1.1 Chemistry in Context"), openStax("1-3-physical-and-chemical-properties", "§1.3 Physical and Chemical Properties")],
  },
  {
    slug: "importance-of-chemistry",
    title: "Importance of Chemistry",
    description: "See how chemistry helps explain health, food, materials, and the environment.",
    definition: "Chemistry is important because it helps people understand and responsibly change the materials and reactions that affect daily life.",
    explanation: [
      "Chemistry supports the design of medicines, clean-water treatments, batteries, fertilizers, building materials, and safer household products. In each case, knowing which particles are present and how they react helps people predict a product's properties and improve how it is made.",
      "Chemistry also helps us measure pollution, compare energy sources, and understand processes in living things. A chemical explanation is not a guarantee that a product is safe or sustainable; evidence, dose, exposure, and environmental effects must also be considered.",
    ],
    analogy: "Chemistry is like a set of maps for materials. A map does not make the journey for you, but it helps you choose a route and anticipate what is ahead.",
    examples: ["Water treatment uses carefully controlled chemicals to remove contaminants.", "Battery researchers study reactions that move electrons and store usable energy."],
    equations: [{ label: "Making ammonia for many fertilizers", formula: "N₂ + 3 H₂ ⇌ 2 NH₃", note: "The Haber process combines nitrogen and hydrogen under industrially controlled conditions." }],
    quiz: [
      { prompt: "Why do chemists study a medicine's chemical properties?", options: ["To predict how it behaves and interacts", "To change the laws of motion", "To make every medicine identical"], answer: 0, explanation: "Composition and reactivity help researchers understand a medicine's behavior." },
      { prompt: "Does a useful chemical product automatically have no environmental impact?", options: ["Yes", "No; impact depends on evidence and use", "Only if it is a liquid"], answer: 1, explanation: "Benefits and risks depend on production, exposure, dose, and disposal." },
    ],
    references: [openStax("1-1-chemistry-in-context", "§1.1 Chemistry in Context"), { label: "NIST Chemistry WebBook", href: "https://webbook.nist.gov/chemistry/" }],
  },
  {
    slug: "matter-and-its-states",
    title: "Matter and Its States",
    description: "Compare solids, liquids, and gases by how their particles move.",
    definition: "Matter is anything that has mass and occupies space; its state describes how its particles are arranged and move.",
    explanation: [
      "In a solid, particles are close together and vibrate around fixed positions, so the object keeps its shape. In a liquid, particles remain close but can move past one another, so a liquid flows and takes the shape of its container. In a gas, particles are much farther apart and spread to fill their container.",
      "Heating or cooling can change the motion of particles and cause a phase change. Melting, freezing, evaporation, and condensation are physical changes: the particles are rearranged or move differently, but the substance's chemical identity stays the same.",
    ],
    analogy: "Imagine people in a hall: standing in assigned places resembles a solid, walking around while staying close resembles a liquid, and moving freely across a large field resembles a gas.",
    examples: ["Water can be ice, liquid water, or water vapor.", "A bicycle pump compresses air because gas particles have space between them."],
    equations: [{ label: "A physical change of state", formula: "H₂O(s) → H₂O(l)", note: "Solid water melts to liquid water; the formula remains H₂O." }],
    quiz: [
      { prompt: "Which state has a fixed volume but takes the shape of its container?", options: ["Solid", "Liquid", "Gas"], answer: 1, explanation: "A liquid flows while its particles remain close together." },
      { prompt: "Does evaporation turn water into a different chemical substance?", options: ["Yes", "No", "Only in a sealed jar"], answer: 1, explanation: "Evaporation changes the state, not the identity of H₂O." },
    ],
    references: [openStax("1-2-phases-and-classification-of-matter", "§1.2 Phases and Classification of Matter"), openStax("9-5-the-kinetic-molecular-theory", "§9.5 The Kinetic-Molecular Theory")],
  },
  {
    slug: "elements-compounds-mixtures",
    title: "Elements, Compounds and Mixtures",
    description: "Learn the difference between pure substances and physical combinations.",
    definition: "An element contains one kind of atom, a compound contains elements chemically bonded in a fixed ratio, and a mixture contains substances physically combined in variable proportions.",
    explanation: [
      "A sample of pure copper is an element because every copper atom is the same element. Water is a compound: each molecule has hydrogen and oxygen atoms bonded in a fixed ratio of two to one. The atoms in a compound do not keep all the properties of the separate elements.",
      "Air, salt water, and soil are mixtures. Their ingredients are not joined into one new substance, and the proportions can vary. Mixture components can often be separated using physical properties such as particle size, boiling point, or attraction to a surface.",
    ],
    analogy: "A compound is like a fixed-piece kit whose parts are joined into each unit. A mixture is like a bowl of different snacks: the portions can vary and the items can still be picked apart.",
    examples: ["Distilled water is a compound; tap water is a mixture of water and dissolved substances.", "Brass is a mixture (alloy) of copper and zinc."],
    equations: [{ label: "Water contains hydrogen and oxygen in a fixed ratio", formula: "2 H₂ + O₂ → 2 H₂O", note: "The product is a compound; the reactant gases are elements." }],
    quiz: [
      { prompt: "What makes a compound different from a mixture?", options: ["A compound has chemically bonded elements in fixed proportions", "A compound can only be a gas", "A mixture always contains exactly two substances"], answer: 0, explanation: "Compounds have fixed chemical composition; mixture composition can vary." },
      { prompt: "Is air usually a compound or a mixture?", options: ["A compound", "A mixture", "An element"], answer: 1, explanation: "Air contains several gases physically mixed together." },
    ],
    references: [openStax("1-2-phases-and-classification-of-matter", "§1.2 Phases and Classification of Matter"), openStax("2-6-ionic-and-molecular-compounds", "§2.6 Ionic and Molecular Compounds")],
  },
  {
    slug: "atomic-structure",
    title: "Atomic Structure",
    description: "Explore the nucleus, electrons, atomic number, and isotopes.",
    definition: "An atom is the smallest unit of an element that retains that element's chemical identity.",
    explanation: [
      "An atom has a tiny, dense nucleus containing positively charged protons and uncharged neutrons. Negatively charged electrons occupy regions around the nucleus. Almost all of an atom's mass is concentrated in its nucleus, while its size is mostly the space occupied by its electron cloud.",
      "The number of protons is the atomic number and identifies the element. Atoms of the same element can have different numbers of neutrons; these versions are called isotopes. In a neutral atom, the number of electrons equals the number of protons, but atoms can gain or lose electrons to form ions.",
    ],
    analogy: "A stadium is mostly open space around a tiny central stage. This is only a scale analogy, but it helps show why an atom's nucleus is small compared with the space occupied by its electrons.",
    examples: ["Every carbon atom has 6 protons; carbon-12 has 6 neutrons and carbon-14 has 8.", "A sodium atom that loses one electron becomes Na⁺."],
    equations: [{ label: "A neutral carbon-12 atom", formula: "¹²₆C: 6 protons, 6 neutrons, 6 electrons", note: "The lower number is the atomic number; the upper number is the mass number." }],
    quiz: [
      { prompt: "Which particle determines an atom's element?", options: ["Proton", "Neutron", "Electron"], answer: 0, explanation: "The proton count is the atomic number and defines the element." },
      { prompt: "What changes between isotopes of the same element?", options: ["Number of protons", "Number of neutrons", "Element name"], answer: 1, explanation: "Isotopes share proton count but differ in neutron count." },
    ],
    references: [openStax("2-3-atomic-structure-and-symbolism", "§2.3 Atomic Structure and Symbolism"), openStax("2-2-evolution-of-atomic-theory", "§2.2 Evolution of Atomic Theory")],
  },
  {
    slug: "the-periodic-table",
    title: "The Periodic Table",
    description: "Read element symbols and discover patterns across rows and columns.",
    definition: "The periodic table arranges elements by increasing atomic number so that repeating patterns in their properties become visible.",
    explanation: [
      "Each square gives information such as an element's name, symbol, and atomic number. Horizontal rows are periods; vertical columns are groups. Elements in a group often have similar chemical behavior because their outer electrons are arranged in related ways.",
      "Metals occupy most of the left and center of the table, nonmetals are mostly on the right, and metalloids lie near the zigzag boundary. These are broad patterns rather than rules without exceptions. The table helps chemists predict how an element may react and bond.",
    ],
    analogy: "The table is like a neighborhood map: nearby addresses share location patterns, and the column a house is in can hint at the community it belongs to.",
    examples: ["Lithium, sodium, and potassium are in Group 1 and are reactive metals.", "Helium and neon are in Group 18 and are generally unreactive gases."],
    equations: [{ label: "A periodic pattern in Group 1", formula: "2 Na + Cl₂ → 2 NaCl", note: "Sodium reacts with chlorine to form the ionic compound sodium chloride." }],
    quiz: [
      { prompt: "What does an element's atomic number count?", options: ["Protons", "Neutrons and electrons together", "Chemical bonds"], answer: 0, explanation: "Atomic number is the number of protons in the nucleus." },
      { prompt: "Where are elements with often-similar properties found?", options: ["In the same group (column)", "Only in the same period", "At random positions"], answer: 0, explanation: "Elements in the same group often have related outer-electron arrangements." },
    ],
    references: [openStax("2-5-the-periodic-table", "§2.5 The Periodic Table"), { label: "NIST Periodic Table of the Elements", href: "https://www.nist.gov/pml/periodic-table-elements" }],
  },
  {
    slug: "chemical-symbols-and-formulae",
    title: "Chemical Symbols and Formulae",
    description: "Decode element symbols, formula subscripts, and equation coefficients.",
    definition: "A chemical symbol names an element; a chemical formula shows which elements are in a substance and the relative number of their atoms or ions.",
    explanation: [
      "Element symbols use one or two letters: the first is capitalized and the second, if present, is lowercase. A formula's subscripts apply to the symbol immediately before them, while parentheses let a subscript apply to a whole group. If there is no subscript, the count is one.",
      "Coefficients written in front of formulas count whole particles or moles in a reaction. They multiply every atom in that formula. When balancing an equation, change coefficients—not subscripts—so the same number of each kind of atom appears on both sides.",
    ],
    analogy: "A formula is like a packed lunch label: the symbols name the ingredients and the subscripts state how many units of each are in one package.",
    examples: ["CO₂ has one carbon atom and two oxygen atoms per molecule.", "Ca(OH)₂ has one calcium, two oxygen, and two hydrogen atoms per formula unit."],
    equations: [{ label: "A coefficient counts whole molecules", formula: "2 H₂ + O₂ → 2 H₂O", note: "The coefficient 2 multiplies every atom in H₂O; the subscript 2 is part of the formula." }],
    quiz: [
      { prompt: "How many oxygen atoms are in one Ca(OH)₂ formula unit?", options: ["1", "2", "3"], answer: 1, explanation: "The subscript outside the parentheses multiplies the one oxygen inside: 2 oxygen atoms." },
      { prompt: "What may be changed to balance an equation?", options: ["Subscripts in formulas", "Coefficients before formulas", "Element symbols"], answer: 1, explanation: "Changing coefficients keeps the substances' identities unchanged." },
    ],
    references: [openStax("2-4-chemical-formulas", "§2.4 Chemical Formulas"), openStax("4-1-writing-and-balancing-chemical-equations", "§4.1 Writing and Balancing Chemical Equations")],
  },
  {
    slug: "chemical-bonding",
    title: "Chemical Bonding",
    description: "Understand how atoms form ionic, covalent, and metallic bonds.",
    definition: "A chemical bond is an attractive interaction that holds atoms or ions together in a more stable arrangement.",
    explanation: [
      "In an ionic bond, electrons are transferred from one atom to another, forming oppositely charged ions that attract. In a covalent bond, atoms share electron pairs. Metals have bonding in which some electrons are shared across many atoms, helping explain metals' ability to conduct electricity and bend without shattering.",
      "Bond type helps explain a substance's structure and properties, but real bonding can be more nuanced than three simple categories. A compound's formula tells which atoms or ions are present; its bonding and arrangement help determine melting point, conductivity, and other behavior.",
    ],
    analogy: "Ionic attraction is like two opposite ends of magnets pulling together. Covalent bonding is like two people sharing a tool. These comparisons describe one feature of a bond, not the full quantum picture.",
    examples: ["Sodium chloride forms a repeating ionic crystal of Na⁺ and Cl⁻ ions.", "Each water molecule has covalent O–H bonds."],
    equations: [{ label: "Sodium and chlorine form sodium chloride", formula: "2 Na + Cl₂ → 2 NaCl", note: "Sodium atoms form Na⁺ ions and chlorine atoms form Cl⁻ ions in the solid." }],
    quiz: [
      { prompt: "What happens to electrons in a covalent bond?", options: ["They are shared between atoms", "They disappear", "They turn into protons"], answer: 0, explanation: "Covalent bonds involve shared electron pairs." },
      { prompt: "Which particles attract in an ionic solid?", options: ["Like-charged ions", "Oppositely charged ions", "Only neutral neutrons"], answer: 1, explanation: "Positive and negative ions attract each other." },
    ],
    references: [openStax("7-1-ionic-bonding", "§7.1 Ionic Bonding"), openStax("7-2-covalent-bonding", "§7.2 Covalent Bonding")],
  },
  {
    slug: "acids-bases-and-salts",
    title: "Acids, Bases and Salts",
    description: "Explore pH, hydrogen-ion transfer, and neutralization reactions.",
    definition: "An acid donates hydrogen ions in a reaction, a base accepts hydrogen ions, and a salt is an ionic compound often formed when an acid and a base react.",
    explanation: [
      "In water, many acids increase the concentration of H₃O⁺ ions, while bases may accept H⁺ or increase OH⁻. The pH scale describes acidity in dilute aqueous solutions: lower pH is more acidic, pH 7 is neutral at about 25 °C, and higher pH is more basic. Concentration and temperature matter, so pH is not a measure of how strong or dangerous a substance is by itself.",
      "When an acid and base react, their characteristic ions can form water; the remaining ions may form a salt. Not every acid-base reaction goes exactly to completion, but the simple neutralization equation is a useful first model. Never taste or mix household chemicals to identify them.",
    ],
    analogy: "Think of a hydrogen ion as a small parcel: an acid can hand it over, while a base can receive it. The analogy describes proton transfer, not the full behavior of ions in water.",
    examples: ["Antacid tablets contain bases that react with some excess stomach acid.", "Acidic rainwater can react with carbonate rocks such as limestone."],
    equations: [{ label: "A common neutralization reaction", formula: "HCl + NaOH → NaCl + H₂O", note: "Hydrochloric acid reacts with sodium hydroxide to produce sodium chloride and water." }, { label: "Net ionic form", formula: "H⁺ + OH⁻ → H₂O", note: "This simplified equation shows the water-forming part of the reaction." }],
    quiz: [
      { prompt: "At about 25 °C, which pH is acidic?", options: ["3", "7", "11"], answer: 0, explanation: "An aqueous pH below 7 is acidic under these conditions." },
      { prompt: "What are the products in the model reaction HCl + NaOH?", options: ["NaCl and water", "Sodium and oxygen", "Hydrogen and chlorine"], answer: 0, explanation: "The acid and base form sodium chloride and water." },
    ],
    references: [openStax("14-1-bronsted-lowry-acids-and-bases", "§14.1 Brønsted-Lowry Acids and Bases"), openStax("14-2-ph-and-poh", "§14.2 pH and pOH"), openStax("14-4-hydrolysis-of-salts", "§14.4 Hydrolysis of Salts")],
  },
  {
    slug: "chemical-reactions",
    title: "Chemical Reactions",
    description: "Follow how atoms rearrange when reactants become products.",
    definition: "A chemical reaction is a process in which atoms in starting substances rearrange to form different substances.",
    explanation: [
      "The substances present at the beginning are reactants; those formed are products. Evidence may include a lasting color change, gas formation, a temperature change, or a solid forming from solution. Any one observation alone is not always proof of a reaction, so chemists look at the whole experiment.",
      "Atoms are conserved in an ordinary chemical reaction: they are rearranged, not created or destroyed. A chemical equation uses formulas to summarize the change. It must be balanced so each element has the same number of atoms on both sides.",
    ],
    analogy: "A reaction resembles rebuilding with the same set of LEGO bricks: the arrangement changes, but the bricks are still accounted for.",
    examples: ["Cooking an egg involves many chemical reactions that change its proteins.", "Vinegar and baking soda react and produce carbon dioxide gas."],
    equations: [{ label: "Combustion of methane", formula: "CH₄ + 2 O₂ → CO₂ + 2 H₂O", note: "One carbon, four hydrogen, and four oxygen atoms appear on each side." }],
    quiz: [
      { prompt: "What are the starting substances in a chemical equation called?", options: ["Products", "Reactants", "Catalysts only"], answer: 1, explanation: "Reactants are the starting substances." },
      { prompt: "What happens to atoms in a typical chemical reaction?", options: ["They are rearranged", "They vanish", "They change into different elements"], answer: 0, explanation: "Chemical reactions rearrange atoms; nuclear reactions are a different process." },
    ],
    references: [openStax("4-2-classifying-chemical-reactions", "§4.2 Classifying Chemical Reactions"), openStax("4-1-writing-and-balancing-chemical-equations", "§4.1 Writing and Balancing Chemical Equations")],
  },
  {
    slug: "balancing-chemical-equations",
    title: "Balancing Chemical Equations",
    description: "Use coefficients to account for every atom in a reaction.",
    definition: "Balancing a chemical equation means choosing coefficients so each element has the same number of atoms on both sides.",
    explanation: [
      "Start by counting each kind of atom in the reactants and products. Adjust coefficients in front of complete formulas until the counts match. A coefficient multiplies every atom in that formula, including atoms inside parentheses. It is often helpful to balance a complex compound first and leave hydrogen and oxygen until later.",
      "Do not change subscripts to balance an equation: a subscript changes the identity of a substance. Once the counts match, reduce the coefficients to the smallest whole-number ratio and check every element again.",
    ],
    analogy: "Balancing is like checking both sides of an inventory sheet: every type of item must be accounted for before and after the exchange.",
    examples: ["In 2 H₂ + O₂ → 2 H₂O, the left and right each contain four H atoms and two O atoms.", "In 4 Fe + 3 O₂ → 2 Fe₂O₃, each side has four Fe atoms and six O atoms."],
    equations: [{ label: "Balance iron reacting with oxygen", formula: "4 Fe + 3 O₂ → 2 Fe₂O₃", note: "The coefficients balance both iron and oxygen while keeping each formula unchanged." }],
    quiz: [
      { prompt: "What is the balanced coefficient for O₂ in Fe + O₂ → Fe₂O₃?", options: ["1", "2", "3"], answer: 2, explanation: "The balanced equation is 4 Fe + 3 O₂ → 2 Fe₂O₃." },
      { prompt: "Why should you not change a formula's subscripts when balancing?", options: ["It changes the substance", "It changes the arrow", "Subscripts are decorative"], answer: 0, explanation: "Changing subscripts changes the chemical identity of the formula." },
    ],
    references: [openStax("4-1-writing-and-balancing-chemical-equations", "§4.1 Writing and Balancing Chemical Equations")],
  },
  {
    slug: "mole-concept",
    title: "Mole Concept",
    description: "Connect the tiny scale of particles to measurable amounts of substance.",
    definition: "A mole is the SI unit for amount of substance; one mole contains exactly 6.02214076 × 10²³ specified particles.",
    explanation: [
      "Atoms and molecules are too small to count one by one in a laboratory. The mole is a counting unit, like a dozen but vastly larger. The word “particles” must be specified: a mole of water molecules and a mole of sodium ions contain the same number of entities, but have different masses.",
      "Molar mass links moles to mass. For a pure sample, the number of moles equals its measured mass divided by its molar mass. A chemical equation's coefficients then describe ratios of moles that react or form.",
    ],
    analogy: "A dozen lets a shopkeeper count eggs by groups instead of individually. Chemists use the mole for the same reason, with an enormous group size suited to atoms.",
    examples: ["One mole of carbon-12 atoms has a mass of about 12 grams.", "Water has a molar mass of about 18.02 g/mol, so 18.02 g is about one mole of H₂O."],
    equations: [{ label: "Convert mass to amount", formula: "n = m ÷ M", note: "n is amount in moles, m is mass, and M is molar mass." }, { label: "The particle count in one mole", formula: "1 mol = 6.02214076 × 10²³ entities", note: "This exact number is the Avogadro constant." }],
    quiz: [
      { prompt: "About how many particles are in one mole?", options: ["6.022 × 10²³", "100", "3.14"], answer: 0, explanation: "One mole contains exactly 6.02214076 × 10²³ specified entities." },
      { prompt: "How do you calculate moles from mass and molar mass?", options: ["n = m ÷ M", "n = m + M", "n = M ÷ m"], answer: 0, explanation: "Divide the sample's mass by the molar mass." },
    ],
    references: [openStax("3-1-formula-mass-and-the-mole-concept", "§3.1 Formula Mass and the Mole Concept"), openStax("3-2-determining-empirical-and-molecular-formulas", "§3.2 Determining Empirical and Molecular Formulas")],
  },
  {
    slug: "chemical-calculations",
    title: "Chemical Calculations",
    description: "Use units, formulas, and reaction ratios to solve chemistry problems.",
    definition: "Chemical calculations use measured quantities and chemical relationships to find an unknown amount of a substance.",
    explanation: [
      "A reliable calculation starts by writing down what is known, what is sought, and the units. Convert quantities to compatible units before using a formula. For example, mass can be converted to moles with molar mass, while a balanced equation provides mole ratios between reactants and products.",
      "Keep units through every step and check whether the result is reasonable. A balanced equation gives ratios, not masses directly; molar masses are needed to move between mass and amount. Measurements also have precision limits, so a calculated answer should not imply more certainty than the data support.",
    ],
    analogy: "A calculation is like following a map with unit signs at every turn. Units reveal whether a step takes you toward the destination or sends you the wrong way.",
    examples: ["If 2 mol of H₂ react completely with enough O₂, the equation predicts 2 mol of H₂O.", "A 10 g sample with molar mass 20 g/mol contains 0.50 mol."],
    equations: [{ label: "Use a balanced equation's mole ratio", formula: "2 H₂ + O₂ → 2 H₂O", note: "The coefficients show a 2:1:2 mole ratio for hydrogen, oxygen, and water." }, { label: "Mass, amount, and molar mass", formula: "n = m ÷ M", note: "Use consistent units, such as grams and grams per mole." }],
    quiz: [
      { prompt: "What quantity do coefficients in a balanced equation directly compare?", options: ["Mole amounts", "Temperatures", "Colors"], answer: 0, explanation: "Coefficients give ratios of particles and moles in the reaction." },
      { prompt: "A 12 g sample has a molar mass of 24 g/mol. How many moles?", options: ["0.5 mol", "2 mol", "36 mol"], answer: 0, explanation: "n = m ÷ M = 12 ÷ 24 = 0.5 mol." },
    ],
    references: [openStax("4-3-reaction-stoichiometry", "§4.3 Reaction Stoichiometry"), openStax("3-1-formula-mass-and-the-mole-concept", "§3.1 Formula Mass and the Mole Concept")],
  },
  {
    slug: "gas-laws",
    title: "Gas Laws",
    description: "Relate gas pressure, volume, temperature, and amount.",
    definition: "Gas laws are mathematical relationships that describe how a gas's pressure, volume, temperature, and amount change together.",
    explanation: [
      "Gas particles move continually and collide with their container. Those collisions create pressure. For a fixed amount of gas at constant temperature, reducing the volume makes collisions with the walls more frequent and pressure rises. At constant pressure, heating a gas tends to increase its volume.",
      "The ideal gas equation, PV = nRT, links pressure, volume, amount, and absolute temperature. It is a useful model when particles are far apart and intermolecular forces are small. Real gases can depart from the model at high pressure or low temperature.",
    ],
    analogy: "Imagine bouncing balls in a box. A smaller box causes more wall collisions per second; faster-moving balls, like warmer gas particles, also collide more forcefully.",
    examples: ["A sealed, heated aerosol can can become dangerous as gas pressure rises; do not heat it.", "A hot-air balloon rises because warmed air is less dense than surrounding cooler air."],
    equations: [{ label: "Ideal gas law", formula: "PV = nRT", note: "Use absolute temperature in kelvin and units consistent with the chosen gas constant R." }, { label: "Boyle's law at fixed temperature and amount", formula: "P₁V₁ = P₂V₂", note: "Pressure and volume vary inversely in this restricted situation." }],
    quiz: [
      { prompt: "At constant temperature, what happens to gas pressure if volume decreases?", options: ["It usually increases", "It becomes zero", "It is always unchanged"], answer: 0, explanation: "The particles collide with the smaller container more frequently." },
      { prompt: "What temperature scale is used in the ideal gas law?", options: ["Kelvin", "Celsius only", "Fahrenheit"], answer: 0, explanation: "Absolute temperature in kelvin is required." },
    ],
    references: [openStax("9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law", "§9.2 The Ideal Gas Law"), openStax("9-5-the-kinetic-molecular-theory", "§9.5 The Kinetic-Molecular Theory")],
  },
  {
    slug: "electrolysis",
    title: "Electrolysis",
    description: "Learn how electrical energy can drive a chemical change.",
    definition: "Electrolysis uses an external electrical current to drive a chemical reaction that would not proceed on its own under the same conditions.",
    explanation: [
      "An electrolytic cell has two electrodes in an electrolyte. The power supply pushes electrons through the external circuit; ions move through the liquid to balance charge. Reduction occurs at the cathode and oxidation at the anode. These names remain true for all electrochemical cells, even though the signs of the electrodes differ between cell types.",
      "Electrolysis can split compounds, coat objects with a thin metal layer, or help extract metals. The exact products depend on the substances present, the electrode materials, and operating conditions. Pure water conducts poorly, so practical water electrolysis uses an electrolyte and suitable equipment.",
    ],
    analogy: "A power supply is like a pump pushing charge around a loop; ions in the electrolyte help complete the circuit while reactions occur at the electrodes.",
    examples: ["Electroplating can coat a metal object with a thin layer of another metal.", "Industrial electrolysis is used to produce some important chemicals and metals."],
    equations: [{ label: "Overall water-splitting equation", formula: "2 H₂O(l) → 2 H₂(g) + O₂(g)", note: "This is an overall reaction; practical systems require suitable electrodes and an electrolyte." }],
    quiz: [
      { prompt: "What supplies the energy for electrolysis?", options: ["An external electrical source", "A magnet alone", "No energy input"], answer: 0, explanation: "The current drives a nonspontaneous chemical change." },
      { prompt: "At which electrode does reduction occur?", options: ["Cathode", "Anode", "Neither"], answer: 0, explanation: "Reduction always occurs at the cathode." },
    ],
    references: [openStax("17-7-electrolysis", "§17.7 Electrolysis"), openStax("17-1-review-of-redox-chemistry", "§17.1 Review of Redox Chemistry")],
  },
  {
    slug: "oxidation-and-reduction",
    title: "Oxidation and Reduction (Redox Reactions)",
    description: "Track electron transfer and changes in oxidation state.",
    definition: "A redox reaction includes oxidation and reduction: electrons are lost by one species and gained by another.",
    explanation: [
      "Oxidation means loss of electrons; reduction means gain. The two processes occur together because electrons released by one species must be accepted by another. Oxidation states are bookkeeping values that help identify which atoms have been oxidized or reduced, even when electrons are not transferred as isolated particles.",
      "The memory aid OIL RIG means Oxidation Is Loss and Reduction Is Gain of electrons. In a redox equation, count atoms and charge as well as electrons. Redox reactions power batteries, contribute to corrosion, and occur in combustion and biological energy pathways.",
    ],
    analogy: "Think of electrons like tokens passed between teams: the team that gives tokens is oxidized, while the team that receives them is reduced.",
    examples: ["Rusting involves iron losing electrons as oxygen-containing species are reduced.", "A battery generates useful electrical energy through separated oxidation and reduction steps."],
    equations: [{ label: "Zinc displaces copper ions", formula: "Zn + Cu²⁺ → Zn²⁺ + Cu", note: "Zinc is oxidized; copper ions are reduced." }, { label: "Electron bookkeeping", formula: "Zn → Zn²⁺ + 2 e⁻;   Cu²⁺ + 2 e⁻ → Cu", note: "The electrons lost and gained balance." }],
    quiz: [
      { prompt: "What happens to electrons during oxidation?", options: ["They are lost", "They are gained", "They become neutrons"], answer: 0, explanation: "Oxidation is loss of electrons." },
      { prompt: "In Zn + Cu²⁺ → Zn²⁺ + Cu, which species is reduced?", options: ["Zn", "Cu²⁺", "Both are reduced"], answer: 1, explanation: "Cu²⁺ gains electrons to form Cu." },
    ],
    references: [openStax("17-1-review-of-redox-chemistry", "§17.1 Review of Redox Chemistry"), openStax("17-5-batteries-and-fuel-cells", "§17.5 Batteries and Fuel Cells")],
  },
  {
    slug: "metals-and-non-metals",
    title: "Metals and Non-metals",
    description: "Compare broad physical and chemical patterns across the periodic table.",
    definition: "Metals and nonmetals are broad classes of elements with different typical physical properties and patterns of chemical behavior.",
    explanation: [
      "Many metals are shiny, conduct heat and electricity, and can be shaped. Many nonmetals are poorer conductors and, when solid, may be brittle. These are tendencies, not absolute rules: mercury is a liquid metal at room temperature, and graphite is a carbon form that conducts electricity.",
      "Metals often lose electrons to form positive ions; nonmetals often gain electrons or share electrons in covalent bonds. Metalloids near the boundary show a mixture of properties. The periodic table is a guide to patterns, while the specific element and conditions determine actual behavior.",
    ],
    analogy: "Think of the periodic table as a landscape with neighborhoods, not a row of identical houses: nearby elements often share traits, but each still has its own details.",
    examples: ["Copper is a good electrical conductor and is used in wiring.", "Oxygen is a nonmetal gas that supports many combustion reactions."],
    equations: [{ label: "Magnesium forms magnesium oxide", formula: "2 Mg + O₂ → 2 MgO", note: "Magnesium is a metal; oxygen is a nonmetal." }],
    quiz: [
      { prompt: "Which is a common property of many metals?", options: ["Good electrical conductivity", "Always a gas at room temperature", "Cannot form compounds"], answer: 0, explanation: "Many metals conduct electricity, though properties vary by element." },
      { prompt: "Are all nonmetals gases?", options: ["Yes", "No; some are solids or liquids", "Only at night"], answer: 1, explanation: "Nonmetals occur in different states; bromine is liquid and carbon is solid at room temperature." },
    ],
    references: [openStax("18-2-occurrence-and-preparation-of-the-representative-metals", "§18.2 Representative Metals"), openStax("18-4-structure-and-general-properties-of-the-nonmetals", "§18.4 Nonmetals"), { label: "NIST Periodic Table of the Elements", href: "https://www.nist.gov/pml/periodic-table-elements" }],
  },
  {
    slug: "organic-chemistry",
    title: "Organic Chemistry",
    description: "Explore the structures and reactions of carbon-containing molecules.",
    definition: "Organic chemistry studies carbon compounds, especially the molecules built from carbon frameworks and their reactions.",
    explanation: [
      "Carbon can form four covalent bonds and link to itself in chains, branches, and rings. This flexibility gives rise to a vast range of molecules with different shapes and properties. Organic compounds are important in medicines, fuels, plastics, foods, dyes, and living systems.",
      "Not every carbon-containing substance is classed as organic; carbon dioxide and many carbonates are common inorganic examples. Organic chemists often focus on functional groups—small arrangements of atoms that influence a molecule's characteristic reactions.",
    ],
    analogy: "Carbon atoms are like connectors with several attachment points: they can build many different frameworks, and attaching different groups changes how each framework behaves.",
    examples: ["Ethanol is used as a solvent and is present in alcoholic beverages.", "Cellulose, fats, and many medicines are organic substances with different structures and functions."],
    equations: [{ label: "Combustion of ethanol", formula: "C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O", note: "Combustion rearranges atoms to form carbon dioxide and water." }],
    quiz: [
      { prompt: "Why can carbon form many different organic structures?", options: ["It can form several covalent bonds, including bonds to itself", "It has no electrons", "It only forms ionic crystals"], answer: 0, explanation: "Carbon's bonding allows chains, branches, rings, and varied functional groups." },
      { prompt: "Is carbon dioxide usually classified as an organic compound?", options: ["Yes", "No", "Only when frozen"], answer: 1, explanation: "CO₂ is a common inorganic carbon compound." },
    ],
    references: [openStax("20-introduction", "Chapter 20 Organic Chemistry"), openStax("20-1-hydrocarbons", "§20.1 Hydrocarbons")],
  },
  {
    slug: "hydrocarbons",
    title: "Hydrocarbons",
    description: "Meet compounds made only from carbon and hydrogen.",
    definition: "A hydrocarbon is an organic compound made only of carbon and hydrogen atoms.",
    explanation: [
      "Alkanes contain only single carbon-carbon bonds; open-chain alkanes follow the general formula CₙH₂ₙ₊₂. Alkenes contain at least one carbon-carbon double bond, while alkynes contain at least one triple bond. Rings and multiple bonds change the formula patterns, so identify the structure before applying a general formula.",
      "Hydrocarbons are used as fuels and as feedstocks for making many materials. Combustion requires oxygen and releases energy; complete combustion forms carbon dioxide and water, while insufficient oxygen can produce carbon monoxide or soot. Carbon monoxide is poisonous, so fuel-burning appliances require proper ventilation and maintenance.",
    ],
    analogy: "A carbon skeleton is like a chain made from clip-together links; hydrogen atoms fill available attachment points, while double or triple links change the chain's shape and reactivity.",
    examples: ["Methane is a one-carbon alkane and a major component of natural gas.", "Ethene is an alkene used to make polyethylene."],
    equations: [{ label: "Complete combustion of propane", formula: "C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", note: "The equation is balanced for carbon, hydrogen, and oxygen atoms." }],
    quiz: [
      { prompt: "Which elements are present in a hydrocarbon?", options: ["Carbon and hydrogen only", "Carbon and oxygen only", "Any three elements"], answer: 0, explanation: "Hydrocarbons contain only carbon and hydrogen." },
      { prompt: "Which bond is characteristic of an alkene?", options: ["At least one carbon-carbon double bond", "Only ionic bonds", "No carbon-carbon bonds"], answer: 0, explanation: "Alkenes contain a carbon-carbon double bond." },
    ],
    references: [openStax("20-1-hydrocarbons", "§20.1 Hydrocarbons"), openStax("4-2-classifying-chemical-reactions", "§4.2 Classifying Chemical Reactions")],
  },
  {
    slug: "separation-techniques",
    title: "Separation Techniques",
    description: "Choose a physical method to separate the parts of a mixture.",
    definition: "A separation technique isolates components of a mixture by using differences in their physical properties.",
    explanation: [
      "Filtration separates an insoluble solid from a fluid using a porous barrier. Distillation separates substances using differences in boiling behavior: a vapor is collected and condensed. Evaporation can recover a dissolved solid, while chromatography separates substances that travel differently through a material.",
      "The best method depends on the mixture and the property that differs. Some samples need several steps, such as filtering sand from salt water and then evaporating the water to recover salt. Separation usually changes where substances are found, not their chemical identities.",
    ],
    analogy: "Sorting a mixed box by size, shape, or magnetism uses a different feature for each step. Laboratory separation similarly depends on a property that differs between components.",
    examples: ["A coffee filter separates coffee grounds from brewed liquid.", "Distillation can separate liquid mixtures when their components have different boiling behavior."],
    equations: [{ label: "Separation is not itself a reaction", formula: "Mixture → separated components", note: "No new chemical formula is required; each component retains its identity." }],
    quiz: [
      { prompt: "Which method is commonly used to remove insoluble sand from water?", options: ["Filtration", "Combustion", "Neutralization"], answer: 0, explanation: "A filter traps the insoluble sand while water passes through." },
      { prompt: "What property does simple distillation use?", options: ["Different boiling behavior", "Different names", "Different colors only"], answer: 0, explanation: "Distillation relies on vaporization and condensation behavior." },
    ],
    references: [openStax("1-2-phases-and-classification-of-matter", "§1.2 Phases and Classification of Matter"), openStax("1-3-physical-and-chemical-properties", "§1.3 Physical and Chemical Properties")],
  },
];
