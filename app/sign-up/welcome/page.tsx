'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'

const GRID_BACKGROUND =
  'bg-[linear-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px)] bg-size-[24px_24px]'

export default function SignUpWelcomePage() {
  const router = useRouter()

  const handleStartClick = () => {
    router.push('/')
  }

  return (
    <section
      aria-label="가입 환영"
      className={`flex min-h-0 flex-1 flex-col justify-end overflow-hidden bg-bg-alternative ${GRID_BACKGROUND}`}
    >
      <div className="h-11 shrink-0" />

      <div className="flex h-75 shrink-0 flex-col items-center justify-center gap-2.5 px-6 py-25 text-center">
        <h1 className="whitespace-nowrap text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-text-secondary">
          다정한 연필 님, 환영합니다!
        </h1>
        <p className="whitespace-nowrap text-title-18md text-text-tertiary">
          다양한 사람들과 각각 느낀 점들을 비교하며
          <br />책 읽는 재미를 더해가세요!
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Image
          src="/images/happy-friends.png"
          alt=""
          width={304}
          height={215}
          priority
          className="h-[215px] w-76 object-cover"
        />
      </div>

      <div className="flex h-22 shrink-0 items-center justify-center p-4">
        <Button onClick={handleStartClick} className="h-14 w-full">
          시작하기
        </Button>
      </div>
    </section>
  )
}
