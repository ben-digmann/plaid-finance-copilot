
import db from './db.js';

export function getCashflowSummary({ months = 6, userId = 'demo' } = {}) {
  // Sum income (positive) and expenses (negative)
  const rows = db.prepare(
    `SELECT date, amount, name, merchant_name, category
     FROM transactions t
     JOIN items i ON t.item_id = i.id
     WHERE i.user_id = ?
     ORDER BY date DESC
     LIMIT 5000`
  ).all(userId);

  // group by month
  const map = new Map();
  for (const r of rows) {
    const m = r.date.slice(0, 7);
    if (!map.has(m)) map.set(m, { income: 0, expenses: 0 });
    const entry = map.get(m);
    if (r.amount < 0) entry.income += Math.abs(r.amount);
    else entry.expenses += r.amount;
  }
  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-months);
  const series = sorted.map(([month, v]) => ({ month, income: +(v.income.toFixed(2)), expenses: +(v.expenses.toFixed(2)), net: +((v.income - v.expenses).toFixed(2)) }));

  const last = series[series.length - 1] || { income: 0, expenses: 0, net: 0 };
  const savingsRate = last.income ? +(((last.income - last.expenses) / last.income) * 100).toFixed(1) : 0;
  const burn = last.net < 0 ? Math.abs(last.net) : 0;

  return { series, lastMonth: last, savingsRate, monthlyBurn: burn };
}

export function topCategorySpend({ months = 3, userId = 'demo' } = {}) {
  const rows = db.prepare(
    `SELECT date, amount, category
     FROM transactions t
     JOIN items i ON t.item_id = i.id
     WHERE i.user_id = ? AND date >= date('now','start of month', '-' || ? || ' months')
     ORDER BY date DESC`
  ).all(userId, months);

  const catMap = new Map();
  for (const r of rows) {
    const cat = r.category || 'Other';
    const val = r.amount > 0 ? r.amount : 0; // expenses are positive amounts in this demo
    catMap.set(cat, (catMap.get(cat) || 0) + val);
  }
  const arr = [...catMap.entries()].map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  arr.sort((a, b) => b.value - a.value);
  return arr.slice(0, 10);
}

export function upcomingBills({ userId = 'demo' } = {}) {
  // naive: merchants with near-monthly cadence
  const rows = db.prepare(
    `SELECT name, merchant_name, date, amount
     FROM transactions t
     JOIN items i ON t.item_id = i.id
     WHERE i.user_id = ?
     ORDER BY date DESC`
  ).all(userId);
  const byMerchant = new Map();
  for (const r of rows) {
    const key = r.merchant_name || r.name;
    if (!byMerchant.has(key)) byMerchant.set(key, []);
    byMerchant.get(key).push(r);
  }
  const bills = [];
  for (const [m, txns] of byMerchant.entries()) {
    if (txns.length < 3) continue;
    txns.sort((a, b) => b.date.localeCompare(a.date));
    const a = new Date(txns[0].date), b = new Date(txns[1].date);
    const diff = Math.abs((a - b) / (1000 * 60 * 60 * 24));
    if (diff > 25 && diff < 35) {
      const avg = Math.abs(txns.slice(0, 3).reduce((s, t) => s + t.amount, 0) / 3);
      const next = new Date(a); next.setMonth(a.getMonth() + 1);
      bills.push({ merchant: m, expected_amount: +avg.toFixed(2), expected_date: next.toISOString().slice(0, 10) });
    }
  }
  return bills.slice(0, 10);
}

export function budgetsStatus({ month, userId = 'demo' } = {}) {
  const m = month || new Date().toISOString().slice(0, 7);
  const budgets = db.prepare(`SELECT category, amount FROM budgets WHERE user_id=? AND month=?`).all(userId, m);
  const spendRows = db.prepare(
    `SELECT category, SUM(amount) as spent
     FROM transactions t
     JOIN items i ON t.item_id = i.id
     WHERE i.user_id=? AND date LIKE ? AND amount > 0
     GROUP BY category`
  ).all(userId, `${m}%`);
  const spendMap = new Map(spendRows.map(r => [r.category || 'Other', r.spent || 0]));
  return budgets.map(b => {
    const spent = +(spendMap.get(b.category) || 0).toFixed(2);
    return { category: b.category, budget: b.amount, spent, remaining: +(b.amount - spent).toFixed(2) };
  });
}

export function accountsSnapshot({ userId = 'demo' } = {}) {
  const rows = db.prepare(
    `SELECT a.name, a.type, a.subtype, a.available, a.current, a.iso_currency_code
     FROM accounts a
     JOIN items i ON a.item_id = i.id
     WHERE i.user_id=?`
  ).all(userId);
  const totals = rows.reduce((acc, r) => {
    const bal = r.current ?? r.available ?? 0;
    if (['credit'].includes(r.type)) acc.liabilities += Math.abs(bal);
    else acc.assets += bal;
    return acc;
  }, { assets: 0, liabilities: 0 });
  return { accounts: rows, netWorth: +(totals.assets - totals.liabilities).toFixed(2) };
}
