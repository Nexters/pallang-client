import Image from 'next/image'

import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'

export function LandingHeroSection() {
  return (
    <section
      aria-label="팔랑 소개"
      className={`flex min-h-[1080px] flex-col items-center overflow-hidden px-10 pt-[140px] text-center font-pretendard ${GRID_BACKGROUND_CLASS_NAME}`}
    >
      <p className="whitespace-nowrap text-[40px] leading-[1.2] font-bold tracking-[-0.02em] text-black">
        흔적을 넘기면 다른 생각이 팔랑
      </p>

      <div aria-hidden="true" className="mt-[22px] h-[182px] w-[560px] shrink-0" />

      <p className="mt-3 whitespace-nowrap text-[24px] leading-[1.5] font-medium tracking-[-0.02em] text-[#616161]">
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
        className="mt-[42px] h-[312px] w-[495px] object-contain"
      />

      <button
        type="button"
        className="press mt-[74px] flex h-20 w-[210px] items-center justify-center rounded-full bg-interactive-accent px-6 py-2 text-[24px] leading-[1.2] font-bold tracking-[-0.02em] text-white"
      >
        출시 알람 받기
      </button>
    </section>
  )
}
