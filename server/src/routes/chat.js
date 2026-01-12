
import express from 'express';
import db from '../db.js';
import { getCashflowSummary, topCategorySpend, upcomingBills, budgetsStatus, accountsSnapshot } from '../insights.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const router = express.Router();

// Simple keyword extraction for "RAG-lite"
function findRelevantTransactions(queryText, userId = 'demo') {
  if (!queryText) return [];
  // basic stop words
  const stops = new Set(['what', 'where', 'when', 'how', 'much', 'does', 'did', 'spent', 'cost', 'money', 'show', 'give', 'list', 'tell', 'transaction', 'transactions', 'payment', 'payments']);
  const tokens = queryText.toLowerCase().replace(/[?.,!]/g, '').split(/\s+/).filter(t => t.length > 2 && !stops.has(t));

  if (tokens.length === 0) return [];

  // Construct query: check name, merchant, category for ANY match
  // LIMIT 20
  const conditions = tokens.map(() => `(name LIKE ? OR merchant_name LIKE ? OR category LIKE ?)`).join(' OR ');
  const params = [userId];
  tokens.forEach(t => {
    const like = `%${t}%`;
    params.push(like, like, like);
  });

  const sql = `
    SELECT date, name, merchant_name, amount, category 
    FROM transactions t
    JOIN items i ON t.item_id = i.id
    WHERE i.user_id = ? AND (${conditions})
    ORDER BY date DESC
    LIMIT 20
  `;

  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    console.error("Search error", e);
    return [];
  }
}

function buildContext(query) {
  const month = new Date().toISOString().slice(0, 7);
  const cash = getCashflowSummary({ months: 6 });
  const cats = topCategorySpend({ months: 3 });
  const bills = upcomingBills({});
  const budgets = budgetsStatus({ month });
  const accounts = accountsSnapshot({});

  // RAG: Add relevant transactions
  const relevantTransactions = findRelevantTransactions(query);

  return { month, cash, cats, bills, budgets, accounts, relevantTransactions };
}

async function askOpenAI(prompt, context) {
  const apiKey = process.env.OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const sys = `You are a helpful financial copilot. 
  You have access to a summary of finances AND a list of 'relevantTransactions' found by keyword search. 
  Always use the relevantTransactions to answer specific questions about spending history.
  If the user asks about a specific merchant (e.g. 'Target'), look at relevantTransactions.
  Always state the month you are using for budgets and provide clear, concise explanations. 
  When giving numbers, include units and dates. 
  If you make an assumption, say so.`;

  const ctx = `Data Context:\n${JSON.stringify(context, null, 2)}`;

  try {
    if (azureEndpoint && azureKey && azureDeployment) {
      // Azure OpenAI (Chat Completions style)
      const url = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-10-21`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: `${ctx}\n\nQuestion: ${prompt}` }
          ],
          max_tokens: 800,
          temperature: 0.2
        })
      });
      const j = await r.json();
      return j.choices?.[0]?.message?.content || JSON.stringify(j);
    } else if (apiKey) {
      // OpenAI (Chat Completions)
      // OpenAI (Chat Completions) or Compatible (OpenRouter)
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const url = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173', // OpenRouter Requirement
          'X-Title': 'Plaid Finance Copilot'      // OpenRouter Requirement
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: `${ctx}\n\nQuestion: ${prompt}` }
          ],
          max_tokens: 800,
          temperature: 0.2
        })
      });
      const j = await r.json();
      return j.choices?.[0]?.message?.content || JSON.stringify(j);
    } else {
      // No LLM configured – fallback response
      return `LLM not configured. Based on your data: Last month's savings rate was ${context.cash.savingsRate}%. Top category: ${context.cats[0]?.name} at $${context.cats[0]?.value?.toFixed(2)}. I found ${context.relevantTransactions.length} relevant transactions.`;
    }
  } catch (e) {
    console.error(e);
    return `Chat error: ${e.message}`;
  }
}
router.get('/', (req, res) => {
  const context = buildContext('');
  res.json({ context });
});
router.post('/', async (req, res) => {
  const { question } = req.body;
  const context = buildContext(question);
  const answer = await askOpenAI(question || 'Give me a quick summary of my finances.', context);
  res.json({ answer, context });
});

export default router;
