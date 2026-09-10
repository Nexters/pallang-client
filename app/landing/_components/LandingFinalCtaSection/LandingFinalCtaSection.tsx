import Image from 'next/image'

import AppleIcon from '@/app/_global/_components/Icon/assets/apple.svg'
import GoogleIcon from '@/app/_global/_components/Icon/assets/google.svg'

export function LandingFinalCtaSection() {
  return (
    <section className="relative h-[843px] overflow-hidden bg-bg-default font-pretendard md:h-[748px]">
      <div className="absolute top-0 left-1/2 h-full w-[414px] -translate-x-1/2 md:w-[1920px]">
        <div className="absolute top-[72px] left-1/2 flex w-[343px] -translate-x-1/2 flex-col items-center md:top-[100px] md:left-[320px] md:w-[510px] md:translate-x-0 md:items-start">
          <Image
            src="/images/landing/instagram-qr.webp"
            alt="팔랑 인스타그램 QR 코드"
            width={492}
            height={492}
            className="size-[164px] object-contain"
          />

          <div className="mt-6 flex w-full flex-col gap-4 md:mt-10">
            <h2 className="whitespace-nowrap text-center text-[24px] leading-[1.4] font-bold tracking-[-0.02em] text-black md:text-left md:text-[48px]">
              팔랑을 함께 만들어갈
              <br />첫 독자를 찾고 있어요.
            </h2>
            <p className="text-center text-[14px] leading-[1.5] font-medium tracking-[-0.02em] text-[#595959] md:whitespace-nowrap md:text-left md:text-[20px] md:leading-[1.4]">
              팔랑을 직접 사용해보고
              <br className="hidden md:block" />
              좋았던 점, 불편했던 점, 있었으면 하는 기능을 들려주세요.
              <br className="hidden md:block" />
              여러분의 의견을 바탕으로 더 즐거운 교환독서 경험을 만들어갈게요.
            </p>
          </div>

          <div className="mt-10 flex w-full max-w-[460px] flex-col gap-3 md:mt-8 md:w-[460px] md:max-w-none md:flex-row md:gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=kr.co.pallang.app"
              target="_blank"
              rel="noreferrer"
              className="press flex h-14 items-center justify-center gap-2 rounded-xl bg-bg-dark px-6 py-2 text-[18px] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-white md:h-20 md:w-56 md:rounded-2xl md:text-[24px]"
            >
              <GoogleIcon aria-hidden="true" className="size-8 shrink-0 md:size-10" />
              <span>Google Play</span>
            </a>
            <a
              href="https://apps.apple.com/us/app/pallang-%ED%8C%94%EB%9E%91/id6796140451"
              target="_blank"
              rel="noreferrer"
              className="press flex h-14 items-center justify-center gap-2 rounded-xl bg-bg-dark px-6 py-2 text-[18px] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-white md:h-20 md:w-56 md:rounded-2xl md:text-[24px]"
            >
              <AppleIcon aria-hidden="true" className="size-8 shrink-0 md:size-10" />
              <span>App Store</span>
            </a>
          </div>
        </div>

        <Image
          src="/images/pencil-friends.webp"
          alt=""
          width={613}
          height={451}
          className="absolute top-[623px] left-1/2 h-[219px] w-[299px] -translate-x-1/2 object-contain md:top-[150px] md:left-[1003px] md:h-[451px] md:w-[613px] md:translate-x-0"
        />
      </div>
    </section>
  )
}
