/**
 * Convert a string to a URL-safe slug.
 * e.g. "PT Maju Bersama Indonesia" -> "pt-maju-bersama-indonesia"
 * Handles Unicode (Indonesian, etc.) by transliterating where possible.
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      // Replace common Indonesian/punctuation with spaces
      .replace(/[()]/g, " ")
      .replace(/['']/g, "")
      .replace(/[.,\/#!$%^&*;:{}=\_`~()]/g, " ")
      // Replace multiple spaces with single dash
      .trim()
      .replace(/\s+/g, "-")
      // Remove non-alphanumeric chars except dashes
      .replace(/[^a-z0-9-]/g, "")
      // Collapse multiple dashes
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Generate a unique slug for a given base text by appending a short suffix.
 * Uses a small random string so slugs are unique even for identical names.
 */
export function uniqueSlug(base: string, suffixLength = 4): string {
  const random = Math.random().toString(36).substring(2, 2 + suffixLength);
  return `${slugify(base)}-${random}`;
}

/**
 * Generate a unique slug that doesn't exist in the database.
 * Uses the Job model for jobs or Client model for clients.
 */
export async function generateUniqueJobSlug(title: string, prisma: any): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 0;

  while (true) {
    const existing = await prisma.job.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) break;
    counter++;
    slug = `${base}-${counter}`;
  }

  return slug;
}

export async function generateUniqueClientSlug(name: string, prisma: any): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 0;

  while (true) {
    const existing = await prisma.client.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) break;
    counter++;
    slug = `${base}-${counter}`;
  }

  return slug;
}
