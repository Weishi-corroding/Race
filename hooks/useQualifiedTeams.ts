// hooks/useQualifiedTeams.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Team } from '@/lib/types'

export function useQualifiedTeams(category: '男双' | '女双' | '混双', stage: '预赛' | '决赛') {
  const [qualifiedTeams, setQualifiedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadQualifiedTeams = async () => {
      try {
        setLoading(true)
        setError('')
        
        if (stage === '预赛') {
          // 预赛时返回所有队伍
          const { data, error } = await supabase
            .from('teams')
            .select('*')
            .eq('category', category)
            .order('name')
          
          if (error) throw error
          setQualifiedTeams(data || [])
        } else {
          // 决赛时只返回预赛前八名

          // 1. 首先查找对应的预赛比赛（放宽条件，不限制状态）
          const { data: preliminaryMatches, error: matchError } = await supabase
            .from('matches')
            .select('id, status')
            .eq('group_name', category)
            .eq('stage', '预赛')
            .order('created_at', { ascending: false })
            .limit(1)

          if (matchError) throw matchError

          if (!preliminaryMatches || preliminaryMatches.length === 0) {
            setQualifiedTeams([])
            return
          }

          const preliminaryMatch = preliminaryMatches[0]

          // 2. 检查预赛是否有成绩记录（即使状态不是 completed）
          const { data: preliminaryResults, error: resultsCheckError } = await supabase
            .from('results')
            .select('id')
            .eq('match_id', preliminaryMatch.id)
            .limit(1)

          if (resultsCheckError) throw resultsCheckError

          const hasResults = preliminaryResults && preliminaryResults.length > 0

          if (!hasResults) {
            setQualifiedTeams([])
            return
          }

          // 3. 查找预赛前8名的成绩
          const { data: qualifiedResults, error: resultsError } = await supabase
            .from('results')
            .select('team_id, rank, teams(*)')
            .eq('match_id', preliminaryMatch.id)
            .lte('rank', 8)
            .order('rank', { ascending: true })

          if (resultsError) throw resultsError

          const teams = (qualifiedResults || [])
            .filter(result => result.teams && result.rank <= 8)
            .map(result => {
              if (Array.isArray(result.teams)) {
                return result.teams[0] as Team
              } else {
                return result.teams as Team
              }
            })

          setQualifiedTeams(teams)
        }
      } catch (err: any) {
        setError(err.message)
        setQualifiedTeams([])
      } finally {
        setLoading(false)
      }
    }

    loadQualifiedTeams()
  }, [category, stage])

  return { qualifiedTeams, loading, error }
}
