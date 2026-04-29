// app/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminForm from '../components/admin-form'
import { Match } from '@/lib/types'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  
  const [group, setGroup] = useState<'男双' | '女双' | '混双'>('男双')

  useEffect(() => {
    // 检查用户登录状态
    supabase.auth.getSession().then(r => {
      setUser(r.data.session?.user ?? null)
    })
    loadMatches()
  }, [])

  // 根据筛选条件过滤比赛
  useEffect(() => {
    const filtered = matches.filter(m => m.group_name === group)
    setFilteredMatches(filtered)
    if (filtered.length > 0 && !selectedMatch) {
      setSelectedMatch(filtered[0])
    }
  }, [matches, group])

  async function loadMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })
    
    if (error) {
      console.error('加载比赛失败:', error)
      return
    }
    
    setMatches(data || [])
  }

  if (!user) {
    return (
      <div className="container">
        {/* 同时显示比赛列表供查看 */}
        <div className="mt-6">
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

          <div className="mt-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">{group}比赛列表</h3>
              <div className="space-y-3">
                {filteredMatches.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    暂无{group}比赛
                  </div>
                ) : (
                  filteredMatches.map(match => (
                    <div
                      key={match.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {match.stage} · {match.group_name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            状态: {match.status === 'completed' ? '已完成' : 
                                 match.status === 'in_progress' ? '进行中' : '未开始'}
                          </p>
                        </div>
                        <span className={`status-badge ${
                          match.status === 'completed' ? 'status-blue' : 
                          match.status === 'in_progress' ? 'status-yellow' : 'status-white'
                        }`}>
                          {match.status === 'completed' ? '已完成' : 
                           match.status === 'in_progress' ? '进行中' : '未开始'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 已登录用户看到完整的管理界面
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 比赛列表 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{group}比赛列表</h3>
          <div className="space-y-3">
            {filteredMatches.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无{group}比赛
              </div>
            ) : (
              filteredMatches.map(match => (
                <div
                  key={match.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMatch?.id === match.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        {match.stage} · {match.group_name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        状态: {match.status === 'completed' ? '已完成' : 
                             match.status === 'in_progress' ? '进行中' : '未开始'}
                      </p>
                    </div>
                    <span className={`status-badge ${
                      match.status === 'completed' ? 'status-blue' : 
                      match.status === 'in_progress' ? 'status-yellow' : 'status-white'
                    }`}>
                      {match.status === 'completed' ? '已完成' : 
                       match.status === 'in_progress' ? '进行中' : '未开始'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 成绩录入 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">成绩录入</h3>
          {selectedMatch ? (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium">当前选择:</h4>
                <p>{selectedMatch.stage} · {selectedMatch.group_name}</p>
              </div>
              <AdminForm 
                match={selectedMatch} 
                onSaved={() => {
                  loadMatches()
                }} 
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              请从左侧选择比赛
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
