
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSummary, syncAccounts, syncTransactions } from './api'
import Dashboard from './components/Dashboard'
import Budgets from './components/Budgets'
import Investments from './components/Investments'
import Chat from './components/Chat'
import Transactions from './components/Transactions'
import PlaidLinkButton from './components/PlaidLinkButton'
import { LayoutDashboard, Wallet, TrendingUp, MessageSquare, Receipt, RefreshCw } from 'lucide-react'

function Nav({ tab, setTab }) {
  const tabs = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Transactions', icon: Receipt },
    { name: 'Budgets', icon: Wallet },
    { name: 'Investments', icon: TrendingUp },
    { name: 'Chat', icon: MessageSquare }
  ]
  return (
    <div className="flex gap-2 mb-8 p-1.5 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 inline-flex">
      {tabs.map(t => {
        const Icon = t.icon
        const active = tab === t.name
        return (
          <button
            key={t.name}
            onClick={() => setTab(t.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${active
                ? 'bg-indigo-500 shadow-lg shadow-indigo-500/25 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Icon size={18} />
            <span className="font-medium">{t.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['summary'], queryFn: getSummary })
  const mAcc = useMutation({ mutationFn: syncAccounts, onSuccess: () => qc.invalidateQueries({ queryKey: ['summary'] }) })
  const mTxn = useMutation({ mutationFn: syncTransactions, onSuccess: () => qc.invalidateQueries({ queryKey: ['summary'] }) })

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans selection:bg-indigo-500/30">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Finance Copilot
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your AI-powered financial assistant</p>
        </div>

        <div className="flex gap-3">
          <PlaidLinkButton />

          <button
            onClick={() => mAcc.mutate()}
            disabled={mAcc.isPending}
            className="glass-button flex items-center gap-2 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-300"
          >
            <RefreshCw size={16} className={mAcc.isPending ? "animate-spin" : ""} />
            <span className="hidden md:inline">Sync Accounts</span>
          </button>

          <button
            onClick={() => mTxn.mutate()}
            disabled={mTxn.isPending}
            className="glass-button flex items-center gap-2 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-300"
          >
            <RefreshCw size={16} className={mTxn.isPending ? "animate-spin" : ""} />
            <span className="hidden md:inline">Sync Txns</span>
          </button>
        </div>
      </header>

      <Nav tab={tab} setTab={setTab} />

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {tab === 'Dashboard' && <Dashboard />}
        {tab === 'Transactions' && <Transactions />}
        {tab === 'Budgets' && <Budgets />}
        {tab === 'Investments' && <Investments />}
        {tab === 'Chat' && <Chat />}
      </main>

      <footer className="mt-12 text-center text-xs text-slate-500 pb-8">
        <p>Demo Application • Personal Finance Copilot</p>
      </footer>
    </div>
  )
}
