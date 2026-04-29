'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function handleLogin(e: any) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert('登录失败：' + error.message)
    router.push('/admin')
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleLogin} className="card">
        <h2 className="text-xl font-semibold mb-2">管理员登录</h2>
        <input className="input mb-2" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input mb-2" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="flex justify-end">
          <button className="btn btn-primary">登录</button>
        </div>
      </form>
    </div>
  )
}
