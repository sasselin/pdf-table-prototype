export function header(body: string) {
  return `
  <!doctype html>
  <html lang="fr">
      <head>
          <meta charset="UTF-8" />
          <title>Rapport de Distribution</title>
          <style>
              @page {
                  margin: 8mm 8mm;
              }
              .page {
                  /* border: 1px dashed red; */
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
              thead th {
                  /* background-color: #f0f0f0; */
                  /* font-weight: bold; */
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

              /* table.by-school tr > *:nth-child(2) {
                  width: 100px;
                  max-width: 100px;
                  overflow-wrap: break-word;
              } */
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
