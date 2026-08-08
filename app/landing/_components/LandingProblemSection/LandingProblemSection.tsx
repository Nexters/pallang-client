import Image from 'next/image'

const problemCards = [
  {
    id: 'find-reader',
    imageSrc: '/images/landing/problem-find-reader.png',
    imageAlt: '',
    imageClassName: 'h-[169px] w-[238px]',
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
    imageClassName: 'h-[217px] w-[233px]',
    text: (
      <>
        교환독서 진행한 책을
        <br />
        가지지 않는 한 의견을
        <br />
        다시 확인하기 어려워요
      </>
    ),
  },
  {
    id: 'taste',
    imageSrc: '/images/landing/problem-reading-taste.png',
    imageAlt: '',
    imageClassName: 'h-[133px] w-[289px]',
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
    <section className="flex h-[1080px] flex-col items-center bg-bg-default pt-[100px] text-center font-pretendard">
      <h2 className="whitespace-nowrap text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
        교환독서, 해보고 싶은데
        <br />
        함께 읽을 사람을 찾기 어렵지 않으셨나요?
      </h2>

      <div className="mt-16 flex gap-6">
        {problemCards.map((card) => (
          <article
            key={card.id}
            className="flex h-[380px] w-80 shrink-0 flex-col items-center gap-4 overflow-hidden rounded-2xl bg-bg-alternative p-6"
          >
            <div className="flex h-[218px] w-full shrink-0 items-center justify-center overflow-hidden">
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                width={289}
                height={218}
                className={`${card.imageClassName} object-contain`}
              />
            </div>

            <p className="flex min-h-0 flex-1 items-center justify-center text-[24px] leading-[1.4] font-medium tracking-[-0.02em] text-black">
              {card.text}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-[72px] flex flex-col gap-2" aria-hidden="true">
        <span className="size-2 rounded-full bg-[#d9d9d9]" />
        <span className="size-2 rounded-full bg-[#d9d9d9]" />
        <span className="size-2 rounded-full bg-[#d9d9d9]" />
      </div>

      <h2 className="mt-8 whitespace-nowrap text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
        교환독서의 즐거움을
        <br />
        온라인에서도 경험할 수 없을까?
      </h2>
    </section>
  )
}
