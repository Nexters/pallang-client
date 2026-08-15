import type { TraceDraft } from '../_types/traceDraft.type'

/**
 * 흔적 보기의 '의견 남기기'가 대목을 통째로 물고 들어온 초안인지.
 *
 * 이 초안에는 대목·페이지·스포일러·꾸밈·합칠 대목이 이미 다 들어 있어 사용자가 정할 것이
 * 의견 하나뿐이다. 그래서 ①(생각 작성)이 곧 마지막 화면이 되고 ②·③을 건너뛴다.
 *
 * **`passageId !== null`로는 가를 수 없다.** 일반 경로에서도 ③의 합치기 다이얼로그에서
 * '합치기'를 고르면 `passageId`가 채워지고, 거기서 ①로 되돌아오면 두 경로가 구분되지 않는다.
 * 그래서 대목의 출처(`source`)를 근거로 삼는다 — 초안이 대목을 어디서 얻었는지는 씨앗을
 * 소비하는 순간에만 알 수 있는 사실이고, 이후 어떤 화면도 그 값을 되돌려 쓰지 않는다.
 *
 * 꾸밈과 페이지까지 함께 보는 이유는 두 가지다. 서버가 꾸밈을 최소 하나 요구하므로(`createOpinion`)
 * 꾸밈이 비면 ①에서 저장할 수 없고 — URL을 손으로 고쳐 `deco`를 지우면 그렇게 된다 — 그때는
 * 평소처럼 ②·③을 거쳐야 한다. 페이지는 읽기 전용으로 그대로 보여줘야 해서 값이 있어야 한다.
 */
export function isSeededPassage(draft: TraceDraft): boolean {
  return draft.source === 'passage' && draft.pageNumber !== null && draft.decorations.length > 0
}
