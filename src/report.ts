import { Database } from "bun:sqlite";
import fs from "fs";

const db = new Database("sc_logs.db");

// --- pegar dados ---
const daily = db.query(`
  SELECT * FROM daily_logs ORDER BY date ASC
`).all() as any[];

const global = db.query(`
  SELECT * FROM global_stats WHERE id = 1
`).get() as any;

// --- helpers ---
function formatHours(seconds: number) {
  return (seconds / 3600).toFixed(2);
}

// --- INSIGHTS ---
const totalHours = formatHours(global.total_seconds || 0);
const ingameHours = formatHours(global.in_game_seconds || 0);
const afkHours = formatHours(global.afk_seconds || 0);

const avgSession =
  global.sessions > 0
    ? (global.total_seconds / global.sessions / 60).toFixed(1)
    : 0;

const mostActiveDay = daily.reduce((prev, curr) =>
  curr.total_seconds > (prev?.total_seconds || 0) ? curr : prev,
  null
);

const afkRatio =
  global.total_seconds > 0
    ? ((global.afk_seconds / global.total_seconds) * 100).toFixed(1)
    : 0;

// --- montar HTML ---
const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8" />
<title>SC Companion - Insights</title>

<style>
body {
  font-family: Arial;
  background: #0f172a;
  color: #e2e8f0;
  padding: 20px;
}

.card {
  background: #1e293b;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 10px;
}

h1 {
  margin-bottom: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.bad {
  color: #f87171;
}

.good {
  color: #4ade80;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td, th {
  padding: 8px;
  border-bottom: 1px solid #334155;
}
</style>

</head>
<body>

<h1>🚀 SC Companion - Insights</h1>

<div class="grid">

  <div class="card"><b>Total jogado:</b><br>${totalHours} horas</div>
  <div class="card"><b>Tempo in-game:</b><br>${ingameHours} horas</div>
  <div class="card"><b>Tempo AFK:</b><br><span class="${afkRatio > 30 ? "bad" : "good"}">${afkHours} horas</span></div>
  <div class="card"><b>Sessões:</b><br>${global.sessions}</div>

  <div class="card"><b>Média por sessão:</b><br>${avgSession} minutos</div>
  <div class="card"><b>% AFK:</b><br>${afkRatio}%</div>

  <div class="card">
    <b>Dia mais ativo:</b><br>
    ${mostActiveDay?.date || "N/A"}<br>
    ${formatHours(mostActiveDay?.total_seconds || 0)} horas
  </div>

</div>

<h2>📊 Histórico diário</h2>

<table>
  <tr>
    <th>Data</th>
    <th>Total (h)</th>
    <th>In Game</th>
    <th>AFK</th>
    <th>Sessões</th>
  </tr>

  ${daily
    .map(
      (d) => `
      <tr>
        <td>${d.date}</td>
        <td>${formatHours(d.total_seconds)}</td>
        <td>${formatHours(d.in_game_seconds)}</td>
        <td>${formatHours(d.afk_seconds)}</td>
        <td>${d.sessions}</td>
      </tr>
    `
    )
    .join("")}

</table>

</body>
</html>
`;

fs.writeFileSync("report.html", html);

console.log("✅ report.html gerado com sucesso!");