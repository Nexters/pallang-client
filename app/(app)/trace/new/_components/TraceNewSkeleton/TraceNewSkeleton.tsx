/**
 * 흔적 작성 첫 화면(방식 선택 시트)의 Suspense fallback — 씨앗을 읽는 동안 잠깐 보인다.
 * 시트는 마운트되자마자 바로 열리므로, 골격은 TraceSourceView와 같은 뒤 배경(bg-bg-dark)이
 * 비지 않게 하는 것으로 충분하다.
 */
export function TraceNewSkeleton() {
  return <div className="flex flex-1 flex-col bg-bg-dark" />
}
