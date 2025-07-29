export type SchoolMealProduction = {
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
    id: string;
    code?: string; // @TODO
    name: string;
    groupId: string; // must match one of groups[].id, or e.g. '+' for the dessert column
    quantityRegular: number; // number of regular servings
    quantityPortionPlus?: number;
  }[];
};

type TableHeaderProps = {
  nameSchool: string;
  nameWeek: string;
};

export class GenerateCatererProductionReportCase {
  execute(schools: SchoolMealProduction[]) {
    let html = "";
    for (const school of schools) {
      const orderedSchool = this.orderSchoolMealProduction(school);
      html += this.renderSchoolTable(orderedSchool);
    }
    return this.header(html);
  }

  private tableContents(props: SchoolMealProduction) {
    const html = String.raw;

    // Canges the amount of colspans you use for a given day
    const colspanPerClosedDay = 1;

    // Unique by meal id because meals come back for every group on each row
    const mealsThatDay = (date: string) => {
      const seen = new Set<string>();
      return props.meals
        .filter((meal) => meal.date === date)
        .filter((meal) => {
          if (seen.has(meal.id)) return false;
          seen.add(meal.id);
          return true;
        });
    };

    // By meal Id, retrieve the count of that meal
    const totalByMealByDay = (date: string, mealId: string) => {
      const selections = props.meals.filter(
        (meal) => meal.date === date && meal.id === mealId,
      );
      let totalRegular = 0;
      let totalPlus = 0;

      for (const selection of selections) {
        totalRegular += selection.quantityRegular || 0;
        totalPlus += selection.quantityPortionPlus || 0;
      }

      return {
        regular: totalRegular,
        plus: totalPlus,
      };
    };

    // Get the meals by given day by a group
    const mealsThatDayByGroup = (date: string, groupId: string) =>
      props.meals.filter(
        (meal) => meal.date === date && meal.groupId === groupId,
      );

    const colspanForDay = (date: string) => {
      const dayConfig = props.days.find((day) => day.date === date);
      if (!dayConfig) return colspanPerClosedDay;
      if (dayConfig.available === false) return colspanPerClosedDay;

      return mealsThatDay(date).length;
    };

    // Prints a gray empty cell for days without meals
    const printClosedCells = (date: string) => {
      const cellCount = colspanForDay(date);

      return Array.from({ length: cellCount })
        .map(() => `<td class="closed"></td>`)
        .join("");
    };

    const date = (date: string) => html`
      <th colspan="${colspanForDay(date)}">${this.formatDate(date)}</th>
    `;

    const mealCountThatDayByGroup = (
      date: string,
      groupId: string,
      mealId: string,
    ) => {
      return props.meals.find(
        (meal) =>
          meal.date === date && meal.groupId === groupId && meal.id === mealId,
      )!;
    };

    const mealCountByDayNoDesserts = (date: string) => {
      const allMeals = props.meals.filter(
        (meal) => meal.date === date && meal.type !== "DESSERT",
      );
      let totalRegular = 0;
      let totalPlus = 0;

      for (const meal of allMeals) {
        totalRegular += meal.quantityRegular || 0;
        totalPlus += meal.quantityPortionPlus || 0;
      }

      return {
        regular: totalRegular,
        plus: totalPlus,
      };
    };

    let content = html`
      <table class="by-school">
        <!-- Builds the table headers with the dates and the meal names -->
        <thead>
          <!-- Builds the Dates table headers -->
          <tr>
            <th rowspan="2">Lieu</th>
            ${props.days.map((day) => date(day.date)).join("")}
          </tr>

          <!-- Builds the meals for each day table headers -->
          <tr>
            ${props.days
              .map((day) => {
                if (!day.available) {
                  return `<td class="closed" colspan="${colspanPerClosedDay}">Aucun service</td>`;
                }
                const meals = mealsThatDay(day.date);
                const cols = meals
                  .map((meal) => `<th class="vertical-text">${meal.name}</th>`)
                  .join("");

                return cols;
              })
              .join("")}
          </tr>
        </thead>

        <!-- Builds the center area of the table with the counts per day per group -->
        <tbody>
          <!-- Builds the meals per group per meal table cells -->
          ${props.groups
            .map((group) => {
              const dayCells = props.days
                .map((day) => {
                  if (!day.available) {
                    return printClosedCells(day.date);
                  }

                  // Build each individual cell with the counts
                  // if there are portion plus meal they are printed inside brackets
                  return mealsThatDayByGroup(day.date, group.id)
                    .map((meal) => {
                      const count = mealCountThatDayByGroup(
                        day.date,
                        group.id,
                        meal.id,
                      );
                      return `
                      <td>
                        ${count.quantityRegular || 0}
                        ${
                          count.quantityPortionPlus &&
                          count.quantityPortionPlus > 0
                            ? `[+${count.quantityPortionPlus}]`
                            : ""
                        }
                      </td>
                    `;
                    })
                    .join("");
                })
                .join("");

              return `
                  <tr>
                    <td class="text-left">${group.name}</td>
                    ${dayCells}
                  </tr>
              `;
            })
            .join("")}
        </tbody>

        <tfoot>
          <!-- Prints the total count per meal -->
          <tr class="gray">
            <td class="text-left school-column">
              <strong>Total de sélections </strong>
            </td>
            ${props.days
              .map((day) => {
                // Build no meal day gray square
                if (!day.available) {
                  return printClosedCells(day.date);
                }

                // Build each individual cell with the counts
                return mealsThatDay(day.date)
                  .map((meal) => {
                    const counts = totalByMealByDay(day.date, meal.id);
                    return `
                        <td>
                            ${counts.regular}
                            ${counts.plus > 0 ? `[+${counts.plus}]` : ""}
                        </td>
                    `;
                  })
                  .join("");
              })
              .join("")}
          </tr>

          <!-- Prints the total meal count for the day regardless of meal excluding desserts -->
          <tr class="gray">
            <td class="text-left">
              <strong>Total de repas</strong>
            </td>
            ${props.days
              .map((day) => {
                // Build no meal day gray square
                if (!day.available) {
                  return printClosedCells(day.date);
                }

                const colspan = mealsThatDay(day.date).length;
                const count = mealCountByDayNoDesserts(day.date);

                return `
                    <td colspan="${colspan}">
                        ${count.regular}
                        ${count.plus > 0 ? `[+${count.plus}]` : ""}
                    </td>
                `;
              })
              .join("")}
          </tr>
        </tfoot>
      </table>
    `;

    return content;
  }

  private tableTitle(props: TableHeaderProps) {
    const html = String.raw;

    return html`
      <h1>${props.nameSchool}</h1>
      <div class="meta">
        Semaine: <strong>du ${props.nameWeek}</strong><br />
      </div>
    `;
  }

  private renderSchoolTable(school: SchoolMealProduction): string {
    const { nameSchool, nameWeek } = school;
    let html = "";

    html += `<div class="page">`;

    html += this.tableTitle({
      nameSchool: nameSchool,
      nameWeek: nameWeek,
    });

    html += `<table class="by-school">`;

    // Table content here
    html += this.tableContents(school);

    html += `</table>`;
    html += `</div>`;

    return html;
  }

  /**
   * Format date without a timezone plainly transforms YYYY-MM-DD
   */
  private formatDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString("fr", {
      timeZone: "UTC", // format as if it were UTC
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /**
   * Sort data in the logical day and group order
   */
  private orderSchoolMealProduction(
    input: SchoolMealProduction,
  ): SchoolMealProduction {
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
      const t = typeOrder[a.type] - typeOrder[b.type];
      if (t !== 0) return t;
      return groupIndex(a.groupId) - groupIndex(b.groupId);
    });

    // return a new object
    return {
      ...input,
      days,
      meals,
    };
  }

  private header(body: string) {
    const html = String.raw;

    return html`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <title>Rapport de production</title>
          <style>
            @page {
              margin: 8mm 8mm;
            }
            .page {
              page-break-after: always;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 8px;
              margin: 0;
              padding: 0;
            }
            .page {
              page-break-after: always;
            }
            h1 {
              font-size: 14px;
              margin-bottom: 4px;
            }
            .meta {
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              table-layout: fixed;
            }
            th,
            td {
              border: 1px solid #000;
              padding: 4px;
              text-align: center;
              vertical-align: middle;
            }
            .text-left {
              text-align: left;
            }
            .gray {
              background-color: lightgray;
            }
            .vertical-text {
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              padding: 2px 4px;
              text-align: left;
              font-size: 8px;
              font-weight: 400;
            }
            table.by-school tr > *:first-child {
              width: 110px;
              max-width: 110px;
              overflow-wrap: break-word;
            }

            .summary-table .day-header {
              font-weight: bold;
              vertical-align: middle;
              text-align: center;
              background-color: #f9f9f9;
              max-width: 100px; /* Add this line */
            }

            .left {
              text-align: left;
            }

            .right {
              text-align: right;
            }
            .summary-table .day-closed td {
              background-color: #f0f0f0;
              font-style: italic;
              padding: 8px;
            }
            .by-school td.closed {
              background-color: #f0f0f0;
              text-align: center;
              font-style: italic;
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
