import Image from 'next/image'

const stepCopy = [
  {
    id: 'book',
    className: 'top-[543px] left-[320px] w-[445px]',
    title: (
      <>
        우선 읽고 있는
        <br />
        책을 선택해요
      </>
    ),
    description: '현재 읽고 있거나 다 읽은 책을 검색해서 시작해요',
  },
  {
    id: 'ocr',
    className: 'top-[1231px] left-[1052px] w-[528px]',
    title: (
      <>
        간편하게 페이지를 촬영해
        <br />
        문장을 쉽게 발췌할 수 있어요
      </>
    ),
    description: '책 속 문장을 촬영하면 OCR을 통해 텍스트로 간편하게 등록할 수 있습니다.',
  },
  {
    id: 'decorate',
    className: 'top-[1954px] left-[320px] w-[445px]',
    title: (
      <>
        발췌한 문장을 꾸미고,
        <br />내 의견을 남겨요
      </>
    ),
    description: '왜 이 문장이 인상 깊었는지 어떤 생각과 감정이 들었는지 기록합니다.',
  },
  {
    id: 'share',
    className: 'top-[2641px] left-[1052px] w-[531px]',
    title: (
      <>
        다른 사람의 흔적을 발견하고,
        <br />
        생각을 나눌 수 있어요
      </>
    ),
    description:
      '같은 책을 읽은 사람들끼리 남긴 다양한 의견을 확인하고 서로 의견을 교환할 수 있어요',
  },
] as const

const screens = [
  {
    imageSrc: '/images/landing/how-it-works-1.png',
    className: 'top-[307px] left-[1290px]',
  },
  {
    imageSrc: '/images/landing/how-it-works-2.png',
    className: 'top-[1012px] left-[320px]',
  },
  {
    imageSrc: '/images/landing/how-it-works-3.png',
    className: 'top-[1718px] left-[1291px]',
  },
  {
    imageSrc: '/images/landing/how-it-works-4.png',
    className: 'top-[2422px] left-[320px]',
  },
] as const

export function LandingHowItWorksSection() {
  return (
    <section className="relative h-[3256px] overflow-hidden bg-bg-default font-pretendard">
      <div className="absolute top-0 left-1/2 h-full w-[1920px] -translate-x-1/2">
        <h2 className="absolute top-[120px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
          어떻게 팔랑에서 교환독서를 할 수 있나요?
        </h2>

        {stepCopy.map((step) => (
          <div key={step.id} className={`absolute text-left ${step.className}`}>
            <h3 className="text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
              {step.title}
            </h3>
            <p className="mt-8 text-[24px] leading-[1.4] font-medium tracking-[-0.02em] text-[#595959]">
              {step.description}
            </p>
          </div>
        ))}

        {screens.map((screen) => (
          <div
            key={screen.imageSrc}
            className={`absolute h-[670px] w-[310px] overflow-hidden rounded-[32px] border border-black bg-white shadow-[123px_282px_86px_0_rgba(0,0,0,0),79px_181px_79px_0_rgba(0,0,0,0.01),44px_102px_66px_0_rgba(0,0,0,0.05),20px_45px_49px_0_rgba(0,0,0,0.09),5px_11px_27px_0_rgba(0,0,0,0.1)] ${screen.className}`}
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
    </section>
  )
}
