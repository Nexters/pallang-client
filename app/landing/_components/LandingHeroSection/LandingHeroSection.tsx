import Image from 'next/image'

import AppleIcon from '@/app/_global/_components/Icon/assets/apple.svg'
import GoogleIcon from '@/app/_global/_components/Icon/assets/google.svg'
import { LANDING_GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import LetterLogo from '@/public/images/letter-logo.svg'

export function LandingHeroSection() {
  return (
    <section
      aria-label="팔랑 소개"
      className={`relative h-[640px] overflow-hidden text-center font-pretendard md:h-[1080px] ${LANDING_GRID_BACKGROUND_CLASS_NAME}`}
    >
      <p className="absolute top-[62px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[20px] leading-[1.2] font-bold tracking-[-0.02em] text-black md:top-[112px] md:text-[40px]">
        흔적을 넘기면 다른 생각이 팔랑
      </p>

      <LetterLogo
        aria-label="Pallang"
        className="absolute top-[98px] left-1/2 h-[91px] w-[280px] -translate-x-1/2 md:top-[166px] md:h-[183px] md:w-[560px]"
      />

      <p className="absolute top-[201px] left-1/2 w-[343px] -translate-x-1/2 text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#616161] md:top-[380px] md:w-auto md:whitespace-nowrap md:text-[24px]">
        <span className="md:hidden">
          책을 읽고 흔적을 남기며
          <br />
          서로의 생각을 발견하는 교환독서 서비스
        </span>
        <span className="hidden md:inline">
          책을 읽고 흔적을 남기며 서로의 생각을 발견하는 교환독서 서비스
        </span>
      </p>

      <div className="absolute top-[275px] left-1/2 flex h-[84px] w-[304px] -translate-x-1/2 justify-center md:top-[458px] md:h-[136px] md:w-[518px]">
        <div className="relative flex w-full flex-col items-center justify-center rounded-[64px] bg-interactive-accent px-6 py-4 text-center text-[14px] leading-[1.4] font-bold tracking-[-0.01em] text-white md:h-[115px] md:w-[518px] md:px-10 md:py-6 md:text-[24px]">
          <p className="whitespace-nowrap">팔랑을 함께 만들어갈 첫 독자를 찾고 있어요.</p>
          <p className="whitespace-nowrap">직접 사용해보고 여러분의 이야기를 들려주세요.</p>
          <span
            aria-hidden="true"
            className="absolute -bottom-3 left-1/2 size-0 -translate-x-1/2 border-x-[8px] border-t-[12px] border-x-transparent border-t-interactive-accent md:-bottom-5 md:border-x-[14px] md:border-t-[20px]"
          />
        </div>
      </div>

      <Image
        src="/images/landing/hero-character.webp"
        alt=""
        width={495}
        height={312}
        priority
        className="absolute top-[359px] left-1/2 h-[177px] w-[280px] -translate-x-1/2 object-contain md:top-[594px] md:h-[312px] md:w-[495px]"
      />

      <div className="absolute top-[552px] left-1/2 flex w-[328px] -translate-x-1/2 gap-2 md:top-[930px] md:w-[460px] md:gap-3">
        <a
          href="https://play.google.com/store/apps/details?id=kr.co.pallang.app"
          target="_blank"
          rel="noreferrer"
          className="press flex h-12 w-40 items-center justify-center gap-2 rounded-2xl bg-bg-dark px-6 py-2 text-[16px] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-white md:h-20 md:w-56 md:text-[24px]"
        >
          <GoogleIcon aria-hidden="true" className="size-6 shrink-0 md:size-10" />
          <span>Google Play</span>
        </a>

        <a
          href="https://apps.apple.com/us/app/pallang-%ED%8C%94%EB%9E%91/id6796140451"
          target="_blank"
          rel="noreferrer"
          className="press flex h-12 w-40 items-center justify-center gap-2 rounded-2xl bg-bg-dark px-6 py-2 text-[16px] leading-[1.2] font-bold tracking-[-0.02em] text-white md:h-20 md:w-56 md:text-[24px]"
        >
          <AppleIcon aria-hidden="true" className="size-6 shrink-0 md:size-10" />
          <span>App Store</span>
        </a>
      </div>
    </section>
  )
}
