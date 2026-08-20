import Image from 'next/image'

import { LANDING_GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'

export function LandingProgressSection() {
  return (
    <section
      className={`relative h-[588px] overflow-hidden text-center font-pretendard md:flex md:h-[1080px] md:flex-col md:items-center md:pt-32 ${LANDING_GRID_BACKGROUND_CLASS_NAME}`}
    >
      <h2 className="absolute top-10 left-1/2 w-[343px] -translate-x-1/2 whitespace-nowrap text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:static md:w-auto md:translate-x-0 md:text-[48px]">
        팔랑은 지금
        <br />
        열심히 제작 중에 있어요
      </h2>

      <p className="absolute top-[124px] left-1/2 w-[343px] -translate-x-1/2 text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#595959] md:static md:mt-4 md:w-auto md:translate-x-0 md:whitespace-nowrap md:text-[20px] md:leading-[1.4]">
        <span className="md:hidden">
          교환독서의 즐거움을 온라인에서도 자연스럽게 느낄 수 있도록
          <br />
          팀원들이 직접 책을 읽고 문장과 생각을 나누며 팔랑에 필요한
          <br />
          경험을 하나씩 다듬고 있습니다.
          <br />
          <br />
          문장을 더 편하게 기록하는 방법과
          <br />
          다른 사람의 생각을 더 자연스럽게 발견하는 방법을
          <br />
          직접 경험하며 고민하고 있어요.
        </span>
        <span className="hidden md:inline">
          교환독서의 즐거움을 온라인에서도 자연스럽게 느낄 수 있도록
          <br />
          팀원들이 직접 책을 읽고 문장과 생각을 나누며 팔랑에 필요한 경험을 하나씩 다듬고 있습니다.
          <br />
          <br />
          문장을 더 편하게 기록하는 방법과 다른 사람의 생각을 더 자연스럽게 발견하는 방법을
          <br />
          직접 경험하며 고민하고 있어요.
        </span>
      </p>

      <Image
        src="/images/landing/progress-character.webp"
        alt=""
        width={533}
        height={405}
        className="absolute top-[320px] left-1/2 h-[223px] w-[294px] -translate-x-1/2 object-contain md:static md:mt-[114px] md:h-[405px] md:w-[533px] md:translate-x-0"
      />
    </section>
  )
}
