// 참조용 예시 — fetch 호출만 담당. 실제 API로 교체하세요.
import type { ExampleDto } from '../_data/example.model'

export async function fetchExamples(): Promise<ExampleDto[]> {
  const res = await fetch('/api/examples')
  if (!res.ok) throw new Error('Failed to fetch examples')
  return res.json() as Promise<ExampleDto[]>
}
