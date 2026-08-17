import { BookSearchPageView } from './_components/BookSearchPageView/BookSearchPageView'

type BookSearchScope = 'internal' | 'my-recent'

type BookSearchPageProps = {
  searchParams: Promise<{
    scope?: BookSearchScope
  }>
}

export default async function BookSearchPage({ searchParams }: BookSearchPageProps) {
  const resolvedSearchParams = await searchParams
  const scope = resolvedSearchParams.scope ?? 'internal'

  return <BookSearchPageView scope={scope} />
}
