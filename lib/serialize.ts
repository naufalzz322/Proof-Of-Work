/**
 * Serializes Prisma data for Client Components
 * Converts Decimal to number, Date to ISO string
 */
export function serializePrisma<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => {
    // Handle Decimal (Prisma) -> number
    if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
      return Number(value);
    }
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));
}

/**
 * Alternative: Use this to select only specific fields
 * Avoids returning raw Prisma objects with Decimal
 */
export function select<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const field of fields) {
    if (field in data) {
      (result as Record<string, unknown>)[field as string] = data[field];
    }
  }
  return serializePrisma(result);
}
