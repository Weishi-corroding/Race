// app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import MatchCard from './components/match-card'
import { Match, Result } from '@/lib/types'

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [allResults, setAllResults] = useState<Result[]>([])
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  
  const [group, setGroup] = useState<'男双' | '女双' | '混双'>('男双')

  useEffect(() => {
    loadMatches()
    loadAllResults()
  }, [])

  useEffect(() => {
    const filtered = matches.filter(m => m.group_name === group)
    setFilteredMatches(filtered)
  }, [matches, group])

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })
    setMatches(data || [])
  }

  async function loadAllResults() {
    const { data } = await supabase
      .from('results')
      .select('*, teams(*)')  // 确保包含 teams 关联数据
    setAllResults(data || [])
  }

  function handleToggleMatch(matchId: string) {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId)
  }

  function getMatchResults(matchId: string): Result[] {
    return allResults.filter(result => result.match_id === matchId)
  }

  return (
    <div className="container">
      {/* 筛选器 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">比赛筛选</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">比赛组别</label>
            <select 
              className="select w-full"
              value={group} 
              onChange={e => setGroup(e.target.value as any)}
            >
              <option value="男双">男双</option>
              <option value="女双">女双</option>
              <option value="混双">混双</option>
            </select>
          </div>
        </div>
      </div>

      {/* 比赛列表 */}
      <div className="mt-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {group}比赛 ({filteredMatches.length})
            </h3>
            {expandedMatchId && (
              <button 
                onClick={() => setExpandedMatchId(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                收起所有
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无{group}比赛
              </div>
            ) : (
              filteredMatches.map(match => {
                const matchResults = getMatchResults(match.id)

                return (
                  <MatchCard 
                    key={match.id} 
                    match={match}
                    results={matchResults}
                    isExpanded={expandedMatchId === match.id}
                    onToggle={handleToggleMatch}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
      </div>
  )
}
