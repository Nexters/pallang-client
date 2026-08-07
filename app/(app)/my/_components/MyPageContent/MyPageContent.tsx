'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { consumeWithdrawalNotice } from '@/app/_global/_services/withdrawal.service'

import { MyPageView } from '../MyPageView/MyPageView'

export function MyPageContent() {
  const router = useRouter()
  const { status, isAuthenticated, signOut } = useAuth()

  // 회원 탈퇴 직후 여기로 옮겨진다 — 도착 시 플래그를 소비해 완료 스낵바를 1회 띄운다.
  // 프리렌더에는 sessionStorage가 없어 effect에서 읽고, setState는 다음 틱으로 넘긴다
  // (동기로 부르면 set-state-in-effect의 연쇄 렌더 경고에 걸린다).
  const [noticeMessage, setNoticeMessage] = useState('')
  useEffect(() => {
    if (!consumeWithdrawalNotice()) return
    const timer = setTimeout(() => {
      setNoticeMessage('성공적으로 탈퇴됐습니다!')
    }, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [])
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
    <>
      <MyPageView
        user={user}
        isPending={isPending}
        recentTraces={recentTraces}
        onLoginClick={() => {
          router.push(LOGIN_PATH)
        }}
        onLogout={() => void signOut()}
      />
      <Snackbar
        message={noticeMessage}
        onClose={() => {
          setNoticeMessage('')
        }}
      />
    </>
  )
}
