export function getTitleSlugFromUrl(url = location.href): string | null {
  try {
    const match = new URL(url).pathname.match(/\/problems\/([^/]+)/)
    return match ? match[1] : null
  }
  catch {
    return null
  }
}
