import Image from 'next/image'

const problemCards = [
  {
    id: 'find-reader',
    imageSrc: '/images/landing/problem-find-reader.png',
    imageAlt: '',
    imageClassName: 'h-[126px] w-[178px] md:h-[169px] md:w-[238px]',
    text: (
      <>
        같이 교환독서할 사람을
        <br />
        찾기 힘들어요
      </>
    ),
  },
  {
    id: 'review-history',
    imageSrc: '/images/landing/problem-review-history.png',
    imageAlt: '',
    imageClassName: 'h-[159px] w-[170px] md:h-[217px] md:w-[233px]',
    text: (
      <>
        <span className="md:hidden">
          교환독서 진행한 책을 가지지 않는 한
          <br />
          의견을 다시 확인하기 어려워요
        </span>
        <span className="hidden md:inline">
          교환독서 진행한 책을
          <br />
          가지지 않는 한 의견을
          <br />
          다시 확인하기 어려워요
        </span>
      </>
    ),
  },
  {
    id: 'taste',
    imageSrc: '/images/landing/problem-reading-taste.png',
    imageAlt: '',
    imageClassName: 'h-[97px] w-[211px] md:h-[133px] md:w-[289px]',
    text: (
      <>
        나와 같은 취향인 사람은
        <br />
        어떤 책을 읽는지 궁금해요
      </>
    ),
  },
] as const

export function LandingProblemSection() {
  return (
    <section className="flex flex-col items-center bg-bg-default py-10 text-center font-pretendard md:h-[1080px] md:pt-[100px] md:pb-0">
      <h2 className="whitespace-nowrap text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:text-[48px]">
        <span className="md:hidden">
          교환독서, 해보고 싶은데
          <br />
          함께 읽을 사람을
          <br />
          찾기 어렵지 않으셨나요?
        </span>
        <span className="hidden md:inline">
          교환독서, 해보고 싶은데
          <br />
          함께 읽을 사람을 찾기 어렵지 않으셨나요?
        </span>
      </h2>

      <div className="mt-8 flex flex-col gap-4 md:mt-16 md:flex-row md:gap-6">
        {problemCards.map((card) => (
          <article
            key={card.id}
            className="flex h-[260px] w-80 shrink-0 flex-col items-center gap-4 overflow-hidden rounded-2xl bg-bg-alternative p-6 md:h-[380px]"
          >
            <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden md:h-[218px]">
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                width={289}
                height={218}
                className={`${card.imageClassName} object-contain`}
              />
            </div>

            <p className="flex min-h-0 flex-1 items-center justify-center text-[16px] leading-[1.4] font-medium tracking-[-0.02em] text-black md:text-[24px]">
              {card.text}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2 md:mt-[72px]" aria-hidden="true">
        <span className="size-2 rounded-full bg-[#d9d9d9]" />
        <span className="size-2 rounded-full bg-[#d9d9d9]" />
        <span className="size-2 rounded-full bg-[#d9d9d9]" />
      </div>

      <h2 className="mt-8 whitespace-nowrap text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:text-[48px]">
        교환독서의 즐거움을
        <br />
        온라인에서도 경험할 수 없을까?
      </h2>
    </section>
  )
}
