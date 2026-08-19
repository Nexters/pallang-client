/**
 * 흔적 보기 화면 → 흔적 작성 플로우로 넘기는 씨앗.
 *
 * 작성 초안(TraceDraftContext)은 `/trace/new` 레이아웃 안에서만 사는 Context라 바깥에서 채울 수 없다.
 * sessionStorage로 넘기면 하이드레이션 뒤에야 읽혀 그 전에 단계 가드가 빈 초안을 보고 첫 화면으로 되돌린다.
 * URL 쿼리는 렌더 시점에 읽히므로 그 경합이 없다.
 */

import { readParam, readPositiveInt } from '@/app/_global/_services/searchParams.service'

import { type Decoration, EFFECT_TYPES } from './decoration.model'

/** 씨앗을 실어 나르는 쿼리 키. 만드는 쪽과 읽는 쪽이 어긋나지 않도록 한곳에 둔다. */
const PARAM = {
  bookId: 'bookId',
  bookTitle: 'bookTitle',
  bookCover: 'bookCover',
  passageId: 'passageId',
  page: 'page',
  quote: 'quote',
  spoiler: 'spoiler',
  decorations: 'deco',
  groupId: 'groupId',
} as const

/** 대목까지 물고 갈 때만 채운다. 없으면 책만 정해진 채 대목 입력부터 시작한다. */
export type TraceSeedPassage = {
  passageId: number
  pageNumber: number
  quotedText: string
  isSpoiler: boolean
  /** 이 대목에 이미 입혀진 효과. 이어받으면 꾸미기 단계를 건너뛰고 의견 작성부터 시작한다. */
  decorations: Decoration[]
}

/* 꾸밈 한 개는 `시작.끝.효과.색`, 여러 개는 `-`로 잇는다.
   구분자를 `.`과 `-`로 고른 이유: 둘 다 URL에서 그대로 쓸 수 있고, 효과 이름(DOUBLE_LINE)의
   밑줄이나 16진수 색과 겹치지 않는다. 색의 `#`은 URL 조각 구분자라 떼고 싣는다. */
const FIELD_SEPARATOR = '.'
const RECORD_SEPARATOR = '-'
/* 색은 16진수만이 아니다 — 서버는 `#PRIMARY` 같은 토큰도 준다. 값의 뜻은 그리는 쪽
   (decorationBrushStyle)이 판단하고 모르는 값은 기본색으로 떨어뜨리므로, 여기서는
   구분자·공백이 섞여 항목 경계가 흐트러지는 것만 막는다. */
const SAFE_COLOR = /^[0-9A-Za-z_]+$/

function encodeDecorations(decorations: readonly Decoration[]): string {
  return decorations
    .map((decoration) =>
      [
        decoration.startOffset,
        decoration.endOffset,
        decoration.effectType,
        decoration.color.replace('#', ''),
      ].join(FIELD_SEPARATOR),
    )
    .join(RECORD_SEPARATOR)
}

/**
 * URL은 사용자가 고쳐 쓸 수 있는 자리다. 인용문 밖을 가리키거나 형식이 어긋난 항목은 버린다 —
 * 그대로 실어 보내면 저장 단계에서 서버가 요청을 통째로 거절한다.
 */
function decodeDecorations(raw: string | undefined, quotedText: string): Decoration[] {
  if (!raw) return []

  return raw.split(RECORD_SEPARATOR).flatMap((record) => {
    const [start, end, effectType, color] = record.split(FIELD_SEPARATOR)
    const startOffset = Number(start)
    const endOffset = Number(end)

    if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset)) return []
    if (startOffset < 0 || startOffset >= endOffset || endOffset > quotedText.length) return []
    if (!EFFECT_TYPES.some((allowed) => allowed === effectType)) return []
    if (!color || !SAFE_COLOR.test(color)) return []

    return [
      {
        startOffset,
        endOffset,
        effectType: effectType as Decoration['effectType'],
        color: `#${color}`,
      },
    ]
  })
}

export type TraceSeed = {
  bookId: number
  bookTitle: string
  bookCoverImageUrl: string | null
  passage: TraceSeedPassage | null
  /** 모임 안에서 시작한 흔적이면 그 모임 — 작성 플로우가 이 모임에 흔적을 붙인다. 아니면 null */
  groupId: number | null
}

/** 흔적 작성 플로우로 보낼 링크. 대목을 함께 넘기면 꾸미기 단계부터 시작한다. */
export function buildTraceSeedHref(seed: TraceSeed): string {
  const params = new URLSearchParams({
    [PARAM.bookId]: String(seed.bookId),
    [PARAM.bookTitle]: seed.bookTitle,
  })
  if (seed.bookCoverImageUrl) params.set(PARAM.bookCover, seed.bookCoverImageUrl)
  if (seed.groupId !== null) params.set(PARAM.groupId, String(seed.groupId))
  if (seed.passage) {
    params.set(PARAM.passageId, String(seed.passage.passageId))
    params.set(PARAM.page, String(seed.passage.pageNumber))
    params.set(PARAM.quote, seed.passage.quotedText)
    if (seed.passage.isSpoiler) params.set(PARAM.spoiler, '1')
    if (seed.passage.decorations.length > 0) {
      params.set(PARAM.decorations, encodeDecorations(seed.passage.decorations))
    }
  }
  return `/trace/new?${params.toString()}`
}

/** 씨앗이 성립하지 않으면(책이 없으면) null. 대목은 네 값이 모두 갖춰졌을 때만 인정한다. */
export function parseTraceSeed(
  params: Record<string, string | string[] | undefined>,
): TraceSeed | null {
  const bookId = readPositiveInt(params, PARAM.bookId)
  const bookTitle = readParam(params, PARAM.bookTitle)
  if (bookId === undefined || !bookTitle) return null

  const passageId = readPositiveInt(params, PARAM.passageId)
  const pageNumber = readPositiveInt(params, PARAM.page)
  const quotedText = readParam(params, PARAM.quote)

  return {
    bookId,
    bookTitle,
    bookCoverImageUrl: readParam(params, PARAM.bookCover) ?? null,
    groupId: readPositiveInt(params, PARAM.groupId) ?? null,
    passage:
      passageId !== undefined && pageNumber !== undefined && quotedText
        ? {
            passageId,
            pageNumber,
            quotedText,
            isSpoiler: readParam(params, PARAM.spoiler) === '1',
            decorations: decodeDecorations(readParam(params, PARAM.decorations), quotedText),
          }
        : null,
  }
}
