export function divideWhile<T>(
  dividend: Set<T>,
  divisor: Set<T>,
  predicate: (intersection: Set<T>, difference: Set<T>) => boolean,
): [Set<T>, Set<T>] {
  const intersection = new Set<T>();
  const difference = new Set<T>();

  for (const value of dividend) {
    if (divisor.has(value)) {
      intersection.add(value);
    } else {
      difference.add(value);
    }

    if (!predicate(intersection, difference)) break;
  }

  return [intersection, difference];
}
