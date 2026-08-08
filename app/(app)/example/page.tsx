import { ExampleCard } from './_components/ExampleCard/ExampleCard'
import { exampleSeed } from './_data/example.store'

export default function ExamplePage() {
  return (
    <main>
      {exampleSeed.map((item) => (
        <ExampleCard key={item.id} item={item} />
      ))}
    </main>
  )
}
