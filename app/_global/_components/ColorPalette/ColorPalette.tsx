const COLOR_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const

const PALETTE_GROUPS = [
  {
    name: 'neutral',
    tokens: ['neutral-0', ...COLOR_STEPS.map((s) => `neutral-${s}`), 'neutral-1000'],
  },
  { name: 'orange', tokens: COLOR_STEPS.map((s) => `orange-${s}`) },
  { name: 'blue', tokens: COLOR_STEPS.map((s) => `blue-${s}`) },
  { name: 'yellow', tokens: COLOR_STEPS.map((s) => `yellow-${s}`) },
  {
    name: 'white alpha',
    tokens: ['white-a10', 'white-a20', 'white-a40', 'white-a60', 'white-a80'],
  },
] as const

const SEMANTIC_GROUPS = [
  {
    role: 'Text',
    tokens: [
      'text-primary',
      'text-secondary',
      'text-tertiary',
      'text-placeholder',
      'text-placeholder-a50',
      'text-disabled',
      'text-inverse',
      'text-accent',
    ],
  },
  { role: 'Label', tokens: ['label-strong'] },
  {
    role: 'Background',
    tokens: [
      'bg-default',
      'bg-surface',
      'bg-book-card',
      'bg-gray',
      'bg-dark',
      'bg-black',
      'bg-overlay',
      'bg-alternative',
      'nav-bg',
    ],
  },
  {
    role: 'Interactive',
    tokens: [
      'interactive-accent',
      'interactive-btn-primary',
      'interactive-btn-secondary',
      'interactive-btn-tertiary',
      'interactive-btn-disabled',
      'interactive-required',
    ],
  },
  { role: 'Border', tokens: ['border-default', 'border-strong', 'border-book'] },
  {
    role: 'Icon',
    tokens: [
      'icon-primary',
      'icon-active',
      'icon-accent',
      'icon-inactive',
      'icon-muted',
      'icon-muted-a50',
    ],
  },
] as const

// ponytail: 토큰 미정의 시 swatch가 투명하게 렌더되어 스토리북에서 바로 눈에 띈다
const Swatch = ({ token }: { token: string }) => (
  <div className="flex min-w-0 flex-1 flex-col gap-1">
    <div
      className="h-20 rounded border border-black/10"
      style={{ backgroundColor: `var(--color-${token})` }}
    />
    <span className="truncate text-xs text-text-tertiary">{token}</span>
  </div>
)

export const ColorPalette = () => {
  return (
    <div className="flex flex-col gap-10 p-6 font-sans">
      <section className="flex flex-col gap-6">
        <h2 className="text-title-24bd">Palette</h2>
        {PALETTE_GROUPS.map(({ name, tokens }) => (
          <div key={name} className="flex flex-col gap-2">
            <h3 className="text-title-16sb">{name}</h3>
            <div className="flex gap-1">
              {tokens.map((token) => (
                <Swatch key={token} token={token} />
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
