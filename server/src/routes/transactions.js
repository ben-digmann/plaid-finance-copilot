
import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/transactions
// ?limit=50&offset=0&month=2023-10
router.get('/', (req, res) => {
    try {
        const { userId = 'demo', limit = 50, offset = 0, month, q } = req.query;

        let query = `
      SELECT t.*, i.institution_name 
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE i.user_id = ?
    `;
        const params = [userId];

        if (month) {
            query += ` AND t.date LIKE ?`;
            params.push(`${month}%`);
        }

        if (q) {
            query += ` AND (t.name LIKE ? OR t.merchant_name LIKE ? OR t.category LIKE ?)`;
            const like = `%${q}%`;
            params.push(like, like, like);
        }

        // Count total for pagination
        const countStmt = db.prepare(`SELECT COUNT(*) as total FROM (${query})`);
        const total = countStmt.get(...params).total;

        // Fetch Page
        query += ` ORDER BY t.date DESC LIMIT ? OFFSET ?`;
        params.push(+limit, +offset);

        const rows = db.prepare(query).all(...params);

        res.json({ data: rows, total, limit: +limit, offset: +offset });
    } catch (err) {
        console.error('Transactions error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
