# Personal Finance Copilot (Plaid + LLM)

A full-stack example that ingests banking and investment data from Plaid, visualizes budgets and investments, and includes a generative AI chat that answers questions about your finances.


## What’s inside
- **server/** Node/Express API
  - Plaid Link token creation, token exchange, accounts & transactions sync
  - Basic SQLite persistence (accounts, transactions, budgets, cursors)
  - Insights: cashflow, savings rate, category spend, bill predictions
  - `/api/chat` endpoint powered by OpenAI (or leave unconfigured to stub responses)
- **web/** Vite + React UI
  - Dark theme dashboard with Recharts: spending donut, cashflow, budget progress, holdings
  - Plaid Link flow
  - AI chat panel for natural-language Q&A about your data

## Quickstart
1. **Prereqs:** Node 18+, pnpm or npm.
2. **Server env:** Copy `server/.env.example` to `server/.env` and fill in values.
3. **Install + run API**
   ```bash
   cd server
   npm install
   npm run dev
   # server on http://localhost:5000
   ```
4. **Install + run Web**
   ```bash
   cd ../web
   npm install
   npm run dev
   # web on http://localhost:5173
   ```

## Environment (.env)
In `server/.env`:
```
PORT=5000
CLIENT_URL=http://localhost:5173

PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
# Optional Azure-style
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
```

## Plaid setup
- In the web app, click **Connect accounts** to launch Plaid Link.
- After linking, the server exchanges the public token for an access token and stores it.
- Use **Sync transactions** to pull historical + new transactions via `/transactions/sync`.
- Budgets live in SQLite (server/db.sqlite). Adjust via simple API calls or by editing code.

## AI Chat
- `/api/chat` compiles fresh insights (cashflow, top merchants, budget status) and adds them as context for the LLM so your answers reflect your real data.
- If no LLM key is present, it responds with a simple rule-based answer to prove the flow works.

## DISCLAIMER
This is a demo. Not financial advice. Verify calculations before relying on them.
