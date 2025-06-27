'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fetcher } from '@/lib/api'

type User = { userId: string; name: string } | null

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
  const [user, setUser] = useState<User>(null) // ← 型は "User"（大文字）
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const data = await fetcher<User>('/api/auth/me')
      setUser(data)
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
