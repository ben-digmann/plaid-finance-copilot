
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function CashflowChart() {
  const { data } = useQuery({
    queryKey:['cashflow'],
    queryFn: async ()=> (await api.get('/chat')).data.context.cash.series
  })

  if (!data) return <div className="text-sm text-gray-400">No data yet.</div>

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" />
          <Line type="monotone" dataKey="expenses" />
          <Line type="monotone" dataKey="net" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
