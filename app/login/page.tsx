'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import AppleIcon from '@/app/_global/_components/Icon/assets/apple.svg'
import KakaoIcon from '@/app/_global/_components/Icon/assets/kakao.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { KAKAO_LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { signInWithAppleToken, signInWithKakaoToken } from '@/app/_global/_queries/auth.queries'
import { resolvePostLoginPath } from '@/app/_global/_services/postLoginRedirect.service'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

import {
  authorizeWithApple,
  isAppleAuthCancel,
  isIosNativePlatform,
} from './_services/appleAuth.service'
import {
  authorizeWithKakao,
  canUseNativeKakaoLogin,
  isKakaoAuthCancel,
} from './_services/kakaoAuth.service'

const noop = () => undefined
const emptySubscribe = () => noop

export default function LoginPage() {
  const router = useRouter()
  // 두 로그인은 동시에 진행될 수 없어 어느 쪽이 진행 중인지 하나로 담는다.
  const [pending, setPending] = useState<'kakao' | 'apple' | null>(null)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  // 애플 로그인은 iOS 앱에서만 제공한다(웹 미제공 결정). 프리렌더에는 플랫폼 정보가 없어
  // 서버 스냅샷을 false로 두고 hydration 후에만 버튼을 드러낸다.
  const showAppleLogin = useSyncExternalStore(emptySubscribe, isIosNativePlatform, () => false)

  // 네이티브 시트를 띄우는 로그인의 공통 흐름 — 진행 표시, 취소 무시, 실패 안내, 로그인 후 이동.
  const startNativeLogin = (
    provider: 'kakao' | 'apple',
    label: string,
    authorize: () => Promise<{ termsAgreed: boolean; hasCompletedOnboarding: boolean }>,
    isCancel: (error: unknown) => boolean,
  ) => {
    setPending(provider)

    authorize()
      .then((login) => {
        router.replace(resolvePostLoginPath(login))
      })
      .catch((e: unknown) => {
        // 사용자가 직접 닫은 것은 실패가 아니다 — 조용히 돌아온다.
        if (isCancel(e)) return
        console.error(`${label} 로그인 실패`, e)
        setSnackbarMessage(`${label} 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.`)
      })
      .finally(() => {
        setPending(null)
      })
  }

  const handleKakaoLoginClick = () => {
    // 브라우저·안드로이드 앱은 서버 302로 카카오 웹 OAuth를 진행한다.
    // API route가 302 하므로 router.push가 아닌 full navigation이 필요하다.
    if (!canUseNativeKakaoLogin()) {
      window.location.assign(KAKAO_LOGIN_PATH)
      return
    }

    startNativeLogin(
      'kakao',
      '카카오',
      async () => signInWithKakaoToken(await authorizeWithKakao()),
      isKakaoAuthCancel,
    )
  }

  const handleAppleLoginClick = () => {
    startNativeLogin(
      'apple',
      '애플',
      async () => signInWithAppleToken(await authorizeWithApple()),
      isAppleAuthCancel,
    )
  }

  return (
    <section
      aria-label="로그인"
      className={`relative -mt-(--safe-top) flex min-h-0 flex-1 flex-col justify-end overflow-hidden pt-(--safe-top) ${GRID_BACKGROUND_CLASS_NAME}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="h-11 shrink-0" />

        <div className="flex h-75 shrink-0 items-center justify-center px-6 py-25">
          <div className="flex flex-col items-center gap-1">
            <Logo aria-label="Pallang" className="h-25 w-60" />
            <p className="whitespace-nowrap text-center text-title-16sb text-text-primary">
              흔적을 넘기면, 다른 생각이 팔랑
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Image
            src="/images/pencil-friends.png"
            alt=""
            width={333}
            height={244}
            priority
            className="h-61 w-83.25 object-cover"
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 p-4">
        {/* Apple HIG 블랙 버튼 — iOS 앱에서만 노출(심사 가이드라인 4.8은 앱에만 적용, 웹은 미제공 결정).
            카카오 위 배치로 동등 이상 노출을 지킨다. */}
        {showAppleLogin && (
          <Button
            onClick={handleAppleLoginClick}
            loading={pending === 'apple'}
            className="h-14 w-full gap-2 bg-[#000] text-white"
          >
            <span className="flex size-6 items-center justify-center" aria-hidden="true">
              <AppleIcon className="size-4.5 text-white" />
            </span>
            <span>Apple로 계속하기</span>
          </Button>
        )}
        <Button
          onClick={handleKakaoLoginClick}
          loading={pending === 'kakao'}
          className="h-14 w-full gap-2 bg-[#fee500] text-[#222]"
        >
          <span className="flex size-6 items-center justify-center" aria-hidden="true">
            <KakaoIcon className="size-4.5" />
          </span>
          <span>카카오로 계속하기</span>
        </Button>
      </div>

      <Snackbar
        message={snackbarMessage}
        onClose={() => {
          setSnackbarMessage('')
        }}
      />
    </section>
  )
}
