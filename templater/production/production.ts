import { header } from "./header";

type SchoolMealProduction = {
  nameSchool: string;
  nameWeek: string;
  days: {
    name: string;
    date: string; // YYYY-MM-DD
    available: boolean;
  }[];
  groups: {
    name: string; // e.g. "Aucun Groupe", "Lieu A", …
    id: string; // e.g. "g1", "g2", …
  }[];
  meals: {
    date: string; // YYYY-MM-DD
    type: "DESSERT" | "MAIN";
    groupId: string; // must match one of groups[].id, or e.g. '+' for the dessert column
    quantityRegular: number; // number of regular servings
    quantityPortionPlus?: number;
  }[];
};

/** simple helper to format an ISO date into "lundi 21 avril 2025" */
function formatDate(frDate: string) {
  const d = new Date(frDate);
  return d.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const schoolMealProductionSeed: SchoolMealProduction[] = [
  {
    nameSchool: "École De la Rochebelle St‑Aimée du lac des signes",
    nameWeek: "du 21 avril 2025 au 25 avril 2025",
    days: [
      { name: "Lundi", date: "2025-04-21", available: false },
      { name: "Mardi", date: "2025-04-22", available: true },
      { name: "Mercredi", date: "2025-04-23", available: true },
      { name: "Jeudi", date: "2025-04-24", available: true },
      { name: "Vendredi", date: "2025-04-25", available: true },
    ],
    groups: [
      { id: "g0", name: "Aucun Groupe" },
      { id: "g1", name: "Lieu A" },
      { id: "g2", name: "Lieu B" },
    ],
    meals: [
      // Mardi 22 avril
      { date: "2025-04-22", type: "MAIN", groupId: "g0", quantityRegular: 0 },
      { date: "2025-04-22", type: "MAIN", groupId: "g1", quantityRegular: 20 },
      { date: "2025-04-22", type: "MAIN", groupId: "g2", quantityRegular: 20 },
      {
        date: "2025-04-22",
        type: "DESSERT",
        groupId: "+",
        quantityRegular: 15,
      },

      // Mercredi 23 avril
      { date: "2025-04-23", type: "MAIN", groupId: "g0", quantityRegular: 10 },
      { date: "2025-04-23", type: "MAIN", groupId: "g1", quantityRegular: 0 },
      { date: "2025-04-23", type: "MAIN", groupId: "g2", quantityRegular: 5 },
      {
        date: "2025-04-23",
        type: "DESSERT",
        groupId: "+",
        quantityRegular: 40,
      },

      // Jeudi 24 avril
      { date: "2025-04-24", type: "MAIN", groupId: "g0", quantityRegular: 10 },
      { date: "2025-04-24", type: "MAIN", groupId: "g1", quantityRegular: 50 },
      { date: "2025-04-24", type: "MAIN", groupId: "g2", quantityRegular: 30 },
      {
        date: "2025-04-24",
        type: "DESSERT",
        groupId: "+",
        quantityRegular: 25,
      },

      // Vendredi 25 avril
      { date: "2025-04-25", type: "MAIN", groupId: "g0", quantityRegular: 5 },
      { date: "2025-04-25", type: "MAIN", groupId: "g1", quantityRegular: 100 },
      { date: "2025-04-25", type: "MAIN", groupId: "g2", quantityRegular: 20 },
      {
        date: "2025-04-25",
        type: "DESSERT",
        groupId: "+",
        quantityRegular: 10,
      },
    ],
  },
];

export function renderProductionReport(s: SchoolMealProduction[]) {
  let html = "";
  for (const school of s) {
    html += renderSchoolTable(school);
  }
  return header(html);
}

function renderSchoolTable(s: SchoolMealProduction): string {
  const { nameSchool, nameWeek, days, groups, meals } = s;
  let html = "";

  html += `<div class="page">`;

  html += tableTitle({
    nameSchool: nameSchool,
    nameWeek: nameWeek,
  });

  html += `<table class="by-school">`;

  // Table content here
  html += tableContents(s);

  html += `</table>`;
  html += `</div>`;

  return html;
}

type TableHeaderProps = {
  nameSchool: string;
  nameWeek: string;
};

function tableTitle(props: TableHeaderProps) {
  const html = String.raw;

  return html`
    <h1>${props.nameSchool}</h1>
    <div class="meta">Semaine: <strong>du ${props.nameWeek}</strong><br /></div>
  `;
}

function tableContents(props: SchoolMealProduction) {
  const html = String.raw;

  let date = (date: string) => html` <th colspan="5">${formatDate(date)}</th> `;

  let content = html`
    <table class="by-school">
      <thead>
        <tr>
          <th rowspan="2">Lieu</th>
          ${props.days.map((day) => date(day.date)).join("")}
        </tr>
        <tr></tr>
      </thead>
    </table>
  `;

  return content;
}
