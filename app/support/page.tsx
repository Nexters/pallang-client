import Link from 'next/link'

import { POLICY_META_BY_SLUG } from '@/app/_shared/terms/_data/policy.constant'

const SUPPORT_EMAIL = 'pallang4you@gmail.com'

// ponytail: 정적 페이지 — App Store Connect의 Support URL 필드가 요구하는 최소 요건(문의 수단 공개)만
// 채운다. 문의 폼·티켓 시스템이 필요해지면 그때 백엔드를 붙인다.
const faqs = [
  {
    question: '계정을 삭제하고 싶어요',
    answer:
      '앱에서 마이페이지 > 설정 > 회원탈퇴로 직접 탈퇴할 수 있습니다. 탈퇴하면 계정 정보는 지체 없이 파기되며, 공개된 발췌와 의견은 다른 이용자의 대화 맥락을 위해 작성자를 알 수 없도록 익명 처리됩니다.',
  },
  {
    question: '부적절한 흔적이나 댓글을 발견했어요',
    answer:
      '해당 흔적 또는 댓글의 신고 버튼으로 접수할 수 있습니다. 접수된 신고는 24시간 이내에 확인해 조치합니다. 특정 이용자의 글을 더 보고 싶지 않다면 차단 기능을 이용해 주세요.',
  },
  {
    question: '카메라 권한은 왜 필요한가요',
    answer:
      '도서를 직접 등록할 때 표지를 촬영하거나 책 문장을 인식하는 용도로만 사용합니다. 촬영·선택한 이미지 외의 사진에는 접근하지 않으며, 권한은 해당 기능을 쓸 때에만 요청합니다.',
  },
  {
    question: '로그인이 되지 않아요',
    answer: `잠시 후 다시 시도해도 같은 문제가 이어지면, 사용 중인 기기와 로그인 방식(카카오·Apple)을 적어 ${SUPPORT_EMAIL}으로 알려주세요.`,
  },
]

export default function SupportPage() {
  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-bg-default px-4 py-6">
      <h1 className="text-title-20bd text-text-primary">팔랑 고객지원</h1>
      <p className="mt-2 text-body-14rg leading-6 text-text-secondary">
        이용 중 불편한 점이나 궁금한 점을 알려주시면 확인 후 답변드립니다.
      </p>

      <section className="mt-6 flex flex-col gap-2 rounded-lg bg-bg-book-card p-4">
        <h2 className="text-body-16bd text-text-primary">문의하기</h2>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-body-14sb text-text-secondary underline press"
        >
          {SUPPORT_EMAIL}
        </a>
        <p className="text-body-14rg leading-6 text-text-tertiary">
          영업일 기준 3일 이내에 회신합니다. 오류 제보는 사용 중인 기기와 상황을 함께 적어주시면
          확인이 빠릅니다.
        </p>
      </section>

      <section className="mt-8 flex flex-col gap-6">
        <h2 className="text-body-16bd text-text-primary">자주 묻는 질문</h2>
        <dl className="flex flex-col gap-5">
          {faqs.map(({ question, answer }) => (
            <div key={question} className="flex flex-col gap-1.5">
              <dt className="text-body-14sb text-text-primary">{question}</dt>
              <dd className="text-body-14rg leading-6 text-text-secondary">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="mt-10 flex items-center gap-2.5 pb-2">
        <Link
          href={POLICY_META_BY_SLUG.service.path}
          className="text-body-14sb tracking-normal text-text-tertiary"
        >
          이용약관
        </Link>
        <span aria-hidden className="h-3 w-px bg-border-default" />
        <Link
          href={POLICY_META_BY_SLUG.privacy.path}
          className="text-body-14sb tracking-normal text-text-tertiary"
        >
          개인정보 처리방침
        </Link>
      </nav>
    </main>
  )
}
