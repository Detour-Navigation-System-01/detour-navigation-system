'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fetcher } from '@/lib/api'

// ✅ サーバーの返り値に一致するUser型（最低限idとusernameを含む）
type User = {
  id: number
  username: string
  email?: string
  first_name?: string
  last_name?: string
  [key: string]: any // 他にもプロパティが追加されることを許容
} | null

const AuthContext = createContext<{
  user: User
  loading: boolean
  refresh: () => Promise<void>
}>({
  user: null,
  loading: true,
  refresh: async () => {}
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const res = await fetcher<{ data?: { user: User } }>('/api/auth/me')
      setUser(res.data?.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
