import Image from 'next/image'

const stepCopy = [
  {
    id: 'book',
    mobileClassName: 'top-[714px] left-4 w-[343px]',
    className: 'md:top-[543px] md:left-[320px] md:w-[445px]',
    title: (
      <>
        <span className="md:hidden">
          우선
          <br />
          읽고 있는 책을 선택해요
        </span>
        <span className="hidden md:inline">
          우선
          <br />
          읽고 있는 책을 선택해요
        </span>
      </>
    ),
    description: '현재 읽고 있거나 다 읽은 책을 검색해서 시작해요',
  },
  {
    id: 'ocr',
    mobileClassName: 'top-[1545px] left-4 w-[343px]',
    className: 'md:top-[1231px] md:left-[1052px] md:w-[528px]',
    title: (
      <>
        간편하게 페이지를 촬영해
        <br />
        문장을 쉽게 발췌할 수 있어요
      </>
    ),
    description: (
      <>
        책 속 문장을 촬영하면
        <br />
        OCR을 통해 텍스트로 간편하게 등록할 수 있습니다.
      </>
    ),
  },
  {
    id: 'decorate',
    mobileClassName: 'top-[2398px] left-4 w-[343px]',
    className: 'md:top-[1954px] md:left-[320px] md:w-[445px]',
    title: (
      <>
        발췌한 문장을 꾸미고,
        <br />내 의견을 남겨요
      </>
    ),
    description: (
      <>
        왜 이 문장이 인상 깊었는지
        <br />
        어떤 생각과 감정이 들었는지 기록합니다.
      </>
    ),
  },
  {
    id: 'share',
    mobileClassName: 'top-[3244px] left-4 w-[343px]',
    className: 'md:top-[2641px] md:left-[1052px] md:w-[531px]',
    title: (
      <>
        다른 사람의 흔적을 발견하고,
        <br />
        생각을 나눌 수 있어요
      </>
    ),
    description: (
      <>
        같은 책을 읽은 사람들끼리 남긴 다양한 의견을 확인하고
        <br />
        서로 의견을 교환할 수 있어요
      </>
    ),
  },
] as const

const screens = [
  {
    imageSrc: '/images/landing/how-it-works-1.webp',
    mobileClassName: 'top-[156px] left-[68px] h-[518px] w-[240px]',
    className: 'md:top-[307px] md:left-[1290px]',
  },
  {
    imageSrc: '/images/landing/how-it-works-2.webp',
    mobileClassName: 'top-[900px] left-12 h-[605px] w-[280px]',
    className: 'md:top-[1012px] md:left-[320px]',
  },
  {
    imageSrc: '/images/landing/how-it-works-3.webp',
    mobileClassName: 'top-[1753px] left-12 h-[605px] w-[280px]',
    className: 'md:top-[1718px] md:left-[1291px]',
  },
  {
    imageSrc: '/images/landing/how-it-works-4.webp',
    mobileClassName: 'top-[2606px] left-12 h-[605px] w-[280px]',
    className: 'md:top-[2422px] md:left-[320px]',
  },
] as const

export function LandingHowItWorksSection() {
  return (
    <section className="relative h-[3436px] overflow-hidden bg-bg-default font-pretendard md:h-[3256px]">
      <div className="relative mx-auto h-full w-full max-w-[375px] md:absolute md:top-0 md:left-1/2 md:block md:w-[1920px] md:max-w-none md:-translate-x-1/2">
        <h2 className="absolute top-10 left-4 w-[343px] text-center text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:top-[120px] md:left-1/2 md:w-auto md:-translate-x-1/2 md:whitespace-nowrap md:text-[48px]">
          어떻게 팔랑에서
          <br className="md:hidden" />
          <span className="hidden md:inline"> </span>
          교환독서를 할 수 있나요?
        </h2>

        <div className="contents">
          {stepCopy.map((step) => (
            <div
              key={step.id}
              className={`absolute text-center md:text-left ${step.mobileClassName} ${step.className}`}
            >
              <h3 className="text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:text-[48px]">
                {step.title}
              </h3>
              <p className="mt-4 text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#595959] md:mt-8 md:text-[24px] md:leading-[1.4] md:font-normal md:text-[#515151]">
                {step.description}
              </p>
            </div>
          ))}

          {screens.map((screen) => (
            <div
              key={screen.imageSrc}
              className={`absolute overflow-hidden rounded-[25px] border border-black bg-white shadow-[5px_11px_27px_0_rgba(0,0,0,0.1)] md:h-[670px] md:w-[310px] md:rounded-[32px] md:shadow-[123px_282px_86px_0_rgba(0,0,0,0),79px_181px_79px_0_rgba(0,0,0,0.01),44px_102px_66px_0_rgba(0,0,0,0.05),20px_45px_49px_0_rgba(0,0,0,0.09),5px_11px_27px_0_rgba(0,0,0,0.1)] ${screen.mobileClassName} ${screen.className}`}
            >
              <Image
                src={screen.imageSrc}
                alt=""
                width={310}
                height={670}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
