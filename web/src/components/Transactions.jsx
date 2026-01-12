
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft, ArrowRight, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

async function fetchTransactions({ queryKey }) {
    const [_, { page, search }] = queryKey;
    const limit = 20;
    const offset = page * limit;
    const params = { limit, offset };
    if (search) params.q = search;
    const res = await axios.get('/api/transactions', { params });
    return res.data;
}

export default function Transactions() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Simple debounce effect
    React.useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 500);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['transactions', { page, search: debouncedSearch }],
        queryFn: fetchTransactions,
        keepPreviousData: true
    });

    if (isError) {
        return (
            <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                <h3 className="font-bold">Error loading transactions</h3>
                <p className="text-sm opacity-80">{error?.message}</p>
                <p className="text-xs mt-2 font-mono">Check if server is running on port 8000</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Transactions
                </h2>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none w-64 transition-all text-sm placeholder-slate-500 text-white"
                        placeholder="Search merchants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/5 text-slate-400 uppercase text-xs font-medium tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading transactions...</td></tr>
                            ) : data?.data?.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No transactions found</td></tr>
                            ) : (
                                data?.data.map((tx, i) => (
                                    <motion.tr
                                        key={`${tx.date}-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                            {tx.date}
                                        </td>
                                        <td className="px-6 py-4 text-slate-200 font-medium">
                                            <div className="flex flex-col">
                                                <span>{tx.merchant_name || tx.name}</span>
                                                {tx.merchant_name && tx.merchant_name !== tx.name && (
                                                    <span className="text-xs text-slate-500">{tx.name}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                                                {tx.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium text-base ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                            {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        Showing {data?.offset || 0} - {(data?.offset || 0) + (data?.data?.length || 0)} of {data?.total || 0}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || isLoading}
                            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!data || (data.offset + data.limit >= data.total) || isLoading}
                            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
