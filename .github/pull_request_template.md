## 요약

<!-- 변경 목적과 사용자/개발자 관점의 효과를 간단히 작성 -->

## 관련 이슈

<!-- 예: Closes #123 -->

## 변경 사항

-

## 검증

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`

## 체크리스트

- [ ] App Router 디렉토리 규칙 준수
- [ ] import 경로 규칙 준수: route-local은 상대경로, `_shared`/`_global`은 `@/`
- [ ] 배럴 파일(`index.ts`/`index.tsx`) 미사용
- [ ] default export 미사용 또는 Next 특수 파일 예외 확인
- [ ] feature 코드에서 `_apis` 직접 import 없음
