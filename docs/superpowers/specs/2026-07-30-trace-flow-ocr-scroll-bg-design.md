# 흔적 남기기 플로우: OCR 인식 표시 + TraceNote 스크롤 + 배경 일관성 — 설계

> Figma: 2295:5842 (흔적 남기기 편집 스텝, 배경/노트 구조의 기준)
> 라우트: `app/trace/new/`
> 관련 스펙: `docs/superpowers/specs/2026-07-27-trace-create-flow-design.md`

## 범위

1. **OCR 인식 중 UI** — 사진은 떴지만 글자 인식이 진행 중인 구간을 딤 + 스캔 라인으로 표시
2. **TraceNote 스크롤** — 320px 고정 높이를 넘치면 잘리던 것을 스크롤로. decorate(꾸미기) 화면에서는 드래그 선택과 공존하도록 드래그 중 가장자리 자동 스크롤 추가
3. **배경 일관성** — 스텝 3화면(detail·decorate·opinion)의 배경 구조를 Figma 기준(decorate 패턴)으로 통일

제외: 새 아이콘 추가, OCR API/응답 형식 변경, 인용문 최대 길이(150자) 변경.

## 결정 사항

| 항목                   | 결정                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| OCR 로딩 표현          | 딤(반투명) + 위→아래 반복 스캔 라인 + "글자를 읽고 있어요" 문구. `role="status"`, reduced-motion 대응          |
| OCR 로딩 조건          | `imageUrl && ocr.isPending && !failure` — `useMutation`의 `isPending` 사용                                     |
| 스캔 애니메이션        | `globals.css`에 `@keyframes scan` 최초 추가 (앱에 커스텀 keyframe 없음). accent 그라데이션 라인                |
| 스크롤 방식            | 320px 고정 유지, `overflow-hidden` → `overflow-y-auto`. 짧으면 중앙정렬, 길면 위부터 스크롤                    |
| 중앙정렬 유지          | flex+overflow 상단 잘림 회피 위해 내부 `min-h-full` 래퍼 패턴 사용                                             |
| 가로 오버플로          | 동그라미 효과 bleed 보존 위해 `overflow-x-hidden` + 기존 음수마진/패딩 유지                                    |
| decorate 오버플로 선택 | 드래그 중 노트 위/아래 가장자리(~40px) 진입 시 그 방향 자동 스크롤 + 포인터 밑 offset 재계산                   |
| 자동 스크롤 로직       | 가장자리 판정·스크롤 속도(px/frame)는 순수 함수로 분리해 유닛 테스트. rAF 루프로 구동                          |
| 배경 기준              | Figma 2295:5842 = decorate 패턴이 정답. detail·opinion을 여기에 맞춤                                           |
| 배경 토큰              | 헤더/노트영역 밝은 배경 `bg-bg-alternative`(#F7F7F8) → `bg-bg-default`(#FFFFFF, Figma `Background/Background`) |

## 배경 구조 (3화면 공통 목표)

Figma 2295:5842 기준: 화면 위쪽(헤더 + 노트 상단 ~121px)은 밝은 배경, 노트 카드가 밝음/어둠 경계를 가로지르고, 노트 하단 199px부터 아래로 `bg-bg-dark`.

```
<div className="relative flex flex-1 flex-col bg-bg-dark">
  <div className="bg-bg-default">
    <TraceStepHeader step={N} title={...} />
  </div>
  <div className="relative bg-bg-default px-8">
    <div aria-hidden className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
    <TraceNote ... />                {/* decorate만 ref/DecorationEditPopover 추가 */}
  </div>
  {/* 이하 스텝별 콘텐츠는 bg-bg-dark 위 */}
</div>
```

- **decorate(2/3)**: 이미 이 구조 (변경 없음, 기준). `noteRef` + `DecorationEditPopover` 유지.
- **detail(1/3)·opinion(3/3)**: 현재 `bg-bg-alternative pb-6` 헤더 + `-mt-4 px-8` 노트(완전 다크에 얹음) → 위 구조로 교체. `-mt-4` 제거, 다크 밴드 추가.
- 노트 아래 콘텐츠 간격(pt)은 Figma 값(약 24px)에 맞춰 구현 시 확인.

## OCR 스캔 오버레이

- **신규 컴포넌트** `OcrScanningOverlay` (`app/trace/new/_components/OcrScanningOverlay/`). named export.
- `OcrSelector`의 사진 스테이지 브랜치에서 스테이지를 `relative` 래퍼로 감싸고 오버레이를 절대 위치 형제로 렌더.
- 구성: 반투명 딤 레이어 + 스캔 라인(`animate-[scan_...]` 또는 클래스) + 문구 `<p role="status">글자를 읽고 있어요</p>` (`text-text-inverse`).
- `prefers-reduced-motion: reduce`이면 라인 애니메이션 정지, 딤 + 문구만.
- 다시 찍기(retake) 시에도 `ocr.isPending`이 다시 true가 되므로 자동 재적용.

## TraceNote 변경

```
현재: max-h/min-h-[320px] + overflow-hidden + items-center justify-center
목표: max-h/min-h-[320px] + overflow-y-auto overflow-x-hidden
      내부에 min-h-full 래퍼로 중앙정렬(짧을 때) / 위부터 스크롤(길 때)
```

- 동그라미 효과 bleed용 `-mx-4 -my-3 h-[calc(100%+1.5rem)] px-4 py-3`(inner `<p>`)는 유지하되 스크롤 컨테이너와의 상호작용(가로 클리핑) 확인.
- 사용처 3곳 모두 스크롤 적용. `selectable`(decorate)만 자동 스크롤 훅 연결.

## decorate 자동 스크롤

- **신규 서비스** `noteAutoScroll.service.ts`: 순수 함수. 입력(포인터 Y, 컨테이너 top/height, 임계값) → 스크롤 방향·속도(0이면 스크롤 안 함) 반환. 유닛 테스트 대상.
- **훅 연결**: 기존 `useTextRangeSelection`의 `onPointerMove`에서 마지막 포인터 위치를 저장하고, 가장자리면 rAF 루프 시작 → 매 프레임 `scrollTop` 조정 + 저장된 포인터 위치로 offset 재계산해 `onChange(normalizeRange(...))` 호출. pointerup/cancel 또는 가장자리 이탈 시 루프 정지.
- `touch-none`은 유지(드래그=선택). 자동 스크롤이 오버플로 도달을 담당.

## 컴포넌트/파일

| 이름                               | 역할                                                  |
| ---------------------------------- | ----------------------------------------------------- |
| `OcrScanningOverlay` (신규)        | OCR 인식 중 딤 + 스캔 라인 + 문구 오버레이            |
| `noteAutoScroll.service.ts` (신규) | 드래그 가장자리 → 스크롤 방향/속도 순수 계산 (테스트) |
| `TraceNote.tsx`                    | 고정 높이 + 스크롤로 전환, 중앙정렬 래퍼              |
| `OcrSelector.tsx`                  | 스테이지 래핑 + 오버레이 렌더 (`ocr.isPending`)       |
| `useTextRangeSelection.ts`         | 자동 스크롤 rAF 루프 연동 (decorate 오버플로 선택)    |
| `TraceDetailForm.tsx`              | 배경 구조를 decorate 패턴으로 통일                    |
| `TraceOpinionForm.tsx`             | 배경 구조를 decorate 패턴으로 통일                    |
| `globals.css`                      | `@keyframes scan` 추가                                |

## 테스트

- `noteAutoScroll.service.ts` 유닛 테스트: 가장자리 위/아래/중앙, 임계값 경계에서 방향·속도.
- 기존 테스트 회귀 확인(`pnpm lint && pnpm typecheck && pnpm test`).
- 수동 검증: OCR 로딩 표시, 긴 인용문 스크롤(3화면), decorate에서 넘친 줄 드래그 선택, 3화면 배경 일치. 웹뷰 검증은 `pnpm build && pnpm start`.

## 리스크

- flex + `overflow-y-auto` + 중앙정렬 상단 잘림 → `min-h-full` 래퍼로 회피.
- `overflow-y-auto`가 가로축도 auto로 승격시켜 동그라미 bleed가 잘리거나 가로 스크롤 유발 → `overflow-x-hidden` 명시 + 패딩 확보.
- 자동 스크롤 중 `elementFromPoint` 재계산 타이밍(스크롤 반영 후 읽기) 주의.
