export type SchoolMealReportMetadata = {
  generatedBy: string;
  generatedAt: Date;
};

export type SchoolMealProduction = {
  nameSchool: string;
  days: {
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
    code: string; // @TODO
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
  execute(schools: SchoolMealProduction[], meta: SchoolMealReportMetadata) {
    let html = "";
    html += this.reportTableContents(schools, meta);

    for (const school of schools) {
      const orderedSchool = this.orderSchoolMealProduction(school);
      html += this.renderSchoolTable(orderedSchool);
    }
    return this.header(html);
  }

  /**
   * This generates the first table of the rapport, it contains
   * the agglomerates of all schools
   */
  private reportTableContents(
    schools: SchoolMealProduction[],
    meta: SchoolMealReportMetadata,
  ) {
    const html = String.raw;

    // key are always date
    const mergedDays: Record<string, { name: string; available: boolean }> = {};
    const uniqueMealsByDays: Record<
      string,
      Record<
        string,
        {
          name: string;
          type: "MAIN" | "DESSERT";
          totalRegular: number;
          totalPlus: number;
          code: string;
        }
      >
    > = {};
    // YYYY-MM-DD dates
    const mergedDates: { date: string }[] = [];

    const totalNonDessertByDay = (date: string) => {
      let totalRegular = 0;
      let totalPlus = 0;

      for (const school of schools) {
        for (const meal of school.meals) {
          if (meal.date !== date) continue;
          if (meal.type === "DESSERT") continue;
          totalRegular += meal.quantityRegular;
          totalPlus += meal.quantityPortionPlus || 0;
        }
      }

      return {
        regular: totalRegular,
        plus: totalPlus,
      };
    };

    for (const school of schools) {
      const orderedSchool = this.orderSchoolMealProduction(school);

      for (const meal of orderedSchool.meals) {
        if (!uniqueMealsByDays[meal.date]) {
          uniqueMealsByDays[meal.date] = {};
        }
        if (!uniqueMealsByDays[meal.date][meal.id]) {
          uniqueMealsByDays[meal.date][meal.id] = {
            name: meal.name,
            type: meal.type,
            totalRegular: meal.quantityRegular || 0,
            totalPlus: meal.quantityPortionPlus || 0,
            code: meal.code,
          };
          continue;
        }

        const quantityRegular = meal.quantityRegular || 0;
        const quantityPlus = meal.quantityPortionPlus || 0;

        uniqueMealsByDays[meal.date][meal.id] = {
          name: meal.name,
          type: meal.type,
          code: meal.code,
          totalRegular:
            uniqueMealsByDays[meal.date][meal.id].totalRegular +
            quantityRegular,
          totalPlus:
            uniqueMealsByDays[meal.date][meal.id].totalPlus + quantityPlus,
        };
      }

      for (const day of orderedSchool.days) {
        const matching = mergedDays[day.date];
        mergedDates.push({ date: day.date });

        if (!matching) {
          mergedDays[day.date] = {
            name: this.formatDate(day.date),
            available: day.available,
          };
          continue;
        }

        // make sure that if one of the school is open it's displayed as open
        if (!matching.available) {
          mergedDays[day.date] = {
            name: this.formatDate(day.date),
            available: day.available,
          };
        }
      }
    }

    const weekRangeLabel = this.weekRangeLabel(mergedDates);
    const days = Object.entries(mergedDays);

    return html`
      <div class="page">
        <h1>Rapport de Production (tous)</h1>
        <div class="meta">
          <strong>${weekRangeLabel}</strong><br />
          ${this.generatedLabel(meta.generatedAt)}
          <strong>${meta.generatedBy}</strong>
        </div>

        <table class="summary-table">
          <!-- Prints the head of the table -->
          <thead>
            <tr>
              <th class="day-header">Jour</th>
              <th class="left">Menu</th>
              <th class="left">Total</th>
            </tr>
          </thead>

          <tbody>
            <!-- Prints vertical days -->
            ${days
              .map(([day, dayInfo]) => {
                if (!dayInfo.available) {
                  return `
                   <tr class="day-closed">
                     <td class="day-header">Lundi 21 avril 2025</td>
                     <td colspan="2" class="left">Aucun service</td>
                   </tr>
                `;
                }

                const dayMeals = Object.values(uniqueMealsByDays[day]);

                // Prints the first column with the name and the first meal
                let content = dayMeals
                  .map((m, i) => {
                    if (i === 0) {
                      return `
                        <tr>
                            <td rowspan="${dayMeals.length}" class="day-header">
                               ${dayInfo.name}
                            </td>
                            <td class="left">
                                ${m.code} | ${m.name}
                            </td>
                            <td class="left">
                                ${m.totalRegular}
                                ${m.totalPlus > 0 ? `[+${m.totalPlus}]` : ""}
                            </td>
                        </tr>
                        `;
                    }

                    // prints the other column with just the meal names
                    return `
                      <tr>
                        <td class="left">
                            ${m.code} | ${m.name}
                        </td>
                        <td class="left">
                            ${m.totalRegular}
                            ${m.totalPlus > 0 ? `[+${m.totalPlus}]` : ""}
                        </td>
                      </tr>
                      `;
                  })
                  .join("");

                const dayTotalNoDessert = totalNonDessertByDay(day);

                // Prints the day footer
                content += `
                  <tr class="day-total gray">
                    <td colspan="2" class="right">Total (excluant dessert) pour ${dayInfo.name}</td>
                    <td class="left">
                        ${dayTotalNoDessert.regular}
                        ${dayTotalNoDessert.plus > 0 ? `[+${dayTotalNoDessert.plus}]` : ""}
                    </td>
                  </tr>
                  `;

                return content;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
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

    // Number of meals for a given day for the day colspan
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
                  .map(
                    (meal) =>
                      `<th class="vertical-text">${meal.code} | ${meal.name}</th>`,
                  )
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

  /** Renders a school table title */
  private tableTitle(props: TableHeaderProps) {
    const html = String.raw;

    return html`
      <h1>${props.nameSchool}</h1>
      <div class="meta">
        <strong>${props.nameWeek}</strong>
      </div>
    `;
  }

  /** Renders a single school table */
  private renderSchoolTable(school: SchoolMealProduction): string {
    const { nameSchool, days } = school;
    let html = "";

    html += `<div class="page">`;

    const weekRangeLabel = this.weekRangeLabel(days);

    html += this.tableTitle({
      nameSchool: nameSchool,
      nameWeek: weekRangeLabel,
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

  /** Generates the "generated by at" label at top of the file */
  private generatedLabel = (date: Date) =>
    `Rapport généré le ${date.toLocaleDateString("fr", {
      hour: "numeric",
      minute: "numeric",
    })} par`;

  /**
   * Computes the first and last week in days array and give the FROM-TO label
   * on top of the file label.
   */
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

    // Format "YYYY-MM-DD" → "21 avril 2025"
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

  /**
   * Generate styles and metadata for the file
   */
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
