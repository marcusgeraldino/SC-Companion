import { Database } from "bun:sqlite";
import fs from "fs";

export function generateReport() {
  const db = new Database("sc_logs.db");

  const daily = db.query(`SELECT * FROM daily_logs ORDER BY date ASC`).all() as any[];

  const global = db.query(`SELECT * FROM global_stats WHERE id = 1`).get() as any;

  function h(s: number) {
    return (s / 3600).toFixed(2);
  }

  const html = `
  <html>
  <head>
  <meta charset="UTF-8">
  <style>
  body { font-family: Arial; background:#111; color:#eee; }
  .card { margin:10px; padding:15px; background:#222; border-radius:10px; }
  </style>
  </head>

  <body>
  <h1>SC Companion Report</h1>

  <div class="card">Total: ${h(global.total_seconds || 0)}h</div>
  <div class="card">In Game: ${h(global.in_game_seconds || 0)}h</div>
  <div class="card">AFK: ${h(global.afk_seconds || 0)}h</div>
  <div class="card">Sessions: ${global.sessions || 0}</div>

  <h2>Por dia</h2>

  <table border="1" cellpadding="5">
  <tr>
    <th>Data</th>
    <th>Total</th>
    <th>InGame</th>
    <th>AFK</th>
  </tr>

  ${daily.map(d => `
    <tr>
      <td>${d.date}</td>
      <td>${h(d.total_seconds)}</td>
      <td>${h(d.in_game_seconds)}</td>
      <td>${h(d.afk_seconds)}</td>
    </tr>
  `).join("")}

  </table>

  </body>
  </html>
  `;

  fs.writeFileSync("report.html", html);
}
