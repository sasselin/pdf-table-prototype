export type VerificationMealReportMetadata = {
  generatedBy: string;
  generatedAt: Date;
};

export type VerificationMealProduction = {
  nameSchool: string;
  days: {
    date: string; // YYYY-MM-DD
    available: boolean;
  }[];
  buildings: {
    id: string;
    name: string;
  }[];
  groups: {
    name: string; // e.g. "Aucun Groupe", "Lieu A", …
    id: string; // e.g. "g1", "g2", …
    service: string;
    buildingId: string;
    shippingDetails: string;
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

export class GenerateVerificationReport {
  execute(
    schools: VerificationMealProduction[],
    meta: VerificationMealReportMetadata,
  ) {
    let html = ``;
    for (const school of schools) {
      const orderedSchool = this.orderSchoolMealProduction(school);
      html += this.reportTableContent(orderedSchool, meta);
    }

    return this.headers(html);
  }

  private reportTableContent(
    school: VerificationMealProduction,
    meta: VerificationMealReportMetadata,
  ) {
    const html = String.raw;
    const mergedDays: Record<string, { name: string; available: boolean }> = {};
    // YYYY-MM-DD dates
    const mergedDates: { date: string }[] = [];
    const services = [...new Set(school.groups.map((g) => g.service))];

    for (const day of school.days) {
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

    const mealsThatDay = (date: string) => {
      const seen = new Set<string>();
      return school.meals
        .filter((meal) => meal.date === date)
        .filter((meal) => {
          if (seen.has(meal.id)) return false;
          seen.add(meal.id);
          return true;
        });
    };

    const mealsThatDayByGroup = (date: string, groupId: string) =>
      school.meals.filter(
        (meal) => meal.date === date && meal.groupId === groupId,
      );

    const totalMealsByGroup = (groupId: string) => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      const meals = school.meals.filter((meal) => meal.groupId === groupId);

      for (const meal of meals) {
        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const totalMeals = () => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      for (const meal of school.meals) {
        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const mealsByBuilding = (buildingId: string) => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      const groupsInBuilding = school.groups
        .filter((g) => g.buildingId === buildingId)
        .map((gib) => gib.id);

      const meals = school.meals.filter((meal) =>
        groupsInBuilding.includes(meal.groupId),
      );

      for (const meal of meals) {
        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const mealsByDay = (mealId: string, date: string) => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      const meals = school.meals.filter((meal) => meal.date === date);

      for (const meal of meals) {
        if (meal.id !== mealId) {
          continue;
        }

        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const mealsByDayAndService = (
      service: string,
      mealId: string,
      date: string,
    ) => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      const groupsInService = [
        ...new Set(
          school.groups
            .filter((group) => group.service === service)
            .map((g) => g.id),
        ),
      ];

      const meals = school.meals.filter(
        (meal) => meal.date === date && meal.id === mealId,
      );

      for (const meal of meals) {
        if (!groupsInService.includes(meal.groupId)) {
          continue;
        }
        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const mealsByService = (service: string) => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      const groupsInService = [
        ...new Set(
          school.groups
            .filter((group) => group.service === service)
            .map((g) => g.id),
        ),
      ];

      for (const meal of school.meals) {
        if (!groupsInService.includes(meal.groupId)) {
          continue;
        }
        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const mealsByBuildingDay = (
      buildingId: string,
      date: string,
      mealId: string,
    ) => {
      let quantityRegular = 0;
      let quantityPortionPlus = 0;

      const groupsInBuilding = school.groups
        .filter((g) => g.buildingId === buildingId)
        .map((gib) => gib.id);

      const meals = school.meals.filter(
        (meal) => meal.date === date && groupsInBuilding.includes(meal.groupId),
      );

      for (const meal of meals) {
        if (meal.id !== mealId) {
          continue;
        }

        if (meal.quantityPortionPlus) {
          quantityPortionPlus += meal.quantityPortionPlus;
        }
        quantityRegular += meal.quantityRegular;
      }

      return {
        quantityRegular,
        quantityPortionPlus,
      };
    };

    const weekRangeLabel = this.weekRangeLabel(mergedDates);

    const colspanPerClosedDays = 2;

    let content = html`
      <header class="report-header">
        <div class="report-info">
          <h1>Rapport de v${"é"}rification ${school.nameSchool}</h1>
          <p class="report-week">
            Rapport de v${"é"}rification semaine
            <strong>${weekRangeLabel}</strong><br />
          </p>
        </div>
        <div class="report-meta">
          ${this.generatedLabel(meta.generatedAt)}
          <strong>${meta.generatedBy}</strong>
        </div>
      </header>
    `;

    content += "<table>";

    // PRINTS THE TABLE HEADER WITH DATES AND CODES -------------------------------------------------
    content += html`
      <thead>
        <tr>
          <th rowspan="3" class="col-info">
            Infos<br /><small
              >(Service ${"—"} Groupe ${"—"} B${"â"}timent)</small
            >
          </th>
          ${school.days
            .map((day) => {
              const colspan = day.available
                ? mealsThatDay(day.date).length
                : colspanPerClosedDays;
              return `<th colspan="${colspan}">${mergedDays[day.date].name}</th>`;
            })
            .join("")}
          <th rowspan="3" class="grand-total">total</th>
        </tr>
        <tr>
          ${school.days
            .map((day) => {
              if (!day.available) {
                return `<td class="closed" colspan="${colspanPerClosedDays}">Aucun service</td>`;
              }
              const meals = mealsThatDay(day.date);
              const cols = meals
                .map(
                  (meal) =>
                    `<th>
                        <div class="meal-name">
                           ${meal.name}
                        </div>
                    </th>`,
                )
                .join("");

              return cols;
            })
            .join("")}
        </tr>
        <tr>
          ${school.days
            .map((day) => {
              if (!day.available) {
                return `<td class="closed white-cell" colspan="${colspanPerClosedDays}"> - </td>`;
              }
              const meals = mealsThatDay(day.date);
              const cols = meals
                .map((meal) => `<th class="meal-code">${meal.code}</th>`)
                .join("");

              return cols;
            })
            .join("")}
        </tr>
      </thead>
    `;

    // PRINTS THE TABLE CONTENT ----------------------------------------------------------------------
    content += `<tbody>`;

    content += html` ${school.buildings
      .map((building) => {
        const groupsInBuilding = school.groups.filter(
          (g) => g.buildingId === building.id,
        );
        let rows = "";

        // Prints rows by groups here ==================================================
        groupsInBuilding.forEach((group) => {
          const totalMealsGroup = totalMealsByGroup(group.id);

          rows += html`
            <tr>
              <td class="col-info">
                <strong>${this.mapServiceName(group.service)}</strong>
                ${group.name}<br />
                ${building.name}
              </td>
              ${school.days
                .map((day) => {
                  if (!day.available) {
                    return `<td class="closed white cell" colspan="${colspanPerClosedDays}"> - </td>`;
                  }
                  const mealByGroup = mealsThatDayByGroup(day.date, group.id);

                  const cols = mealByGroup
                    .map(
                      (meal) => `
                      <td>
                        ${meal.quantityRegular || 0}
                        ${
                          meal.quantityPortionPlus &&
                          meal.quantityPortionPlus > 0
                            ? `[+${meal.quantityPortionPlus}]`
                            : ""
                        }</td>
                      `,
                    )
                    .join("");

                  return cols;
                })
                .join("")}

              <td class="grand-total">
                ${totalMealsGroup.quantityRegular || 0}
                ${totalMealsGroup.quantityPortionPlus &&
                totalMealsGroup.quantityPortionPlus > 0
                  ? `[+${totalMealsGroup.quantityPortionPlus}]`
                  : ""}
              </td>
            </tr>
          `;
        });

        const mealsBuildingCount = mealsByBuilding(building.id);

        // Prints total by group here ================================================
        rows += html`
          <tr class="total-building">
            <td class="col-info" style="background-color: #f0f0f0">
              <strong>Total ${building.name}</strong>
            </td>
            ${school.days
              .map((day) => {
                if (!day.available) {
                  return `<td class="closed white-cell" colspan="${colspanPerClosedDays}"> - </td>`;
                }
                const meals = mealsThatDay(day.date);

                const cols = meals
                  .map((meal) => {
                    const mealCount = mealsByBuildingDay(
                      building.id,
                      day.date,
                      meal.id,
                    );

                    return `
                      <td style="background-color: #f0f0f0">
                            ${mealCount.quantityRegular || 0}
                            ${
                              mealCount.quantityPortionPlus &&
                              mealCount.quantityPortionPlus > 0
                                ? `[+${mealCount.quantityPortionPlus}]`
                                : ""
                            }
                        </td>
                      `;
                  })
                  .join("");

                return cols;
              })
              .join("")}

            <td class="grand-total">
              ${mealsBuildingCount.quantityRegular || 0}
              ${mealsBuildingCount.quantityPortionPlus &&
              mealsBuildingCount.quantityPortionPlus > 0
                ? `[+${mealsBuildingCount.quantityPortionPlus}]`
                : ""}
            </td>
          </tr>
        `;

        return rows;
      })
      .join("")}`;

    content += `</tbody><tfoot>`;

    // Prints the table totals =====================================================

    // prints the total by service
    for (const service of services) {
      const countTotal = mealsByService(service);
      content += html`
        <tr>
          <td class="col-info dark-cell">
            <strong>${this.mapServiceName(service)} Total</strong>
          </td>
          ${school.days
            .map((day) => {
              if (!day.available) {
                return `<td class="closed white-cell" colspan="${colspanPerClosedDays}"> - </td>`;
              }
              const meals = mealsThatDay(day.date);
              const cols = meals
                .map((meal) => {
                  const count = mealsByDayAndService(
                    service,
                    meal.id,
                    day.date,
                  );

                  return `
                    <th class="dark-cell">
                        ${count.quantityRegular || 0}
                            ${
                              count.quantityPortionPlus &&
                              count.quantityPortionPlus > 0
                                ? `[+${count.quantityPortionPlus}]`
                                : ""
                            }
                    </th>
                  `;
                })
                .join("");

              return cols;
            })
            .join("")}
          <td class="grand-total">
            ${countTotal.quantityRegular || 0}
            ${countTotal.quantityPortionPlus &&
            countTotal.quantityPortionPlus > 0
              ? `[+${countTotal.quantityPortionPlus}]`
              : ""}
          </td>
        </tr>
      `;
    }

    // Grand total of everything of the universe and more.
    const totalCount = totalMeals();

    content += html`
      <tr>
        <td class="col-info dark-cell"><strong>Grand Total</strong></td>
        ${school.days
          .map((day) => {
            if (!day.available) {
              return `<td class="closed white-cell" colspan="${colspanPerClosedDays}"> - </td>`;
            }
            const meals = mealsThatDay(day.date);
            const cols = meals
              .map((meal) => {
                const count = mealsByDay(meal.id, day.date);

                return `
                <th class="dark-cell">
                    ${count.quantityRegular || 0}
                    ${
                      count.quantityPortionPlus && count.quantityPortionPlus > 0
                        ? `[+${count.quantityPortionPlus}]`
                        : ""
                    }
                </th>
                `;
              })
              .join("");

            return cols;
          })
          .join("")}
        <td class="grand-total">
          ${totalCount.quantityRegular || 0}
          ${totalCount.quantityPortionPlus && totalCount.quantityPortionPlus > 0
            ? `[+${totalCount.quantityPortionPlus}]`
            : ""}
        </td>
      </tr>
    `;

    content += `</tfoot></table>`;
    return content;
  }

  private headers(content: string) {
    const html = String.raw;
    return html`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="UTF‑8" />
          <title>Distribution par Groupe / Service / Bâtiment</title>
          <style>
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 8pt;
              color: #222;
            }
            h2 {
              margin: 12px 0 4px;
              font-size: 12pt;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin-bottom: 16px;
            }
            th,
            td {
              border: 1px solid #444;
              padding: 4px;
              text-align: center;
              vertical-align: middle;
            }
            thead th {
              background: #ddd;
              font-weight: bold;
              font-size: 8pt;
              text-align: center;
              vertical-align: bottom; /* Aligns the text block to the bottom of the cell */
            }
            tbody tr:nth-child(even) td {
              background: #f7f7f7;
            }

            /* Infos column */
            .col-info {
              background: #fafafa;
              text-align: left;
              padding: 6px;
              font-weight: 500;
              white-space: normal;
              word-break: break-word;
              overflow-wrap: anywhere;
              width: 220px;
            }

            /* Meal names vertical */
            .meal-name {
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              overflow-wrap: break-word;
              display: inline-block;
              max-height: 150px;
              padding: 4px 2px;
              font-size: 7pt;
            }

            /* Code row styling */
            .meal-code {
              background: #eee;
              font-size: 8pt;
            }

            /* Grand total column */
            th.grand-total,
            td.grand-total {
              background: #ccc !important;
              font-weight: bold;
            }

            /* Footer rows */
            tfoot tr.total-building td {
              background: #ececec;
            }
            tfoot tr.total-service td {
              background: #d1d1d1;
            }
            tfoot tr.grand-total-row td {
              background: #a8a8a8;
              color: #fff;
            }
            tfoot tr.grand-total-row td.col-info {
              background: #a8a8a8;
              color: #fff;
            }
            tfoot td strong {
              font-weight: bold;
            }
            /* This rule is more specific and will override the row colors for the final column */
            tfoot tr td.grand-total {
              background: #ccc; /* The desired gray for the whole column */
              color: #222; /* Reset text color to black */
              font-weight: bold;
            }
            .dark-cell {
              background: #ccc; /* The desired gray for the whole column */
              color: #222; /* Reset text color to black */
              font-weight: bold;
            }
            .white-cell {
              background: white !important;
            }

            /* Report Header */
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
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  private generatedLabel = (date: Date) =>
    `Rapport généré le ${date.toLocaleDateString("fr", {
      hour: "numeric",
      minute: "numeric",
    })} par`;

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

  private orderSchoolMealProduction(
    input: VerificationMealProduction,
  ): VerificationMealProduction {
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

  private mapServiceName(serviceName: string): string | null {
    switch (serviceName) {
      case "SERVICE-1":
        return "1ÈRE VAGUE";
      case "SERVICE-2":
        return "2IÈME VAGUE";
      case "SERVICE-3":
        return "3IÈME VAGUE";
      default:
        return "AUCUN GROUPE";
    }
  }
}
