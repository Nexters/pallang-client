import Image from 'next/image'

import { LANDING_GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import LetterLogo from '@/public/images/letter-logo.svg'

export function LandingHeroSection() {
  return (
    <section
      aria-label="팔랑 소개"
      className={`flex h-[640px] flex-col items-center overflow-hidden px-4 py-[54px] text-center font-pretendard md:min-h-[1080px] md:h-auto md:px-10 md:py-0 md:pt-[140px] ${LANDING_GRID_BACKGROUND_CLASS_NAME}`}
    >
      <p className="whitespace-nowrap text-[20px] leading-[1.2] font-bold tracking-[-0.02em] text-black md:text-[40px]">
        흔적을 넘기면 다른 생각이 팔랑
      </p>

      <LetterLogo
        aria-label="Pallang"
        className="mt-4 h-[91px] w-[280px] shrink-0 md:mt-[22px] md:h-[183px] md:w-[560px]"
      />

      <p className="mt-12 whitespace-nowrap text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#616161] md:mt-3 md:text-[24px]">
        책 속 문장을 발췌하고 내 생각을 기록하며
        <br />
        다른 사람의 시선을 만나는 새로운 교환독서 경험
      </p>

      <Image
        src="/images/landing/hero-character.png"
        alt=""
        width={495}
        height={312}
        priority
        className="mt-[42px] h-[177px] w-[280px] object-contain md:h-[312px] md:w-[495px]"
      />

      <a
        href="https://apps.apple.com/us/app/pallang-%ED%8C%94%EB%9E%91/id6796140451"
        target="_blank"
        rel="noreferrer"
        className="press mt-[51px] flex h-10 items-center justify-center rounded-full bg-interactive-accent px-4 py-2 text-[16px] leading-[1.2] font-bold tracking-[-0.02em] text-white md:mt-[74px] md:h-20 md:w-[210px] md:px-6 md:text-[24px]"
      >
        앱 다운로드
      </a>
    </section>
  )
}
