export type SchoolDistributionOrder = {
  date: string; // YYYY-MM-DD
  groupId: string;
  beneficiaryId: string;
  service?: string;
  nameBeneficiary: string;
  nameMeal: string;
  nameDessert: string;
  code: string;
  portionPlus: boolean;
};

export type SchoolDistributionPayload = {
  generatedAt: Date;
  generatedBy: string;
  groups: SchoolDistributionGroup[];
  days: {
    date: string; // YYYY-MM-DD
    available: boolean;
    incomplete: boolean;
  }[];
  meals: SchoolDistributionOrder[];
};

export type SchoolDistributionGroup = {
  name: string; // e.g. "Aucun Groupe", "Lieu A", …
  id: string; // e.g. "g1", "g2", …
  service?: string;
};

// @TODO MOVE SIMILAR FUNCTIONS TO HELPERS
export const schoolDistributionPayload: SchoolDistributionPayload = {
  generatedAt: new Date(),
  generatedBy: "Monsieur test",
  groups: [
    { id: "g0", name: "Aucun Groupe", service: "1" },
    { id: "g1", name: "Groupe des raisins", service: "2" },
  ],
  days: [
    { date: "2025-04-21", available: false, incomplete: false },
    { date: "2025-04-23", available: true, incomplete: false },
    { date: "2025-04-24", available: true, incomplete: false },
    { date: "2025-04-22", available: true, incomplete: false },
    { date: "2025-04-25", available: true, incomplete: true },
  ],
  meals: [
    {
      date: "2025-04-21",
      groupId: "g0",
      beneficiaryId: "1",
      nameBeneficiary: "Jasper Bichard",
      service: "1",
      code: "C",
      nameMeal: "Assiettes repas salade de patates et thon",
      nameDessert: "Pomme",
      portionPlus: true,
    },
    {
      date: "2025-04-22",
      groupId: "g0",
      beneficiaryId: "1",
      nameBeneficiary: "Jasper Bichard",
      service: "1",
      code: "C",
      nameMeal: "Assiettes de choux-fleurs",
      nameDessert: "Pomme",
      portionPlus: false,
    },
  ],
};

export class GenerateDistributionReportCase {
  execute(payload: SchoolDistributionPayload) {
    let content = ``;
    const orderedPayload = this.orderDistribution(payload);

    for (const group of orderedPayload.groups) {
      content += this.tableContent(group, orderedPayload);
    }

    return this.head(content);
  }

  private tableContent(
    group: SchoolDistributionGroup,
    payload: SchoolDistributionPayload,
  ) {
    const html = String.raw;
    let content = `<div class="page">`;
    const weekRange = this.weekRangeLabel(payload.days);
    const containsIncomplete = !!payload.days.find(
      (d) => d.incomplete === true,
    );

    const getMealByDayBySpecificBeneficiary = (
      beneficiaryId: string,
      date: string,
    ) => {
      const match = payload.meals.find(
        (meal) =>
          meal.beneficiaryId === beneficiaryId &&
          meal.date === date &&
          meal.groupId === group.id,
      );

      return match;
    };

    const getTotalForDay = (date: string, groupId: string) => {
      const dayMeals = payload.meals.filter(
        (m) => m.date === date && m.groupId === groupId,
      );
      let totalRegular = 0;
      let totalPlus = 0;

      for (const meal of dayMeals) {
        if (meal.portionPlus) {
          totalPlus++;
          continue;
        }
        totalRegular++;
      }

      return {
        regular: totalRegular,
        plus: totalPlus,
      };
    };

    // id + string map
    const uniqueBeneficiaryInGroup = new Map<string, string>();

    for (let order of payload.meals) {
      if (order.groupId !== group.id) {
        continue;
      }
      uniqueBeneficiaryInGroup.set(order.beneficiaryId, order.nameBeneficiary);
    }

    const beneficiaries = Object.entries(
      Object.fromEntries(uniqueBeneficiaryInGroup),
    );

    // This generates the group page header =============================================================
    content += html`
      <header class="report-header">
        <div class="report-info">
          <h1>${group.name} - Service ${group.service}</h1>
          <p class="report-week">
            Rapport de distribution
            <strong>${weekRange}</strong>
          </p>
        </div>
        <div class="report-meta">
          <p>${this.generatedLabel(payload.generatedAt)}</p>
          <p>Utilisateur : <strong>${payload.generatedBy}</strong></p>
        </div>
      </header>
      ${containsIncomplete
        ? `
        <p class="incomplete">
            ${"&#9888; Incomplet, des commandes peuvent encore être effectués dans les journées identifiées."}
        </p>
        `
        : ""}
    `;

    // Start of table content =============================================================================
    content += "<table>";

    // This generates the day table headers
    content += html`
      <thead>
        <tr>
          <th class="name-col">Nom</th>
          ${payload.days
            .map((day) => {
              if (!day.incomplete) {
                return `<th>${this.formatDate(day.date)}</th>`;
              }
              return `
                <th>
                ${this.formatDate(day.date)}
                    <span class="incomplete-icon">
                        &#9888; incomplet
                    </span>
                </th>
            `;
            })
            .join("")}
        </tr>
      </thead>
    `;

    content += "<tbody>";

    // This generates each beneficiary week order
    content += beneficiaries
      .map(([id, name]) => {
        return html`
          <tr>
            <td class="name-col">${name}</td>
            ${payload.days
              .map((day) => {
                const matchingMeal = getMealByDayBySpecificBeneficiary(
                  id,
                  day.date,
                );

                if (!matchingMeal) {
                  return `
                    <td>
                        <span class="cell-meal">—</span>
                        <span class="cell-dessert">—</span>
                    </td>
                  `;
                }

                return `
                  <td>
                      ${matchingMeal.portionPlus ? `<span class="cell-meal tag">PORTION PLUS</span>` : ""}
                      <span class="cell-meal">${matchingMeal.nameMeal}</span>
                      <span class="cell-dessert">${matchingMeal.nameDessert}</span>
                  </td>
                  `;
              })
              .join("")}
          </tr>
        `;
      })
      .join("");

    content += "</tbody>";

    content += html`
      <tfoot>
        <tr>
          <td><strong>Total des repas</strong></td>
          ${payload.days
            .map((d) => {
              const count = getTotalForDay(d.date, group.id);
              return `
                <td>
                    ${count.regular}
                    ${count.plus > 0 ? `[+${count.plus}]` : ""}
                </td>
            `;
            })
            .join("")}
        </tr>
      </tfoot>
    `;

    content += "</table>";
    content += html`</div>`;

    return content;
  }

  // reused, same but removed year
  private formatDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString("fr", {
      timeZone: "UTC", // format as if it were UTC
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  // reused same
  private generatedLabel = (date: Date) =>
    `Rapport généré le ${date.toLocaleDateString("fr", {
      hour: "numeric",
      minute: "numeric",
    })} par`;

  // reused same
  private weekRangeLabel(days: { date: string }[]): string {
    if (days.length === 0) {
      return "Semaine : du — au —";
    }

    // Extract just the ISO dates
    const isoDates = days.map((d) => d.date);

    // Find min/max by lexicographic order on YYYY‑MM‑DD
    const sorted = isoDates.slice().sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Format "YYYY-MM-DD" → "21 avril 2025"
    const fmt = (iso: string) => {
      const [year, month, day] = iso.split("-").map(Number);
      // Use UTC so that local TZ doesn’t shift the day
      const dt = new Date(Date.UTC(year, month - 1, day));
      return dt.toLocaleDateString("fr", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    };

    return `Semaine : du ${fmt(first)} au ${fmt(last)}`;
  }

  // Not the same ordering do not copy for both
  private orderDistribution(
    input: SchoolDistributionPayload,
  ): SchoolDistributionPayload {
    // sort days by date
    const days = [...input.days].sort((a, b) => a.date.localeCompare(b.date));

    // build group‐order lookup (groups in order, then '+' at the end)
    const groupOrder = input.groups.map((g) => g.id).concat("+");
    const groupIndex = (id: string) =>
      groupOrder.indexOf(id) >= 0 ? groupOrder.indexOf(id) : groupOrder.length;

    // define type order
    const typeOrder: Record<"MAIN" | "DESSERT", number> = {
      MAIN: 0,
      DESSERT: 1,
    };

    // sort meals by (date, type, group)
    const meals = [...input.meals].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return groupIndex(a.groupId) - groupIndex(b.groupId);
    });

    // return a new object
    return {
      ...input,
      days,
      meals,
    };
  }

  /** Generates the document styles and headers */
  private head(body: string) {
    const html = String.raw;

    return html`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <title>Commandes par personne avec dessert</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 8pt;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            .page {
              page-break-after: always;
            }

            th,
            td {
              border: 1px solid #333;
              padding: 4px;
              text-align: center;
              vertical-align: top;
              overflow-wrap: anywhere;
            }
            thead th {
              background: #eee;
              font-weight: bold;
            }
            tbody tr:nth-child(even) td {
              background: #fafafa;
            }
            .name-col {
              width: 140px;
              text-align: left;
            }
            .group-col {
              width: 120px;
              text-align: left;
            }
            .cell-meal {
              font-weight: bold;
              display: block;
              margin-bottom: 2px;
            }
            .cell-dessert {
              font-size: 0.85em;
              color: #333;
            }
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-bottom: 12px;
              border-top: 3px solid #444;
              padding-top: 10px;
              padding-bottom: 6px;
            }

            .report-info h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              line-height: 1.2;
            }

            .report-week {
              margin: 2px 0 0;
              font-size: 10px;
              color: #555;
            }

            .report-meta {
              text-align: right;
              font-size: 9px;
              color: #555;
            }

            .report-meta p {
              margin: 0;
              line-height: 1.2;
            }

            .tag {
              border: 1px solid black;
              border-radius: 99px;
              background-color: lightgoldenrodyellow;
            }
            .summary-section {
              margin-top: 10px;
            }
            .summary-section-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              margin-bottom: 6px;
              padding-bottom: 2px;
            }
            .summary-section-header h2 {
              font-size: 10pt;
              margin: 0;
              font-weight: 500;
            }
            .summary-section-header .service-tag {
              font-size: 9pt;
              color: #333;
              background: #eef;
              padding: 2px 6px;
              border-radius: 4px;
            }
            .incomplete {
              color: #b00;
              font-size: 10px;
              vertical-align: middle;
            }
            .incomplete-icon {
              color: #b00;
              font-size: 9px;
              vertical-align: middle;
            }
          </style>
        </head>
        <body>
          ${body}
        </body>
      </html>
    `;
  }
}
