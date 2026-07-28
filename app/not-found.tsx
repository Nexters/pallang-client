'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end bg-bg-default">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="h-11 shrink-0" />

        <section className="flex h-75 shrink-0 flex-col items-center justify-center gap-2.5 px-6 py-25 text-center">
          <h1 className="text-title-24bd text-text-secondary">404 Error</h1>
          <p className="text-title-18md text-text-tertiary">
            죄송합니다. 해당 페이지를 찾을 수 없습니다.
            <br />
            홈페이지로 돌아가 다시 시도해주세요!
          </p>
        </section>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Image
            src="/images/sad-friends.png"
            alt=""
            width={275}
            height={220}
            className="h-55 w-68.75 object-cover object-bottom opacity-40"
            priority
          />
        </div>
      </div>

      <div className="flex h-21.5 shrink-0 items-center justify-center p-4">
        <Button
          className="h-13.5 w-full"
          onClick={() => {
            router.push('/')
          }}
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
