'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { MyPageView } from '../MyPageView/MyPageView'

export function MyPageContent() {
  const router = useRouter()
  const { status, isAuthenticated, signOut } = useAuth()
  const { data, isError } = useQuery({ ...userQueries.me(), enabled: isAuthenticated })
  const { data: opinionsData } = useQuery({
    ...userQueries.myOpinions(),
    enabled: isAuthenticated,
  })

  const me = data?.data

  // 인증 상태 판별 전/프로필 로딩 중에는 화면 전환 깜빡임을 막기 위해 렌더하지 않는다.
  // 조회 실패(서버 미기동 등) 시에는 빈 화면 대신 비로그인 화면으로 폴백한다.
  if (status === 'loading' || (isAuthenticated && !me && !isError)) return null

  const user =
    isAuthenticated && me
      ? { nickname: me.nickname, traceCount: me.opinionCount, profileImageUrl: me.profileImageUrl }
      : null

  const recentTraces =
    opinionsData?.data?.opinions.map((opinion) => ({
      id: opinion.opinionId,
      title: opinion.bookTitle,
      coverImageUrl: opinion.bookCoverImageUrl,
    })) ?? []

  return (
    <MyPageView
      user={user}
      recentTraces={recentTraces}
      onLoginClick={() => {
        router.push(LOGIN_PATH)
      }}
      onLogout={() => void signOut()}
    />
  )
}
