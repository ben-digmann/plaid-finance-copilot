
import express from 'express';
import { plaidClient } from '../plaid.js';
import db from '../db.js';

const router = express.Router();

// Create Plaid Link token
router.post('/create_link_token', async (req, res) => {
  try {
    const userId = 'demo'; // replace with real auth user id
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Personal Finance Copilot',
      products: ['transactions', 'investments'],
      country_codes: ['US'],
      language: 'en',
      redirect_uri: undefined
    });
    res.json(response.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Link token failed' });
  }
});

// Exchange public_token for access_token
router.post('/exchange_public_token', async (req, res) => {
  const { public_token, institution_name } = req.body;
  console.log(`Exchanging token for inst: ${institution_name}`);
  // Sanity check env
  if (!process.env.PLAID_SECRET || !process.env.PLAID_CLIENT_ID) {
    console.error("Missing Plaid credentials in .env");
    return res.status(500).json({ error: 'Server misconfigured: missing keys' });
  }

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    console.log("Token exchanged successfully. Saving to DB...");
    const userId = 'demo';
    const info = db.prepare(`INSERT INTO items (user_id, access_token, institution_name) VALUES (?,?,?)`).run(userId, access_token, institution_name || '');
    res.json({ ok: true, item_id: info.lastInsertRowid });
  } catch (e) {
    console.error("Exchange Error:", e.response?.data || e.message);
    res.status(500).json({ error: 'Token exchange failed', details: e.response?.data || e.message });
  }
});

export default router;
