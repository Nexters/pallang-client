import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileSettingsContent } from '../_components/ProfileSettingsContent/ProfileSettingsContent'
import { ProfileSettingsSkeleton } from '../_components/ProfileSettingsSkeleton/ProfileSettingsSkeleton'

const { back, replace, takePhoto } = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
  takePhoto: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back, prefetch: vi.fn() }),
}))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))
vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto }),
}))
vi.mock('@/app/_global/_services/authToken.service', () => ({
  clearTokens: vi.fn().mockResolvedValue(undefined),
}))

const ME = {
  userId: 1,
  nickname: '기록광',
  email: 'pallang@example.com',
  profileImageUrl: null as null | string,
  snsProvider: 'KAKAO',
  opinionCount: 3,
}

type Request = { url: string; method: string; body?: string }

/** 응답을 붙잡아 두는 문. 요청이 뜬 채로 화면을 떠나는 상황을 만든다. */
function createGate() {
  let open!: () => void
  const passed = new Promise<void>((resolve) => {
    open = resolve
  })
  return { open, passed }
}

type StubConfig = {
  me?: typeof ME
  nickname?: { status: number; detail?: string }
  image?: { status: number }
  withdraw?: { status: number; gate?: Promise<void> }
  nicknameGate?: Promise<void>
  imageGate?: Promise<void>
}

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

function stubApi(config: StubConfig) {
  const requests: Request[] = []
  const me = config.me ?? ME

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      requests.push({
        url,
        method,
        body: typeof options?.body === 'string' ? options.body : undefined,
      })

      if (url.includes('/api/users/me/nickname')) {
        await config.nicknameGate
        const status = config.nickname?.status ?? 200
        if (status !== 200) {
          return respond(status, { title: 'NICKNAME_ERROR', detail: config.nickname?.detail })
        }
        return respond(200, { data: me })
      }
      if (url.includes('/api/users/me/profile-image')) {
        await config.imageGate
        const status = config.image?.status ?? 200
        if (status !== 200) return respond(status, { title: 'IMAGE_ERROR', detail: '업로드 실패' })
        return respond(200, { data: me })
      }
      if (method === 'DELETE') {
        await config.withdraw?.gate
        const status = config.withdraw?.status ?? 200
        if (status !== 200) return respond(status, { title: 'WITHDRAW_ERROR', detail: '탈퇴 실패' })
        return respond(200, { data: null })
      }
      return respond(200, { data: me })
    }),
  )

  return requests
}

function renderProfile(config: StubConfig = {}) {
  const requests = stubApi(config)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const clearCache = vi.spyOn(client, 'clear')
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <ProfileSettingsContent />
    </QueryClientProvider>,
  )
  return { clearCache, invalidate, requests, unmount }
}

function nicknameRequests(requests: Request[]) {
  return requests.filter((request) => request.url.includes('/api/users/me/nickname'))
}

async function save() {
  await userEvent.click(screen.getByRole('button', { name: '저장하기' }))
}

async function confirmWithdraw() {
  await userEvent.click(await screen.findByRole('button', { name: '회원탈퇴' }))
  await userEvent.click(await screen.findByRole('button', { name: '회원 탈퇴하기' }))
}

/** alt=""라 role로 잡히지 않는다 — 아바타 버튼 안에서 직접 고른다 */
function avatarImage() {
  const image = document.querySelector('button[aria-label="프로필 이미지 변경"] img')
  if (!image) throw new Error('아바타 이미지를 찾지 못했다')
  return image
}

async function pickPhoto() {
  takePhoto.mockResolvedValue({ webPath: 'blob:photo', blob: new Blob(['x']) })
  await userEvent.click(screen.getByRole('button', { name: '프로필 이미지 변경' }))
}

describe('프로필 설정 — 닉네임 저장', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('닉네임을 비운 채 저장하면 요청 없이 그 자리에서 알린다', async () => {
    const { requests } = renderProfile()
    await userEvent.clear(await screen.findByLabelText('닉네임'))

    await save()

    expect(await screen.findByText('닉네임을 입력해 주세요.')).toBeInTheDocument()
    // 조용히 되돌아가면 입력하던 내용이 사라진다
    expect(back).not.toHaveBeenCalled()
    expect(nicknameRequests(requests)).toHaveLength(0)
  })

  it('닉네임이 그대로면 서버를 부르지 않고 돌아간다', async () => {
    const { requests } = renderProfile()
    await screen.findByLabelText('닉네임')

    await save()

    expect(back).toHaveBeenCalled()
    expect(nicknameRequests(requests)).toHaveLength(0)
  })

  it('닉네임을 바꿔 저장하면 프로필을 다시 받고 돌아간다', async () => {
    const { invalidate, requests } = renderProfile()
    await userEvent.clear(await screen.findByLabelText('닉네임'))
    await userEvent.type(screen.getByLabelText('닉네임'), '물결')

    await save()

    await waitFor(() => {
      expect(back).toHaveBeenCalled()
    })
    const [request] = nicknameRequests(requests)
    expect(request?.method).toBe('PATCH')
    expect(JSON.parse(request?.body ?? '{}')).toEqual({ nickname: '물결' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user', 'me'] })
  })

  it('서버가 준 실패 사유를 입력 아래에 그대로 보여준다', async () => {
    renderProfile({ nickname: { status: 409, detail: '이미 사용 중인 닉네임이에요.' } })
    await userEvent.clear(await screen.findByLabelText('닉네임'))
    await userEvent.type(screen.getByLabelText('닉네임'), '물결')

    await save()

    expect(await screen.findByText('이미 사용 중인 닉네임이에요.')).toBeInTheDocument()
    expect(back).not.toHaveBeenCalled()
  })

  // 콜백을 mutate에 넘기면 observer가 사라지는 순간 통째로 버려진다
  it('저장 요청 중 화면을 떠나도 프로필 캐시는 갱신된다', async () => {
    const gate = createGate()
    const { invalidate, unmount } = renderProfile({ nicknameGate: gate.passed })
    await userEvent.clear(await screen.findByLabelText('닉네임'))
    await userEvent.type(screen.getByLabelText('닉네임'), '물결')
    await save()

    unmount()
    gate.open()

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user', 'me'] })
    })
  })
})

describe('프로필 설정 — 프로필 이미지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('업로드에 성공하면 프로필을 다시 받는다', async () => {
    const { invalidate, requests } = renderProfile()
    await screen.findByLabelText('닉네임')

    await pickPhoto()

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user', 'me'] })
    })
    expect(requests.some((request) => request.url.includes('/profile-image'))).toBe(true)
  })

  it('업로드 요청 중 화면을 떠나도 프로필 캐시는 갱신된다', async () => {
    const gate = createGate()
    const { invalidate, unmount } = renderProfile({ imageGate: gate.passed })
    await screen.findByLabelText('닉네임')
    await pickPhoto()

    unmount()
    gate.open()

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user', 'me'] })
    })
  })

  it('업로드에 실패하면 스낵바로 알린다', async () => {
    renderProfile({ image: { status: 500 } })
    await screen.findByLabelText('닉네임')

    await pickPhoto()

    expect(await screen.findByText(/프로필 이미지를 변경하지 못했어요/)).toBeInTheDocument()
  })

  it('만료된 이미지 URL은 기본 캐릭터로 떨어뜨린다', async () => {
    renderProfile({ me: { ...ME, profileImageUrl: 'https://cdn.example.com/expired.jpg' } })
    await screen.findByLabelText('닉네임')

    expect(avatarImage().getAttribute('src')).toContain('expired.jpg')

    fireEvent.error(avatarImage())

    await waitFor(() => {
      expect(avatarImage().getAttribute('src')).toContain('profile-character-orange')
    })
  })
})

describe('프로필 설정 — 회원 탈퇴', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('성공하면 캐시를 비우고 마이페이지로 보낸다', async () => {
    const { clearCache, requests } = renderProfile()
    await screen.findByLabelText('닉네임')

    await confirmWithdraw()

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/my')
    })
    expect(clearCache).toHaveBeenCalled()
    expect(requests.some((request) => request.method === 'DELETE')).toBe(true)
  })

  // 요청 중 하드웨어 백을 누르면 탈퇴한 계정의 캐시가 그대로 남는다
  it('요청 중 화면을 떠나도 탈퇴한 계정의 캐시를 남기지 않는다', async () => {
    const gate = createGate()
    const { clearCache, unmount } = renderProfile({ withdraw: { status: 200, gate: gate.passed } })
    await screen.findByLabelText('닉네임')
    await confirmWithdraw()

    unmount()
    gate.open()

    await waitFor(() => {
      expect(clearCache).toHaveBeenCalled()
    })
  })

  it('실패하면 모달을 닫고 흰 배경에서도 보이는 스낵바로 알린다', async () => {
    const { clearCache } = renderProfile({ withdraw: { status: 500 } })
    await screen.findByLabelText('닉네임')

    await confirmWithdraw()

    expect(await screen.findByText(/회원 탈퇴에 실패했어요/)).toBeInTheDocument()
    expect(clearCache).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    // 이 화면은 흰 배경(ScreenLayout)이라 기본 tone(흰 바)이면 아무것도 안 보인다
    expect(screen.getByRole('status').className).toContain('bg-bg-black')
  })
})

describe('프로필 설정 — 본문 배치', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('회원탈퇴는 본문 맨 아래에 붙는다', async () => {
    renderProfile()
    const withdrawLink = await screen.findByRole('button', { name: '회원탈퇴' })

    // mt-auto는 부모가 스크롤 영역을 끝까지 채워야 밀어낼 여백을 얻는다
    expect(withdrawLink.className).toContain('mt-auto')
    expect(withdrawLink.parentElement?.className).toContain('flex-1')
  })

  // 가입 아이디는 SNS 이메일 미동의면 없다 — 늘 그리면 도착할 때 그 자리가 접힌다
  it('골격은 항상 있는 필드(닉네임)만 세운다', () => {
    const { container } = render(<ProfileSettingsSkeleton />)

    // 이미지 1 + 닉네임 라벨 1 + 닉네임 입력 1
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })
})
