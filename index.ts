import readline from "readline";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { runParser } from "./src/parser";
import { generateReport } from "./src/report";

// ==========================
// INPUT OPCIONAL
// ==========================

function askPath(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(
            "Digite o caminho da pasta LIVE do Star Citizen (ou pressione ENTER para usar a pasta atual):\n> ",
            (answer) => {
                rl.close();
                resolve(answer.trim().replace(/\\+/g, "/"));
            }
        );
    });
}

// ==========================
// DELETE COM RETRY
// ==========================

function deleteDBWithRetry(file: string, attempts = 5) {
    let count = 0;

    const tryDelete = () => {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log("🗑️ Banco removido");
                return;
            }
        } catch (err) {
            if (count < attempts) {
                count++;
                setTimeout(tryDelete, 500);
            } else {
                console.log("⚠️ Não foi possível remover o banco após várias tentativas");
            }
        }
    };

    tryDelete();
}

// ==========================
// MAIN
// ==========================

(async () => {
    console.log("🚀 SC Companion\n");

    const userInput = await askPath();

    // ✅ se usuário não digitar nada → usa pasta atual
    let basePath = userInput;

    if (!basePath) {
        basePath = process.cwd().replace(/\\+/g, "/");
        console.log("📁 Usando pasta atual:", basePath);
    }

    // validação
    if (!fs.existsSync(basePath)) {
        console.log("❌ Caminho inválido");
        process.exit(1);
    }

    console.log("\n📊 Processando logs...");
    await runParser(basePath);

    console.log("\n📄 Gerando relatório...");
    generateReport();

    console.log("\n🌐 Abrindo relatório...");

    const reportPath = path.resolve("report.html");
    exec(`start "" "${reportPath}"`);

    // ==========================
    // REMOVE DB COM SEGURANÇA
    // ==========================

    setTimeout(() => {
        deleteDBWithRetry("sc_logs.db");
    }, 1500);

    console.log("\n✅ Finalizado!");
})();