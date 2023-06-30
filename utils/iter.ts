export function* imap<T, U = T>(
  transformer: (value: T) => U,
  iterable: Iterable<T>,
): Iterable<U> {
  for (const value of iterable) {
    yield transformer(value);
  }
}

export function map<T, U = T>(
  transformer: (value: T) => U,
  iterable: Iterable<T>,
): U[] {
  return [...imap(transformer, iterable)];
}

export function* ifilter<T>(
  predicate: (value: T) => boolean,
  iterable: Iterable<T>,
): Iterable<T> {
  for (const value of iterable) {
    if (predicate(value)) yield value;
  }
}

export function filter<T>(
  predicate: (value: T) => boolean,
  iterable: Iterable<T>,
): T[] {
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

export function* ilimit<T>(iterable: Iterable<T>, size: number): Iterable<T> {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Bound must be a positive integer");
  }

  let count = 0;
  for (const value of iterable) {
    yield value;

    if (++count === size) return;
  }
}

export function limit<T>(iterable: Iterable<T>, size: number): T[] {
  return [...ilimit(iterable, size)];
}

export function* ichunk<T>(iterable: Iterable<T>, size: number): Iterable<T[]> {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Sample size must be a positive integer");
  }

  let chunk = [];
  for (const value of iterable) {
    chunk.push(value);

    if (chunk.length === size) {
      yield chunk;

      chunk = [];
    }
  }

  if (chunk.length) yield chunk;
}

export function chunk<T>(iterable: Iterable<T>, size: number): T[][] {
  return [...ichunk(iterable, size)];
}

export function* iflatten<T>(iterable: Iterable<Iterable<T>>): Iterable<T> {
  for (const value of iterable) yield* value;
}

export function flatten<T>(iterable: Iterable<Iterable<T>>): T[] {
  return [...iflatten(iterable)];
}
