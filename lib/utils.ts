export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
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
