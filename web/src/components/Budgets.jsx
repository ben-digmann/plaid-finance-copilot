
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBudgets, saveBudget } from '../api'
import { Wallet, Plus, AlertCircle, PieChart as PieIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

export default function Budgets() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['budgets', month], queryFn: () => getBudgets(month) })
  const m = useMutation({ mutationFn: saveBudget, onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets', month] }) })

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data.map(b => ({
      name: b.category,
      Budget: b.budget,
      Spent: b.spent
    })).sort((a, b) => b.Spent - a.Spent);
  }, [data]);

  const handleAdd = () => {
    const cat = document.getElementById('cat').value;
    const amt = document.getElementById('amt').value;
    if (cat && amt) {
      m.mutate({ month, category: cat, amount: +amt });
      document.getElementById('cat').value = '';
      document.getElementById('amt').value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
          <Wallet className="text-purple-400" /> Monthly Budgets
        </h2>

        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/5">
          <span className="text-sm text-slate-400 px-2">Month:</span>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-transparent text-white outline-none font-mono text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Budget List */}
        <div className="lg:col-span-2 space-y-4">
          {data?.map((b, i) => {
            const percent = Math.min(100, (b.spent / b.budget) * 100);
            const isOver = b.spent > b.budget;

            return (
              <motion.div
                key={b.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-4 flex flex-col gap-2 group hover:border-purple-500/30 transition-colors"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-200">{b.category}</h3>
                    <p className="text-xs text-slate-500">
                      Spent <span className={isOver ? "text-red-400 font-bold" : "text-slate-300"}>${b.spent.toFixed(0)}</span> of ${b.budget}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isOver ? "text-red-400" : "text-emerald-400"}`}>
                      {isOver ? "Over Budget" : `$${b.remaining.toFixed(0)} left`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                  />
                </div>
              </motion.div>
            )
          })}

          {/* Add New Budget */}
          <div className="glass-panel p-4 flex gap-2 items-center border-dashed border-slate-700 bg-transparent opacity-60 hover:opacity-100 transition-opacity">
            <input id="cat" placeholder="New Category (e.g. Travel)" className="bg-transparent border-b border-slate-600 focus:border-purple-500 outline-none text-white px-2 py-1 flex-1" />
            <span className="text-slate-500">$</span>
            <input id="amt" type="number" placeholder="0" className="bg-transparent border-b border-slate-600 focus:border-purple-500 outline-none text-white px-2 py-1 w-24 text-right" />
            <button onClick={handleAdd} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Chart Column */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col">
          <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <PieIcon size={16} /> Spend vs Budget
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="Budget" stackId="a" fill="#334155" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Spent" stackId="b" fill="#8b5cf6" radius={[0, 4, 4, 0]} >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Spent > entry.Budget ? '#ef4444' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Add budgets to see analytics
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            Comparing what you planned (Grey) vs what you spent (Purple/Red).
          </p>
        </div>
      </div>
    </div>
  )
}
