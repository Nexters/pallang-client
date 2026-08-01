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

  // 인증 판별 전이거나 프로필을 기다리는 구간. 예전에는 여기서 null을 반환했는데,
  // 그러면 화면 셸(TabScreenLayout·탭바)까지 사라져 루트 배경이 드러나며 번쩍였다.
  // 조회 실패(서버 미기동 등) 시에는 기다리지 않고 비로그인 화면으로 폴백한다.
  const isPending = status === 'loading' || (isAuthenticated && !me && !isError)

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
      isPending={isPending}
      recentTraces={recentTraces}
      onLoginClick={() => {
        router.push(LOGIN_PATH)
      }}
      onLogout={() => void signOut()}
    />
  )
}
