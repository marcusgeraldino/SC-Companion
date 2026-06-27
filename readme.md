# 🚀 SC Companion - Log Parser + Insights

Ferramenta simples feita em **Bun** para analisar logs do Star Citizen, detectar tempo em jogo, AFK e gerar insights automaticamente em HTML.

---

## 📌 Funcionalidades

✅ Leitura automática dos logs do Star Citizen  
✅ Cálculo de:
- Tempo total jogado
- Tempo real em jogo (in-game)
- Tempo AFK  
- Número de sessões  

✅ Detector de AFK (baseado em tempo sem atividade no log)  
✅ Armazenamento em SQLite  
✅ Relatório automático em HTML com insights  

---

## 📂 Estrutura do projeto

```
src/
  index.ts      -> parser dos logs
  report.ts     -> geração de insights + HTML
run_all.bat     -> executa tudo automaticamente
config.json     -> configuração do caminho do jogo
```

---

## ⚙️ Requisitos

- Windows (testado)
- Star Citizen instalado
- Bun (obrigatório)

---

## 🛠️ Instalando o Bun (PASSO IMPORTANTE)

1. Acesse: https://bun.sh/

2. Baixe e instale normalmente.

3. Após instalar, abra o PowerShell e digite:

```
bun --version
```

Se aparecer um número, está funcionando ✅

---

## ⚙️ Configuração

Crie um arquivo chamado `config.json` na raiz do projeto:

```json
{
  "gamePath": "F:/Roberts Space Industries/StarCitizen/LIVE"
}
```

---

## 🚀 Como usar

### ✅ Forma mais fácil

Dê duplo clique em:

```
run_all.bat
```

---

## 📊 Resultado

Será gerado um arquivo `report.html` com todos os insights.

---

## 🧠 Como funciona o AFK

AFK é detectado quando não há log por mais de 60 segundos.

---

## 👨‍💻 Autor

Marcus Xavier 🚀
