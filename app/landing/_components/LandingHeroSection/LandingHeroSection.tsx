import Image from 'next/image'

import AppleIcon from '@/app/_global/_components/Icon/assets/apple.svg'
import GoogleIcon from '@/app/_global/_components/Icon/assets/google.svg'
import { LANDING_GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import LetterLogo from '@/public/images/letter-logo.svg'

export function LandingHeroSection() {
  return (
    <section
      aria-label="팔랑 소개"
      className={`relative flex min-h-[640px] flex-col items-center overflow-hidden px-4 py-[54px] text-center font-pretendard md:block md:h-[1080px] md:min-h-0 md:px-0 md:py-0 ${LANDING_GRID_BACKGROUND_CLASS_NAME}`}
    >
      <p className="whitespace-nowrap text-[20px] leading-[1.2] font-bold tracking-[-0.02em] text-black md:absolute md:top-[112px] md:left-1/2 md:-translate-x-1/2 md:text-[40px]">
        흔적을 넘기면 다른 생각이 팔랑
      </p>

      <LetterLogo
        aria-label="Pallang"
        className="mt-4 h-[91px] w-[280px] shrink-0 md:absolute md:top-[166px] md:left-1/2 md:mt-0 md:h-[183px] md:w-[560px] md:-translate-x-1/2"
      />

      <p className="mt-12 whitespace-nowrap text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#616161] md:absolute md:top-[380px] md:left-1/2 md:mt-0 md:-translate-x-1/2 md:text-[24px]">
        책을 읽고 흔적을 남기며 서로의 생각을 발견하는 교환독서 서비스
      </p>

      <div className="relative mt-8 flex w-full justify-center md:absolute md:top-[458px] md:left-1/2 md:mt-0 md:h-[136px] md:w-[518px] md:-translate-x-1/2">
        <div className="relative flex w-full max-w-[518px] flex-col items-center justify-center rounded-[32px] bg-interactive-accent px-4 py-3 text-center text-[13px] leading-[1.4] font-bold tracking-[-0.02em] text-white md:h-[115px] md:w-[518px] md:max-w-none md:rounded-[64px] md:px-10 md:py-6 md:text-[24px] md:tracking-[-0.01em]">
          <p className="break-words md:whitespace-nowrap">
            팔랑을 함께 만들어갈 첫 독자를 찾고 있어요.
          </p>
          <p className="break-words md:whitespace-nowrap">
            직접 사용해보고 여러분의 이야기를 들려주세요.
          </p>
          <span
            aria-hidden="true"
            className="absolute -bottom-3 left-1/2 size-0 -translate-x-1/2 border-x-[10px] border-t-[14px] border-x-transparent border-t-interactive-accent md:-bottom-5 md:border-x-[14px] md:border-t-[20px]"
          />
        </div>
      </div>

      <Image
        src="/images/landing/hero-character.webp"
        alt=""
        width={495}
        height={312}
        priority
        className="mt-8 h-[177px] w-[280px] object-contain md:absolute md:top-[594px] md:left-1/2 md:mt-0 md:h-[312px] md:w-[495px] md:-translate-x-1/2"
      />

      <div className="mt-[51px] flex w-full max-w-[460px] flex-col gap-3 px-4 md:absolute md:top-[930px] md:left-1/2 md:mt-0 md:w-[460px] md:max-w-none md:-translate-x-1/2 md:flex-row md:gap-3 md:px-0">
        <a
          href="https://play.google.com/store/apps/details?id=kr.co.pallang.app"
          target="_blank"
          rel="noreferrer"
          className="press flex h-14 items-center justify-center gap-2 rounded-xl bg-bg-dark px-6 py-2 text-[18px] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-white md:h-20 md:w-56 md:rounded-2xl md:text-[24px]"
        >
          <GoogleIcon aria-hidden="true" className="size-8 shrink-0 md:size-10" />
          <span>Google Play</span>
        </a>

        <a
          href="https://apps.apple.com/us/app/pallang-%ED%8C%94%EB%9E%91/id6796140451"
          target="_blank"
          rel="noreferrer"
          className="press flex h-14 items-center justify-center gap-2 rounded-xl bg-bg-dark px-6 py-2 text-[18px] leading-[1.2] font-bold tracking-[-0.02em] text-white md:h-20 md:w-56 md:rounded-2xl md:text-[24px]"
        >
          <AppleIcon aria-hidden="true" className="size-8 shrink-0 md:size-10" />
          <span>App Store</span>
        </a>
      </div>
    </section>
  )
}
