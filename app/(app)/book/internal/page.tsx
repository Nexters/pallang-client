import { redirect } from 'next/navigation'

type BookInternalRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BookInternalRedirectPage({
  searchParams,
}: BookInternalRedirectPageProps) {
  const params = new URLSearchParams()
  const entries = await searchParams

  Object.entries(entries).forEach(([key, value]) => {
    if (key === 'focus') return
    if (typeof value === 'string') {
      params.set(key, value)
      return
    }
    value?.forEach((item) => {
      params.append(key, item)
    })
  })

  const queryString = params.toString()
  redirect(`/book/search${queryString ? `?${queryString}` : ''}`)
}
