import Image from 'next/image'

import AppleIcon from '@/app/_global/_components/Icon/assets/apple.svg'

export function LandingFinalCtaSection() {
  return (
    <section className="relative h-[719px] overflow-hidden bg-bg-default font-pretendard md:h-[748px]">
      <div className="absolute top-0 left-1/2 h-full w-[414px] -translate-x-1/2 md:w-[1920px]">
        <div className="absolute top-[72px] left-1/2 flex w-[343px] -translate-x-1/2 flex-col items-center md:top-[148px] md:left-[320px] md:w-[472px] md:translate-x-0 md:items-start">
          <Image
            src="/images/landing/instagram-qr.png"
            alt="팔랑 인스타그램 QR 코드"
            width={492}
            height={492}
            className="size-[164px] object-contain"
          />

          <div className="mt-6 flex w-full flex-col gap-4 md:mt-10">
            <h2 className="whitespace-nowrap text-center text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:text-left md:text-[48px]">
              곧 팔랑에서 만나요!
            </h2>
            <p className="whitespace-nowrap text-center text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#595959] md:text-left md:text-[20px] md:leading-[1.4]">
              인스타그램을 팔로우하고 출시 소식을 가장 먼저 확인해보세요!
            </p>
          </div>

          <div className="mt-10 flex w-[180px] flex-col items-start gap-3 md:mt-[65px] md:w-auto md:flex-row md:gap-6">
            <a
              href="https://apps.apple.com/us/app/pallang-%ED%8C%94%EB%9E%91/id6796140451"
              target="_blank"
              rel="noreferrer"
              className="press flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#111] px-4 py-2 text-[16px] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-white md:h-20 md:w-[210px] md:px-6 md:text-[24px]"
            >
              <AppleIcon className="size-4 text-white md:h-6 md:w-5" aria-hidden="true" />
              App Store
            </a>
            <a
              href="https://naver.me/51u1mr53"
              target="_blank"
              rel="noreferrer"
              className="press flex h-10 w-full items-center justify-center rounded-full bg-interactive-accent px-4 py-2 text-[16px] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-white md:h-20 md:w-auto md:px-6 md:text-[24px]"
            >
              안드로이드 출시 알림 받기
            </a>
          </div>
        </div>

        <Image
          src="/images/pencil-friends.png"
          alt=""
          width={613}
          height={451}
          className="absolute top-[475px] left-1/2 h-[219px] w-[299px] -translate-x-1/2 object-contain md:top-[153px] md:left-[1003px] md:h-[451px] md:w-[613px] md:translate-x-0"
        />
      </div>
    </section>
  )
}
