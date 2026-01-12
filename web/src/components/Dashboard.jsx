
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { chat } from '../api'
import SpendingDonut from './SpendingDonut'
import CashflowChart from './CashflowChart'

export default function Dashboard() {
  const [quick, setQuick] = React.useState('')
  const { data, refetch } = useQuery({ queryKey:['quick'], queryFn: ()=>chat('Give me one-sentence summary of my finances this month'), enabled:false })

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-4 bg-gray-900 rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Spending by Category (90 days)</h2>
        <SpendingDonut />
      </div>
      <div className="md:col-span-8 bg-gray-900 rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Cashflow (6 months)</h2>
        <CashflowChart />
      </div>
      <div className="md:col-span-12 bg-gray-900 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Quick take</h2>
          <button onClick={()=>refetch()} className="px-3 py-2 rounded-xl bg-gray-800">Refresh</button>
        </div>
        <p className="mt-2 text-gray-200">{data?.answer || 'Click refresh for a quick AI summary.'}</p>
      </div>
    </div>
  )
}
