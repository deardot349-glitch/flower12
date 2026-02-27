export function slugify(text: string): string {
  // Transliteration map for Ukrainian/Russian characters
  const cyrillicMap: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye','ж':'zh',
    'з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n',
    'о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
    'ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya',
    // Russian
    'ё':'yo','ъ':'','ы':'y','э':'e',
  }
  return text
    .toLowerCase()
    .trim()
    .split('')
    .map(char => cyrillicMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  const { prisma } = await import('./prisma')
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.shop.findUnique({
      where: { slug }
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}
