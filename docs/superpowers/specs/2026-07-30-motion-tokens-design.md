# 모션 토큰 디자인 시스템 + 오버레이 공통화

작성일: 2026-07-30
기준 브랜치: `origin/develop` (49e2212)

## 배경

바텀시트·모달·토스트가 이미 `app/_global/_components/`에 전역 컴포넌트로 있지만 두 가지가 새고 있다.

1. **모달 프리미티브가 둘로 갈려 있다.** `Dialog`는 base-ui(`@base-ui-components/react` 1.0.0-rc.0) 기반이고 `BottomSheet`·`LoginGateModal`은 손으로 만든 `fixed inset-0`이다. 손으로 만든 쪽은 포커스 트랩과 스크롤 락이 없다.
2. **모션 토큰이 없다.** `globals.css`의 `@theme static`에는 색과 타이포만 있다. `Dialog`만 등장/퇴장이 있고(`duration-200`·`scale-95` 하드코딩), `BottomSheet`·`Snackbar`·`LoginGateModal`·`TraceDetailOverlay`·`DecorationEditPopover`는 `return null`이라 툭 나타나고 툭 사라진다. `prefers-reduced-motion`은 `useQuoteCollapse` 한 곳에서만 대응한다.

## 목표

- duration·easing을 디자인 토큰으로 정의하고 Tailwind 유틸로 노출한다.
- 등장/퇴장 모션을 바텀시트·모달·토스트에 적용한다.
- 모달 프리미티브를 base-ui 하나로 수렴시킨다.
- `prefers-reduced-motion`을 토큰 레벨에서 한 번에 처리한다.
- 같은 성격의 오버레이(전체화면 상세, 팝오버, 스플래시)와 프레스 피드백에도 같은 토큰을 적용한다.

## 비목표

- 토스트 전역 Provider/큐 도입 (사용처 3곳이 각자 `message` state를 드는 현행 유지)
- 바텀시트 스와이프-다운 닫기
- 스켈레톤 `animate-pulse` 정리
- 라우트 전환 애니메이션
- `Snackbar`의 `absolute` 포지셔닝 변경

---

## 1. 토큰 설계

### Easing — `@theme static`

`--ease-*`는 Tailwind v4의 네이티브 테마 네임스페이스라 유틸이 자동 생성된다(컴파일 출력으로 확인).

```css
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1); /* 등장 — 빠르게 나와 부드럽게 안착 */
--ease-exit: cubic-bezier(0.4, 0, 1, 1); /* 퇴장 — 가속하며 사라짐 */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1); /* 상태 전환 — 색·투명도·프레스 */
```

→ `ease-enter` / `ease-exit` / `ease-standard`

오버슈트(스프링) 계열은 넣지 않는다. 이 앱 톤에 안 맞고, 쓰이지 않는 토큰은 다음 사람에게 고민만 남긴다.

### Duration — `:root`

`--duration-*`는 Tailwind 네임스페이스가 **아니다**(확인함 — `duration-normal` 유틸이 생성되지 않는다). `@theme`에 둘 이유가 없고, reduced-motion 오버라이드가 소스 순서로 확실히 이기도록 평범한 `:root`에 둔다.

```css
:root {
  --duration-instant: 120ms; /* 프레스 피드백, 색 전환 */
  --duration-fast: 180ms; /* 백드롭, 토스트, 팝오버 */
  --duration-normal: 240ms; /* 모달·바텀시트 등장 */
  --duration-slow: 350ms; /* 전체화면 전환 */
}
```

`--duration-slow: 350ms`는 임의값이 아니라 기존 `COLLAPSE_ANIMATION_MS = 350`을 흡수한 값이다. 흔적 접힘 화면은 시각적 변화 없이 상수만 토큰으로 갈아끼운다. `Dialog`의 기존 `duration-200`은 `normal`(240ms)이 되며 아주 약간 느려진다.

유틸은 `@utility`로 직접 정의한다. 빌트인 `duration-200`과 동일한 형태로 컴파일되고, `motion-safe:`·`data-ending-style:` 같은 variant도 정상 조합되는 것을 확인했다.

```css
@utility duration-instant {
  --tw-duration: var(--duration-instant);
  transition-duration: var(--duration-instant);
}
/* fast / normal / slow 동일 */
```

### reduced-motion 전역 정책

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 1ms;
    --duration-fast: 1ms;
    --duration-normal: 1ms;
    --duration-slow: 1ms;
  }
}
```

두 가지 제약이 따라온다.

- **모든 등장/퇴장은 `transition`으로 구현하고 `@keyframes` / `animate-*`는 쓰지 않는다.** keyframes는 duration이 애니메이션 선언에 박혀 있어 변수 하나로 무력화되지 않는다. (기존 `animate-pulse` 스켈레톤은 비목표라 그대로 둔다.)
- **`0ms`가 아니라 `1ms`다.** base-ui가 퇴장 완료를 전환 종료로 판정하므로 0이면 판정이 걸리지 않는다.

### JS에서 쓰는 값

`useExitTransition`은 언마운트 타이밍을 알아야 하고, `useQuoteCollapse`는 rAF로 350ms를 센다. happy-dom/jsdom에서는 CSS 전환이 실제로 돌지 않아 `transitionend`가 오지 않으므로, 훅은 `transitionend`가 아니라 **`setTimeout(durationMs)` 기반**으로 만든다.

`app/_global/_data/motion.constant.ts`에 같은 숫자를 TS 상수로 두고, **`globals.css`를 읽어 파싱한 값과 TS 상수가 일치하는지 검사하는 spec**을 하나 단다. 두 곳이 조용히 어긋나는 것을 막는 용도다(`widthTiming.constant.ts`가 이미 같은 걱정을 하고 있다).

---

## 2. 프리미티브

| 이름                                  | 위치                                      | 역할                                                                                                                                         |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `useExitTransition(open, durationMs)` | `app/_global/_hooks/useExitTransition.ts` | base-ui를 쓰지 않는 것들의 마운트 수명 관리. `{ shouldRender, state: 'entering' \| 'open' \| 'exiting' }` 반환 → `data-state`로 CSS에 넘긴다 |
| `useLastPresent(value)`               | `app/_global/_hooks/useLastPresent.ts`    | 퇴장 애니메이션 도중 마지막 값 유지. 지금은 `message`가 `''`이 되는 순간 글자가 사라진다                                                     |
| `@utility press`                      | `app/globals.css`                         | `&:active { scale: 0.97 }` + `duration-instant ease-standard`                                                                                |

훅을 둘로 나눈 이유는 책임이 다르고 필요한 곳이 겹치지 않기 때문이다. base-ui 계열은 수명 관리를 라이브러리가 하므로 `useLastPresent`만 쓰고, `Snackbar`만 둘 다 쓴다.

`useExitTransition`의 `state` 전이는 이렇게 정한다.

- `open`이 `true`가 되면 그 렌더에서는 `'entering'`(등장 전 스타일 — 예: `translate-y-full`)을 내보내고, 다음 프레임(`requestAnimationFrame`)에 `'open'`으로 바꾼다. 마운트와 동시에 최종 스타일을 주면 브라우저가 전환을 시작할 시작점을 못 잡는다.
- `open`이 `false`가 되면 `'exiting'`으로 바꾸고 `durationMs` 뒤에 `shouldRender`를 `false`로 내린다.
- 전환 도중 `open`이 다시 뒤집히면 대기 중인 타이머/rAF를 취소하고 새 방향으로 간다.

---

## 3. 컴포넌트별 적용

| 대상                    | 방식                                                                                 | 모션                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Dialog`                | 토큰 교체만                                                                          | 등장 `normal`+`ease-enter`, 퇴장 `fast`+`ease-exit`, 기존 `scale-95` 유지                                    |
| `BottomSheet`           | base-ui Dialog로 내부 재작성, public props(`open`·`title`·`onClose`·`children`) 불변 | 패널 `translate-y-full`→0 `normal`, 백드롭 opacity `fast`                                                    |
| `LoginGateModal`        | `Dialog` 조합으로 재작성 + `useLastPresent`                                          | `Dialog`와 동일                                                                                              |
| `Snackbar`              | `useExitTransition` + `useLastPresent`, 호출부 무변경                                | `translate-y-2`+opacity, `fast`                                                                              |
| `TraceDetailOverlay`    | `useExitTransition`, 호출부(`TraceCollapseView`)에서 `useLastPresent(selectedTrace)` | 아래→위 슬라이드, `slow`                                                                                     |
| `DecorationEditPopover` | `useExitTransition`                                                                  | scale .96+opacity, `fast`, `origin-bottom` (꼬리가 아래를 가리키고 팝오버는 대상 위에 뜬다)                  |
| `SplashProvider`        | `useExitTransition`                                                                  | 페이드아웃만, `normal`                                                                                       |
| `useQuoteCollapse`      | 상수만 토큰으로                                                                      | 350ms 그대로 — 시각 변화 없음                                                                                |
| 프레스 피드백           | `press` 유틸 부착                                                                    | `Button`·`TabBar`·`SegmentedControl`·`SourceOption`·`BookItem` + `CameraCheck`의 임시 `active:scale-95` 교체 |
| `transition-colors` 3곳 | duration·easing 명시                                                                 | `SearchTextfield`·`Textarea`·`SegmentedControl`에 `duration-instant ease-standard`                           |

방향별 duration 분기는 base-ui가 붙이는 속성을 variant로 받아 건다: `data-ending-style:duration-fast data-ending-style:ease-exit`.

`BottomSheet`의 홈 인디케이터 대응(`paddingBottom: max(1rem, env(safe-area-inset-bottom))`)은 base-ui `Popup`으로 옮기며 그대로 유지한다.

---

## 4. base-ui 포팅이 끌고 오는 변화

1. **`BottomSheet`가 포털로 나간다.** body 끝에 렌더되므로 현재 `z-20`이 의미를 잃는다. `Dialog`와 같은 `z-50`으로 맞춘다. `LoginGateModal`도 `z-30`→`z-50`이 되지만, 위에 떠야 할 대상인 `TraceDetailOverlay`가 포털을 쓰지 않는 인페이지 `z-20`이라 순서는 유지된다.
2. **포커스 트랩·스크롤 락이 새로 생긴다.** 지금 `BottomSheet`는 Esc만 직접 처리하고 둘 다 없다. 개선이지만 동작 변화이므로 실기기 확인이 필요하다.
3. **`LoginGateProvider`가 조건부 렌더를 그만둔다.** `{gate.gateMessage !== null && <LoginGateModal/>}` → 항상 렌더하고 `open`으로 제어한다. "열림 여부를 따로 두지 않고 문구 하나로 표현한다"는 기존 설계 의도는 유지되고, 퇴장 중 문구만 `useLastPresent`가 붙든다.
4. **`BottomSheet`의 `<button aria-label="배경 닫기">`가 사라진다.** base-ui `Backdrop`으로 대체된다. 이 버튼을 쿼리하는 테스트는 없고, 배경 탭으로 닫는 동작은 base-ui 기본값으로 유지된다.

---

## 5. 테스트 전략

기존 25파일 158테스트는 모두 통과 상태를 유지한다.

**기존 테스트에 대한 판단**

`bottomSheet.spec`의 4개 케이스(`open={false}` 미렌더 / `role=dialog` / 닫기 버튼 / Escape)는 base-ui가 모두 만족시킨다. `Dialog.spec.tsx`가 이미 happy-dom에서 base-ui Dialog를 띄우고 닫으므로 환경 리스크도 확인된 상태다. 실제로 통과하는지는 구현 중 확인한다.

**추가할 테스트**

- `useExitTransition` — `open`이 `false`가 된 뒤 `durationMs` 동안 `shouldRender`가 유지되고 `state`가 `'exiting'`인지, 타이머 만료 후 언마운트되는지 (fake timers)
- `useLastPresent` — `null`이 들어와도 직전 값을 유지하는지
- 토큰 parity — `globals.css`에서 파싱한 duration 값과 `motion.constant.ts`가 일치하는지
- `Snackbar` — `message`가 `''`이 되어도 즉시 사라지지 않고 퇴장 상태를 거치는지, 그동안 문구가 유지되는지
- `BottomSheet` — 배경(backdrop) 탭으로 닫히는지

`BottomSheet.stories.tsx`와 `Snackbar.stories.tsx`는 포팅 후 동작하는지 확인하고, 필요하면 등장/퇴장을 눈으로 볼 수 있게 토글 스토리를 보강한다.

---

## 6. 문서화

`AGENTS.md`에 "모션" 섹션을 추가한다. 담을 내용:

- duration·easing 토큰 목록과 각 단계의 용도
- **화면 코드에서 `duration-[200ms]` 같은 임의값을 쓰지 않는다** — 토큰 유틸만 쓴다
- `@keyframes` / `animate-*`를 쓰지 않는 이유(reduced-motion 정책이 깨진다)
- 모달·바텀시트는 `Dialog` / `BottomSheet`를 쓰고 `fixed inset-0`을 새로 만들지 않는다
- 그 외 등장/퇴장은 `useExitTransition`을 쓴다

---

## 7. 머지 조정 노트

이 작업은 `origin/develop` 기준이라 PR #84(safe-area 인셋을 레이아웃 셸에서 일괄 처리)가 포함되어 있지 않다. #84는 "화면 코드에서 `env(safe-area-inset-*)`를 직접 쓰지 않는다"는 규칙을 세우는데, `BottomSheet`와 `OcrQuoteSheet`가 `env(safe-area-inset-bottom)`을 직접 쓰고 있다.

이 스펙에서는 그 값을 **그대로 옮기기만 한다**. #84가 먼저 머지되면 후속 작업으로 `--safe-bottom` 토큰을 추가하고 두 곳을 교체한다. 여기서 미리 처리하면 #84와 충돌한다.

---

## 8. 검증

- `pnpm lint && pnpm typecheck && pnpm test`
- Storybook에서 `BottomSheet`·`Dialog`·`Snackbar` 등장/퇴장 육안 확인
- OS 접근성 설정에서 "동작 줄이기"를 켠 상태로 모션이 죽는지 확인
- 웹뷰 확인은 `pnpm build && pnpm start` (프로덕션) — `next dev`는 WKWebView에서 하이드레이션되지 않는다
