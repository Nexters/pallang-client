// 시안의 '선택' 리본(40×49, 3321:28387) — 상단 모서리 r2, 아래는 양 꼬리 + 가운데 V 노치.
// 24px 아이콘 파이프라인에 맞지 않는 모양이라 Icon 에셋이 아니라 인라인 SVG로 둔다.
// 검색 결과 리스트·표지 캐러셀·외부 검색 결과가 같은 후보 표시를 쓴다(#343).
// 장식일 뿐이므로 클릭은 아래 버튼으로 흘려보내고(pointer-events-none) 접근성 트리에서도 뺀다 —
// 선택 상태는 각 버튼의 aria-pressed가 알린다.
export function BookSelectRibbon() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 h-[49px] w-10 text-interactive-accent"
    >
      <svg
        className="absolute inset-x-0 top-0"
        width="40"
        height="47.4707"
        viewBox="0 0 40 47.4707"
        fill="none"
      >
        <path
          d="M0 2C0 0.89543 0.895431 0 2 0H38C39.1046 0 40 0.89543 40 2V45.4676C40 47.0222 38.3041 47.9824 36.971 47.1826L21.029 37.6174C20.3956 37.2374 19.6044 37.2374 18.971 37.6174L3.02899 47.1826C1.69594 47.9824 0 47.0222 0 45.4676V2Z"
          fill="currentColor"
        />
      </svg>
      <span className="absolute inset-x-0 top-[11px] text-center text-title-14bd text-text-inverse">
        선택
      </span>
    </span>
  )
}
