// app/components/match-card.tsx
'use client'

import { useState, useMemo } from 'react'
import { Match, Result } from '@/lib/types'
import { formatDisplayTime } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  results: Result[]
  isExpanded: boolean
  onToggle: (matchId: string) => void
}

export default function MatchCard({ match, results, isExpanded, onToggle }: MatchCardProps) {
  // 获取排名样式
  const getRankStyle = (rank: number, stage: string) => {
    if (stage === '预赛') {
      return rank <= 8 ? 'bg-green-50 border-green-200' : ''
    } else if (stage === '决赛') {
      if (rank === 1) return 'bg-yellow-50 border-yellow-300'
      if (rank === 2) return 'bg-gray-100 border-gray-300'
      if (rank === 3) return 'bg-orange-50 border-orange-200'
      if (rank <= 8) return 'bg-blue-50 border-blue-200'
    }
    return ''
  }

  // 获取排名徽章
  const getRankBadge = (rank: number, stage: string) => {
    if (stage === '预赛' && rank <= 8) return '🏆'
    if (stage === '决赛') {
      if (rank === 1) return '🥇'
      if (rank === 2) return '🥈'
      if (rank === 3) return '🥉'
    }
    return ''
  }

  // 获取排名文字颜色
  const getRankTextColor = (rank: number, stage: string) => {
    if (stage === '预赛') {
      return rank <= 8 ? 'text-green-700 font-bold' : ''
    } else if (stage === '决赛') {
      if (rank === 1) return 'text-yellow-700 font-bold'
      if (rank === 2) return 'text-gray-700 font-bold'
      if (rank === 3) return 'text-orange-700 font-bold'
      if (rank <= 8) return 'text-white-700 font-bold'
    }
    return ''
  }

  const hasResults = results && results.length > 0

  return (
    <div className="card cursor-pointer transition-all hover:shadow-md">
      {/* 卡片头部 - 可点击区域 */}
      <div 
        className="flex justify-between items-start"
        onClick={() => onToggle(match.id)}
      >
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {match.stage} · {match.group_name}
          </h3>
        </div>
        <div className="text-right">
          <div className="flex items-center text-sm text-gray-500">
            <span>{hasResults ? `${results.length} 条成绩` : '暂无成绩'}</span>
            <svg 
              className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 下拉内容 - 保留成绩表 */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {hasResults ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>队伍名称</th>
                    <th>成绩</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))
                    .map((result) => {
                      const rowStyle = getRankStyle(result.rank, match.stage)
                      const textStyle = getRankTextColor(result.rank, match.stage)
                      
                      return (
                        <tr 
                          key={result.id} 
                          className={rowStyle}
                        >
                          <td className="text-center font-semibold">
                            <span className={`flex items-center justify-center gap-1 ${textStyle}`}>
                              {result.rank}
                              {getRankBadge(result.rank, match.stage)}
                            </span>
                          </td>
                          <td className={`font-medium ${textStyle}`}>
                            {result.team_name}
                          </td>
                          <td className={`text-center font-mono ${textStyle}`}>
                            {formatDisplayTime(result.display_time)}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              暂无成绩记录
            </div>
          )}
        </div>
      )}
    </div>
  )
}

