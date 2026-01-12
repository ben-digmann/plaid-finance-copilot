
import express from 'express';
import db from '../db.js';
import { plaidClient } from '../plaid.js';

const router = express.Router();

// Fetch and store accounts for all items
router.post('/sync/accounts', async (req, res) => {
  try {
    const items = db.prepare(`SELECT id, access_token FROM items`).all();
    for (const it of items) {
      const resp = await plaidClient.accountsGet({ access_token: it.access_token });
      for (const acc of resp.data.accounts) {
        db.prepare(`INSERT INTO accounts (item_id, account_id, name, official_name, type, subtype, mask, available, current, iso_currency_code, unofficial_currency_code, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
          ON CONFLICT(account_id) DO UPDATE SET
            name=excluded.name, official_name=excluded.official_name, type=excluded.type, subtype=excluded.subtype,
            mask=excluded.mask, available=excluded.available, current=excluded.current,
            iso_currency_code=excluded.iso_currency_code, unofficial_currency_code=excluded.unofficial_currency_code,
            updated_at=CURRENT_TIMESTAMP
        `).run(it.id, acc.account_id, acc.name, acc.official_name || '', acc.type, acc.subtype || '', acc.mask || '', acc.balances.available, acc.balances.current, acc.balances.iso_currency_code, acc.balances.unofficial_currency_code || null);
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Accounts sync failed' });
  }
});

// Transactions sync (incremental)
router.post('/sync/transactions', async (req, res) => {
  console.log("Starting transaction sync...");
  try {
    const items = db.prepare(`SELECT id, access_token FROM items`).all();
    console.log(`Found ${items.length} items to sync.`);

    let addedTotal = 0;
    for (const it of items) {
      console.log(`Syncing item ID: ${it.id}`);
      let cursorRow = db.prepare(`SELECT id, cursor FROM cursors WHERE item_id=?`).get(it.id);
      let cursor = cursorRow?.cursor || null;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching from Plaid with cursor: ${cursor}`);
        const resp = await plaidClient.transactionsSync({ access_token: it.access_token, cursor });
        const { added, next_cursor, has_more, modified, removed } = resp.data;
        console.log(`Plaid response: added=${added.length}, modified=${modified.length}, removed=${removed.length}, has_more=${has_more}`);

        for (const t of added) {
          const cat = t.personal_finance_category?.primary || t.category?.[0] || 'Other';
          try {
            db.prepare(`INSERT OR IGNORE INTO transactions (item_id, account_id, transaction_id, amount, iso_currency_code, date, authorized_date, name, merchant_name, category, pending)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
              .run(it.id, t.account_id, t.transaction_id, Math.abs(t.amount), t.iso_currency_code || '', t.date, t.authorized_date || '', t.name || '', t.merchant_name || '', cat, t.pending ? 1 : 0);
          } catch (err) {
            console.error("Error inserting transaction:", err.message);
          }
        }
        addedTotal += added.length;
        cursor = next_cursor;
        hasMore = has_more;
      }

      if (cursor) {
        if (cursorRow) db.prepare(`UPDATE cursors SET cursor=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(cursor, cursorRow.id);
        else db.prepare(`INSERT INTO cursors (item_id, cursor) VALUES (?,?)`).run(it.id, cursor);
      }
    }
    console.log(`Sync complete. Total added: ${addedTotal}`);
    res.json({ ok: true, added: addedTotal });
  } catch (e) {
    console.error("Sync error details:", e.response?.data || e.message);
    res.status(500).json({ error: 'Transactions sync failed', details: e.message });
  }
});

// Simple summaries for UI
router.get('/summary', (req, res) => {
  const accounts = db.prepare(`SELECT COUNT(*) as n, SUM(current) as balance FROM accounts`).get();
  const txCount = db.prepare(`SELECT COUNT(*) as n FROM transactions`).get().n;
  res.json({ accounts, txCount });
});

import { budgetsStatus } from '../insights.js';

// ... other imports ...

// Budgets CRUD
router.get('/budgets', (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows = budgetsStatus({ month, userId: 'demo' });
  res.json(rows);
});

router.post('/budgets', (req, res) => {
  const { month, category, amount } = req.body;
  db.prepare(`INSERT INTO budgets (user_id, month, category, amount) VALUES ('demo',?,?,?)`).run(month, category, amount);
  res.json({ ok: true });
});

// Investments Sync
router.post('/sync/investments', async (req, res) => {
  try {
    const items = db.prepare(`SELECT id, access_token FROM items`).all();
    let totalHoldings = 0;

    for (const it of items) {
      try {
        const resp = await plaidClient.investmentsHoldingsGet({ access_token: it.access_token });
        const { holdings, securities } = resp.data;

        // Upsert Securities
        const insertSec = db.prepare(`INSERT OR REPLACE INTO securities (security_id, ticker, name, type, close_price, close_price_as_of, iso_currency_code)
          VALUES (?,?,?,?,?,?,?)`);

        for (const s of securities) {
          insertSec.run(s.security_id, s.ticker_symbol, s.name, s.type, s.close_price, s.close_price_as_of, s.iso_currency_code);
        }

        // Replace Holdings for this item
        db.prepare(`DELETE FROM holdings WHERE item_id=?`).run(it.id);
        const insertHold = db.prepare(`INSERT INTO holdings (item_id, account_id, security_id, quantity, institution_value, cost_basis, iso_currency_code)
          VALUES (?,?,?,?,?,?,?)`);

        for (const h of holdings) {
          insertHold.run(it.id, h.account_id, h.security_id, h.quantity, h.institution_value, h.cost_basis, h.iso_currency_code);
        }
        totalHoldings += holdings.length;
      } catch (err) {
        console.error(`Example Error syncing item ${it.id}:`, err.response?.data || err.message);
        // Continue to next item even if one fails (e.g. item doesn't support investments)
      }
    }
    res.json({ ok: true, added: totalHoldings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Investments sync failed' });
  }
});

router.get('/investments', (req, res) => {
  const { userId = 'demo' } = req.query;
  const rows = db.prepare(`
    SELECT h.*, s.ticker, s.name as security_name, s.type, s.close_price 
    FROM holdings h 
    JOIN securities s ON h.security_id = s.security_id
    JOIN items i ON h.item_id = i.id
    WHERE i.user_id = ?
    ORDER BY h.institution_value DESC
  `).all(userId);
  res.json(rows);
});

export default router;
