'use server'

export async function createExample(label: string): Promise<{ label: string }> {
  await Promise.resolve()
  return { label }
}
