import type { Example } from '../../_types/example.type'
import { formatExample } from '../../_services/formatExample.service'

export function ExampleCard({ item }: { item: Example }) {
  return <div>{formatExample(item.label)}</div>
}
