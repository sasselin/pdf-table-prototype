import { VerificationMealProduction } from "./verification";

const pouletRoti = {
  id: "poulet-roti",
  type: "MAIN",
  name: "Poulet rôtis",
} as const;

const sandwichPoulet = {
  id: "sandwich-poulet",
  type: "MAIN",
  name: "Sandwich au poulet",
} as const;

const boulettesViande = {
  id: "boulettesViande",
  type: "MAIN",
  name: "Boulettes a la viande",
} as const;

const macaroniFromage = {
  id: "macaroniFromage",
  type: "MAIN",
  name: "Macaroni au fromage",
} as const;

const quicheLegumes = {
  id: "quiche-legumes",
  type: "MAIN",
  name: "Quiche aux légumes",
} as const;

const chiliSinCarne = {
  id: "chili-sin-carne",
  type: "MAIN",
  name: "Chili sin carne",
} as const;

const gratinDauphinois = {
  id: "gratin-dauphinois",
  type: "MAIN",
  name: "Gratin dauphinois",
} as const;

const pizzaVegetarienne = {
  id: "pizza-vegetarienne",
  type: "MAIN",
  name: "Pizza végétarienne",
} as const;

const tajinePoulet = {
  id: "tajine-poulet",
  type: "MAIN",
  name: "Tajine de poulet",
} as const;

const curryLegumes = {
  id: "curry-legumes",
  type: "MAIN",
  name: "Curry de légumes",
} as const;

const risottoChampignons = {
  id: "risotto-champignons",
  type: "MAIN",
  name: "Risotto aux champignons",
} as const;

const omeletteFromage = {
  id: "omelette-fromage",
  type: "MAIN",
  name: "Omelette au fromage",
} as const;

const paellaVegetarienne = {
  id: "paella-vegetarienne",
  type: "MAIN",
  name: "Paëlla végétarienne",
} as const;

/// desserts

const dessertGateauCarottes = {
  id: "gateau-carottes",
  type: "DESSERT",
  name: "Gateaux au carottes",
} as const;

const dessertTartePommes = {
  id: "tarte-pommes",
  type: "DESSERT",
  name: "Tarte aux pommes",
} as const;

const dessertMousseChocolat = {
  id: "mousse-chocolat",
  type: "DESSERT",
  name: "Mousse au chocolat",
} as const;

const dessertCremeBrulee = {
  id: "creme-brulee",
  type: "DESSERT",
  name: "Crème brûlée",
} as const;

const dessertClafoutisCerises = {
  id: "clafoutis-cerises",
  type: "DESSERT",
  name: "Clafoutis aux cerises",
} as const;

const dessertRizAuLait = {
  id: "riz-au-lait",
  type: "DESSERT",
  name: "Riz au lait",
} as const;

const example = {
  nameSchool: "École De la Rochebelle St‑Aimée du lac des signes",
  days: [
    { date: "2025-04-21", available: false },
    { date: "2025-04-23", available: true },
    { date: "2025-04-22", available: true },
    { date: "2025-04-24", available: true },
    { date: "2025-04-25", available: true },
  ],
  buildings: [
    {
      id: "b1",
      name: "building 1",
    },
    {
      id: "b2",
      name: "building 2",
    },
  ],
  groups: [
    {
      id: "g0",
      name: "Super Groupe",
      service: "SERVICE-1",
      buildingId: "b1",
      shippingDetails: "example",
    },
    {
      id: "g1",
      name: "Groupe des raisins",
      service: "SERVICE-2",
      buildingId: "b2",
      shippingDetails: "example",
    },
  ],
  meals: [
    // Mardi 22 avril ========================================
    // groupe 0
    {
      date: "2025-04-22",
      groupId: "g0",
      quantityRegular: 1,
      quantityPortionPlus: 2,
      code: "C",
      ...pouletRoti,
    },
    {
      date: "2025-04-22",
      groupId: "g0",
      quantityRegular: 10,
      code: "A",
      ...quicheLegumes,
    },
    {
      date: "2025-04-22",
      groupId: "g0",
      quantityRegular: 100,
      code: "A",
      ...dessertGateauCarottes,
    },
    // groupe 1
    {
      date: "2025-04-22",
      groupId: "g1",
      quantityRegular: 2,
      quantityPortionPlus: 2,
      code: "C",
      ...pouletRoti,
    },
    {
      date: "2025-04-22",
      groupId: "g1",
      quantityRegular: 20,
      code: "A",
      ...quicheLegumes,
    },
    {
      date: "2025-04-22",
      groupId: "g1",
      quantityRegular: 200,
      code: "A",
      ...dessertGateauCarottes,
    },

    // Mercredi 23 avril ========================================
    {
      date: "2025-04-23",
      groupId: "g0",
      quantityRegular: 3,
      code: "A",
      ...sandwichPoulet,
    },
    {
      date: "2025-04-23",
      groupId: "g0",
      quantityRegular: 30,
      code: "A",
      ...chiliSinCarne,
    },
    {
      date: "2025-04-23",
      groupId: "g0",
      quantityRegular: 300,
      code: "A",
      ...dessertTartePommes,
    },
    {
      date: "2025-04-23",
      groupId: "g1",
      quantityRegular: 4,
      code: "A",
      ...sandwichPoulet,
    },
    {
      date: "2025-04-23",
      groupId: "g1",
      quantityRegular: 40,
      code: "A",
      ...chiliSinCarne,
    },
    {
      date: "2025-04-23",
      groupId: "g1",
      quantityRegular: 400,
      code: "A",
      ...dessertTartePommes,
    },

    // Jeudi 24 avril ========================================
    {
      date: "2025-04-24",
      groupId: "g0",
      quantityRegular: 5,
      code: "A",
      ...boulettesViande,
    },
    {
      date: "2025-04-24",
      groupId: "g0",
      quantityRegular: 50,
      code: "A",
      ...gratinDauphinois,
    },
    {
      date: "2025-04-24",
      groupId: "g0",
      quantityRegular: 500,
      code: "A",
      ...dessertTartePommes,
    },
    {
      date: "2025-04-24",
      groupId: "g1",
      quantityRegular: 6,
      code: "A",
      ...boulettesViande,
    },
    {
      date: "2025-04-24",
      groupId: "g1",
      quantityRegular: 60,
      code: "A",
      ...gratinDauphinois,
    },
    {
      date: "2025-04-24",
      groupId: "g1",
      quantityRegular: 600,
      code: "A",
      ...dessertTartePommes,
    },

    // Vendredi 25 avril ========================================
    {
      date: "2025-04-25",
      quantityRegular: 7,
      groupId: "g0",
      code: "A",
      ...macaroniFromage,
    },
    {
      date: "2025-04-25",
      quantityRegular: 70,
      groupId: "g0",
      code: "A",
      ...pizzaVegetarienne,
    },
    {
      date: "2025-04-25",
      quantityRegular: 700,
      groupId: "g0",
      code: "A",
      ...dessertMousseChocolat,
    },
    {
      date: "2025-04-25",
      quantityRegular: 8,
      groupId: "g1",
      code: "A",
      ...macaroniFromage,
    },
    {
      date: "2025-04-25",
      quantityRegular: 80,
      groupId: "g1",
      code: "A",
      ...pizzaVegetarienne,
    },
    {
      date: "2025-04-25",
      quantityRegular: 800,
      groupId: "g1",
      code: "A",
      ...dessertMousseChocolat,
    },
  ],
};

export const schoolVerificationSeed: VerificationMealProduction[] = [example];
