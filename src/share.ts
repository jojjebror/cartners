export async function shareText(text: string, title: string) {
  if (navigator.share) {
    await navigator.share({ title, text }).catch(() => undefined)
    return false
  }
  await navigator.clipboard.writeText(text)
  return true
}
