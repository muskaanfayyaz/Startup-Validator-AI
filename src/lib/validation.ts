/**
 * validation.ts
 * Lightweight, zero-dependency validation assertions for strict runtime type-checking.
 * Complies fully with TypeScript's erasableSyntaxOnly mode.
 */

export function assertString(val: any, path: string): string {
  if (typeof val !== 'string' || !val.trim()) {
    throw new Error(`Validation Error: "${path}" must be a non-empty string.`);
  }
  return val.trim();
}

export function assertNumber(val: any, path: string): number {
  if (typeof val !== 'number' || Number.isNaN(val)) {
    throw new Error(`Validation Error: "${path}" must be a valid number.`);
  }
  return val;
}

export function assertObject(val: any, path: string): any {
  if (typeof val !== 'object' || val === null) {
    throw new Error(`Validation Error: "${path}" must be a valid object.`);
  }
  return val;
}

export function assertArray<T>(val: any, path: string, assertItem: (item: any, idx: number) => T): T[] {
  if (!Array.isArray(val) || val.length === 0) {
    throw new Error(`Validation Error: "${path}" must be a non-empty array.`);
  }
  return val.map((item, idx) => assertItem(item, idx));
}

export function assertEnum<T extends string>(val: any, allowed: T[], path: string): T {
  if (typeof val !== 'string' || !allowed.includes(val as T)) {
    throw new Error(`Validation Error: "${path}" must be one of [${allowed.join(', ')}]. Received: "${val}"`);
  }
  return val as T;
}
