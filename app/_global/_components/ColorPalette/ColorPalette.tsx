const PALETTE_STEPS = ['5', '10', '20', '30', '40', '50', '60', '70', '80', '90'] as const

const PALETTE_SCALES = ['neutral', 'yellow', 'red', 'green', 'blue'] as const

const SEMANTIC_GROUPS = [
  { role: 'Primary', tokens: ['primary-normal'] },
  { role: 'Status', tokens: ['status-negative', 'status-positive'] },
  {
    role: 'Label',
    tokens: [
      'label-strong',
      'label-normal',
      'label-alternative',
      'label-assistive',
      'label-disabled',
      'label-white',
    ],
  },
  { role: 'Static', tokens: ['static-black', 'static-white'] },
  { role: 'Bg', tokens: ['bg-disabled'] },
  {
    role: 'Interaction',
    tokens: ['interaction-normal', 'interaction-pressed', 'interaction-focused'],
  },
] as const

// ponytail: 토큰 미정의 시 swatch가 투명하게 렌더되어 스토리북에서 바로 눈에 띈다
const Swatch = ({ token }: { token: string }) => (
  <div className="flex min-w-0 flex-1 flex-col gap-1">
    <div
      className="h-20 rounded border border-black/10"
      style={{ backgroundColor: `var(--color-${token})` }}
    />
    <span className="truncate text-xs text-label-alternative">{token}</span>
  </div>
)

export const ColorPalette = () => {
  return (
    <div className="flex flex-col gap-10 p-6 font-sans">
      <section className="flex flex-col gap-6">
        <h2 className="text-title-24bd">Palette</h2>
        <div className="flex flex-col gap-2">
          <h3 className="text-title-16sb">common</h3>
          <div className="flex gap-1">
            <Swatch token="common-0" />
            <Swatch token="common-100" />
          </div>
        </div>
        {PALETTE_SCALES.map((scale) => (
          <div key={scale} className="flex flex-col gap-2">
            <h3 className="text-title-16sb">{scale}</h3>
            <div className="flex gap-1">
              {PALETTE_STEPS.map((step) => (
                <Swatch key={step} token={`${scale}-${step}`} />
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-title-24bd">Semantic</h2>
        {SEMANTIC_GROUPS.map(({ role, tokens }) => (
          <div key={role} className="flex flex-col gap-2">
            <h3 className="text-title-16sb">{role}</h3>
            <div className="flex gap-1">
              {tokens.map((token) => (
                <Swatch key={token} token={token} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
