
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function SpendingDonut() {
  const { data } = useQuery({
    queryKey:['donut'],
    queryFn: async ()=> (await api.get('/chat')).data.context.cats
  })

  if (!data) return <div className="text-sm text-gray-400">No data yet.</div>

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
