// app/components/admin-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Match, Team, Result } from '@/lib/types'
import { useQualifiedTeams } from '@/hooks/useQualifiedTeams'

interface AdminFormProps {
  match: Match
  onSaved: () => void
}

export default function AdminForm({ match, onSaved }: AdminFormProps) {
  const [results, setResults] = useState<Result[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [timeInput, setTimeInput] = useState<string>('')
  const [resultType, setResultType] = useState<'time' | 'dnf' | 'dns' | 'dq' | 'withdrawn'>('time')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 使用新的 hook 获取符合条件的队伍
  const { qualifiedTeams, loading: teamsLoading, error: teamsError } = useQualifiedTeams(match.group_name, match.stage)

  useEffect(() => {
    loadResults()
  }, [match])

  useEffect(() => {
    if (qualifiedTeams.length > 0) {
      loadAvailableTeams()
    }
  }, [qualifiedTeams, results])

  async function loadResults() {
    const { data, error } = await supabase
      .from('results')
      .select('*, teams(*)')
      .eq('match_id', match.id)
      .order('time_seconds', { ascending: true })

    if (error) return

    setResults(data || [])
  }

  async function loadAvailableTeams() {
    const selectedTeamIds = results.map(r => r.team_id).filter(Boolean)
    const available = qualifiedTeams.filter(team => !selectedTeamIds.includes(team.id))
    setAvailableTeams(available)
    
    if (available.length > 0 && !selectedTeamId) {
      setSelectedTeamId(available[0].id)
    }
  }

  // 获取结果类型的中文说明
  function getResultTypeText(resultType: string): string {
    switch (resultType) {
      case 'dnf': return '未完成'
      case 'dns': return '未出发'
      case 'dq': return '弃权'
      case 'withdrawn': return '退赛'
      default: return '比赛用时'
    }
  }

  function validateTime(time: string): boolean {
    if (resultType !== 'time') return true
    const timeRegex = /^(\d{1,2}):([0-5]\d)(\.\d{1,2})?$/
    return timeRegex.test(time)
  }

  function timeToSeconds(time: string): number {
    const [minutes, secondsPart] = time.split(':')
    const [seconds, hundredths = '00'] = secondsPart.split('.')
    
    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds)
    const hundredthsValue = parseInt(hundredths.padEnd(2, '0')) / 100
    
    return totalSeconds + hundredthsValue
  }

  function autoCompleteTime(time: string): string {
    if (!time.includes(':')) return time
    
    const [minutes, secondsPart] = time.split(':')
    
    if (!secondsPart.includes('.')) {
      return `${minutes}:${secondsPart.padEnd(2, '0')}.00`
    } else {
      const [seconds, hundredths = ''] = secondsPart.split('.')
      return `${minutes}:${seconds.padStart(2, '0')}.${hundredths.padEnd(2, '0')}`
    }
  }

  async function submitSingleResult() {
    if (!selectedTeamId) {
      setMessage('请选择队伍')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const selectedTeam = qualifiedTeams.find(team => team.id === selectedTeamId)
      if (!selectedTeam) {
        throw new Error('选择的队伍不存在')
      }

      let timeSeconds: number | null = null
      let displayTime = ''

      switch (resultType) {
        case 'time':
          if (!timeInput) {
            setMessage('请输入比赛用时')
            return
          }
          if (!validateTime(timeInput)) {
            setMessage('时间格式不正确，请使用 mm:ss 或 mm:ss.ss 格式（如 02:30 或 02:30.45）')
            return
          }
          
          const completedTime = autoCompleteTime(timeInput)
          timeSeconds = timeToSeconds(completedTime)
          displayTime = completedTime
          break
        case 'dnf':
          displayTime = 'DNF'
          break
        case 'dns':
          displayTime = 'DNS'
          break
        case 'dq':
          displayTime = '弃权'
          break
        case 'withdrawn':
          displayTime = '退赛'
          break
      }

      const resultData = {
        match_id: match.id,
        team_id: selectedTeamId,
        team_name: selectedTeam.name,
        time_seconds: timeSeconds,
        display_time: displayTime,
        result_type: resultType,
        rank: 0,
        status: 'completed'
      }

      const { error: insertError } = await supabase
        .from('results')
        .insert(resultData)

      if (insertError) throw insertError

      await calculateAndUpdateRanks()
      setMessage(`✅ ${selectedTeam.name} 的成绩已录入：${displayTime}`)
      setTimeInput('')
      setResultType('time')
      
      await loadResults()
      
    } catch (error: any) {
      setMessage('录入失败: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function calculateAndUpdateRanks() {
    const { data: allResults, error } = await supabase
      .from('results')
      .select('*')
      .eq('match_id', match.id)

    if (error) throw error

    const sortedResults = [...allResults].sort((a, b) => {
      if (a.time_seconds !== null && b.time_seconds !== null) {
        return a.time_seconds - b.time_seconds
      }
      if (a.time_seconds !== null && b.time_seconds === null) return -1
      if (a.time_seconds === null && b.time_seconds !== null) return 1
      const typeOrder: Record<string, number> = { 'time': 0, 'dnf': 1, 'withdrawn': 2, 'dq': 3, 'dns': 4 }
return (typeOrder[a.result_type] || 999) - (typeOrder[b.result_type] || 999)
    })

    const updatePromises = sortedResults.map((result, index) => 
      supabase
        .from('results')
        .update({ rank: index + 1 })
        .eq('id', result.id)
    )

    await Promise.all(updatePromises)
  }

  async function completeMatch() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', match.id)

      if (error) throw error

      setMessage('🎉 比赛成绩录入完成！')
      onSaved()
      
    } catch (error: any) {
      setMessage('完成比赛失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteResult(resultId: string) {
    if (!confirm('确定要删除这个成绩记录吗？')) return

    try {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('id', resultId)

      if (error) throw error

      setMessage('成绩记录已删除')
      await loadResults()
      
    } catch (error: any) {
      setMessage('删除失败: ' + error.message)
    }
  }

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    if (match.stage === '预赛') {
      return rank <= 8 ? 'bg-green-50 border-green-200' : ''
    } else if (match.stage === '决赛') {
      if (rank === 1 || rank === 2) return 'bg-yellow-50 border-yellow-300'
      if (rank === 3 || rank === 4) return 'bg-gray-100 border-gray-300'
      if (rank === 5 || rank === 6) return 'bg-orange-50 border-orange-200'
      if (rank <= 8) return 'bg-blue-50 border-blue-200'
    }
    return ''
  }

  // 获取排名徽章
  const getRankBadge = (rank: number) => {
    if (match.stage === '预赛' && rank <= 8) return '🏆'
    if (match.stage === '决赛') {
      if (rank === 1 || rank === 2) return '🥇'
      if (rank === 3 || rank === 4) return '🥈'
      if (rank === 5 || rank === 6) return '🥉'
    }
    return ''
  }

  // 获取排名文字颜色
  const getRankTextColor = (rank: number) => {
    if (match.stage === '预赛') {
      return rank <= 8 ? 'text-green-700' : ''
    } else if (match.stage === '决赛') {
      if (rank === 1 || rank === 2) return 'text-yellow-700'
      if (rank === 3 || rank === 4) return 'text-gray-700'
      if (rank === 5 || rank === 6) return 'text-orange-700'
      if (rank <= 8) return 'text-blue-700'
    }
    return ''
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded ${
          message.includes('✅') || message.includes('🎉')
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {teamsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          加载队伍失败: {teamsError}
        </div>
      )}

      {/* 队伍选择提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">队伍选择说明</h5>
        <p className="text-sm text-blue-700">
          {match.stage === '预赛' 
            ? '预赛：可选择所有报名队伍'
            : '决赛：仅显示预赛前8名晋级队伍'
          }
        </p>
        {match.stage === '决赛' && availableTeams.length === 0 && !teamsLoading && (
          <p className="text-sm text-orange-700 mt-1">
            提示：请先完成对应组别的预赛成绩录入
          </p>
        )}
      </div>

      {/* 单个队伍成绩录入 */}
      <div className="card">
        <h4 className="font-semibold mb-4">录入单个队伍成绩</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择队伍
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="select w-full"
              disabled={submitting || availableTeams.length === 0 || teamsLoading}
            >
              <option value="">请选择队伍</option>
              {availableTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            {teamsLoading && (
              <p className="text-sm text-gray-500 mt-1">加载队伍中...</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结果类型
            </label>
            <select
              value={resultType}
              onChange={(e) => setResultType(e.target.value as any)}
              className="select w-full"
              disabled={submitting}
            >
              <option value="time">比赛用时</option>
              <option value="dnf">DNF (未完成)</option>
              <option value="dns">DNS (未出发)</option>
              <option value="dq">弃权</option>
              <option value="withdrawn">退赛</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {resultType === 'time' ? '比赛用时' : '结果说明'}
            </label>
            {resultType === 'time' ? (
              <input
                type="text"
                placeholder="mm:ss 或 mm:ss.ss (如 02:30 或 02:30.45)"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="input w-full"
                disabled={submitting}
              />
            ) : (
              <div className="input w-full bg-gray-100 text-gray-500">
                {resultType === 'dnf' && 'DNF (未完成)'}
                {resultType === 'dns' && 'DNS (未出发)'}
                {resultType === 'dq' && '弃权'}
                {resultType === 'withdrawn' && '退赛'}
              </div>
            )}
            {resultType === 'time' && (
              <p className="text-xs text-gray-500 mt-1">
                支持格式：02:30（自动补全为02:30.00）或 02:30.45
              </p>
            )}
          </div>
          
          <div className="flex items-end">
            <button
              onClick={submitSingleResult}
              disabled={submitting || !selectedTeamId || (resultType === 'time' && !timeInput)}
              className="btn btn-primary w-full"
            >
              {submitting ? '录入中...' : '确认录入'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {availableTeams.length > 0 
            ? `还有 ${availableTeams.length} 支队伍待录入成绩`
            : teamsLoading 
              ? '加载队伍中...'
              : '所有队伍成绩已录入完成'
          }
        </div>
      </div>

      {/* 已录入成绩列表 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">已录入成绩</h4>
          {results.length > 0 && availableTeams.length === 0 && (
            <button
              onClick={completeMatch}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '处理中...' : '完成比赛录入'}
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            暂无成绩记录
          </div>
        ) : (
          <div className="space-y-3">
            {results
              .sort((a, b) => (a.rank || 999) - (b.rank || 999))
              .map((result) => (
              <div 
                key={result.id}
                className={`flex items-center justify-between p-3 border rounded ${getRankStyle(result.rank)}`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    getRankStyle(result.rank) ? 'bg-white border' : 'bg-gray-100'
                  }`}>
                    <span className={`font-bold ${getRankTextColor(result.rank)}`}>
                      {result.rank}
                      {getRankBadge(result.rank)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${getRankTextColor(result.rank)}`}>
                      {result.team_name}
                    </div>
                    <div className={`text-sm font-mono ${getRankTextColor(result.rank)} ${
                      result.result_type !== 'time' ? 'text-red-600 font-semibold' : ''
                    }`}>
                      成绩: {result.display_time}
                      {result.result_type !== 'time' && ` (${getResultTypeText(result.result_type)})`}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteResult(result.id)}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
