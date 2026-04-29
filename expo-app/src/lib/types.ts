export interface Match {
  id: string
  event: string
  stage: '预赛' | '决赛'
  group_name: '男双' | '女双' | '混双'
  round_type: '预赛' | '决赛'
  start_time: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface Team {
  id: string
  name: string
  category: '男双' | '女双' | '混双'
  created_at: string
}

export interface Result {
  id: string
  match_id: string
  team_id: string
  team_name: string
  time_seconds: number
  display_time: string
  rank: number
  status: 'pending' | 'in_progress' | 'completed'
  result_type: 'time' | 'dnf' | 'dns' | 'dq' | 'withdrawn'
  created_at: string
  teams?: Team
}
