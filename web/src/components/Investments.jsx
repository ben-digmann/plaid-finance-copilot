
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvestments, syncInvestments, api } from '../api'
import { RefreshCw, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

export default function Investments() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['investments'], queryFn: getInvestments })

  // Fetch context for Net Worth
  const { data: ctxData } = useQuery({
    queryKey: ['context'],
    queryFn: async () => (await api.get('/chat')).data.context
  })

  const mSync = useMutation({
    mutationFn: syncInvestments,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] })
      alert("Investments synced!")
    },
    onError: (e) => alert("Failed to sync: " + e.message)
  })

  // Prepare allocation data
  const allocation = React.useMemo(() => {
    if (!data) return [];
    const map = new Map();
    for (const h of data) {
      const type = h.type || 'Other';
      map.set(type, (map.get(type) || 0) + h.institution_value);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [data]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" /> Investments
        </h2>
        <button
          onClick={() => mSync.mutate()}
          disabled={mSync.isPending}
          className="glass-button flex items-center gap-2 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-300"
        >
          <RefreshCw size={16} className={mSync.isPending ? "animate-spin" : ""} />
          <span>Sync Holdings</span>
        </button>
      </div>

      {/* Net Worth Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Net Worth</p>
            <h3 className="text-4xl font-bold text-white mt-2">
              {ctxData?.accounts?.netWorth ? `$${ctxData.accounts.netWorth.toLocaleString()}` : '...'}
            </h3>
          </div>
          <div className="mt-4 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block self-start">
            +2.4% this month
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="md:col-span-2 glass-panel p-6 flex flex-col">
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
            <PieIcon size={16} /> Asset Allocation
          </h3>
          <div className="flex-1 h-48 w-full">
            {allocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No allocation data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-slate-200">Portfolio Holdings</h3>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading holdings...</div>
        ) : (!data || data.length === 0) ? (
          <div className="p-12 text-center text-slate-500">
            <p>No investment holdings found.</p>
            <p className="text-xs mt-2 opacity-50">Link an investment account to see your portfolio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/5 text-slate-400 uppercase text-xs font-medium tracking-wider">
                <tr>
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((h, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-emerald-300 font-bold">{h.ticker || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-300">{h.security_name}</td>
                    <td className="px-6 py-4 text-right text-slate-400">{h.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-400">${h.close_price?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">${h.institution_value?.toFixed(2)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
