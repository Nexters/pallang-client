# 모임(교환독서) 기능 설계

**대상:** 모임 탭(목록·빈 상태) · 모임 만들기 · 방 설정 변경 · 더보기(초대 링크 보내기·방 설정 변경하기) · 모임 스코프 흔적 보기/남기기.
**근거:** Figma `4ffaEtjCoV2r2P2ZCVLOls` "모임 초대" 섹션(타이틀 `3308:23056`) 13프레임 + 서버 `group` API(dev 스웨거) + 서버 PR Nexters/pallang-server#134(흔적/의견에 `groupId` 스코프, **미배포**).

## 1. 용어·이름

| 화면 용어 | API                     | 코드                                                                                                                                                              |
| --------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 모임      | `group` (`/api/groups`) | 데이터 레이어는 API 이름(`group.queries.ts`, `groupQueries`), 라우트·컴포넌트는 화면 용어(`/meeting`, `Meeting*`) — 흔적(`trace`) ↔ `opinion/passage` 선례와 같다 |
| 모임장    | `HOST`                  | `hostUserId === me.userId`                                                                                                                                        |
| 초대 링크 | `inviteCode`            | `/meeting/invite/{inviteCode}` (이번 PR에 라우트는 만들지 않는다 — URL 형식만 고정)                                                                               |

## 2. 화면 ↔ 라우트 ↔ API

```
/meeting                         탭 · 목록/빈 상태         GET /api/groups (무한, size 20)
  ├ [+] / [모임 만들기] ──▶ /meeting/new                   POST /api/groups
  ├ 카드 [···] ──▶ 더보기 시트
  │     ├ 초대 링크 보내기  GET /api/groups/{id}/invite-link → navigator.share → 클립보드 폴백
  │     └ 방 설정 변경하기 ──▶ /meeting/{id}/edit          GET /api/groups/{id} · PATCH /api/groups/{id}
  └ 카드 [보러가기] ──▶ /trace/{bookId}?groupId={id}        흔적 보기(모임 배지) — passages 조회에 groupId
        └ [+] ──▶ /trace/new?…&groupId={id}                흔적 남기기 — similar-check·POST /api/opinions에 groupId
```

- 목록 카드 아바타: `GET /api/groups/{id}/members?page=0&size=5` (카드마다 1회, 요약 응답에 멤버 프로필이 없어서).
- 초대 랜딩(`previewInvitation`/`joinGroup`)·모임 삭제·나가기·초대 링크 재발급은 **이번 범위 밖**(시안 없음).

## 3. 스펙 충돌과 결정 (SSoT)

| #   | 충돌                                                                      | 결정                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 기간: Figma 별표 없음·기간 없이 CTA 활성 / API `startDate`·`endDate` 필수 | **FE도 필수.** 별표 붙이고 CTA 조건에 포함. 피커 시안이 없어 바텀시트에 시작일/종료일 네이티브 `input[type=date]` 2칸. 필드 표시 `2026.08.19 ~ 2026.09.19`. 디자이너에게 피커 프레임 요청 |
| 2   | 초대 링크 보내기(카카오 아이콘) / 공유·카카오 SDK 인프라 없음             | `navigator.share` → 실패·미지원 시 클립보드 복사 + 스낵바. 아이콘은 시안의 카카오톡 앱 아이콘 PNG 유지. 카카오 SDK 공유는 후속                                                            |
| 3   | 초대 랜딩 시안 없음                                                       | 이번 제외. 공유 URL은 `/meeting/invite/{code}`로 고정                                                                                                                                     |
| 4   | 서버 PR 134 미배포                                                        | FE 배선은 지금 한다. 생성 타입에 `groupId`가 없으므로 `_queries`/`_apis` 래퍼에서 타입을 넓히고, 배포 후 `pnpm api:gen`으로 정리                                                          |
| 5   | 책 선택 시트 제목 `책 선택하기`(28250) vs `책 등록하기`(28387)            | 모임은 `책 선택하기`. 28387은 흔적 시트 복제본(stale). 시트는 `title` prop                                                                                                                |
| 6   | 선택 표시: Figma 리본 "선택" / 코드 `ring-2`                              | 리본으로 바꾼다 — 흔적 ③ 시안(3140:19070)도 리본이라 공용 변경이 맞다                                                                                                                     |
| 7   | CTA disabled: Figma 오렌지 40% / Button 기본 회색                         | 모임 폼·책 선택 시트 CTA는 `disabled:bg-interactive-accent disabled:opacity-40` 오버라이드(CommentBar 선례)                                                                               |
| 8   | 타이포 토큰 불일치(24/1.2, 12/1.2, 14/1.3)                                | 새 토큰 만들지 않고 가장 가까운 토큰(`text-title-24bd`, `text-caption-12rg`, `text-body-14md`) — 프로젝트 확정 규칙                                                                       |
| 9   | 아바타 20 vs 22 · z순서                                                   | 20px, 오른쪽이 위(`+N`이 가려지면 안 된다). 최대 5 + `+N`(N = memberCount − 5)                                                                                                            |
| 10  | 목록 상단 여백 16 vs 12                                                   | 16(다수결)                                                                                                                                                                                |
| 11  | BottomSheet 모서리 32 vs 공용 24                                          | 공용 컴포넌트 기본값 유지                                                                                                                                                                 |
| 12  | 비로그인 모임 탭(시안 없음, GET 401)                                      | 빈 상태 화면을 그대로 보여주고 CTA/+는 로그인 게이트(`LOGIN_GATE_MESSAGE.groupCreate`)                                                                                                    |
| 13  | 목록 요약에 `hostUserId` 없음 → 멤버/모임장 구분 불가                     | 더보기 타일은 모두에게 보이고, 서버 403이면 스낵바 `모임장만 할 수 있어요.` 백엔드에 요약 응답 `hostUserId` 추가 요청(후속에서 비모임장 `···` 숨김)                                       |
| 14  | 흔적 보기 비모임 최신 시안(주황 배경·페이저) 미반영                       | 이번 범위 밖. 모임 변형 차이는 헤더 배지뿐                                                                                                                                                |
| 15  | 종료된 모임(`ended`) 배지 시안 없음                                       | 표시하지 않는다                                                                                                                                                                           |

## 4. 구조

```
app/_global/_queries/group.queries.ts            groupQueries{all,list,detail,members,inviteLink} · groupMutations{create,update}
app/_global/_apis/passage.api.ts                 getPassagesByPageScoped(bookId,page,groupId) — 생성 함수에 params가 없어 임시 래퍼
app/_global/_data/loginGate.constant.ts          LOGIN_GATE_MESSAGE.groupCreate

app/_shared/book/_data/selectedBook.model.ts     SelectedBook (trace/new에서 이동)
app/_shared/book/_components/{BookSearchSheet,BookSearchView,BookPickList,BookCoverCarousel,ExternalBookList,SelectedBookCard}
                                                 trace/new에서 승격. BookSearchSheet: title·onRegisterBack prop / SelectedBookCard: onEdit optional / BookPickList: 리본
app/_shared/trace/_data/traceTarget.model.ts     groupId(parseTraceGroupId · buildTraceHref · buildTraceTargetHref options)
app/_shared/trace/_data/traceSeed.model.ts       TraceSeed.groupId

app/(app)/meeting/
  page.tsx · new/page.tsx · [id]/edit/page.tsx
  _components/ MeetingPageView · MeetingEmptyState · MeetingList · MeetingListSkeleton · MeetingCard · MeetingMemberAvatars
               MeetingMoreSheet · MeetingForm · MeetingField · MeetingCapacityField · MeetingBookField · MeetingPeriodField · MeetingPeriodSheet
               MeetingCreateView · MeetingEditBoundary · MeetingEditView
  _hooks/      useInviteShare
  _services/   meetingForm.service · meetingDate.service · meetingNotice.service · inviteLink.service
  _data/       meeting.constant
  _types/      meetingForm.type
  _tests/

app/(app)/trace/[id]/  TracePrefetchBoundary·tracePrefetch.service·TraceCollapseView·usePassageViewer·QuoteStage·TraceHeader(배지)·useTraceCreateNav — groupId 배선
app/(app)/trace/new/   TraceSourceView(씨앗→draft.groupId)·traceDraft(type/store)·useTraceSubmit·useSimilarPassageCheck·similarCheck.service·TraceBookForm(책 잠금)·TraceDoneView(복귀 href)
```

## 5. 상태/인터랙션 합의

- **목록**: loading → 카드 골격 2장(셸·헤더 유지) / error → `ApiErrorFeedbackState` / 비로그인·0건 → 빈 상태(헤더에 `+` 없음) / 1건+ → 카드 + 헤더 `+`. 무한 스크롤(`useLoadMoreOnVisible`).
- **생성/수정 완료 알림**: sessionStorage 플래그(`meetingNotice.service`) → `/meeting` 마운트 시 1회 스낵바(`모임이 성공적으로 만들어졌어요!` / `모임 수정이 완료되었어요.`), `tone="light"`.
- **폼 CTA 활성**: 모임명 1~~15자(trim) ∧ 책 선택 ∧ 인원 2~~10 ∧ 기간(시작·종료 모두, 시작 ≤ 종료). 수정 폼은 초기값으로 바로 활성, 인원 옵션은 `memberCount` 미만 비활성(서버 409 방지).
- **폼 에러 스낵바**: 400 `입력한 정보를 다시 확인해주세요.` / 404(BOOK) `선택한 책을 찾을 수 없어요.` / 403 `모임장만 수정할 수 있어요.` / 409 `현재 참여 인원보다 적게 줄일 수 없어요.` / 그 외 `모임을 만들지 못했어요. 잠시 후 다시 시도해주세요.`·`모임을 수정하지 못했어요. 잠시 후 다시 시도해주세요.` 401 → `runWithLogin`.
- **책 선택 시트**: 풀하이트 BottomSheet(흔적 ③과 같은 컴포넌트), 후보 탭 → 리본 → `등록하기`로 확정. 시트·내부 등록 폼 열림 중 하드웨어 back은 화면을 떠나지 않고 그 층만 닫는다(`useHardwareBackRegistry().register`).
- **기간 시트**: 시작일/종료일 `input[type=date]`, 종료 < 시작이면 `종료일은 시작일보다 빠를 수 없어요.` + 확인 비활성. 확인 → 필드에 `YYYY.MM.DD ~ YYYY.MM.DD`.
- **더보기 시트**: 초대 링크 보내기(로딩 중 타일 비활성) → `navigator.share` 성공: 스낵바 없음 / 취소: 없음 / 복사: `초대 링크를 복사했어요.` / 실패: `초대 링크를 공유하지 못했어요. 잠시 후 다시 시도해주세요.` / 403: `모임장만 초대 링크를 보낼 수 있어요.` 방 설정 변경하기 → `/meeting/{id}/edit`.
- **보러가기**: `/trace/{bookId}?groupId={id}` — 헤더에 `모임` 배지, 대목 조회에 `groupId`, `+`로 흔적 남기기에 `groupId`가 따라간다(책 단계는 책 고정·편집 없음). 완료 화면의 "흔적 확인하러 가기"도 같은 스코프로 돌아간다.

## 6. 디자인 공백 → 디자이너 요청 목록

기간 피커 · 인원 드롭다운 열림 · 초대 랜딩 · 비로그인 모임 탭 · 로딩/에러 · 종료된 모임 배지 · 멤버 전용 더보기 · 긴 제목 말줄임 규칙 · 카카오 공유 템플릿.

## 7. 검증

- 단위/통합 spec(각 태스크) + `pnpm lint && pnpm typecheck && pnpm test`(Node 22).
- 화면 완성 직후 Figma 스크린샷(`scratchpad/figma/*.png`) 대비 시각 확인(브라우저 375px).
