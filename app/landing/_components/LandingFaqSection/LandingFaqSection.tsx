'use client'

import Image from 'next/image'
import { useState } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'

const faqItems = [
  {
    question: '팔랑은 어떤 서비스인가요?',
    answer:
      '책을 읽으며 마음에 남은 문장과 감상을 기록하고, 같은 책을 읽은 다른 사람의 생각을 만나볼 수 있는 온라인 교환독서 서비스입니다.',
  },
  {
    question: '꼭 전체 공개를 해야하나요?',
    answer: '준비 중입니다.',
  },
  {
    question: '책의 저작권은 어떻게 보호하나요?',
    answer: '준비 중입니다.',
  },
  {
    question: '종이책만 이용할 수 있나요?',
    answer: '준비 중입니다.',
  },
  {
    question: '팔랑은 언제 사용할 수 있나요?',
    answer: '준비 중입니다.',
  },
] as const

export function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative h-[919px] overflow-hidden bg-bg-default font-pretendard">
      <div className="absolute top-0 left-1/2 h-full w-[1920px] -translate-x-1/2">
        <Image
          src="/images/landing/faq-character.png"
          alt=""
          width={146}
          height={106}
          className="absolute top-[162px] left-[1238px] h-[106px] w-[146px] object-contain"
        />

        <h2 className="absolute top-32 left-1/2 -translate-x-1/2 text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
          FAQ
        </h2>

        <div className="absolute top-[251px] left-1/2 flex w-[848px] -translate-x-1/2 flex-col gap-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div key={item.question} className="rounded-2xl bg-bg-alternative">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-[89px] p-6 text-left"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenIndex(isOpen ? null : index)
                  }}
                >
                  <span className="min-w-0 flex-1 text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
                    {item.question}
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={`size-6 shrink-0 text-icon-primary transition-transform duration-instant ease-standard ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <p className="px-6 pb-6 text-[18px] leading-[1.4] font-medium tracking-[-0.02em] text-[#505050]">
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
