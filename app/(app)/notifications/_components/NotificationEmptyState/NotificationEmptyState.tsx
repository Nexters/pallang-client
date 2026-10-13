import Image from 'next/image'

const MASCOT_SRC = '/images/mascot-pair.png'

/** 시안(3912:20143) — 회색 마스코트 한 쌍과 안내 문구 */
export function NotificationEmptyState() {
  return (
    <section
      aria-label="빈 알림함"
      className="flex flex-1 flex-col items-center justify-center gap-5 px-4 pb-10"
    >
      <Image
        src={MASCOT_SRC}
        alt=""
        width={175}
        height={126}
        aria-hidden="true"
        className="h-auto w-[175px] opacity-40"
      />
      <p className="text-center text-title-18md text-text-disabled">아직 알림이 없어요.</p>
    </section>
  )
}
