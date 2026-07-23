# TanStack Query 상세 규칙

이 문서는 `pallang-client`의 TanStack Query/API 레이어 작업 시 따른다. 파일 위치, 네이밍, export 규칙은 항상 `AGENTS.md`를 우선한다.

## 파일 역할

- API 호출 함수는 `app/_global/_apis/*.api.ts`에 둔다.
- 서버 상태 옵션은 `app/_global/_queries/*.queries.ts`에 둔다.
- feature 코드에서는 `_apis`를 직접 import하지 않고 `_queries`의 queryOptions/mutationOptions를 사용한다.
- `index.ts` 배럴 파일은 만들지 않는다. 항상 실제 파일 경로로 import한다.

## API 패턴

- `_apis/*.api.ts`는 HTTP 호출만 담당한다.
- 적절한 API client 또는 fetch helper가 있다면 기존 파일을 먼저 읽고 같은 방식을 따른다.
- query string 생성 helper가 있다면 직접 문자열 조합보다 helper를 우선 사용한다.
- 응답 반환 방식은 같은 도메인 또는 주변 API 파일의 패턴을 따른다.
- path parameter는 필요하면 `encodeURIComponent` 등으로 안전하게 처리한다.

## DTO/타입 패턴

- 타입은 `type` 별칭을 사용한다.
- request params, payload, response, list item 타입은 역할이 드러나게 이름 짓는다.
- 공통 response wrapper 또는 pagination 타입이 있으면 새로 만들지 않고 재사용한다.
- 단일 도메인의 payload/response 타입은 함께 둘 수 있지만, store/model/constant는 `_data/`에서 파일 단위로 분리한다.

## Query 패턴

- `_queries/*.queries.ts`는 `queryKey`와 `queryOptions`를 정의한다.
- HTTP 호출은 `_apis/*.api.ts` 함수로만 위임한다.
- query key factory는 기존 도메인 스타일을 우선한다.
- 기본 key 스타일은 `all`에서 출발해 list/detail 등으로 확장한다.

```ts
export const exampleQueries = {
  all: () => ['example'] as const,
  list: () =>
    queryOptions({
      queryKey: [...exampleQueries.all(), 'list'],
      queryFn: fetchExamples,
    }),
}
```

## 옵션 사용 기준

- optional id나 params가 있으면 `enabled` guard 필요 여부를 검토한다.
- `select`, `meta`, `staleTime`, `gcTime`은 consumer 요구가 있을 때만 추가한다.
- 같은 query를 서버 prefetch와 클라이언트 `useQuery`에서 공유할 수 있게 queryOptions를 재사용한다.

## Mutation

- mutation HTTP 함수는 `app/_global/_apis/*.api.ts`에 둔다.
- mutation options는 `app/_global/_queries/*.queries.ts`에 `mutationOptions`로 정의한다.
- mutation export는 query export와 분리한다. 예: `exampleQueries`, `exampleMutations`.
- `_queries` 파일에서는 `useMutation`을 호출하지 않는다.
- invalidation, optimistic update, toast, navigation 같은 side effect는 사용부 또는 route-local hook에서 처리한다.
- mutation 성공 후 invalidate할 queryKey는 `_queries`의 key factory를 사용한다.

```ts
export const exampleMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...exampleQueries.all(), 'create'],
      mutationFn: createExample,
    }),
}
```

## 작업 순서

1. 관련 도메인의 기존 `_apis`/`_queries` 파일을 먼저 읽는다.
2. 새 API 호출 함수는 `_apis/*.api.ts`에 추가한다.
3. 조회 queryOptions는 `_queries/*.queries.ts`에 추가한다.
4. 변경 mutationOptions는 `_queries/*.queries.ts`에 추가한다.
5. 사용부에서는 `useQuery(exampleQueries.list())` 또는 `useMutation(exampleMutations.create())` 형태로 호출한다.
6. 변경 후 `pnpm lint && pnpm typecheck && pnpm test`로 검증한다.
