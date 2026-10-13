'use client'

/**
 * 사진 위에서 무엇을 해야 하는지 알려준다.
 *
 * 시트의 placeholder는 시트 안에서만 보여 정작 손을 대야 할 사진에는 안내가 없었다.
 * 아직 한 어절도 고르지 않았을 때만 띄우고, 첫 선택과 함께 사라진다.
 */
export function OcrSelectionHint() {
  return (
    <p
      role="status"
      className="pointer-events-none absolute inset-x-0 bottom-safe-6 mx-auto w-fit rounded-full bg-bg-overlay/80 px-4 py-2 text-body-14md text-text-inverse transition-opacity duration-fast ease-enter"
    >
      담고 싶은 문장을 손가락으로 훑어보세요.
    </p>
  )
}
