# 온보딩 (첫 실행 4단계 안내) 설계

- 날짜: 2026-08-15
- Figma: 수미 작업 공간 `202:5031`(375 기준) / `202:5337`(530 반응형 가이드) 계열 9개 노드
- 상태: 사용자 승인 완료

## 목표

로그인 전 앱/웹 **첫 실행 시 1회**, 서비스 핵심 가치를 소개하는 4단계 온보딩을 보여준다.

1. 인사 — "안녕하세요. 밤샘 낭독가님, 교환 독서를 즐기러 오셨군요!" (시안 문구 그대로 고정, 닉네임 치환 없음)
2. 사진으로 문장 발췌(카메라 OCR) 소개
3. 읽은 만큼 의견 보기(스포일러 방지) 소개
4. "그렇다면 교환독서를 하러 가볼까요?" + 시작하기(오렌지 CTA)

1–3단계는 건너뛰기(텍스트) + 다음(다크 버튼), 4단계는 시작하기 버튼 하나.

## 첫 실행 감지 & 저장

- 로그인 전이므로 서버 저장 불가 → `localStorage` 플래그(`pallang:onboarding-seen`)로 기기당 1회 판정.
- Capacitor 앱은 원격 URL을 로드하므로 웹뷰 localStorage가 유지된다.
- localStorage 접근 불가 환경(프라이빗 모드 등)에서는 '본 것'으로 간주 — 매 진입마다 뜨는 것을 막는다.
- 판정/저장은 홈·온보딩 두 route가 쓰므로 `app/_shared/onboarding/_services/onboardingSeen.service.ts`.

## 진입 흐름

- 홈(`/`) 진입 시 클라이언트 effect에서 플래그 확인 → 미노출이면 `router.replace('/onboarding')`.
  이 시점엔 `SplashProvider` 스플래시(최소 1초, z-50)가 화면을 덮고 있어 홈이 비쳐 보이지 않는다.
- 딥링크 진입은 가로채지 않는다 — 홈에서만 체크.
- `/onboarding` 직접 진입은 그냥 렌더(재진입 무해).
- 완료·건너뛰기 시 플래그 저장 후 `router.replace('/')`.
- Android 하드웨어 back: 2단계 이후는 이전 단계로, 1단계에서는 안드로이드 관례대로 앱 종료
  (홈을 replace로 떠나온 뒤라 되돌아갈 화면이 없다).

## 화면 구조

- `app/(app)/onboarding/page.tsx` + `_components/OnboardingView` — 4단계는 내부 step 상태로 전환.
- 단계 문구·일러스트는 `_data/onboarding.constant.ts`에 상수로 분리.
- 레이아웃은 `sign-up/welcome` 패턴: 상단 44px 스페이서 / 300px 텍스트 블록(24px bold 타이틀 + 18px 서브)
  / flex-1 중앙 일러스트 / 하단 버튼 컨테이너(p-4). 풀블리드(`-mt-(--safe-top)` + `pt-(--safe-top)`).
- 반응형(375→530)은 셸 `max-w-132.5`(=530px)와 flex 비율이 흡수 — 별도 분기 없음.
- 버튼은 `_components/Button` 재사용: 다음 = `default`(#333), 시작하기 = `activated`(#ef5a06), 높이 54px.
- 일러스트 4종은 Figma 3x export → `public/images/onboarding/*.png`, `next/image` 로드.
  4장을 모두 렌더하고 현재 단계만 표시해 단계 전환 시 로딩 깜빡임을 없앤다.

## 테스트

- `onboardingSeen.service`: 초기값 false, mark 후 true.
- 홈 게이트 훅: 미노출이면 `/onboarding`으로 replace, 노출 완료면 유지.
- 온보딩 뷰: 다음으로 단계 진행, 건너뛰기/시작하기 시 플래그 저장 + 홈 이동.
