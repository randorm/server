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

export async function* aimap<T, U = T>(
  transformer: (value: T) => U | Promise<U>,
  iterable: AsyncIterable<T>,
): AsyncIterable<U> {
  for await (const value of iterable) {
    yield await transformer(value);
  }
}

export async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values = [];
  for await (const value of iterable) values.push(value);

  return values;
}

export async function amap<T, U = T>(
  transformer: (value: T) => U | Promise<U>,
  iterable: AsyncIterable<T>,
): Promise<U[]> {
  return await toArray(aimap(transformer, iterable));
}
