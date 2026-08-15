// 알라딘 표지 URL → 업로드용 Blob. 프록시(/api/book-cover)를 거쳐 CORS 없이 받는다.
// 표지는 부가 정보라 어떤 실패든 null로 삼켜 등록 자체는 계속 진행되게 한다.
export async function fetchCoverImageBlob(coverImageUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(`/api/book-cover?url=${encodeURIComponent(coverImageUrl)}`)
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}
