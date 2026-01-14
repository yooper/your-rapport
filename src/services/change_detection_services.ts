

export function areEqual<T>(obj1: T, obj2: T, keys: (keyof T)[]): boolean {
  for (const key of keys) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}