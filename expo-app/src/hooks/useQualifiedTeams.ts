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
          const { data, error } = await supabase
            .from('teams')
            .select('*')
            .eq('category', category)
            .order('name')

          if (error) throw error
          setQualifiedTeams(data || [])
        } else {
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
