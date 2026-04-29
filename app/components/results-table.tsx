// app/components/results-table.tsx
import React from 'react'
import { Result } from '@/lib/types'
import { formatDisplayTime } from '@/lib/utils'

export default function ResultsTable({ results }: { results: Result[] }) {
  if (!results || results.length === 0) {
    return <div className="card">暂无成绩 — 管理员尚未录入。</div>
  }

  const sorted = results.slice().sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>排名</th>
            <th>队伍名称</th>
            <th>成绩</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id}>
              <td>{r.rank ?? '-'}</td>
              <td>{r.team_name}</td>
              <td>{formatDisplayTime(r.display_time)}</td> {/* 使用格式化后的时间 */}
              <td>
                <span className={`status-badge ${
                  r.status === 'completed' ? 'status-blue' : 
                  r.status === 'in_progress' ? 'status-yellow' : 'status-white'
                }`}>
                  {r.status === 'completed' ? '已完成' : 
                   r.status === 'in_progress' ? '进行中' : '待开始'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
