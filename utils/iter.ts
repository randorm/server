export type Predicate<T> = (value: T) => boolean;

export function* ifilter<T>(
  predicate: Predicate<T>,
  iterable: Iterable<T>,
): Iterable<T> {
  for (const value of iterable) {
    if (predicate(value)) yield value;
  }
}

export function filter<T>(predicate: Predicate<T>, iterable: Iterable<T>): T[] {
  return [...ifilter(predicate, iterable)];
}

export function idifference<T>(
  minuend: Set<T>,
  subtrahend: Set<T>,
): Iterable<T> {
  return ifilter((value) => !subtrahend.has(value), minuend);
}

export function difference<T>(minuend: Set<T>, subtrahend: Set<T>): Set<T> {
  return new Set(idifference(minuend, subtrahend));
}

export function* ilimit<T>(iterable: Iterable<T>, bound: number): Iterable<T> {
  if (bound <= 0) {
    throw new Error("Limit must be positive");
  }

  let count = 0;
  for (const value of iterable) {
    yield value;

    if (++count === bound) return;
  }
}

export function limit<T>(iterable: Iterable<T>, bound: number): T[] {
  return [...ilimit(iterable, bound)];
}
