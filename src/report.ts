import { Database } from "bun:sqlite";
import fs from "fs";

export function generateReport() {
  const db = new Database("sc_logs.db");

  const daily = db.query(`SELECT * FROM daily_logs ORDER BY date ASC`).all() as any[];
  const global = db.query(`SELECT * FROM global_stats WHERE id = 1`).get() as any;

  function h(s: number) {
    return (s / 3600).toFixed(2);
  }

  // prepara dados para gráfico
  const dates = daily.map(d => d.date);
  const totalData = daily.map(d => (d.total_seconds / 3600).toFixed(2));
  const afkData = daily.map(d => (d.afk_seconds / 3600).toFixed(2));

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<!-- ECharts CDN -->
<script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>

<style>
body {
  font-family: Arial;
  background: radial-gradient(circle at top, #0b0f18, #03060a);
  color: #e6f1ff;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #66d9ff;
}

.container {
  max-width: 1200px;
  margin: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.card {
  background: rgba(20, 30, 50, 0.8);
  border: 1px solid #294a6d;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.card h2 {
  margin: 0;
  color: #66d9ff;
}

.chart {
  margin-top: 30px;
  height: 400px;
  background: rgba(15,25,40,0.9);
  border-radius: 10px;
  padding: 10px;
}

table {
  width: 100%;
  margin-top: 30px;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  border-bottom: 1px solid #294a6d;
  text-align: center;
}

th {
  color: #66d9ff;
}
</style>
</head>

<body>
<div class="container">

<h1>🚀 SC Companion</h1>

<div class="grid">
  <div class="card">
    <h2>${h(global.total_seconds || 0)}h</h2>
    <small>Total Jogado</small>
  </div>

  <div class="card">
    <h2>${h(global.in_game_seconds || 0)}h</h2>
    <small>In Game</small>
  </div>

  <div class="card">
    <h2>${h(global.afk_seconds || 0)}h</h2>
    <small>AFK</small>
  </div>

  <div class="card">
    <h2>${global.sessions || 0}</h2>
    <small>Sessões</small>
  </div>
</div>

<div id="chart1" class="chart"></div>
<div id="chart2" class="chart"></div>

<h2>📊 Histórico</h2>

<table>
<tr>
  <th>Data</th>
  <th>Total (h)</th>
  <th>InGame (h)</th>
  <th>AFK (h)</th>
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

</div>

<script>

// ===================
// GRÁFICO 1 (pizza)
// ===================

var chart1 = echarts.init(document.getElementById('chart1'));

chart1.setOption({
  backgroundColor: 'transparent',
  title: {
    text: 'Uso Geral',
    left: 'center',
    textStyle: { color: '#66d9ff' }
  },
  tooltip: {},
  series: [{
    type: 'pie',
    radius: '65%',
    data: [
      { value: ${h(global.in_game_seconds || 0)}, name: 'In Game' },
      { value: ${h(global.afk_seconds || 0)}, name: 'AFK' }
    ],
    label: { color: '#fff' }
  }]
});


// ===================
// GRÁFICO 2 (linha)
// ===================

var chart2 = echarts.init(document.getElementById('chart2'));

chart2.setOption({
  backgroundColor: 'transparent',
  title: {
    text: 'Tempo por dia',
    left: 'center',
    textStyle: { color: '#66d9ff' }
  },
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['Total', 'AFK'],
    textStyle: { color: '#fff' }
  },
  xAxis: {
    type: 'category',
    data: ${JSON.stringify(dates)},
    axisLabel: { color: '#fff' }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#fff' }
  },
  series: [
    {
      name: 'Total',
      type: 'line',
      data: ${JSON.stringify(totalData)},
      smooth: true
    },
    {
      name: 'AFK',
      type: 'line',
      data: ${JSON.stringify(afkData)},
      smooth: true
    }
  ]
});

</script>

</body>
</html>
`;

  fs.writeFileSync("report.html", html);

  db.close();
}