/**
 * 흔적 작성 첫 화면(방식 선택 시트)의 Suspense fallback — URL 직접 로드가 하이드레이션돼
 * 클라이언트가 씨앗을 읽을 때까지만 보인다(클라이언트 내비게이션은 이 폴백을 거치지 않는다).
 * 시트는 마운트되자마자 바로 열리므로, 골격은 TraceSourceView와 같은 뒤 배경(bg-bg-dark)이
 * 비지 않게 하는 것으로 충분하다.
 */
export function TraceNewSkeleton() {
  return <div className="flex flex-1 flex-col bg-bg-dark" />
}
