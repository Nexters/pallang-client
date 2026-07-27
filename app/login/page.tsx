import Image from 'next/image'

import KakaoIcon from '@/app/_global/_components/Icon/assets/kakao.svg'
import { KAKAO_LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import Logo from '@/public/images/logo.svg'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-alternative bg-[linear-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px)] bg-size-[24px_24px]">
      <div className="flex flex-col items-center gap-1 px-6 pt-25">
        <Logo aria-label="Pallang" className="h-auto w-60" />
        <p className="text-title-16sb text-text-primary">흔적을 넘기면, 다른 생각이 팔랑</p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <Image
          src="/images/login-mascot.png"
          alt=""
          width={360}
          height={240}
          priority
          className="h-auto w-full max-w-90 object-contain"
        />
      </div>

      {/* API route가 카카오 authorize로 302 하므로 full navigation(<a>)이 필요하다. */}
      <div className="w-full p-4">
        <a
          href={KAKAO_LOGIN_PATH}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fee500] p-4"
        >
          <span className="flex size-6 items-center justify-center text-black">
            <KakaoIcon aria-hidden="true" className="size-4.5" />
          </span>
          <span className="text-body-16bd text-text-secondary">카카오로 계속하기</span>
        </a>
      </div>
    </div>
  )
}
