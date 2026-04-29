// app/components/Header.tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // 清理函数
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="bg-white shadow">
      <div className="container header py-4">
        <div>
          {/* 点击标题回到首页 */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-semibold">🏆 2025长三角高校赛艇邀请赛</h1>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/admin" className="btn btn-primary">管理</Link>
          ) : (
            <Link href="/login" className="btn btn-outline">登录</Link>
          )}
        </div>
      </div>
    </header>
  )
}
