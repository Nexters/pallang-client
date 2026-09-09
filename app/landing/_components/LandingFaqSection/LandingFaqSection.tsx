'use client'

import Image from 'next/image'
import { useState } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'

const faqItems = [
  {
    question: '꼭 전체 공개를 해야하나요?',
    answer: '아는 사람들이나 팔로워끼리만 볼 수 있는 모임도 준비 중에 있습니다!',
  },
  {
    question: '책의 저작권은 어떻게 보호하나요?',
    answer:
      '팔랑은 책 전체를 공유하는 서비스가 아닙니다. 발췌 분량과 공개 범위를 제한하고, 책 정보와 출처를 표시하며, 권리자의 신고 및 삭제 요청에 대응할 수 있는 정책을 준비하고 있습니다.',
  },
  {
    question: '종이책만 이용할 수 있나요?',
    answer:
      '현재는 종이책의 문장을 촬영해 등록하는 경험을 먼저 제공합니다. 전자책을 활용하는 방법은 추후 검토할 예정입니다.',
  },
  {
    question: '혼자서도 팔랑을 사용할 수 있나요?',
    answer: (
      <>
        <span className="whitespace-nowrap">
          네. 혼자 책을 읽으며 문장과 생각을 기록할 수도 있고,
        </span>
        <br />
        <span className="whitespace-nowrap">
          다른 독자의 흔적을 보거나 모임을 만들어 함께 읽을 수도 있어요.
        </span>
      </>
    ),
  },
] as const

export function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative min-h-[719px] overflow-hidden bg-bg-default font-pretendard md:h-[919px]">
      <div className="relative mx-auto w-full max-w-[414px] md:absolute md:top-0 md:left-1/2 md:h-full md:w-[1920px] md:max-w-none md:-translate-x-1/2">
        <Image
          src="/images/landing/faq-character.webp"
          alt=""
          width={146}
          height={106}
          className="absolute top-[613px] right-[7px] h-[106px] w-[146px] object-contain md:top-[162px] md:right-auto md:left-[1238px]"
        />

        <h2 className="pt-10 text-center text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:absolute md:top-32 md:left-1/2 md:-translate-x-1/2 md:pt-0 md:text-[48px]">
          FAQ
        </h2>

        <div className="relative top-auto left-auto mx-4 mt-[38px] flex w-auto translate-x-0 flex-col gap-4 md:absolute md:top-[251px] md:left-1/2 md:mx-0 md:mt-0 md:w-[848px] md:-translate-x-1/2">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div key={item.question} className="rounded-2xl bg-bg-alternative">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-4 p-6 text-left md:gap-[89px]"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenIndex(isOpen ? null : index)
                  }}
                >
                  <span className="min-w-0 flex-1 text-[16px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:text-[24px]">
                    {item.question}
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={`size-5 shrink-0 text-icon-primary transition-transform duration-instant ease-standard md:size-6 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <p className="break-keep px-6 pb-6 text-[12px] leading-[1.4] font-medium tracking-[-0.02em] text-[#505050] md:text-[18px]">
                    {item.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
