import Image from 'next/image'

import { LANDING_GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'

export function LandingProgressSection() {
  return (
    <section
      className={`flex h-[1080px] flex-col items-center overflow-hidden pt-32 text-center font-pretendard ${LANDING_GRID_BACKGROUND_CLASS_NAME}`}
    >
      <h2 className="whitespace-nowrap text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
        팔랑은 지금
        <br />
        열심히 제작 중에 있어요
      </h2>

      <p className="mt-4 whitespace-nowrap text-[20px] leading-[1.4] font-medium tracking-[-0.02em] text-[#595959]">
        교환독서의 즐거움을 온라인에서도 자연스럽게 느낄 수 있도록
        <br />
        팀원들이 직접 책을 읽고 문장과 생각을 나누며 팔랑에 필요한 경험을 하나씩 다듬고 있습니다.
        <br />
        <br />
        문장을 더 편하게 기록하는 방법과 다른 사람의 생각을 더 자연스럽게 발견하는 방법을
        <br />
        직접 경험하며 고민하고 있어요.
      </p>

      <Image
        src="/images/landing/progress-character.png"
        alt=""
        width={533}
        height={405}
        className="mt-[114px] h-[405px] w-[533px] object-contain"
      />
    </section>
  )
}
