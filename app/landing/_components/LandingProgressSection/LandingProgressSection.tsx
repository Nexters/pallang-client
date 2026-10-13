import Image from 'next/image'

import { LANDING_GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'

export function LandingProgressSection() {
  return (
    <section
      className={`relative h-[588px] overflow-hidden text-center font-pretendard md:flex md:h-[1080px] md:flex-col md:items-center md:pt-32 ${LANDING_GRID_BACKGROUND_CLASS_NAME}`}
    >
      <h2 className="absolute top-10 left-1/2 w-[343px] -translate-x-1/2 whitespace-nowrap text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:static md:w-auto md:translate-x-0 md:text-[48px]">
        팔랑은 지금도
        <br />
        함께 읽으며 만들어가고 있어요
      </h2>

      <p className="absolute top-[124px] left-1/2 w-[343px] -translate-x-1/2 text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#595959] md:static md:mt-4 md:w-auto md:translate-x-0 md:whitespace-nowrap md:text-[20px] md:leading-[1.4]">
        <span className="md:hidden">
          교환독서의 즐거움을 온라인에서도
          <br />
          자연스럽게 느낄 수 있도록 저희도 직접 팔랑으로
          <br />
          책을 읽고 흔적을 나누고 있어요.
          <br />
          <br />
          실제로 사용하면서 발견한 불편함과 독자분들이
          <br />
          들려주시는 의견을 하나씩 반영해
          <br />더 즐거운 교환독서 경험을 만들어가고 있습니다.
        </span>
        <span className="hidden md:inline">
          교환독서의 즐거움을 온라인에서도 자연스럽게 느낄 수 있도록
          <br />
          저희도 직접 팔랑으로 책을 읽고 흔적을 나누고 있어요.
          <br />
          <br />
          실제로 사용하면서 발견한 불편함과 독자분들이 들려주시는 의견을 하나씩 반영해
          <br />더 즐거운 교환독서 경험을 만들어가고 있습니다.
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
