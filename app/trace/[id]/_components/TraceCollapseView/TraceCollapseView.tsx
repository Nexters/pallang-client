'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { opinionQueries, type OpinionSortType } from '@/app/_global/_queries/opinion.queries'
import { passageQueries } from '@/app/_global/_queries/passage.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { bookTitle, DEFAULT_OPINION_SORT_TYPE } from '../../_data/readerHighlights.constant'
import { useHighlightViewer } from '../../_hooks/useHighlightViewer'
import { useQuoteCollapse } from '../../_hooks/useQuoteCollapse'
import { CommentBar } from '../CommentBar/CommentBar'
import { QuoteStage } from '../QuoteStage/QuoteStage'
import { TraceDetailOverlay } from '../TraceDetailOverlay/TraceDetailOverlay'
import { TraceListError } from '../TraceListError/TraceListError'
import { TraceListSection } from '../TraceListSection/TraceListSection'
import styles from './TraceCollapseView.module.css'

type TraceCollapseViewProps = {
  bookId: number
}

export function TraceCollapseView({ bookId }: TraceCollapseViewProps) {
  // bookId는 서버 컴포넌트(TracePrefetchBoundary)가 검증해 내려준다 — 여기서 params를 언래핑하지 않는다
  const runWithLogin = useLoginGate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { stageStyle, isCollapsed } = useQuoteCollapse(scrollerRef)
  const traceLoadMoreRef = useRef<HTMLDivElement>(null)
  const pageNumbersQuery = useInfiniteQuery(passageQueries.pageNumbers(bookId))
  const pages = useMemo(
    () => pageNumbersQuery.data?.pages.flatMap((page) => page.data?.pageNumbers ?? []) ?? [],
    [pageNumbersQuery.data],
  )
  const canLoadMorePages =
    pageNumbersQuery.hasNextPage &&
    !pageNumbersQuery.isError &&
    !pageNumbersQuery.isFetchingNextPage
  // 기본 문구가 범용이라 페이지 탭 게이트는 전용 문구를 명시적으로 넘긴다
  const viewer = useHighlightViewer((action) => {
    runWithLogin(action, LOGIN_GATE_MESSAGE.pageView)
  }, pages[0])
  const passagesQuery = useQuery({
    ...passageQueries.passagesByPage(bookId, viewer.activePage ?? 0),
    enabled: viewer.activePage !== undefined,
  })

  const passages = useMemo(() => passagesQuery.data?.data?.passages ?? [], [passagesQuery.data])
  const highlight = useMemo(
    () => ({
      page: viewer.activePage ?? 0,
      quotes: passages.map((passage) => ({
        text: passage.quotedText,
        isSpoiler: passage.isSpoiler,
      })),
    }),
    [passages, viewer.activePage],
  )
  // 선택된 대목 — quoteIndex가 바뀌면 passageId도 함께 바뀌어 흔적 목록이 갱신된다
  const activePassage = passages[viewer.quoteIndex]
  const [isCommentBarOpen, setIsCommentBarOpen] = useState(false)
  // 서버 프리페치가 채운 queryKey와 맞아야 첫 렌더에서 캐시가 그대로 쓰인다
  const [sortType, setSortType] = useState<OpinionSortType>(DEFAULT_OPINION_SORT_TYPE)
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null)

  const opinionsQuery = useInfiniteQuery(
    opinionQueries.listByPassage(activePassage?.passageId, sortType),
  )
  const traces = useMemo(
    () => opinionsQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [opinionsQuery.data],
  )
  // 헤더 숫자는 서버가 알려준 전체 개수라, 목록을 끝까지 불러오면 둘이 맞는다
  const traceCount = opinionsQuery.data?.pages[0]?.data?.pageInfo.totalElements ?? 0

  const selectedTrace = traces.find((trace) => trace.opinionId === selectedTraceId)

  // 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러 화면으로 묶는다
  const failedTraceListQueries = [pageNumbersQuery, passagesQuery, opinionsQuery].filter(
    (query) => query.isError,
  )
  const isTraceListError = failedTraceListQueries.length > 0

  const retryTraceList = () => {
    for (const query of failedTraceListQueries) void query.refetch()
  }

  // placeholderData로 이전 대목의 목록이 보이는 동안에는 다음 페이지를 당기지 않는다
  const canFetchMoreTraces =
    opinionsQuery.hasNextPage &&
    !opinionsQuery.isError &&
    !opinionsQuery.isFetchingNextPage &&
    !opinionsQuery.isPlaceholderData

  useLoadMoreOnVisible({
    targetRef: traceLoadMoreRef,
    rootRef: scrollerRef,
    enabled: canFetchMoreTraces,
    onLoadMore: () => {
      void opinionsQuery.fetchNextPage()
    },
  })

  const openCommentBar = () => {
    runWithLogin(() => {
      setIsCommentBarOpen(true)
    }, LOGIN_GATE_MESSAGE.traceCreate)
  }

  const toggleCommentBar = () => {
    if (isCommentBarOpen) {
      setIsCommentBarOpen(false)
      return
    }
    openCommentBar()
  }

  return (
    <>
      <div
        ref={scrollerRef}
        style={stageStyle}
        className={cn(
          'min-h-0 flex-1',
          styles['scroller'],
          !isCollapsed && styles['scrollerLocked'],
        )}
      >
        <div className={styles['stageAnchor']}>
          <QuoteStage
            title={bookTitle}
            pages={pages}
            highlight={highlight}
            quoteIndex={viewer.quoteIndex}
            isRevealed={viewer.isRevealed}
            isCollapsed={isCollapsed}
            onSelectPage={viewer.select}
            onLoadMorePages={
              canLoadMorePages
                ? () => {
                    void pageNumbersQuery.fetchNextPage()
                  }
                : undefined
            }
            onClickQuote={() => {
              viewer.clickCard(highlight)
            }}
          />
        </div>
        <div aria-hidden className={styles['stageSpacer']} />
        {isTraceListError ? (
          <TraceListError className={styles['listArea']} onRetry={retryTraceList} />
        ) : (
          <>
            <TraceListSection
              className={styles['listArea']}
              traces={traces}
              traceCount={traceCount}
              sortType={sortType}
              onToggleSort={() => {
                setSortType((prev) => (prev === 'LATEST' ? 'LIKES' : 'LATEST'))
              }}
              onToggleComment={toggleCommentBar}
              onSelectTrace={(trace) => {
                setSelectedTraceId(trace.opinionId)
              }}
            />
            {/* 목록 끝 sentinel — 화면에 들어오면 다음 흔적 페이지를 불러온다. 목록 여백(pb-10)을 건드리지 않도록 1px만 차지한다 */}
            <div ref={traceLoadMoreRef} aria-hidden className="h-px w-full" />
          </>
        )}
      </div>
      {/* ponytail: 흔적 작성 API 연결은 별도 이슈 — 입력 UI만 열린다 */}
      {isCommentBarOpen && <CommentBar />}
      {selectedTrace && (
        <TraceDetailOverlay
          trace={selectedTrace}
          index={traces.indexOf(selectedTrace)}
          count={traces.length}
          quote={highlight.quotes[viewer.quoteIndex]?.text ?? ''}
          onNavigate={(next) => {
            const target = traces[next]
            if (target) setSelectedTraceId(target.opinionId)
            // 상세에서도 마지막 흔적에 닿으면 다음 페이지를 이어 붙인다
            if (next >= traces.length - 1 && canFetchMoreTraces) {
              void opinionsQuery.fetchNextPage()
            }
          }}
          onClose={() => {
            setSelectedTraceId(null)
          }}
        />
      )}
    </>
  )
}
