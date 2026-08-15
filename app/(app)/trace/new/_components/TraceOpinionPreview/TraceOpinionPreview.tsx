export function TraceOpinionPreview({ content }: { content: string }) {
  return (
    <section className="flex flex-col gap-2 px-8">
      <h2 className="text-body-14md text-text-inverse opacity-60">의견</h2>
      <p className="whitespace-pre-wrap rounded-lg bg-bg-surface/10 p-4 text-body-16rg text-text-inverse">
        {content}
      </p>
    </section>
  )
}
