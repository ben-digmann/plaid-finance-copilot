
import React, { useState } from 'react'
import { chat } from '../api'

export default function Chat() {
  const [q, setQ] = useState('How much did I spend on food last month?')
  const [a, setA] = useState('')
  const ask = async () => {
    const r = await chat(q)
    setA(r.answer)
  }
  const suggestions = [
    'Summarize my cashflow this month',
    'What are my top 3 merchants in the last 90 days?',
    'How am I tracking vs my budgets?',
    'Do I have any upcoming bills I should plan for?'
  ]
  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <div className="flex gap-2 flex-wrap mb-2">
        {suggestions.map(s=> (
          <button key={s} onClick={()=>setQ(s)} className="px-3 py-1 rounded-full bg-gray-800 text-sm">{s}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-gray-800 rounded px-3 py-2" />
        <button onClick={ask} className="px-3 py-2 rounded-xl bg-indigo-600">Ask</button>
      </div>
      <div className="mt-3 whitespace-pre-wrap text-gray-100 min-h-[120px]">{a}</div>
      <p className="text-xs text-gray-400 mt-2">Answers include live summaries derived from your synced data.</p>
    </div>
  )
}
