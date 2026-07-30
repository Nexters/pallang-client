/** OCR 인식 중, 사진 스테이지 위에 얹는 딤 + 위→아래 스캔 라인 오버레이. 부모가 relative여야 한다. */
export function OcrScanningOverlay() {
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-black/45"
    >
      {/* 위→아래로 반복해 훑는 스캔 라인. 모션 최소화 설정이면 감춘다. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 h-0.5 -translate-y-1/2 animate-scan bg-gradient-to-r from-transparent via-interactive-accent to-transparent motion-reduce:hidden"
      />
      <p className="text-body-16md text-text-inverse">글자를 읽고 있어요</p>
    </div>
  )
}
