import Image from 'next/image'

const teamReadingPhotos = [
  '/images/landing/team-reading-1.png',
  '/images/landing/team-reading-2.png',
  '/images/landing/team-reading-3.png',
  '/images/landing/team-reading-4.png',
  '/images/landing/team-reading-5.png',
] as const

export function LandingTeamReadingSection() {
  const photoPlaceholderClassName =
    'h-[431px] w-[431px] overflow-hidden rounded-[40px] border-4 border-white bg-bg-surface shadow-[0_24px_48px_rgba(0,0,0,0.16)]'

  return (
    <section className="flex h-[1080px] flex-col items-center bg-bg-alternative pt-[120px] text-center font-pretendard">
      <h2 className="whitespace-nowrap text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
        저희도 요즘
        <br />
        직접 교환독서를 하고 있어요
      </h2>

      <p className="mt-[14px] whitespace-nowrap text-[20px] leading-[1.4] font-medium tracking-[-0.02em] text-[#595959]">
        직접 교환독서의 좋은 점과 아쉬운 점을 몸소 느끼기위해
        <br />
        팀원들은 직접 교환독서를 하며 서비스를 만들고 있어요!
      </p>

      <div
        className="relative mt-[55px] h-[640px] w-full overflow-hidden"
        aria-label="교환독서 사진 영역"
      >
        <div className="absolute top-0 left-1/2 h-full w-[1920px] -translate-x-1/2">
          <div className="absolute top-[17px] left-[-61px] flex h-[528px] w-[528px] items-center justify-center">
            <div className={`${photoPlaceholderClassName} rotate-[-15deg]`}>
              <Image
                src={teamReadingPhotos[0]}
                alt=""
                width={431}
                height={431}
                className="size-full object-cover"
              />
            </div>
          </div>

          <div className={`absolute top-[97px] left-[350px] ${photoPlaceholderClassName}`}>
            <Image
              src={teamReadingPhotos[1]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>

          <div className="absolute top-[17px] left-[696px] z-30 flex h-[528px] w-[528px] items-center justify-center">
            <div className={`${photoPlaceholderClassName} rotate-[15deg]`}>
              <Image
                src={teamReadingPhotos[2]}
                alt=""
                width={431}
                height={431}
                className="size-full object-cover"
              />
            </div>
          </div>

          <div className={`absolute top-[144px] left-[1109px] z-20 ${photoPlaceholderClassName}`}>
            <Image
              src={teamReadingPhotos[3]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>

          <div className="absolute top-0 left-[1454px] z-10 flex h-[528px] w-[528px] items-center justify-center">
            <div className={`${photoPlaceholderClassName} rotate-[-15deg]`}>
              <Image
                src={teamReadingPhotos[4]}
                alt=""
                width={431}
                height={431}
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
