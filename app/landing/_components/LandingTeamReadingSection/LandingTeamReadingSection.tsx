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
    'h-40 w-40 overflow-hidden rounded-[32px] border border-white bg-bg-surface shadow-none md:h-[431px] md:w-[431px] md:rounded-[40px] md:border-4 md:shadow-[0_24px_48px_rgba(0,0,0,0.16)]'
  const mobilePhotoClassName =
    'h-40 w-40 overflow-hidden rounded-[32px] border border-white bg-bg-surface'

  return (
    <section className="relative h-[658px] overflow-hidden bg-bg-alternative text-center font-pretendard md:flex md:h-[1080px] md:flex-col md:items-center md:pt-[120px]">
      <h2 className="absolute top-10 left-1/2 w-[343px] -translate-x-1/2 text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:static md:w-auto md:translate-x-0 md:text-[48px]">
        저희도 요즘
        <br />
        직접 교환독서를 하고 있어요
      </h2>

      <p className="absolute top-[124px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#616161] md:static md:mt-[14px] md:translate-x-0 md:text-[20px] md:leading-[1.4] md:text-[#595959]">
        직접 교환독서의 좋은 점과 아쉬운 점을 몸소 느끼기위해
        <br />
        팀원들은 직접 교환독서를 하며 서비스를 만들고 있어요!
      </p>

      <div
        className="absolute top-0 left-1/2 h-full w-[375px] -translate-x-1/2 md:hidden"
        aria-label="교환독서 사진 영역"
      >
        <div className="absolute top-[411px] left-[170px] flex size-[198.761px] items-center justify-center">
          <div className={`${mobilePhotoClassName} rotate-[16.45deg]`}>
            <Image
              src={teamReadingPhotos[1]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>
        </div>

        <div className="absolute top-[414.53px] left-[6.54px] flex size-[190.945px] items-center justify-center">
          <div className={`${mobilePhotoClassName} rotate-[-12.55deg]`}>
            <Image
              src={teamReadingPhotos[3]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>
        </div>

        <div className="absolute top-[190px] left-[161.01px] z-30 flex h-[195.948px] w-[196.003px] items-center justify-center">
          <div className={`${mobilePhotoClassName} -rotate-[15deg]`}>
            <Image
              src={teamReadingPhotos[0]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>
        </div>

        <div className="absolute top-[242px] left-[6.01px] z-20 flex h-[195.971px] w-[195.916px] items-center justify-center">
          <div className={`${mobilePhotoClassName} rotate-[15deg]`}>
            <Image
              src={teamReadingPhotos[4]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>
        </div>

        <div className="absolute top-[314px] left-[113.5px] z-40 flex h-[195.932px] w-[195.987px] items-center justify-center">
          <div className={mobilePhotoClassName}>
            <Image
              src={teamReadingPhotos[2]}
              alt=""
              width={431}
              height={431}
              className="size-full object-cover"
            />
          </div>
        </div>
      </div>

      <div
        className="relative mt-[55px] hidden h-[640px] w-full overflow-hidden md:block"
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
