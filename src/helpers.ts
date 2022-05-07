export function uniqeBy<T>(arr: T[], keySelector: (item: T) => unknown): T[] {
  const keySet = new Set()
  return arr.filter(item => {
    const key = keySelector(item)
    if (keySet.has(key)) {
      return false
    }
    keySet.add(key)
    return true
  })
}
