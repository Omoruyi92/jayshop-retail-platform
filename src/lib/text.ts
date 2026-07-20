export function titleCase(value: string): string {
  if (!value) return value
  return value
    .toLowerCase()
    .split(/[\s\-]+/)
    .map((word) => {
      if (!word) return ''
      // Preserve common acronyms/initialisms (2-4 letters all caps)
      if (/^[a-z]{1,4}$/i.test(word) && word.length <= 4) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
