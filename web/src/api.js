
import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

export const createLinkToken = () => api.post('/plaid/create_link_token').then(r => r.data);
export const exchangePublicToken = (public_token, institution_name) => api.post('/plaid/exchange_public_token', { public_token, institution_name }).then(r => r.data);

export const syncAccounts = () => api.post('/data/sync/accounts').then(r => r.data);
export const syncTransactions = () => api.post('/data/sync/transactions').then(r => r.data);
export const getSummary = () => api.get('/data/summary').then(r => r.data);
export const getBudgets = (month) => api.get('/data/budgets', { params: { month } }).then(r => r.data);
export const saveBudget = (payload) => api.post('/data/budgets', payload).then(r => r.data);
export const syncInvestments = () => api.post('/data/sync/investments').then(r => r.data);
export const getInvestments = () => api.get('/data/investments').then(r => r.data);
export const chat = (question) => api.post('/chat', { question }).then(r => r.data);
