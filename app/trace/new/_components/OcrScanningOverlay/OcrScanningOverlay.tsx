/** OCR 인식 중, 사진 스테이지 위에 얹는 딤 오버레이. 부모가 relative여야 한다.
 *  이동 애니메이션(keyframes)은 모션 컨벤션이 막으므로, 허용된 animate-pulse로 '처리 중'을 알린다. */
export function OcrScanningOverlay() {
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45"
    >
      <div className="flex animate-pulse flex-col items-center gap-4">
        <span aria-hidden="true" className="h-0.5 w-24 rounded-full bg-interactive-accent" />
        <p className="text-body-16md text-text-inverse">글자를 읽고 있어요</p>
      </div>
    </div>
  )
}
