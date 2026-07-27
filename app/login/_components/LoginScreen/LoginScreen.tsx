import Image from 'next/image'

import KakaoIcon from '@/app/_global/_components/Icon/assets/kakao.svg'
import Logo from '@/public/images/logo.svg'

export function LoginScreen() {
  return (
    <section
      aria-label="로그인"
      className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden bg-bg-alternative bg-[linear-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px)] bg-size-[24px_24px]"
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

      <div className="flex h-22 shrink-0 items-center justify-center p-4">
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#fee500] p-4 text-center text-body-16bd text-[#222] backdrop-blur-[1px]"
        >
          <span className="flex size-6 items-center justify-center" aria-hidden="true">
            <KakaoIcon className="size-4.5" />
          </span>
          <span>카카오로 계속하기</span>
        </button>
      </div>
    </section>
  )
}
