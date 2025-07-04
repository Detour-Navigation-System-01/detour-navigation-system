'use client'

/**
 * @fileoverview 保存スポットコンポーネント（ログイン遷移制御あり）
 * @description ログインしていない場合はログインページへリダイレクト（元のページURLを記録）
 * @author 平野
 * @created 2025-07-03
 * @updated 2025-07-04
 * @version 1.1.0
 */

import { useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export default function PreservationRedirectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(`/preservation/${user.id}`)
      } else {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }
  }, [loading, user, pathname, router])

  return <p>読み込み中...</p>
}
