'use client'

import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function LogoutPage() {
  const router = useRouter()
  const { setUser } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null) // フロント側の状態も消す
      router.push('/login')
    } catch (err) {
      console.error('ログアウト失敗', err)
      alert('ログアウトに失敗しました')
    }
  }

  const handleCancel = () => {
    router.push('/profile')
  }

  return (
    <main className="p-6 text-center">
      <h1 className="text-xl font-bold mb-4">ログアウトしますか？</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded m-2"
      >
        ログアウトする
      </button>
      <button
        onClick={handleCancel}
        className="bg-gray-300 text-black px-4 py-2 rounded m-2"
      >
        キャンセル
      </button>
    </main>
  )
}
