import { formatExample } from '../../_services/formatExample.service'
import type { Example } from '../../_types/example.type'

export function ExampleCard({ item }: { item: Example }) {
  return <div>{formatExample(item.label)}</div>
}
