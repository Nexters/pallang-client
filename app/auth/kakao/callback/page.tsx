'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import {
  HOME_PATH,
  KAKAO_CALLBACK_PATH,
  KAKAO_EXCHANGE_PATH,
  LOGIN_PATH,
} from '@/app/_global/_data/auth.constant'
import { agreeTerms, signInWithKakaoToken } from '@/app/_global/_queries/auth.queries'

export default function KakaoCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      if (params.get('error') || !code) {
        setError('카카오 로그인이 취소되었어요.')
        return
      }

      const redirectUri = `${window.location.origin}${KAKAO_CALLBACK_PATH}`
      const res = await fetch(KAKAO_EXCHANGE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri, state }),
      })
      if (!res.ok) {
        setError('로그인 처리에 실패했어요.')
        return
      }

      const { kakaoAccessToken } = (await res.json()) as { kakaoAccessToken: string }
      const login = await signInWithKakaoToken(kakaoAccessToken)
      if (!login.termsAgreed) await agreeTerms()

      // TODO(onboarding): !login.hasCompletedOnboarding이면 온보딩 라우트로 보낸다(미구현이라 홈으로).
      router.replace(HOME_PATH)
    }

    run().catch((e: unknown) => {
      console.error('카카오 로그인 콜백 처리 실패', e)
      setError('로그인 처리 중 문제가 발생했어요.')
    })
  }, [router])

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      {error ? (
        <>
          <p className="text-title-16sb text-text-secondary">{error}</p>
          <a
            href={LOGIN_PATH}
            className="rounded-full bg-interactive-accent px-6 py-3 text-body-14sb text-text-inverse"
          >
            다시 로그인하기
          </a>
        </>
      ) : (
        <p className="text-title-16sb text-text-secondary">로그인 중이에요…</p>
      )}
    </div>
  )
}
