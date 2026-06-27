import fs from "fs";
import path from "path";
import readline from "readline";
import { Database } from "bun:sqlite";

const AFK_THRESHOLD = 60;

export async function runParser(basePath: string) {
    const DB_FILE = "sc_logs.db";

    // reset DB
    if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
    }

    const db = new Database(DB_FILE);

    db.run(`
  CREATE TABLE IF NOT EXISTS daily_logs (
    date TEXT PRIMARY KEY,
    total_seconds INTEGER,
    in_game_seconds INTEGER,
    afk_seconds INTEGER,
    sessions INTEGER
  );
  `);

    db.run(`
  CREATE TABLE IF NOT EXISTS global_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_seconds INTEGER,
    in_game_seconds INTEGER,
    afk_seconds INTEGER,
    sessions INTEGER
  );
  `);

    function extractTimestamp(line: string): Date | null {
        const match = line.match(/<(.+?)>/);
        return match ? new Date(match[1]) : null;
    }

    async function processLog(filePath: string) {
        const stream = fs.createReadStream(filePath);

        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });

        let prevTs: Date | null = null;

        let total = 0;
        let afk = 0;
        let inGame = 0;
        let sessions = 0;

        let isInGame = false;

        for await (const line of rl) {
            const ts = extractTimestamp(line);
            if (!ts) continue;

            if (prevTs) {
                const diff = (ts.getTime() - prevTs.getTime()) / 1000;

                total += diff;

                if (diff > AFK_THRESHOLD) {
                    afk += diff;
                } else if (isInGame) {
                    inGame += diff;
                }
            }

            prevTs = ts;

            if (line.includes("CGameContext::m_currentState = EGameContextState::eEGS_Running")) {
                isInGame = true;
            }

            if (line.includes("Channel Disconnected")) {
                isInGame = false;
            }

            if (line.includes("LoginCompleted")) {
                sessions++;
            }
        }

        return {
            date: prevTs ? prevTs.toISOString().slice(0, 10) : null,
            total,
            inGame,
            afk,
            sessions,
        };
    }

    function saveDaily(data: any) {
        const existing = db.query(`SELECT * FROM daily_logs WHERE date = ?`).get(data.date);

        if (existing) {
            db.run(`
        UPDATE daily_logs
        SET total_seconds = total_seconds + ?,
            in_game_seconds = in_game_seconds + ?,
            afk_seconds = afk_seconds + ?,
            sessions = sessions + ?
        WHERE date = ?
      `, [data.total, data.inGame, data.afk, data.sessions, data.date]);
        } else {
            db.run(`
        INSERT INTO daily_logs VALUES (?, ?, ?, ?, ?)
      `, [data.date, data.total, data.inGame, data.afk, data.sessions]);
        }
    }

    function updateGlobal() {
        const totals = db.query(`
      SELECT 
        SUM(total_seconds) as total,
        SUM(in_game_seconds) as ingame,
        SUM(afk_seconds) as afk,
        SUM(sessions) as sessions
      FROM daily_logs
    `).get() as any;

        db.run(`
      INSERT INTO global_stats (id, total_seconds, in_game_seconds, afk_seconds, sessions)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        total_seconds = excluded.total_seconds,
        in_game_seconds = excluded.in_game_seconds,
        afk_seconds = excluded.afk_seconds,
        sessions = excluded.sessions
    `, [
            totals?.total || 0,
            totals?.ingame || 0,
            totals?.afk || 0,
            totals?.sessions || 0
        ]);
    }

    async function scanLogs() {
        const folders = [
            `${basePath}/logbackups`,
            `${basePath}`,
        ];

        for (const folder of folders) {
            if (!fs.existsSync(folder)) continue;

            const files = fs.readdirSync(folder);

            for (const file of files) {
                if (!file.endsWith(".log")) continue;

                const fullPath = path.join(folder, file);

                console.log("📄", fullPath);

                const data = await processLog(fullPath);

                if (data.date) saveDaily(data);
            }
        }

        updateGlobal();
    }

    await scanLogs();
}
