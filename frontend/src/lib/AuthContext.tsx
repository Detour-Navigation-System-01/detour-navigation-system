'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fetcher } from '@/lib/api'

type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
  public_settings: boolean
} | null

const AuthContext = createContext<{
  user: User
  loading: boolean
  refresh: () => Promise<void>
  setUser: (u: User | null) => void
}>({
  user: null,
  loading: true,
  refresh: async () => {},
  setUser: () => {}
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const response = await fetcher<{ data: { user: NonNullable<User> } }>('/api/auth/me')
      setUser(response.data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
  console.log('ログイン状態:', user);
}, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
