'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Checkbox } from '@/app/_global/_components/Checkbox/Checkbox'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { SIGN_UP_WELCOME_PATH } from '@/app/_global/_data/auth.constant'
import { agreeTerms } from '@/app/_global/_queries/auth.queries'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

type TermsRowProps = {
  checked: boolean
  label: string
  onCheckedChange: () => void
}

type TermsChecked = {
  privacy: boolean
  service: boolean
}

function TermsRow({ checked, label, onCheckedChange }: TermsRowProps) {
  return (
    <div className="flex w-full items-center gap-1.5">
      <Checkbox checked={checked} aria-label={`${label} 선택`} onClick={onCheckedChange} />

      <span className="min-w-0 flex-1 text-body-16md text-text-primary">{label}</span>

      <button
        type="button"
        aria-label={`${label} 보기`}
        className="flex size-6 shrink-0 items-center justify-center text-icon-primary opacity-50"
      >
        <NextIcon aria-hidden="true" className="size-6" />
      </button>
    </div>
  )
}

export default function TermsAgreePage() {
  const router = useRouter()
  const [termsChecked, setTermsChecked] = useState<TermsChecked>({
    privacy: false,
    service: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const termsAgreed = termsChecked.service && termsChecked.privacy

  const handleAllTermsClick = () => {
    const nextChecked = !termsAgreed

    setTermsChecked({
      privacy: nextChecked,
      service: nextChecked,
    })
  }

  const handleTermClick = (term: keyof TermsChecked) => {
    setTermsChecked((prevChecked) => ({
      ...prevChecked,
      [term]: !prevChecked[term],
    }))
  }

  const handleNextClick = () => {
    setIsSubmitting(true)
    agreeTerms()
      .then(() => {
        router.push(SIGN_UP_WELCOME_PATH)
      })
      .catch((error: unknown) => {
        console.error('약관 동의 실패', error)
        setIsSubmitting(false)
      })
  }

  return (
    <section
      aria-label="약관 동의"
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${GRID_BACKGROUND_CLASS_NAME}`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-163.75 bg-linear-to-b from-transparent to-neutral-200" />

      <div className="relative z-10 h-11 shrink-0" />

      <div className="relative z-10 flex h-115.5 shrink-0 items-center justify-center px-6 py-25">
        <div className="flex flex-col items-center gap-1">
          <Logo aria-label="Pallang" className="h-25 w-60" />
          <p className="whitespace-nowrap text-center text-title-16sb text-text-primary">
            흔적을 넘기면, 다른 생각이 팔랑
          </p>
        </div>
      </div>

      <div className="relative z-10 px-4 py-6">
        <div className="flex w-full flex-col gap-5 rounded-4xl bg-bg-default px-4 py-6">
          <div className="flex w-full items-center gap-1.5">
            <Checkbox
              checked={termsAgreed}
              aria-label="약관 전체동의 선택"
              onClick={handleAllTermsClick}
            />
            <span className="min-w-0 flex-1 text-title-18bd text-text-secondary">
              약관 전체동의
            </span>
          </div>

          <div className="h-px w-full border-t border-dashed border-border-default" />

          <div className="flex w-full flex-col gap-3">
            <TermsRow
              checked={termsChecked.service}
              label="이용약관 동의"
              onCheckedChange={() => {
                handleTermClick('service')
              }}
            />
            <TermsRow
              checked={termsChecked.privacy}
              label="개인정보 수집 및 이용동의"
              onCheckedChange={() => {
                handleTermClick('privacy')
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto flex shrink-0 items-center justify-center p-4">
        <Button
          disabled={!termsAgreed || isSubmitting}
          onClick={handleNextClick}
          className="h-14 w-full"
        >
          다음
        </Button>
      </div>
    </section>
  )
}
