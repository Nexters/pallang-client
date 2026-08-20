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
  // 로그아웃 실패 안내도 같은 자리를 쓴다 — 스낵바는 화면에 하나만 선다.
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
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data, isError, refetch } = useQuery({ ...userQueries.me(), enabled: isAuthenticated })

  const me = data?.data

  // 인증 판별 전이거나 프로필을 기다리는 구간. 예전에는 여기서 null을 반환했는데,
  // 그러면 화면 셸(TabScreenLayout·탭바)까지 사라져 루트 배경이 드러나며 번쩍였다.
  const isPending = status === 'loading' || (isAuthenticated && !me && !isError)

  // 로그인 상태인데 프로필 조회만 실패한 경우. me()는 retry: false라 5xx·네트워크 끊김
  // 한 번에 실패로 굳는데, 이때 비로그인 화면으로 떨어뜨리면 내 서재·로그아웃이 사라진다.
  // 로그인 화면을 그대로 두고 프로필 자리만 재시도 안내로 바꾼다.
  const isProfileError = isAuthenticated && isError && !me

  const user =
    isAuthenticated && me
      ? {
          nickname: me.nickname,
          opinionCount: me.opinionCount,
          profileImageUrl: me.profileImageUrl,
        }
      : null

  return (
    <>
      <MyPageView
        user={user}
        isPending={isPending}
        isProfileError={isProfileError}
        isLoggingOut={isLoggingOut}
        onRetryProfile={() => {
          void refetch()
        }}
        onLoginClick={() => {
          router.push(LOGIN_PATH)
        }}
        onLogout={() => {
          if (isLoggingOut) return
          setIsLoggingOut(true)
          // signOut은 토큰 정리가 실패하면 호출자가 반응하도록 다시 던진다 —
          // 그냥 버리면 unhandled rejection만 남고 사용자는 아무 안내도 받지 못한다.
          void signOut()
            .catch((error: unknown) => {
              console.error('로그아웃 실패', error)
              setNoticeMessage('로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.')
            })
            .finally(() => {
              setIsLoggingOut(false)
            })
        }}
      />
      <Snackbar
        tone="light"
        message={noticeMessage}
        onClose={() => {
          setNoticeMessage('')
        }}
      />
    </>
  )
}
