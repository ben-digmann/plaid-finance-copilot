
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import plaidRoutes from './routes/plaid.js';
import dataRoutes from './routes/data.js';
import chatRoutes from './routes/chat.js';
import transactionsRoutes from './routes/transactions.js';

dotenv.config();

const app = express();
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json({ limit: '2mb' }));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/plaid', plaidRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/transactions', transactionsRoutes);

// Serve static (optional build step)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
