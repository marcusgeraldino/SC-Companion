import readline from "readline";
import fs from "fs";
import { exec } from "child_process";
import { runParser } from "./parser";
import { generateReport } from "./report";

function askPath(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question("Digite o caminho da pasta LIVE do Star Citizen:\n> ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

(async () => {
    console.log("🚀 SC Companion\n");

    const basePath = await askPath();

    if (!fs.existsSync(basePath)) {
        console.log("❌ Caminho inválido");
        process.exit(1);
    }

    console.log("\n📊 Processando logs...");
    await runParser(basePath);

    console.log("\n📄 Gerando relatório...");
    generateReport();

    console.log("\n🌐 Abrindo relatório...");
    exec("start report.html");

    console.log("\n✅ Finalizado!");
})();