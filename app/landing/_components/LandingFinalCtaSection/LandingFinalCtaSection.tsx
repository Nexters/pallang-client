import Image from 'next/image'

export function LandingFinalCtaSection() {
  return (
    <section className="relative h-[748px] overflow-hidden bg-bg-default font-pretendard">
      <div className="absolute top-0 left-1/2 h-full w-[1920px] -translate-x-1/2">
        <div className="absolute top-[148px] left-[320px] flex w-[472px] flex-col items-start">
          <div className="flex size-[164px] items-center justify-center bg-[#d9d9d9] text-[20px] leading-[1.4] font-medium tracking-[-0.02em] text-[#595959]">
            인스타 QR
          </div>

          <div className="mt-10 flex w-full flex-col gap-4">
            <h2 className="whitespace-nowrap text-[48px] leading-[1.4] font-bold tracking-[-0.02em] text-black">
              곧 팔랑에서 만나요!
            </h2>
            <p className="whitespace-nowrap text-center text-[20px] leading-[1.4] font-medium tracking-[-0.02em] text-[#595959]">
              인스타그램을 팔로우하고 출시 소식을 가장 먼저 확인해보세요!
            </p>
          </div>

          <button
            type="button"
            className="press mt-[65px] flex h-20 w-[210px] items-center justify-center rounded-full bg-interactive-accent px-6 py-2 text-[24px] leading-[1.2] font-bold tracking-[-0.02em] text-white"
          >
            출시 알람 받기
          </button>
        </div>

        <Image
          src="/images/pencil-friends.png"
          alt=""
          width={613}
          height={451}
          className="absolute top-[153px] left-[1003px] h-[451px] w-[613px] object-contain"
        />
      </div>
    </section>
  )
}
