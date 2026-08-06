// ponytail: 서버가 ISO 문자열을 주므로 앞 10자만 잘라 쓴다 — 시각·상대시간이 필요해지면 그때 파싱한다
export function formatNoticeDate(createdAt: string): string {
  return createdAt.slice(0, 10).replaceAll('-', '.')
}
